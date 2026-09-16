export function asRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  throw new Error("Expected object");
}

export function asRecordOrNull(value: unknown): Record<string, unknown> | null {
  if (value == null) return null;
  if (Array.isArray(value) && value.length > 0) return asRecord(value[0]);
  if (typeof value === "object") return asRecord(value);
  return null;
}

export function parseTimestamptz(value: unknown): Date {
  return new Date(String(value));
}

export function parseTimestamptzOrNull(value: unknown): Date | null {
  if (value == null) return null;
  return parseTimestamptz(value);
}

export function parseContentUrls(row: Record<string, unknown>): string[] {
  const raw = row.content_urls;
  if (Array.isArray(raw)) {
    const urls = raw
      .map((item) => (item == null ? "" : String(item).trim()))
      .filter(Boolean);
    if (urls.length > 0) return urls;
  }
  const single = row.content_url;
  if (typeof single === "string" && single.trim()) return [single.trim()];
  return [];
}

export function hasContentAccess(input: {
  status: string | null | undefined;
  trialEndsAt: Date | null;
  currentPeriodEnd: Date | null;
  now?: Date;
}): boolean {
  const current = (input.now ?? new Date()).getTime();
  if (input.status === "trialing" && input.trialEndsAt && current < input.trialEndsAt.getTime()) {
    return true;
  }
  if (input.status === "active" && input.currentPeriodEnd && current < input.currentPeriodEnd.getTime()) {
    return true;
  }
  return false;
}

export function isEmailIdentifier(value: string): boolean {
  return value.includes("@") && value.includes(".");
}

export function sanitizeIlike(query: string): string {
  return query.replace(/[%_,]/g, " ").trim();
}
