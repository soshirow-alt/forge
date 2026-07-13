import sharp from "sharp";
import {
  OG_H,
  OG_W,
  SKANK_SUPABASE_OG_IMAGE_URL,
} from "@/lib/ogp-diagnostic";

export const runtime = "nodejs";

const CACHE_CONTROL =
  "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800";

async function loadNormalizedPng(): Promise<
  { bytes: Buffer } | { error: number }
> {
  const upstream = await fetch(SKANK_SUPABASE_OG_IMAGE_URL, {
    cache: "force-cache",
    headers: { Accept: "image/jpeg" },
  });
  if (!upstream.ok) {
    return { error: upstream.status === 404 ? 404 : 502 };
  }
  const src = Buffer.from(await upstream.arrayBuffer());
  if (src.byteLength < 100) {
    return { error: 502 };
  }

  // Full re-encode: sRGB PNG, fixed size, strip EXIF/ICC/orientation extras.
  const png = await sharp(src)
    .rotate()
    .resize(OG_W, OG_H, { fit: "cover", position: "centre" })
    .toColourspace("srgb")
    .png({ compressionLevel: 9, effort: 7 })
    .toBuffer({ resolveWithObject: true });

  if (png.info.width !== OG_W || png.info.height !== OG_H) {
    return { error: 502 };
  }
  return { bytes: png.data };
}

function pngHeaders(byteLength: number): HeadersInit {
  return {
    "Content-Type": "image/png",
    "Content-Disposition": "inline",
    "Content-Length": String(byteLength),
    "Cache-Control": CACHE_CONTROL,
  };
}

export async function GET() {
  const loaded = await loadNormalizedPng();
  if ("error" in loaded) {
    return new Response("Image unavailable", { status: loaded.error });
  }
  return new Response(new Uint8Array(loaded.bytes), {
    status: 200,
    headers: pngHeaders(loaded.bytes.byteLength),
  });
}

export async function HEAD() {
  const loaded = await loadNormalizedPng();
  if ("error" in loaded) {
    return new Response(null, { status: loaded.error });
  }
  return new Response(null, {
    status: 200,
    headers: pngHeaders(loaded.bytes.byteLength),
  });
}
