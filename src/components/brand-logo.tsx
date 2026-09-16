import { cn } from "@/lib/cn";

export const BRAND_LOGO_SRC = "/brand/picaday-vote-logo.png";
export const BRAND_NAME = "picaday.vote";

export function BrandLogo({
  size = "md",
  className,
  showWordmark = true,
}: {
  size?: "sm" | "md" | "lg";
  className?: string;
  showWordmark?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex min-w-0 items-center",
        size === "lg" ? "flex-col gap-3" : "gap-2",
        className,
      )}
      aria-label={BRAND_NAME}
    >
      <span
        className={cn(
          "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white",
          size === "sm" && "h-9 w-9 p-0.5",
          size === "md" && "h-11 w-11 p-0.5",
          size === "lg" && "h-28 w-28 p-2",
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={BRAND_LOGO_SRC} alt="" className="h-full w-full object-contain" />
      </span>
      {showWordmark ? (
        <span
          className={cn(
            "min-w-0 truncate font-extrabold tracking-tight",
            size === "sm" && "text-lg",
            size === "md" && "text-xl",
            size === "lg" && "text-3xl",
          )}
        >
          picaday
          <span className="text-[var(--text-muted)]">.vote</span>
        </span>
      ) : null}
    </span>
  );
}
