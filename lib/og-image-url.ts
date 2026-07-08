import { getSiteOrigin, toAbsoluteUrl } from "@/lib/site-url";

/** Default OGP image (PNG for X / social card compatibility). */
export const DEFAULT_GAME_OG_PATH = "/images/og-default.png";

/** Social crawlers reject oversized / data-URI images. */
const MAX_OG_IMAGE_URL_LENGTH = 2048;

/**
 * Extensionful API path — lazy-generates Storage card when og_image_url is unset.
 */
export function projectOgImageApiPath(projectId: string): string {
  return `/api/projects/${projectId}/og-image.png`;
}

export function projectOgSyncApiPath(projectId: string): string {
  return `/api/projects/${projectId}/og-sync`;
}

/** Legacy extensionless path. */
export function projectOgImageApiPathLegacy(projectId: string): string {
  return `/api/projects/${projectId}/og-image`;
}

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
 * Prefer Storage `og_image_url`; until backfill, fall back to lazy-sync API path.
 */
export function resolveProjectOgImageUrl(
  projectId: string,
  ogImageUrl: string | null | undefined,
  origin = getSiteOrigin(),
): string {
  const fromStorage = ogImageUrl?.trim() ?? "";
  if (fromStorage && /^https?:\/\//i.test(fromStorage)) {
    return fromStorage;
  }
  return toAbsoluteUrl(projectOgImageApiPath(projectId), origin);
}
