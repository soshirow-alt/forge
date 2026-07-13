import { SKANK_SUPABASE_OG_IMAGE_URL } from "@/lib/ogp-diagnostic";

export const runtime = "nodejs";

const CACHE_CONTROL =
  "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800";

async function loadJpeg(): Promise<{ bytes: ArrayBuffer } | { error: number }> {
  const upstream = await fetch(SKANK_SUPABASE_OG_IMAGE_URL, {
    cache: "force-cache",
    headers: { Accept: "image/jpeg" },
  });
  if (!upstream.ok) {
    return { error: upstream.status === 404 ? 404 : 502 };
  }
  const bytes = await upstream.arrayBuffer();
  if (bytes.byteLength < 100) {
    return { error: 502 };
  }
  return { bytes };
}

function jpegHeaders(byteLength: number): HeadersInit {
  return {
    "Content-Type": "image/jpeg",
    "Content-Disposition": "inline",
    "Content-Length": String(byteLength),
    "Cache-Control": CACHE_CONTROL,
  };
}

export async function GET() {
  const loaded = await loadJpeg();
  if ("error" in loaded) {
    return new Response("Image unavailable", { status: loaded.error });
  }
  return new Response(loaded.bytes, {
    status: 200,
    headers: jpegHeaders(loaded.bytes.byteLength),
  });
}

export async function HEAD() {
  const loaded = await loadJpeg();
  if ("error" in loaded) {
    return new Response(null, { status: loaded.error });
  }
  return new Response(null, {
    status: 200,
    headers: jpegHeaders(loaded.bytes.byteLength),
  });
}
