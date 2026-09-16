"use client";

import { useState } from "react";
import { Check, Copy, Download, Share2 } from "lucide-react";
import { Button } from "@/components/ui";
import { ogPath, sharePath, shareText, type ShareKind } from "@/lib/share";

export function ShareButton({
  kind,
  id,
  agendaTitle,
  username,
  compact = false,
  copyKind,
}: {
  kind: ShareKind;
  id: string;
  agendaTitle?: string | null;
  username?: string | null;
  compact?: boolean;
  copyKind?: ShareKind;
}) {
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);

  async function shareUrl() {
    const origin = window.location.origin;
    return `${origin}${sharePath(kind, id)}`;
  }

  async function onShare(event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    const url = await shareUrl();
    const text = shareText(copyKind ?? kind, { agendaTitle, username });
    try {
      if (navigator.share) {
        await navigator.share({ title: "PicADay.Vote", text, url });
        return;
      }
      await navigator.clipboard.writeText(`${text}\n${url}`);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      try {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1600);
      } catch {
        // Ignore if clipboard is blocked.
      }
    }
  }

  async function onCopy(event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    try {
      await navigator.clipboard.writeText(await shareUrl());
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      // Ignore.
    }
  }

  async function onDownload(event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    setBusy(true);
    try {
      const response = await fetch(`${window.location.origin}${ogPath(kind, id)}`, { cache: "no-store" });
      if (!response.ok) return;
      const blob = await response.blob();
      if (!blob.type.startsWith("image/")) return;
      const href = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = href;
      link.download = `picaday-${kind}.png`;
      link.click();
      URL.revokeObjectURL(href);
    } catch {
      // OG generation can fail; keep the page usable.
    } finally {
      setBusy(false);
    }
  }

  if (compact) {
    return (
      <Button variant="ghost" className="gap-2 px-2" onClick={(e) => void onShare(e)} aria-label="Share">
        {copied ? <Check size={18} /> : <Share2 size={18} />}
      </Button>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button className="gap-2" onClick={(e) => void onShare(e)}>
        <Share2 size={16} /> Share
      </Button>
      <Button variant="ghost" className="gap-2" onClick={(e) => void onCopy(e)}>
        {copied ? <Check size={16} /> : <Copy size={16} />}
        {copied ? "Copied" : "Copy link"}
      </Button>
      <Button variant="ghost" className="gap-2" disabled={busy} onClick={(e) => void onDownload(e)}>
        <Download size={16} /> {busy ? "Saving…" : "Download image"}
      </Button>
    </div>
  );
}
