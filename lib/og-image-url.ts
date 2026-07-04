import { getSiteOrigin, toAbsoluteUrl } from "@/lib/site-url";

/** Default OGP image (PNG for X / social card compatibility). */
export const DEFAULT_GAME_OG_PATH = "/images/og-default.png";

/** Social crawlers reject oversized / data-URI images. */
const MAX_OG_IMAGE_URL_LENGTH = 2048;

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
