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

export function publicProjectThumbnailPathAtIndex(
  projectId: string,
  index: number,
): string {
  return `${publicProjectThumbnailPath(projectId)}?index=${index}`;
}
