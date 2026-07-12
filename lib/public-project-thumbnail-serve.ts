import { parseOgDataUrlImage } from "@/lib/og-data-url-image";
import { resolveProjectThumbnailUrlsFromRow } from "@/lib/project-thumbnails";
import {
  MAX_PUBLIC_PROJECT_THUMBNAIL_BYTES,
  PUBLIC_PROJECT_THUMBNAIL_CACHE_CONTROL,
} from "@/lib/public-project-thumbnail";
import { isHttpOrHttpsUrl } from "@/lib/safe-http-thumbnail";
import type { SupabaseClient } from "@supabase/supabase-js";

export type PublicThumbnailFullRow = {
  thumbnail_url: string | null;
  thumbnail_urls: string[] | null;
  visibility: "public" | "private";
};

export type ResolvedPublicThumbnail =
  | { kind: "redirect"; url: string }
  | { kind: "bytes"; contentType: string; bytes: Uint8Array }
  | { kind: "missing" };

function validExternalImageUrl(candidate: string): string | null {
  if (!isHttpOrHttpsUrl(candidate)) return null;
  try {
    const url = new URL(candidate.trim());
    return url.protocol === "http:" || url.protocol === "https:"
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}

function resolveCandidate(candidate: string): ResolvedPublicThumbnail {
  const externalUrl = validExternalImageUrl(candidate);
  if (externalUrl) {
    return { kind: "redirect", url: externalUrl };
  }

  const parsed = parseOgDataUrlImage(
    candidate,
    MAX_PUBLIC_PROJECT_THUMBNAIL_BYTES,
  );
  if (!parsed) {
    return { kind: "missing" };
  }

  return {
    kind: "bytes",
    contentType: parsed.contentType,
    bytes: parsed.bytes,
  };
}

/**
 * Resolve a public project's thumbnail by gallery index.
 * Order: thumbnail_urls[i] when the array is non-empty; else thumbnail_url as index 0.
 */
export async function resolvePublicProjectThumbnail(
  supabase: SupabaseClient,
  projectId: string,
  index: number,
): Promise<ResolvedPublicThumbnail> {
  if (!Number.isInteger(index) || index < 0) {
    return { kind: "missing" };
  }

  const { data, error } = await supabase
    .from("projects")
    .select("thumbnail_url, thumbnail_urls, visibility")
    .eq("id", projectId)
    .eq("visibility", "public")
    .maybeSingle();

  if (error || !data) {
    return { kind: "missing" };
  }

  const all = resolveProjectThumbnailUrlsFromRow(data as PublicThumbnailFullRow);
  const candidate = all[index];
  return candidate ? resolveCandidate(candidate) : { kind: "missing" };
}

export function publicThumbnailResponseHeaders(contentType: string): HeadersInit {
  return {
    "Content-Type": contentType,
    "Content-Disposition": "inline",
    "Cache-Control": PUBLIC_PROJECT_THUMBNAIL_CACHE_CONTROL,
    "X-Content-Type-Options": "nosniff",
  };
}
