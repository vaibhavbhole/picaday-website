import type { SupabaseClient } from "@supabase/supabase-js";
import { AppError } from "@/lib/errors";
import { asRecord, asRecordOrNull, parseContentUrls, parseTimestamptz } from "@/data/mappers";
import { PAGE_SIZE, type FeedSort, type Paged } from "@/data/pagination";
import { Rpc, type Agenda, type BucketFeed, type HourlyBucket, type Post } from "@/data/types";

const POST_SELECT =
  "id, agenda_id, user_id, content_url, content_urls, caption, created_at, profiles!posts_user_id_fkey(user_name, avatar_url, display_name), agendas!posts_agenda_id_fkey(id, title)";

const rankCache = new Map<string, string[]>();

export function clearFeedRankCache() {
  rankCache.clear();
}

export class FeedRepository {
  constructor(private readonly client: SupabaseClient) {}

  async getCurrentAgenda(): Promise<Agenda> {
    const { data: agendaRow, error } = await this.client
      .from("agendas")
      .select()
      .eq("status", "active")
      .order("starts_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    if (!agendaRow) throw new AppError("No active agenda right now.");

    const agenda = asRecord(agendaRow);
    const agendaId = String(agenda.id);
    const buckets = await this.listBuckets(agendaId);
    const current = pickLiveBucket(buckets) ?? buckets.at(-1) ?? null;
    if (!current) throw new AppError("Active agenda has no hourly buckets.");

    return {
      id: agendaId,
      title: String(agenda.title),
      description: (agenda.description as string | null) ?? null,
      startsAt: parseTimestamptz(agenda.starts_at),
      endsAt: parseTimestamptz(agenda.ends_at),
      status: String(agenda.status),
      bucketIndex: current.bucketNumber,
      totalBuckets: 24,
      bucketStartsAt: current.startsAt,
      bucketEndsAt: current.endsAt,
      bucketId: current.id,
    };
  }

  async listBuckets(agendaId: string): Promise<HourlyBucket[]> {
    const { data, error } = await this.client
      .from("hourly_buckets")
      .select(
        "id, agenda_id, bucket_number, starts_at, ends_at, status, winning_post_id, winner_user_id, winning_votes",
      )
      .eq("agenda_id", agendaId)
      .order("bucket_number");
    if (error) throw error;
    return (data ?? []).map((row) => mapBucket(asRecord(row)));
  }

  async getLiveFeedPage(agendaId: string, offset = 0, sort: FeedSort = "latest"): Promise<Paged<Post>> {
    const buckets = await this.listBuckets(agendaId);
    const live = pickLiveBucket(buckets);
    if (!live) return { items: [], hasMore: false };
    return this.loadPosts(agendaId, {
      createdFrom: live.startsAt,
      createdTo: live.endsAt,
      voteScope: { kind: "bucket", bucketId: live.id },
      offset,
      sort,
    });
  }

  async getBucketFeed(
    agendaId: string,
    bucketId: string,
    offset = 0,
    sort: FeedSort = "latest",
  ): Promise<BucketFeed> {
    const { data: agendaRow, error: agendaError } = await this.client
      .from("agendas")
      .select("id, title, description")
      .eq("id", agendaId)
      .maybeSingle();
    if (agendaError) throw agendaError;
    if (!agendaRow) throw new AppError("Agenda not found.");

    const { data: bucketRow, error: bucketError } = await this.client
      .from("hourly_buckets")
      .select(
        "id, agenda_id, bucket_number, starts_at, ends_at, status, winning_post_id, winner_user_id, winning_votes, winner:profiles!hourly_buckets_winner_user_id_fkey(user_name, avatar_url), winning_post:posts!hourly_buckets_winning_post_fk(content_url)",
      )
      .eq("id", bucketId)
      .eq("agenda_id", agendaId)
      .maybeSingle();
    if (bucketError) throw bucketError;
    if (!bucketRow) throw new AppError("Hour not found.");

    const bucket = mapBucket(asRecord(bucketRow));
    const winnerProfile = asRecordOrNull(asRecord(bucketRow).winner);
    const winningPost = asRecordOrNull(asRecord(bucketRow).winning_post);
    const page = await this.loadPosts(agendaId, {
      createdFrom: bucket.startsAt,
      createdTo: bucket.endsAt,
      voteScope: { kind: "bucket", bucketId },
      winningPostId: bucket.winningPostId,
      offset,
      sort,
    });

    const hasWinner = Boolean(bucket.winnerUserId || bucket.winningPostId);
    return {
      agenda: {
        id: String(asRecord(agendaRow).id),
        title: String(asRecord(agendaRow).title),
        description: (asRecord(agendaRow).description as string | null) ?? null,
      },
      bucket,
      winner: hasWinner
        ? {
            username: (winnerProfile?.user_name as string | null) ?? null,
            avatarUrl: (winnerProfile?.avatar_url as string | null) ?? null,
            votes: bucket.winningVotes,
            thumbnailUrl: (winningPost?.content_url as string | null) ?? null,
          }
        : null,
      posts: page.items,
      hasMore: page.hasMore,
    };
  }

  async castVote(bucketId: string, postId: string) {
    clearFeedRankCache();
    const { error } = await this.client.rpc(Rpc.castVote, {
      bucket_id: bucketId,
      post_id: postId,
    });
    if (error) throw error;
  }

  async countVotes(postId: string): Promise<number> {
    const { count, error } = await this.client
      .from("votes")
      .select("id", { count: "exact", head: true })
      .eq("post_id", postId);
    if (error) throw error;
    return count ?? 0;
  }

  private async loadPosts(
    agendaId: string,
    options: {
      createdFrom?: Date;
      createdTo?: Date;
      voteScope: { kind: "agenda"; agendaId: string } | { kind: "bucket"; bucketId: string };
      winningPostId?: string | null;
      offset?: number;
      sort?: FeedSort;
    },
  ): Promise<Paged<Post>> {
    const offset = options.offset ?? 0;
    const sort = options.sort ?? "latest";
    let rows: Record<string, unknown>[] = [];

    if (sort === "liked") {
      const ids = await this.rankedPostIds(agendaId, options);
      const pageIds = ids.slice(offset, offset + PAGE_SIZE);
      if (pageIds.length > 0) {
        const { data, error } = await this.client
          .from("posts")
          .select(POST_SELECT)
          .in("id", pageIds);
        if (error) throw error;
        const byId = new Map((data ?? []).map((raw) => [String(asRecord(raw).id), asRecord(raw)]));
        rows = pageIds.map((id) => byId.get(id)).filter((row): row is Record<string, unknown> => Boolean(row));
      }
      const items = await this.hydratePosts(rows, options);
      return { items, hasMore: offset + pageIds.length < ids.length };
    }

    let query = this.client.from("posts").select(POST_SELECT).eq("agenda_id", agendaId);
    if (options.createdFrom) query = query.gte("created_at", options.createdFrom.toISOString());
    if (options.createdTo) query = query.lt("created_at", options.createdTo.toISOString());
    const { data: postRows, error } = await query
      .order("created_at", { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1);
    if (error) throw error;
    rows = (postRows ?? []).map(asRecord);
    const items = await this.hydratePosts(rows, options);
    return { items, hasMore: items.length === PAGE_SIZE };
  }

  private async rankedPostIds(
    agendaId: string,
    options: {
      createdFrom?: Date;
      createdTo?: Date;
      voteScope: { kind: "agenda"; agendaId: string } | { kind: "bucket"; bucketId: string };
    },
  ): Promise<string[]> {
    const key = [
      agendaId,
      options.voteScope.kind === "bucket" ? options.voteScope.bucketId : "agenda",
      options.createdFrom?.toISOString() ?? "",
      options.createdTo?.toISOString() ?? "",
    ].join(":");
    const cached = rankCache.get(key);
    if (cached) return cached;

    let postQuery = this.client.from("posts").select("id, created_at").eq("agenda_id", agendaId);
    if (options.createdFrom) postQuery = postQuery.gte("created_at", options.createdFrom.toISOString());
    if (options.createdTo) postQuery = postQuery.lt("created_at", options.createdTo.toISOString());
    const { data: postRows, error: postError } = await postQuery.order("created_at", { ascending: false });
    if (postError) throw postError;

    let voteQuery = this.client.from("votes").select("post_id");
    if (options.voteScope.kind === "bucket") {
      voteQuery = voteQuery.eq("bucket_id", options.voteScope.bucketId);
    } else {
      voteQuery = voteQuery.eq("agenda_id", options.voteScope.agendaId);
    }
    const { data: voteRows, error: voteError } = await voteQuery;
    if (voteError) throw voteError;

    const counts = new Map<string, number>();
    for (const raw of voteRows ?? []) {
      const id = String(asRecord(raw).post_id);
      counts.set(id, (counts.get(id) ?? 0) + 1);
    }

    const ranked = (postRows ?? [])
      .map((raw) => {
        const row = asRecord(raw);
        return {
          id: String(row.id),
          likes: counts.get(String(row.id)) ?? 0,
          createdAt: parseTimestamptz(row.created_at).getTime(),
        };
      })
      .sort((a, b) => b.likes - a.likes || b.createdAt - a.createdAt)
      .map((row) => row.id);

    rankCache.set(key, ranked);
    return ranked;
  }

  private async hydratePosts(
    rows: Record<string, unknown>[],
    options: {
      voteScope: { kind: "agenda"; agendaId: string } | { kind: "bucket"; bucketId: string };
      winningPostId?: string | null;
      agendaId?: string;
    },
  ): Promise<Post[]> {
    const postIds = rows.map((row) => String(row.id));
    const voteCounts = new Map<string, number>();
    if (postIds.length > 0) {
      let voteQuery = this.client.from("votes").select("post_id").in("post_id", postIds);
      if (options.voteScope.kind === "bucket") {
        voteQuery = voteQuery.eq("bucket_id", options.voteScope.bucketId);
      } else {
        voteQuery = voteQuery.eq("agenda_id", options.voteScope.agendaId);
      }
      const { data: voteRows, error: voteError } = await voteQuery;
      if (voteError) throw voteError;
      for (const raw of voteRows ?? []) {
        const id = String(asRecord(raw).post_id);
        voteCounts.set(id, (voteCounts.get(id) ?? 0) + 1);
      }
    }

    return rows.map((row) => {
      const profile = asRecordOrNull(row.profiles);
      const agenda = asRecordOrNull(row.agendas);
      const id = String(row.id);
      return {
        id,
        agendaId: (row.agenda_id as string | null) ?? (agenda?.id as string | null) ?? null,
        userId: (row.user_id as string | null) ?? null,
        username: (profile?.user_name as string | undefined) ?? "user",
        userAvatarUrl: (profile?.avatar_url as string | undefined) ?? "",
        imageUrls: parseContentUrls(row),
        likes: voteCounts.get(id) ?? 0,
        createdAt: parseTimestamptz(row.created_at),
        caption: (row.caption as string | null) ?? null,
        isWinner: options.winningPostId === id,
        agendaTitle: (agenda?.title as string | null) ?? null,
      };
    });
  }
}

function mapBucket(row: Record<string, unknown>): HourlyBucket {
  return {
    id: String(row.id),
    agendaId: String(row.agenda_id),
    bucketNumber: Number(row.bucket_number),
    startsAt: parseTimestamptz(row.starts_at),
    endsAt: parseTimestamptz(row.ends_at),
    status: String(row.status),
    winningPostId: (row.winning_post_id as string | null) ?? null,
    winnerUserId: (row.winner_user_id as string | null) ?? null,
    winningVotes: row.winning_votes == null ? null : Number(row.winning_votes),
  };
}

export function isLiveHourPost(post: Post, live: Agenda | null): boolean {
  if (!live || !post.agendaId || post.agendaId !== live.id) return false;
  const now = Date.now();
  const start = live.bucketStartsAt.getTime();
  const end = live.bucketEndsAt.getTime();
  if (now < start || now >= end) return false;
  const created = post.createdAt.getTime();
  return created >= start && created < end;
}

export function pickLiveBucket(buckets: HourlyBucket[]): HourlyBucket | null {
  const active = buckets.find((bucket) => bucket.status === "active");
  if (active) return active;
  const now = Date.now();
  return (
    buckets.find((bucket) => now >= bucket.startsAt.getTime() && now < bucket.endsAt.getTime()) ?? null
  );
}

export function pickCurrentBucket(buckets: HourlyBucket[]): HourlyBucket | null {
  return pickLiveBucket(buckets) ?? buckets.at(-1) ?? null;
}
