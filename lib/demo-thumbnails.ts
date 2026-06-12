export const DEMO_THUMBNAIL_BASE = "/demo-thumbnails";

export function getBuiltInThumbnailUrl(gameId: string): string {
  return `${DEMO_THUMBNAIL_BASE}/${gameId}.svg`;
}
