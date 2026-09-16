import type { SupabaseClient } from "@supabase/supabase-js";
import { asRecord, asRecordOrNull, parseContentUrls, parseTimestamptz } from "@/data/mappers";
import { formatTimeWindow } from "@/lib/format";
import type { ShareKind } from "@/lib/share";
import { SITE } from "@/lib/site";

export type ShareCard = {
  kind: ShareKind;
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  username: string | null;
  agendaTitle: string | null;
  hourLabel: string | null;
  timeWindow: string | null;
  deepLink: string;
};

export class ShareRepository {
  constructor(private readonly client: SupabaseClient) {}

  async getPost(postId: string): Promise<ShareCard | null> {
    const { data, error } = await this.client
      .from("posts")
      .select(
        "id, content_url, content_urls, caption, agenda_id, profiles!posts_user_id_fkey(user_name), agendas!posts_agenda_id_fkey(id, title)",
      )
      .eq("id", postId)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    const row = asRecord(data);
    const profile = asRecordOrNull(row.profiles);
    const agenda = asRecordOrNull(row.agendas);
    const username = (profile?.user_name as string | null) ?? null;
    const agendaTitle = (agenda?.title as string | null) ?? null;
    const urls = parseContentUrls(row);

    const { data: winRows } = await this.client
      .from("hourly_buckets")
      .select("id, bucket_number, starts_at, ends_at, agenda_id")
      .eq("winning_post_id", postId)
      .limit(1);
    const win = winRows?.[0] ? asRecord(winRows[0]) : null;
    const isWin = Boolean(win);

    return {
      kind: isWin ? "win" : "post",
      id: postId,
      title: isWin
        ? `${username ? `@${username}` : "Hourly champion"} won “${agendaTitle ?? SITE.name}”`
        : `${username ? `@${username}` : "A post"} on “${agendaTitle ?? SITE.name}”`,
      description: (row.caption as string | null) ?? null,
      imageUrl: urls[0] ?? null,
      username,
      agendaTitle,
      hourLabel: win ? `H${Number(win.bucket_number)}` : null,
      timeWindow: win
        ? formatTimeWindow(parseTimestamptz(win.starts_at), parseTimestamptz(win.ends_at))
        : null,
      deepLink: username ? `/u/${username}` : "/",
    };
  }

  async getWin(bucketId: string): Promise<ShareCard | null> {
    const { data, error } = await this.client
      .from("hourly_buckets")
      .select(
        "id, agenda_id, bucket_number, starts_at, ends_at, winning_post_id, winner:profiles!hourly_buckets_winner_user_id_fkey(user_name), winning_post:posts!hourly_buckets_winning_post_fk(content_url, content_urls, caption)",
      )
      .eq("id", bucketId)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    const row = asRecord(data);
    if (!row.winning_post_id) return null;
    const winner = asRecordOrNull(row.winner);
    const post = asRecordOrNull(row.winning_post);
    const username = (winner?.user_name as string | null) ?? null;
    const agendaId = String(row.agenda_id);
    const { data: agendaRow } = await this.client.from("agendas").select("id, title").eq("id", agendaId).maybeSingle();
    const agendaTitle = agendaRow ? String(asRecord(agendaRow).title ?? "") : null;
    return {
      kind: "win",
      id: bucketId,
      title: `${username ? `@${username}` : "Hourly champion"} won “${agendaTitle ?? SITE.name}”`,
      description: (post?.caption as string | null) ?? null,
      imageUrl: post ? parseContentUrls(post)[0] ?? null : null,
      username,
      agendaTitle,
      hourLabel: `H${Number(row.bucket_number)}`,
      timeWindow: formatTimeWindow(parseTimestamptz(row.starts_at), parseTimestamptz(row.ends_at)),
      deepLink: `/agendas/${agendaId}/hours/${bucketId}`,
    };
  }

  async getAgenda(agendaId: string): Promise<ShareCard | null> {
    const { data, error } = await this.client
      .from("agendas")
      .select("id, title, description, status")
      .eq("id", agendaId)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    const row = asRecord(data);
    const title = String(row.title ?? "Today’s agenda");
    const status = String(row.status ?? "");
    return {
      kind: "agenda",
      id: agendaId,
      title: `Today’s ${SITE.name}: “${title}”`,
      description: (row.description as string | null) ?? "One prompt. 24 hours. Community-chosen champions.",
      imageUrl: null,
      username: null,
      agendaTitle: title,
      hourLabel: null,
      timeWindow: "24 hours",
      deepLink: status === "active" ? "/" : `/explore/${agendaId}`,
    };
  }
}
