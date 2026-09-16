import type { SupabaseClient } from "@supabase/supabase-js";
import { AppError } from "@/lib/errors";
import { asRecord, asRecordOrNull, parseContentUrls, parseTimestamptz, sanitizeIlike } from "@/data/mappers";
import { PAGE_SIZE, type FeedSort, type Paged } from "@/data/pagination";
import { Rpc, type AgendaProposal, type Post, type ProfileVisitor, type PublicProfile, type SearchProfile } from "@/data/types";
import { parseSocialLinks, type SocialLinks } from "@/lib/social-links";

export class ProfileRepository {
  constructor(private readonly client: SupabaseClient) {}

  async getByUsername(username: string): Promise<PublicProfile | null> {
    const withSocial = await this.client
      .from("profiles")
      .select("id, user_name, display_name, avatar_url, social_links")
      .eq("user_name", username.toLowerCase())
      .maybeSingle();

    const missingSocialColumn =
      Boolean(withSocial.error) && /social_links/i.test(String(withSocial.error?.message ?? ""));
    const rowSource = missingSocialColumn
      ? await this.client
          .from("profiles")
          .select("id, user_name, display_name, avatar_url")
          .eq("user_name", username.toLowerCase())
          .maybeSingle()
      : withSocial;

    if (rowSource.error) throw rowSource.error;
    if (!rowSource.data) return null;
    const row = asRecord(rowSource.data);
    const id = String(row.id);
    const [postsCount, winsCount, agendasCount] = await Promise.all([
      this.count("posts", "user_id", id),
      this.count("hourly_buckets", "winner_user_id", id),
      this.count("agenda_proposals", "user_id", id),
    ]);
    return {
      id,
      username: String(row.user_name),
      displayName: String(row.display_name ?? row.user_name),
      avatarUrl: (row.avatar_url as string | null) ?? null,
      postsCount,
      winsCount,
      agendasCount,
      socialLinks: parseSocialLinks(row.social_links),
    };
  }

  async search(query: string): Promise<SearchProfile[]> {
    const q = sanitizeIlike(query);
    if (q.length < 2) return [];
    const { data, error } = await this.client
      .from("profiles")
      .select("id, user_name, display_name, avatar_url")
      .or(`user_name.ilike.%${q}%,display_name.ilike.%${q}%`)
      .limit(20);
    if (error) throw error;
    return (data ?? []).map((raw) => {
      const row = asRecord(raw);
      return {
        id: String(row.id),
        username: String(row.user_name),
        displayName: String(row.display_name ?? row.user_name),
        avatarUrl: (row.avatar_url as string | null) ?? null,
      };
    });
  }

