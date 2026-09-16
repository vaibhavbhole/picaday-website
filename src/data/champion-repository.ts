import type { SupabaseClient } from "@supabase/supabase-js";
import { AppError } from "@/lib/errors";
import { formatHourLabel } from "@/lib/format";
import { asRecord, asRecordOrNull, parseTimestamptz } from "@/data/mappers";
import { PAGE_SIZE, type Paged } from "@/data/pagination";
import type { ChampionSlot, ChampionSlotStatus, PastAgenda } from "@/data/types";

const BUCKET_SELECT =
  "id, agenda_id, bucket_number, starts_at, ends_at, status, winning_votes, winner_user_id, winning_post_id, winner:profiles!hourly_buckets_winner_user_id_fkey(user_name, avatar_url), winning_post:posts!hourly_buckets_winning_post_fk(content_url, user_id)";

export class ChampionRepository {
  constructor(private readonly client: SupabaseClient) {}

  async getActiveAgendaId(): Promise<string> {
    const { data, error } = await this.client
      .from("agendas")
      .select("id")
      .eq("status", "active")
      .order("starts_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new AppError("No active agenda right now.");
    return String(asRecord(data).id);
  }

  async listPastAgendas(offset = 0): Promise<Paged<PastAgenda>> {
    const { data, error } = await this.client
      .from("agendas")
      .select("id, title, description, starts_at, ends_at")
      .eq("status", "completed")
      .order("starts_at", { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1);
    if (error) throw error;
    const items = (data ?? []).map((raw) => {
      const row = asRecord(raw);
      return {
        id: String(row.id),
        title: String(row.title),
        description: (row.description as string | null) ?? null,
        startsAt: parseTimestamptz(row.starts_at),
        endsAt: parseTimestamptz(row.ends_at),
      };
    });
    return { items, hasMore: items.length === PAGE_SIZE };
  }

  async getAgendaSummary(agendaId: string): Promise<PastAgenda> {
    const { data, error } = await this.client
      .from("agendas")
      .select("id, title, description, starts_at, ends_at")
      .eq("id", agendaId)
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new AppError("Agenda not found.");
    const row = asRecord(data);
    return {
      id: String(row.id),
      title: String(row.title),
      description: (row.description as string | null) ?? null,
      startsAt: parseTimestamptz(row.starts_at),
      endsAt: parseTimestamptz(row.ends_at),
    };
  }

  async getChampionSlots(agendaId: string): Promise<ChampionSlot[]> {
    const { data, error } = await this.client
      .from("hourly_buckets")
      .select(BUCKET_SELECT)
      .eq("agenda_id", agendaId)
      .order("bucket_number");
    if (error) throw error;

    const slots: ChampionSlot[] = [];
    for (const raw of data ?? []) {
      slots.push(await this.mapBucket(asRecord(raw)));
    }
    return slots.sort(compareSlots);
  }

  private async mapBucket(row: Record<string, unknown>): Promise<ChampionSlot> {
    const startsAt = parseTimestamptz(row.starts_at);
    const endsAt = parseTimestamptz(row.ends_at);
    const status = slotStatus(String(row.status), endsAt);
    const base: ChampionSlot = {
      id: String(row.id),
      agendaId: String(row.agenda_id),
      bucketNumber: Number(row.bucket_number),
      hourLabel: formatHourLabel(startsAt),
      status,
      username: null,
      userAvatarUrl: null,
      votes: null,
      thumbnailUrl: null,
      startsAt,
      endsAt,
    };

    if (status === "upcoming") return base;

    if (status === "completed") {
      const winner = asRecordOrNull(row.winner);
      const winningPost = asRecordOrNull(row.winning_post);
      return {
        ...base,
        username: (winner?.user_name as string | null) ?? null,
        userAvatarUrl: (winner?.avatar_url as string | null) ?? null,
        votes: row.winning_votes == null ? null : Number(row.winning_votes),
        thumbnailUrl: (winningPost?.content_url as string | null) ?? null,
      };
    }

    return this.mapLiveBucket(base);
  }

  private async mapLiveBucket(base: ChampionSlot): Promise<ChampionSlot> {
    const { data, error } = await this.client
      .from("votes")
      .select(
        "post_id, posts!votes_post_id_fkey(content_url, user_id, profiles!posts_user_id_fkey(user_name, avatar_url))",
      )
      .eq("bucket_id", base.id);
    if (error) throw error;

    const counts = new Map<string, number>();
    const posts = new Map<string, Record<string, unknown>>();
    for (const raw of data ?? []) {
      const vote = asRecord(raw);
      const postId = String(vote.post_id);
      counts.set(postId, (counts.get(postId) ?? 0) + 1);
      const post = asRecordOrNull(vote.posts);
      if (post) posts.set(postId, post);
    }

    let leadingId: string | null = null;
    let leadingVotes = 0;
    for (const [id, count] of counts) {
      if (count > leadingVotes) {
        leadingVotes = count;
        leadingId = id;
      }
    }
    const leading = leadingId ? posts.get(leadingId) : undefined;
    const profile = asRecordOrNull(leading?.profiles);
    return {
      ...base,
      username: (profile?.user_name as string | null) ?? null,
      userAvatarUrl: (profile?.avatar_url as string | null) ?? null,
      votes: leadingId ? leadingVotes : 0,
      thumbnailUrl: (leading?.content_url as string | null) ?? null,
    };
  }
}

function slotStatus(status: string, endsAt: Date): ChampionSlotStatus {
  if (status === "completed") return "completed";
  if (status === "active") return "live";
  if (endsAt.getTime() <= Date.now()) return "completed";
  return "upcoming";
}

function compareSlots(a: ChampionSlot, b: ChampionSlot): number {
  const rank = { completed: 0, live: 1, upcoming: 2 };
  const delta = rank[a.status] - rank[b.status];
  if (delta !== 0) return delta;
  return a.bucketNumber - b.bucketNumber;
}
