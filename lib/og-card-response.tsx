import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import { isOgDataUrlImage } from "@/lib/og-data-url-image";

export const OG_CARD_WIDTH = 1200;
export const OG_CARD_HEIGHT = 630;

/** Skip unsafe / oversized data URLs — keep first Twitterbot crawl fast. */
const MAX_THUMB_DATA_URL_CHARS = 180_000;

const OG_CACHE_HEADERS = {
  "Cache-Control":
    "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400",
  "Content-Disposition": "inline",
} as const;

function clipTitle(title: string, max = 42): string {
  const normalized = title.replace(/\s+/g, " ").trim() || "Forge";
  if (normalized.length <= max) {
    return normalized;
  }
  return `${normalized.slice(0, max - 1)}…`;
}

async function readDefaultOgPng(): Promise<Buffer> {
  const filePath = path.join(process.cwd(), "public", "images", "og-default.png");
  return readFile(filePath);
}

function safeThumbSrc(candidate: string | null | undefined): string | null {
  const trimmed = candidate?.trim() ?? "";
  if (!trimmed || trimmed.length > MAX_THUMB_DATA_URL_CHARS) {
    return null;
  }
  if (!isOgDataUrlImage(trimmed)) {
    if (/^https?:\/\//i.test(trimmed) && trimmed.length <= 2048) {
      return trimmed;
    }
    return null;
  }
  return trimmed;
}

function CoverCard({ title, thumb }: { title: string; thumb: string }) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        position: "relative",
        backgroundColor: "#09090b",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={thumb}
        width={OG_CARD_WIDTH}
        height={OG_CARD_HEIGHT}
        alt=""
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          padding: "28px 36px",
          background:
            "linear-gradient(180deg, rgba(9,9,11,0) 0%, rgba(9,9,11,0.82) 100%)",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            maxWidth: "85%",
          }}
        >
          <div
            style={{
              fontSize: 40,
              fontWeight: 700,
              color: "#fafafa",
              lineHeight: 1.2,
              letterSpacing: "-0.02em",
            }}
          >
            {title}
          </div>
          <div
            style={{
              marginTop: 8,
              fontSize: 22,
              fontWeight: 600,
              color: "#a1a1aa",
            }}
          >
            Forge
          </div>
        </div>
      </div>
    </div>
  );
}

function BrandedCard({ title }: { title: string }) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "64px 72px",
        backgroundColor: "#18181b",
        backgroundImage:
          "radial-gradient(ellipse at 20% 20%, #27272a 0%, #18181b 55%)",
      }}
    >
      <div
        style={{
          fontSize: 28,
          fontWeight: 700,
          color: "#a78bfa",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
        }}
      >
        FORGE
      </div>
      <div
        style={{
          marginTop: 28,
          fontSize: 64,
          fontWeight: 700,
          color: "#fafafa",
          lineHeight: 1.15,
          letterSpacing: "-0.03em",
          maxWidth: 1000,
        }}
      >
        {title}
      </div>
      <div
        style={{
          marginTop: 24,
          fontSize: 26,
          color: "#a1a1aa",
        }}
      >
        Incomplete games. Growing in public.
      </div>
    </div>
  );
}

/**
 * Always returns a crawler-safe image Response (never throws to 500).
 * Prefer cover thumb when safe; otherwise branded Forge card.
 * next/og ImageResponse emits PNG — Content-Type image/png.
 */
export async function buildProjectOgCardResponse(input: {
  title: string;
  thumbnailUrl?: string | null;
}): Promise<Response> {
  try {
    const title = clipTitle(input.title);
    const thumb = safeThumbSrc(input.thumbnailUrl);

    const response = new ImageResponse(
      thumb ? <CoverCard title={title} thumb={thumb} /> : <BrandedCard title={title} />,
      {
        width: OG_CARD_WIDTH,
        height: OG_CARD_HEIGHT,
        headers: OG_CACHE_HEADERS,
      },
    );
    return response;
  } catch {
    try {
      const png = await readDefaultOgPng();
      // Uint8Array — Buffer is not assignable to BodyInit under Next's TS check.
      return new Response(new Uint8Array(png), {
        status: 200,
        headers: {
          "Content-Type": "image/png",
          ...OG_CACHE_HEADERS,
        },
      });
    } catch {
      // Last resort 1x1 PNG so crawlers never see 500.
      const tinyPng = new Uint8Array(
        Buffer.from(
          "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
          "base64",
        ),
      );
      return new Response(tinyPng, {
        status: 200,
        headers: {
          "Content-Type": "image/png",
          ...OG_CACHE_HEADERS,
        },
      });
    }
  }
}

export async function buildMissingProjectOgCardResponse(): Promise<Response> {
  return buildProjectOgCardResponse({ title: "Forge", thumbnailUrl: null });
}
