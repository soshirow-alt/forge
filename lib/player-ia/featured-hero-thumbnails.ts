import { FEATURED_HERO_SLOT_COUNT } from "@/lib/home-featured-hero";
import { publicProjectThumbnailPaths } from "@/lib/public-project-thumbnail";
import type { FeaturedThumbnailsState } from "@/components/featured/featured-game-carousel";

/** Paths per project for cover + up to 2 extras in the featured card. */
export const HERO_THUMBNAIL_PATHS_PER_PROJECT = 4;

/**
 * Cap requested hero IDs to the featured-slot capacity (066 four-slot hero).
 * Never use a smaller magic number (legacy API truncated at 3 → 4th slide stuck).
 */
export function capFeaturedHeroThumbnailIds(
  heroIds: readonly string[],
): string[] {
  return [...new Set(heroIds.filter(Boolean))].slice(
    0,
    FEATURED_HERO_SLOT_COUNT,
  );
}

/**
 * Build byId from thumbnail-counts payload. Every requested id gets an entry
 * even when the API omits it (count 0 → cover-only fallback in carousel).
 */
export function buildFeaturedHeroThumbnailById(
  requestedIds: readonly string[],
  counts: Record<string, number>,
): Record<string, string[]> {
  const byId: Record<string, string[]> = {};
  for (const id of requestedIds) {
    const count = counts[id] ?? 0;
    byId[id] = publicProjectThumbnailPaths(
      id,
      Math.min(HERO_THUMBNAIL_PATHS_PER_PROJECT, count),
    );
  }
  return byId;
}

/**
 * After a successful (or error) fetch, do not require every hero id in byId
 * before leaving loading — missing ids use cover-only from the slide image.
 */
export function resolveFeaturedCarouselThumbnails(
  heroIds: readonly string[],
  thumbnails: FeaturedThumbnailsState,
): FeaturedThumbnailsState {
  if (heroIds.length === 0) {
    return { status: "ready", byId: {} };
  }
  if (thumbnails.status === "loading") {
    return { status: "loading" };
  }
  return thumbnails;
}
