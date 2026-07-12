import { isOgDataUrlImage } from "@/lib/og-data-url-image";
import { resolveProjectThumbnailUrlsFromRow } from "@/lib/project-thumbnails";
import { getSiteOrigin, toAbsoluteUrl } from "@/lib/site-url";

/** Default OGP image (PNG for X / social card compatibility). */
export const DEFAULT_GAME_OG_PATH = "/images/og-default-v2.png";

/** Social crawlers reject oversized / data-URI images. */
const MAX_OG_IMAGE_URL_LENGTH = 2048;

/**
 * First http(s) thumbnail suitable for og:image (read-only metadata).
 * Skips null, empty, data:, blob:, and non-http schemes.
 */
export function pickHttpThumbnailForOg(row: {
  thumbnail_urls?: string[] | null;
  thumbnail_url?: string | null;
}): string | null {
  for (const url of resolveProjectThumbnailUrlsFromRow(row)) {
    const trimmed = url.trim();
    if (!trimmed || isOgDataUrlImage(trimmed)) {
      continue;
    }
    if (/^https?:\/\//i.test(trimmed)) {
      try {
        const parsed = new URL(trimmed);
        if (parsed.protocol === "http:" || parsed.protocol === "https:") {
          return trimmed;
        }
      } catch {
        continue;
      }
    }
  }
  return null;
}

/**
 * Resolve a safe absolute URL for og:image / twitter:image.
 *
 * Accepts:
 * - http(s) absolute URLs
 * - same-origin relative paths (`/images/...`)
 *
 * Rejects (falls back to default):
 * - data: / blob:
 * - empty / oversized strings
 * - broken forms like `https://host/data:image/...`
 * - other non-http(s) schemes
 */
export function resolveOgImageUrl(
  candidate: string | null | undefined,
  origin = getSiteOrigin(),
  fallbackPath: string = DEFAULT_GAME_OG_PATH,
): string {
  const fallback = toAbsoluteUrl(fallbackPath, origin);
  const trimmed = candidate?.trim() ?? "";

  if (!trimmed || trimmed.length > MAX_OG_IMAGE_URL_LENGTH) {
    return fallback;
  }

  const lower = trimmed.toLowerCase();
  if (lower.startsWith("data:") || lower.startsWith("blob:")) {
    return fallback;
  }

  // Already-broken absolute form from prior bug: https://host/data:image/...
  if (/^https?:\/\/[^/?#]+\/data:/i.test(trimmed)) {
    return fallback;
  }

  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const url = new URL(trimmed);
      if (url.protocol !== "http:" && url.protocol !== "https:") {
        return fallback;
      }
      if (url.pathname.toLowerCase().startsWith("/data:")) {
        return fallback;
      }
      return trimmed;
    } catch {
      return fallback;
    }
  }

  if (trimmed.startsWith("//")) {
    return resolveOgImageUrl(`https:${trimmed}`, origin, fallbackPath);
  }

  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) {
    if (trimmed.toLowerCase().startsWith("/data:")) {
      return fallback;
    }
    return toAbsoluteUrl(trimmed, origin);
  }

  return fallback;
}

/**
 * Read-only OGP: http(s) project thumbnail only; data URLs use default image.
 */
export function resolveProjectOgImageUrl(
  _projectId: string,
  candidate: string | null | undefined,
  origin = getSiteOrigin(),
  fallbackPath: string = DEFAULT_GAME_OG_PATH,
): string {
  return resolveOgImageUrl(candidate, origin, fallbackPath);
}
