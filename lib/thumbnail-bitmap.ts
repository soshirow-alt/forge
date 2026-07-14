/**
 * Accept any decodeable bitmap. Do NOT compare naturalWidth to display width —
 * modest sources (e.g. ~400px covers) are valid card thumbnails.
 */
export function isUsableThumbnailBitmap(
  naturalWidth: number,
  naturalHeight: number,
): boolean {
  return naturalWidth >= 1 && naturalHeight >= 1;
}
