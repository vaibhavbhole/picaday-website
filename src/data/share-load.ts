import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ShareRepository, type ShareCard } from "@/data/share-repository";
import { isShareKind, type ShareKind } from "@/lib/share";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function loadShareCard(kind: string, id: string): Promise<ShareCard | null> {
  if (!isShareKind(kind) || !UUID_RE.test(id)) return null;
  try {
    const repos = new ShareRepository(await createServerSupabaseClient());
    if (kind === "post") return await repos.getPost(id);
    if (kind === "win") return await repos.getWin(id);
    return await repos.getAgenda(id);
  } catch {
    return null;
  }
}

export type { ShareCard, ShareKind };
