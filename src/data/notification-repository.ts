import type { SupabaseClient } from "@supabase/supabase-js";
import { AppError } from "@/lib/errors";
import {
  asRecord,
  asRecordOrNull,
  parseContentUrls,
  parseTimestamptz,
  parseTimestamptzOrNull,
} from "@/data/mappers";
import { Rpc, type AppNotification } from "@/data/types";

export class NotificationRepository {
  constructor(private readonly client: SupabaseClient) {}

  async list(): Promise<AppNotification[]> {
    const selectWithUrls =
      "id, type, title, body, agenda_id, bucket_id, winning_post_id, profile_visit_count, proposal_title, proposal_description, proposal_submitted_at, is_read, created_at, winning_post:posts!notifications_winning_post_id_fkey(content_url, content_urls)";
    const selectPlain =
      "id, type, title, body, agenda_id, bucket_id, winning_post_id, profile_visit_count, proposal_title, proposal_description, proposal_submitted_at, is_read, created_at, winning_post:posts!notifications_winning_post_id_fkey(content_url)";
    let result = await this.client.from("notifications").select(selectWithUrls).order("created_at", { ascending: false }).limit(50);
    if (result.error && /content_urls/i.test(result.error.message)) {
      result = await this.client.from("notifications").select(selectPlain).order("created_at", { ascending: false }).limit(50);
    }
    if (result.error) throw result.error;
    const items = (result.data ?? [])
      .map((raw) => this.mapRow(asRecord(raw)))
      .filter((item): item is AppNotification => item != null);
    return this.withProposalEligibility(items);
  }

  async markRead(notificationId: string) {
    const { error } = await this.client.rpc(Rpc.markNotificationRead, {
      notification_id: notificationId,
    });
    if (error) throw error;
  }

  async countUnread(): Promise<number> {
    const { count, error } = await this.client
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("is_read", false);
    if (error) throw error;
    return count ?? 0;
  }

  async submitAgendaProposal(bucketId: string, title: string, description?: string) {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) throw new AppError("Proposed title is required.");
    const trimmedDescription = description?.trim();
    const { error } = await this.client.rpc(Rpc.submitAgendaProposal, {
      bucket_id: bucketId,
      proposed_title: trimmedTitle,
      proposed_description: trimmedDescription || null,
    });
    if (error) throw error;
  }

  private async withProposalEligibility(items: AppNotification[]): Promise<AppNotification[]> {
    const missingPostIds = [
      ...new Set(
        items
          .filter((item) => item.type === "hourly_winner" && !item.bucketId && item.winningPostId)
          .map((item) => item.winningPostId as string),
      ),
    ];
    const bucketByPost = new Map<string, { bucketId: string; agendaId: string | null }>();
    if (missingPostIds.length > 0) {
      const { data } = await this.client
        .from("hourly_buckets")
        .select("id, agenda_id, winning_post_id")
        .in("winning_post_id", missingPostIds);
      for (const raw of data ?? []) {
        const row = asRecord(raw);
        if (!row.winning_post_id) continue;
        bucketByPost.set(String(row.winning_post_id), {
          bucketId: String(row.id),
          agendaId: row.agenda_id ? String(row.agenda_id) : null,
        });
      }
    }

    const hydrated = items.map((item) => {
      const fromPost = item.winningPostId ? bucketByPost.get(item.winningPostId) : undefined;
      return {
        ...item,
        bucketId: item.bucketId ?? fromPost?.bucketId ?? null,
        agendaId: item.agendaId ?? fromPost?.agendaId ?? null,
        canProposeAgenda: false,
      };
    });

    const agendaIds = [
      ...new Set(
        hydrated
          .filter((item) => item.type === "hourly_winner" && item.agendaId)
          .map((item) => item.agendaId as string),
      ),
    ];
    const activeAgendaIds = new Set<string>();
    if (agendaIds.length > 0) {
      const { data } = await this.client.from("agendas").select("id, status").in("id", agendaIds);
      for (const raw of data ?? []) {
        const row = asRecord(raw);
        if (String(row.status) === "active") activeAgendaIds.add(String(row.id));
      }
    }

    const missingAgendaBucketIds = [
      ...new Set(
        hydrated
          .filter((item) => item.type === "hourly_winner" && item.bucketId && !item.agendaId)
          .map((item) => item.bucketId as string),
      ),
    ];
    if (missingAgendaBucketIds.length > 0) {
      const { data } = await this.client
        .from("hourly_buckets")
        .select("id, agenda_id")
        .in("id", missingAgendaBucketIds);
      const agendaByBucket = new Map<string, string>();
      for (const raw of data ?? []) {
        const row = asRecord(raw);
        if (row.agenda_id) agendaByBucket.set(String(row.id), String(row.agenda_id));
      }
      const extraAgendaIds = [...new Set(agendaByBucket.values())].filter((id) => !activeAgendaIds.has(id));
      if (extraAgendaIds.length > 0) {
        const { data: extra } = await this.client.from("agendas").select("id, status").in("id", extraAgendaIds);
        for (const raw of extra ?? []) {
          const row = asRecord(raw);
          if (String(row.status) === "active") activeAgendaIds.add(String(row.id));
        }
      }
      for (const item of hydrated) {
        if (!item.agendaId && item.bucketId) {
          item.agendaId = agendaByBucket.get(item.bucketId) ?? null;
        }
      }
    }

    return hydrated.map((item) => ({
      ...item,
      canProposeAgenda:
        item.type === "hourly_winner" &&
        Boolean(item.bucketId) &&
        !item.proposalSubmittedAt &&
        Boolean(item.agendaId && activeAgendaIds.has(item.agendaId)),
    }));
  }

  private mapRow(row: Record<string, unknown>): AppNotification | null {
    const type = row.type;
    if (type !== "hourly_winner" && type !== "profile_visits_daily") return null;
    const winningPost = asRecordOrNull(row.winning_post);
    const bucketId = (row.bucket_id as string | null) ?? null;
    const proposalSubmittedAt = parseTimestamptzOrNull(row.proposal_submitted_at);
    return {
      id: String(row.id),
      type,
      title: String(row.title ?? ""),
      body: (row.body as string | null) ?? null,
      agendaId: (row.agenda_id as string | null) ?? null,
      bucketId,
      winningPostId: (row.winning_post_id as string | null) ?? null,
      winningPostUrl: winningPost ? parseContentUrls(winningPost)[0] ?? null : null,
      profileVisitCount: row.profile_visit_count == null ? null : Number(row.profile_visit_count),
      proposalTitle: (row.proposal_title as string | null) ?? null,
      proposalDescription: (row.proposal_description as string | null) ?? null,
      proposalSubmittedAt,
      isRead: Boolean(row.is_read),
      createdAt: parseTimestamptz(row.created_at),
      canProposeAgenda: false,
    };
  }
}
