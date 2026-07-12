/**
 * Shared image sniffing / limits for project thumbnail Storage uploads.
 */
import { MAX_PROJECT_THUMBNAILS } from "@/lib/project-thumbnails";

export const PROJECT_THUMBNAILS_BUCKET = "project-thumbnails";
/** Per-file upload cap (bytes). Aligned with Storage bucket file_size_limit. */
export const MAX_PROJECT_THUMBNAIL_UPLOAD_BYTES = 2_000_000;
export const ALLOWED_PROJECT_THUMBNAIL_MIME = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;

export type AllowedProjectThumbnailMime =
  (typeof ALLOWED_PROJECT_THUMBNAIL_MIME)[number];

export function extensionForThumbnailMime(mime: string): string {
  const normalized = mime.toLowerCase();
  if (normalized === "image/png") return "png";
  if (normalized === "image/webp") return "webp";
  if (normalized === "image/gif") return "gif";
  return "jpg";
}

export function normalizeAllowedThumbnailMime(
  mime: string | null | undefined,
): AllowedProjectThumbnailMime | null {
  const raw = (mime ?? "").trim().toLowerCase().split(";")[0]?.trim() ?? "";
  if (raw === "image/jpg") return "image/jpeg";
  if (
    raw === "image/jpeg" ||
    raw === "image/png" ||
    raw === "image/webp" ||
    raw === "image/gif"
  ) {
    return raw;
  }
  return null;
}

/** Detect image type from magic bytes. Rejects SVG and non-images. */
export function sniffThumbnailImageMime(
  bytes: Uint8Array,
): AllowedProjectThumbnailMime | null {
  if (bytes.byteLength < 12) return null;

  // SVG / XML — reject even if mislabeled
  const head = new TextDecoder("utf-8", { fatal: false })
    .decode(bytes.slice(0, Math.min(256, bytes.byteLength)))
    .trimStart()
    .toLowerCase();
  if (
    head.startsWith("<svg") ||
    head.startsWith("<?xml") ||
    head.includes("<svg")
  ) {
    return null;
  }

  // PNG
  if (
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  ) {
    return "image/png";
  }
  // JPEG
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg";
  }
  // GIF
  if (
    bytes[0] === 0x47 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x38
  ) {
    return "image/gif";
  }
  // WEBP: RIFF....WEBP
  if (
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return "image/webp";
  }

  return null;
}

export function isValidThumbnailUploadIndex(index: number): boolean {
  return (
    Number.isInteger(index) &&
    index >= 0 &&
    index < MAX_PROJECT_THUMBNAILS
  );
}

export function isHttpsThumbnailUrl(value: string | null | undefined): boolean {
  if (!value) return false;
  const trimmed = value.trim();
  return /^https:\/\//i.test(trimmed) && trimmed.length <= 2048;
}

export async function sha256Hex(bytes: Uint8Array): Promise<string> {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  const digest = await crypto.subtle.digest("SHA-256", copy);
  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
