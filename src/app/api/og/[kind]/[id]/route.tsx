import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { loadShareCard } from "@/data/share-load";
import { isShareKind } from "@/lib/share";

export const runtime = "nodejs";

let logoDataUrl: string | null = null;

async function brandLogoSrc() {
  if (logoDataUrl) return logoDataUrl;
  const buffer = await readFile(join(process.cwd(), "public/brand/picaday-vote-logo.png"));
  logoDataUrl = `data:image/png;base64,${buffer.toString("base64")}`;
  return logoDataUrl;
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ kind: string; id: string }> },
) {
  try {
    const { kind, id } = await context.params;
    if (!isShareKind(kind)) {
      return new Response("Not found", { status: 404 });
    }
    const card = await loadShareCard(kind, id);
    if (!card) return new Response("Not found", { status: 404 });

    const photo = await embedImage(card.imageUrl);
    const logo = await brandLogoSrc();
    const badge =
      card.kind === "win"
        ? `Hourly champion${card.hourLabel ? ` · ${card.hourLabel}` : ""}${card.timeWindow ? ` · ${card.timeWindow}` : ""}`
        : card.kind === "agenda"
          ? "Today’s agenda · 24 hours · join to post"
          : [card.username ? `@${card.username}` : null, card.agendaTitle].filter(Boolean).join(" · ");
    const footer = [
      card.username ? `@${card.username}` : "picaday",
      card.agendaTitle && card.kind !== "agenda" ? card.agendaTitle : null,
    ]
      .filter(Boolean)
      .join(" · ");

    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            backgroundColor: "#0d0d12",
            color: "#ffffff",
            padding: 48,
          }}
        >
          <div style={{ display: "flex", alignItems: "center" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={logo}
              alt=""
              width={280}
              height={280}
              style={{
                width: 96,
                height: 96,
                objectFit: "contain",
                backgroundColor: "#ffffff",
                borderRadius: 20,
              }}
            />
            <div
              style={{
                display: "flex",
                marginLeft: 20,
                fontSize: 44,
                fontWeight: 800,
                letterSpacing: -1,
              }}
            >
              picaday.vote
            </div>
          </div>
          <div
            style={{
              marginTop: 28,
              flex: 1,
              display: "flex",
              borderRadius: 32,
              overflow: "hidden",
              backgroundColor: "#1e1e26",
              border: "1px solid #2a2a35",
            }}
          >
            {photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photo} alt="" width={1104} height={1200} style={{ objectFit: "cover", width: "100%", height: "100%" }} />
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  padding: 48,
                  width: "100%",
                }}
              >
                <div style={{ display: "flex", fontSize: 28, color: "#b4b1f4", fontWeight: 700 }}>Today’s agenda</div>
                <div style={{ display: "flex", marginTop: 16, fontSize: 64, fontWeight: 800, lineHeight: 1.1 }}>
                  {card.agendaTitle || "One shared prompt"}
                </div>
              </div>
            )}
          </div>
          <div style={{ display: "flex", flexDirection: "column", marginTop: 28 }}>
            <div style={{ display: "flex", fontSize: 28, color: "#b4b1f4", fontWeight: 700 }}>{badge}</div>
            <div style={{ display: "flex", marginTop: 8, fontSize: 22, color: "#9e9eab" }}>{footer}</div>
          </div>
        </div>
      ),
      { width: 1200, height: 1500 },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to generate the image";
    return new Response(message, { status: 500 });
  }
}

async function embedImage(url: string | null): Promise<string | null> {
  if (!url) return null;
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.byteLength === 0 || buffer.byteLength > 4_500_000) return null;
    const mime = response.headers.get("content-type")?.split(";")[0] ?? "image/jpeg";
    if (!mime.startsWith("image/")) return null;
    return `data:${mime};base64,${buffer.toString("base64")}`;
  } catch {
    return null;
  }
}
