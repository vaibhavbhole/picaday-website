import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { ShareButton } from "@/components/share-button";
import type { ShareCard } from "@/data/share-repository";
import type { ShareKind } from "@/lib/share";

export function ShareLanding({
  card,
  shareKind,
  signedIn,
}: {
  card: ShareCard;
  shareKind: ShareKind;
  signedIn: boolean;
}) {
  const badge =
    card.kind === "win"
      ? `Hourly champion${card.hourLabel ? ` · ${card.hourLabel}` : ""}${card.timeWindow ? ` · ${card.timeWindow}` : ""}`
      : card.kind === "agenda"
        ? "Today’s agenda · 24 hours · join to post"
        : null;

  return (
    <div className="mx-auto w-full max-w-[420px] space-y-4 px-3 py-8">
      <div className="flex justify-center">
        <BrandLogo size="md" />
      </div>
      <article className="overflow-hidden rounded-2xl border border-[var(--card-border)] bg-[var(--card)]">
        <div className="relative aspect-[4/5] bg-[var(--surface-elevated)]">
          {card.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={card.imageUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full flex-col justify-center p-6">
              <p className="text-sm font-semibold text-[var(--lavender)]">Today’s agenda</p>
              <h1 className="mt-2 text-3xl font-extrabold">{card.agendaTitle}</h1>
            </div>
          )}
          {badge ? (
            <span className="absolute left-3 top-3 rounded-full bg-black/70 px-3 py-1 text-xs font-bold text-white">
              {badge}
            </span>
          ) : null}
        </div>
        <div className="space-y-1 p-4">
          {card.username ? <p className="font-bold">@{card.username}</p> : null}
          {card.agendaTitle && card.kind !== "agenda" ? (
            <p className="text-sm text-[var(--text-secondary)]">{card.agendaTitle}</p>
          ) : null}
          {card.description ? <p className="text-sm">{card.description}</p> : null}
        </div>
      </article>
      <ShareButton
        kind={shareKind}
        id={card.id}
        copyKind={card.kind}
        agendaTitle={card.agendaTitle}
        username={card.username}
      />
      {signedIn ? (
        <Link
          href={card.deepLink}
          className="flex items-center justify-center rounded-xl bg-[var(--lavender-dark)] px-4 py-2.5 text-sm font-semibold text-white"
        >
          Open in PicADay.Vote
        </Link>
      ) : (
        <div className="grid gap-2">
          <Link
            href={`/signup?next=${encodeURIComponent(card.deepLink)}`}
            className="flex items-center justify-center rounded-xl bg-[var(--lavender-dark)] px-4 py-2.5 text-sm font-semibold text-white"
          >
            Join today’s agenda
          </Link>
          <Link
            href={`/login?next=${encodeURIComponent(card.deepLink)}`}
            className="flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold text-[var(--lavender)]"
          >
            Sign in
          </Link>
        </div>
      )}
    </div>
  );
}
