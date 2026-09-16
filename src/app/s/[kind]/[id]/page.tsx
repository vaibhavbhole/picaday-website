import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { loadShareCard } from "@/data/share-load";
import { ShareLanding } from "@/features/share/share-landing";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isShareKind, shareMetadata } from "@/lib/share";

type PageProps = { params: Promise<{ kind: string; id: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { kind, id } = await params;
  const card = await loadShareCard(kind, id);
  if (!card) return { title: "PicADay.Vote" };
  const urlKind = isShareKind(kind) ? kind : "post";
  return shareMetadata({
    kind: urlKind,
    id,
    title: card.title,
    description: card.description,
  });
}

export default async function SharePage({ params }: PageProps) {
  const { kind, id } = await params;
  if (!isShareKind(kind)) notFound();
  const card = await loadShareCard(kind, id);
  if (!card) notFound();
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return <ShareLanding card={card} shareKind={kind} signedIn={Boolean(user)} />;
}
