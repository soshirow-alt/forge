/**
 * Shared limits / MIME rules for profile avatar upload (client + API).
 * Stored avatar_url must stay short (DB CHECK ≤ 20000); photo uploads go to Storage.
 */

/** Reuse public-read project-thumbnails bucket; path-namespaced (no new Production Storage policy). */
export const PROFILE_AVATAR_STORAGE_BUCKET = "project-thumbnails";
export const PROFILE_AVATAR_OBJECT_PREFIX = "profile-avatars";

/** Raw file pick cap before client compress (bytes). */
export const MAX_PROFILE_AVATAR_UPLOAD_BYTES = 5_000_000;

/** Bytes uploaded to Storage after client JPEG compress. */
export const MAX_PROFILE_AVATAR_STORED_BYTES = 400_000;

/** Align with developer_profiles_avatar_url_len CHECK. */
export const MAX_PROFILE_AVATAR_URL_CHARS = 20_000;

export const ALLOWED_PROFILE_AVATAR_MIME = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export type AllowedProfileAvatarMime =
  (typeof ALLOWED_PROFILE_AVATAR_MIME)[number];

export function extensionForAvatarMime(mime: string): string {
  const normalized = mime.toLowerCase();
  if (normalized === "image/png") return "png";
  if (normalized === "image/webp") return "webp";
  return "jpg";
}

export function normalizeAllowedAvatarMime(
  mime: string | null | undefined,
): AllowedProfileAvatarMime | null {
  const raw = (mime ?? "").trim().toLowerCase().split(";")[0]?.trim() ?? "";
  if (raw === "image/jpg") return "image/jpeg";
  if (raw === "image/jpeg" || raw === "image/png" || raw === "image/webp") {
    return raw;
  }
  return null;
}

/** Detect image type from magic bytes. Rejects SVG and non-images. */
export function sniffAvatarImageMime(
  bytes: Uint8Array,
): AllowedProfileAvatarMime | null {
  if (bytes.byteLength < 12) return null;

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

  if (
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  ) {
    return "image/png";
  }
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg";
  }
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

export function isHttpsAvatarUrl(url: string): boolean {
  return /^https:\/\//i.test(url.trim());
}

export function isSvgDataAvatar(src: string): boolean {
  return /^data:image\/svg\+xml/i.test(src.trim());
}

export function isRasterDataAvatar(src: string): boolean {
  return /^data:image\/(jpeg|jpg|png|webp|gif);base64,/i.test(src.trim());
}

/** Paths written by this app under project-thumbnails. */
export function isManagedProfileAvatarObjectPath(objectPath: string): boolean {
  return objectPath.startsWith(`${PROFILE_AVATAR_OBJECT_PREFIX}/`);
}

export function profileAvatarObjectPath(
  userId: string,
  hash16: string,
  extension: string,
): string {
  return `${PROFILE_AVATAR_OBJECT_PREFIX}/${userId}/${hash16}.${extension}`;
}
