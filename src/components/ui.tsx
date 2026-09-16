import { cn } from "@/lib/cn";

export function Avatar({
  url,
  name,
  size = 40,
}: {
  url?: string | null;
  name: string;
  size?: number;
}) {
  const initial = name.trim().slice(0, 1).toUpperCase() || "P";
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--surface-elevated)] text-sm font-bold text-[var(--lavender)]"
      style={{ width: size, height: size }}
    >
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="" className="h-full w-full object-cover" />
      ) : (
        initial
      )}
    </span>
  );
}

export function Button({
  children,
  className,
  variant = "primary",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" | "danger" }) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50",
        variant === "primary" && "bg-[var(--lavender-dark)] text-white hover:opacity-90",
        variant === "ghost" && "bg-transparent text-[var(--lavender)] hover:bg-[var(--surface-elevated)]",
        variant === "danger" && "bg-transparent text-red-400 hover:bg-[var(--surface-elevated)]",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function Field({
  label,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium text-[var(--text-secondary)]">{label}</span>
      <input
        className="w-full rounded-xl border border-[var(--card-border)] bg-[var(--surface-elevated)] px-3 py-2.5 text-[var(--text-primary)] outline-none ring-[var(--lavender)] focus:ring-2"
        {...props}
      />
    </label>
  );
}

export function EmptyState({ title, body }: { title: string; body?: string }) {
  return (
    <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card)] p-8 text-center">
      <p className="text-lg font-bold">{title}</p>
      {body ? <p className="mt-2 text-sm text-[var(--text-secondary)]">{body}</p> : null}
    </div>
  );
}

export function Spinner() {
  return (
    <div className="flex justify-center py-16">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--card-border)] border-t-[var(--lavender)]" />
    </div>
  );
}