  async getPastPosts(userId: string, offset = 0, sort: FeedSort = "latest"): Promise<Paged<Post>> {
    const { data: winRows } = await this.client
      .from("hourly_buckets")
      .select("winning_post_id")
      .eq("winner_user_id", userId)
      .not("winning_post_id", "is", null);
    const winningIds = new Set(
      (winRows ?? []).map((raw) => String(asRecord(raw).winning_post_id)),
    );

    let postRows: Record<string, unknown>[] = [];
    let hasMore = false;

    if (sort === "liked") {
      const { data: allRows, error: allError } = await this.client
        .from("posts")
        .select("id, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      if (allError) throw allError;
      const allIds = (allRows ?? []).map((raw) => String(asRecord(raw).id));
      const { data: voteRows } = allIds.length
        ? await this.client.from("votes").select("post_id").in("post_id", allIds)
        : { data: [] };
      const counts = new Map<string, number>();
      for (const raw of voteRows ?? []) {
        const id = String(asRecord(raw).post_id);
        counts.set(id, (counts.get(id) ?? 0) + 1);
      }
      const created = new Map(
        (allRows ?? []).map((raw) => {
          const row = asRecord(raw);
          return [String(row.id), parseTimestamptz(row.created_at).getTime()] as const;
        }),
      );
      const ranked = [...allIds].sort(
        (a, b) => (counts.get(b) ?? 0) - (counts.get(a) ?? 0) || (created.get(b) ?? 0) - (created.get(a) ?? 0),
      );
      const pageIds = ranked.slice(offset, offset + PAGE_SIZE);
      hasMore = offset + pageIds.length < ranked.length;
      if (pageIds.length > 0) {
        const { data, error } = await this.client
          .from("posts")
          .select(
            "id, content_url, content_urls, caption, created_at, agenda_id, user_id, profiles!posts_user_id_fkey(user_name, avatar_url), agendas!posts_agenda_id_fkey(id, title)",
          )
          .in("id", pageIds);
        if (error) throw error;
        const byId = new Map((data ?? []).map((raw) => [String(asRecord(raw).id), asRecord(raw)]));
        postRows = pageIds.map((id) => byId.get(id)).filter((row): row is Record<string, unknown> => Boolean(row));
      }
    } else {
      const { data, error } = await this.client
        .from("posts")
        .select(
          "id, content_url, content_urls, caption, created_at, agenda_id, user_id, profiles!posts_user_id_fkey(user_name, avatar_url), agendas!posts_agenda_id_fkey(id, title)",
        )
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .range(offset, offset + PAGE_SIZE - 1);
      if (error) throw error;
      postRows = (data ?? []).map(asRecord);
      hasMore = postRows.length === PAGE_SIZE;
    }

    const postIds = postRows.map((row) => String(row.id));
    const voteCounts = new Map<string, number>();
    if (postIds.length > 0) {
      const { data: voteRows } = await this.client.from("votes").select("post_id").in("post_id", postIds);
      for (const raw of voteRows ?? []) {
        const id = String(asRecord(raw).post_id);
        voteCounts.set(id, (voteCounts.get(id) ?? 0) + 1);
      }
    }

    const items = postRows.map((row) => {
      const profile = asRecordOrNull(row.profiles);
      const agenda = asRecordOrNull(row.agendas);
      const id = String(row.id);
      return {
        id,
        agendaId: (row.agenda_id as string | null) ?? (agenda?.id as string | null) ?? null,
        userId: (row.user_id as string | null) ?? userId,
        username: (profile?.user_name as string | undefined) ?? "user",
        userAvatarUrl: (profile?.avatar_url as string | undefined) ?? "",
        imageUrls: parseContentUrls(row),
        likes: voteCounts.get(id) ?? 0,
        createdAt: parseTimestamptz(row.created_at),
        caption: (row.caption as string | null) ?? null,
        isWinner: winningIds.has(id),
        agendaTitle: (agenda?.title as string | null) ?? null,
      };
    });
    return { items, hasMore };
  }

  async getProposals(userId: string): Promise<AgendaProposal[]> {
    const { data, error } = await this.client
      .from("agenda_proposals")
      .select("id, proposed_title, proposed_description, status, created_at, current_agenda_id")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    const rows = (data ?? []).map(asRecord);
    const proposalIds = rows.map((row) => String(row.id));
    const childByProposal = new Map<string, string>();
    if (proposalIds.length > 0) {
      const { data: childRows, error: childError } = await this.client
        .from("agendas")
        .select("id, created_from_proposal_id")
        .in("created_from_proposal_id", proposalIds);
      if (!childError) {
        for (const raw of childRows ?? []) {
          const child = asRecord(raw);
          const proposalId = child.created_from_proposal_id;
          if (proposalId) childByProposal.set(String(proposalId), String(child.id));
        }
      }
    }
    return rows.map((row) => {
      const id = String(row.id);
      return {
        id,
        title: String(row.proposed_title ?? ""),
        description: (row.proposed_description as string | null) ?? null,
        status: String(row.status),
        createdAt: parseTimestamptz(row.created_at),
        agendaId: childByProposal.get(id) ?? (row.current_agenda_id ? String(row.current_agenda_id) : null),
      };
    });
  }

  async recordVisit(profileId: string) {
    const { error } = await this.client.rpc(Rpc.recordProfileVisit, { profile_id: profileId });
    if (error && !String(error.message).toLowerCase().includes("self")) {
      throw error;
    }
  }

  async updateOwnProfile(input: {
    displayName?: string;
    avatarUrl?: string | null;
    socialLinks?: SocialLinks;
  }): Promise<SocialLinks> {
    const payload: Record<string, unknown> = {
      p_display_name: input.displayName ?? null,
      p_avatar_url: input.avatarUrl ?? null,
    };
    if (input.socialLinks) payload.p_social_links = input.socialLinks;
    const { data, error } = await this.client.rpc(Rpc.updateOwnProfile, payload);
    if (error) throw error;
    return parseSocialLinks(asRecordOrNull(data)?.social_links);
  }

  async report(input: {
    targetType: "post" | "profile" | "proposal";
    reason: string;
    postId?: string | null;
    profileId?: string | null;
    proposalId?: string | null;
  }) {
    const reason = input.reason.trim();
    if (!reason) throw new AppError("A reason is required.");
    const { error } = await this.client.rpc(Rpc.createContentReport, {
      p_target_type: input.targetType,
      p_reason: reason,
      p_target_post_id: input.postId ?? null,
      p_target_profile_id: input.profileId ?? null,
      p_target_proposal_id: input.proposalId ?? null,
    });
    if (error) throw error;
  }

  async listRecentVisitors(hours = 24): Promise<ProfileVisitor[]> {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
    const { data, error } = await this.client
      .from("profile_visits")
      .select("visited_at, visitor_user_id")
      .gte("visited_at", since)
      .order("visited_at", { ascending: false });
    if (error) throw error;
    const visits = (data ?? []).map(asRecord);
    const visitorIds = [...new Set(visits.map((row) => String(row.visitor_user_id)))];
    if (visitorIds.length === 0) return [];

    const { data: profileRows, error: profileError } = await this.client
      .from("profiles")
      .select("id, user_name, display_name, avatar_url")
      .in("id", visitorIds);
    if (profileError) throw profileError;
    const profiles = new Map(
      (profileRows ?? []).map((raw) => {
        const row = asRecord(raw);
        return [String(row.id), row] as const;
      }),
    );

    const grouped = new Map<string, ProfileVisitor>();
    for (const visit of visits) {
      const visitorId = String(visit.visitor_user_id);
      const existing = grouped.get(visitorId);
      if (existing) {
        existing.visitCount += 1;
        continue;
      }
      const profile = profiles.get(visitorId);
      if (!profile) continue;
      grouped.set(visitorId, {
        id: visitorId,
        username: String(profile.user_name),
        displayName: String(profile.display_name ?? profile.user_name),
        avatarUrl: (profile.avatar_url as string | null) ?? null,
        visitedAt: parseTimestamptz(visit.visited_at),
        visitCount: 1,
      });
    }
    return [...grouped.values()].sort((a, b) => b.visitedAt.getTime() - a.visitedAt.getTime());
  }

  async uploadAvatar(userId: string, blob: Blob): Promise<string> {
    const path = `${userId}/avatar.jpg`;
    const { error } = await this.client.storage.from("post-media").upload(path, blob, {
      contentType: "image/jpeg",
      upsert: true,
    });
    if (error) throw error;
    const { data } = this.client.storage.from("post-media").getPublicUrl(path);
    return `${data.publicUrl}?t=${Date.now()}`;
  }

  private async count(table: string, column: string, userId: string): Promise<number> {
    const { count } = await this.client
      .from(table)
      .select("id", { count: "exact", head: true })
      .eq(column, userId);
    return count ?? 0;
  }
}
