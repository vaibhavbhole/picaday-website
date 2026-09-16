export const SOCIAL_PLATFORMS = [
  { id: "instagram", label: "Instagram", placeholder: "instagram.com/yourname" },
  { id: "x", label: "X", placeholder: "x.com/yourname" },
  { id: "tiktok", label: "TikTok", placeholder: "tiktok.com/@yourname" },
  { id: "youtube", label: "YouTube", placeholder: "youtube.com/@yourname" },
  { id: "linkedin", label: "LinkedIn", placeholder: "linkedin.com/in/yourname" },
  { id: "facebook", label: "Facebook", placeholder: "facebook.com/yourname" },
  { id: "threads", label: "Threads", placeholder: "threads.net/@yourname" },
] as const;

export type SocialPlatformId = (typeof SOCIAL_PLATFORMS)[number]["id"];
export type SocialLinks = Partial<Record<SocialPlatformId, string>>;

const PATTERNS: Record<SocialPlatformId, RegExp> = {
  instagram: /^https:\/\/(www\.)?instagram\.com\/[A-Za-z0-9._]+\/?$/,
  x: /^https:\/\/(www\.)?(x|twitter)\.com\/[A-Za-z0-9_]+\/?$/,
  tiktok: /^https:\/\/(www\.)?tiktok\.com\/@[A-Za-z0-9._]+\/?$/,
  youtube:
    /^https:\/\/(www\.)?youtube\.com\/(@[A-Za-z0-9._-]+|channel\/UC[A-Za-z0-9_-]+|c\/[A-Za-z0-9._-]+|user\/[A-Za-z0-9._-]+)\/?$/,
  linkedin: /^https:\/\/(www\.)?linkedin\.com\/in\/[A-Za-z0-9_-]+\/?$/,
  facebook: /^https:\/\/(www\.)?facebook\.com\/[A-Za-z0-9.]+\/?$/,
  threads: /^https:\/\/(www\.)?threads\.net\/@[A-Za-z0-9._]+\/?$/,
};

const HANDLE = /^@?[A-Za-z0-9._-]+$/;

function strip(value: string): string {
  return value.trim().replace(/\/+$/, "");
}

export function normalizeSocialInput(platform: SocialPlatformId, raw: string): string | null {
  const trimmed = strip(raw);
  if (!trimmed) return null;

  let url = trimmed;
  if (!/^https?:\/\//i.test(url)) {
    const handle = trimmed.replace(/^@/, "");
    if (!HANDLE.test(handle)) {
      throw new Error(`Enter a ${platform} profile URL or username, not a post or video link.`);
    }
    switch (platform) {
      case "instagram":
        url = `https://instagram.com/${handle}`;
        break;
      case "x":
        url = `https://x.com/${handle}`;
        break;
      case "tiktok":
        url = `https://tiktok.com/@${handle}`;
        break;
      case "youtube":
        url = `https://youtube.com/@${handle}`;
        break;
      case "linkedin":
        url = `https://linkedin.com/in/${handle}`;
        break;
      case "facebook":
        url = `https://facebook.com/${handle}`;
        break;
      case "threads":
        url = `https://threads.net/@${handle}`;
        break;
    }
  }

  url = url.replace(/^http:\/\//i, "https://");
  if (url.includes("twitter.com")) url = url.replace("twitter.com", "x.com");
  if (!url.startsWith("https://")) url = `https://${url.replace(/^\/+/, "")}`;

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error(`That is not a ${platform} profile page.`);
  }
  if (parsed.search || parsed.hash) {
    throw new Error("Use the profile page URL only, without query parameters.");
  }

  const normalized = `${parsed.origin}${parsed.pathname}`.replace(/\/+$/, "");
  if (!PATTERNS[platform].test(`${normalized}/`) && !PATTERNS[platform].test(normalized)) {
    throw new Error(`That is not a ${platform} profile page.`);
  }
  return normalized;
}

const KEY_ALIASES: Record<string, SocialPlatformId> = {
  instagram: "instagram",
  ig: "instagram",
  x: "x",
  twitter: "x",
  tiktok: "tiktok",
  youtube: "youtube",
  yt: "youtube",
  linkedin: "linkedin",
  facebook: "facebook",
  fb: "facebook",
  threads: "threads",
};

function asSocialObject(value: unknown): Record<string, unknown> | null {
  if (!value) return null;
  if (typeof value === "string") {
    try {
      const parsed: unknown = JSON.parse(value);
      return asSocialObject(parsed);
    } catch {
      return null;
    }
  }
  if (typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

export function parseSocialLinks(value: unknown): SocialLinks {
  const row = asSocialObject(value);
  if (!row) return {};
  const out: SocialLinks = {};
  for (const [rawKey, rawValue] of Object.entries(row)) {
    const platform = KEY_ALIASES[rawKey.trim().toLowerCase()];
    if (!platform || typeof rawValue !== "string" || !rawValue.trim()) continue;
    out[platform] = rawValue.trim();
  }
  return out;
}

export function previewSocialLinks(draft: Record<SocialPlatformId, string>): SocialLinks {
  const out: SocialLinks = {};
  for (const platform of SOCIAL_PLATFORMS) {
    const raw = draft[platform.id] ?? "";
    if (!raw.trim()) continue;
    try {
      const normalized = normalizeSocialInput(platform.id, raw);
      if (normalized) out[platform.id] = normalized;
    } catch {
      if (/^https:\/\//i.test(raw.trim())) out[platform.id] = raw.trim();
    }
  }
  return out;
}

export function serializeSocialLinks(draft: Record<SocialPlatformId, string>): SocialLinks {
  const out: SocialLinks = {};
  for (const platform of SOCIAL_PLATFORMS) {
    const normalized = normalizeSocialInput(platform.id, draft[platform.id] ?? "");
    if (normalized) out[platform.id] = normalized;
  }
  return out;
}
