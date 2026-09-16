import type { Metadata } from "next";
import { SITE } from "@/lib/site";

export const SHARE_KINDS = ["post", "win", "agenda"] as const;
export type ShareKind = (typeof SHARE_KINDS)[number];

export function isShareKind(value: string): value is ShareKind {
  return SHARE_KINDS.includes(value as ShareKind);
}

export function sharePath(kind: ShareKind, id: string) {
  return `/s/${kind}/${id}`;
}

export function ogPath(kind: ShareKind, id: string) {
  return `/api/og/${kind}/${id}`;
}

export function siteOrigin() {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "");
  if (explicit) return explicit;
  const vercel = process.env.VERCEL_URL?.replace(/\/+$/, "");
  if (vercel) return `https://${vercel}`;
  return "http://localhost:3000";
}

export function shareText(
  kind: ShareKind,
  input: { username?: string | null; agendaTitle?: string | null },
) {
  const agenda = input.agendaTitle?.trim() || "today’s agenda";
  if (kind === "win") return `I just won this hour on ${SITE.name} — “${agenda}”`;
  if (kind === "agenda") return `Today’s ${SITE.name}: “${agenda}”. One prompt. 24 hours.`;
  return `My take on today’s ${SITE.name} agenda: “${agenda}”`;
}

export function shareMetadata(input: {
  kind: ShareKind;
  id: string;
  title: string;
  description?: string | null;
}): Metadata {
  const origin = siteOrigin();
  const url = `${origin}${sharePath(input.kind, input.id)}`;
  const image = `${origin}${ogPath(input.kind, input.id)}`;
  const description = input.description?.trim() || "One shared agenda. Twenty-four hours. Community-chosen champions.";
  return {
    title: input.title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: input.title,
      description,
      url,
      siteName: SITE.name,
      type: "website",
      images: [{ url: image, width: 1200, height: 1500, alt: input.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: input.title,
      description,
      images: [image],
    },
  };
}
