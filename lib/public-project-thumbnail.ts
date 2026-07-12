import { MAX_PROJECT_THUMBNAILS } from "@/lib/project-thumbnails";

export const MAX_PUBLIC_PROJECT_THUMBNAIL_BYTES = 1_500_000;

export const PUBLIC_PROJECT_THUMBNAIL_CACHE_CONTROL =
  "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800";

export type PublicProjectThumbnailRow = {
  thumbnail_url?: string | null;
  thumbnail_urls?: string[] | null;
};

export function publicProjectThumbnailPath(projectId: string): string {
  return `/api/public/projects/${encodeURIComponent(projectId)}/thumbnail`;
}

/**
 * Path-based index (NOT ?index=) so next/image local optimization accepts the URL.
 * index 0 may use either /thumbnail or /thumbnail/0.
 */
export function publicProjectThumbnailPathAtIndex(
  projectId: string,
  index: number,
): string {
  if (!Number.isInteger(index) || index < 0) {
    return publicProjectThumbnailPath(projectId);
  }
  if (index === 0) {
    return publicProjectThumbnailPath(projectId);
  }
  return `${publicProjectThumbnailPath(projectId)}/${index}`;
}

export function publicProjectThumbnailPaths(
  projectId: string,
  count: number,
): string[] {
  const n = Math.max(0, Math.min(MAX_PROJECT_THUMBNAILS, Math.floor(count)));
  if (n <= 0) return [];
  return Array.from({ length: n }, (_, index) =>
    publicProjectThumbnailPathAtIndex(projectId, index),
  );
}
