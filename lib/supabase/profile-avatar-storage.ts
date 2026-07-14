import type { SupabaseClient } from "@supabase/supabase-js";
import {
  MAX_PROFILE_AVATAR_STORED_BYTES,
  MAX_PROFILE_AVATAR_URL_CHARS,
  PROFILE_AVATAR_OBJECT_PREFIX,
  PROFILE_AVATAR_STORAGE_BUCKET,
  isHttpsAvatarUrl,
  isManagedProfileAvatarObjectPath,
  isRasterDataAvatar,
  isSvgDataAvatar,
} from "@/lib/profile-avatar-upload-rules";

export function publicProfileAvatarUrl(
  supabase: SupabaseClient,
  objectPath: string,
): string {
  const { data } = supabase.storage
    .from(PROFILE_AVATAR_STORAGE_BUCKET)
    .getPublicUrl(objectPath);
  return data.publicUrl;
}

/**
 * Extract storage object path from a public URL for our profile-avatars namespace.
 * Returns null for presets, external URLs, or unrelated buckets.
 */
export function profileAvatarObjectPathFromPublicUrl(
  publicUrl: string,
): string | null {
  const trimmed = publicUrl.trim();
  if (!isHttpsAvatarUrl(trimmed)) return null;
  try {
    const url = new URL(trimmed);
    const marker = `/storage/v1/object/public/${PROFILE_AVATAR_STORAGE_BUCKET}/`;
    const idx = url.pathname.indexOf(marker);
    if (idx < 0) return null;
    const objectPath = decodeURIComponent(
      url.pathname.slice(idx + marker.length),
    );
    if (!isManagedProfileAvatarObjectPath(objectPath)) return null;
    return objectPath;
  } catch {
    return null;
  }
}

export function assertAvatarUrlFitsDb(url: string): void {
  if (url.length > MAX_PROFILE_AVATAR_URL_CHARS) {
    throw new Error(
      "プロフィール画像の保存データが長すぎます。別の画像で再度お試しください。",
    );
  }
}

/**
 * Resolve what to persist on developer_profiles.avatar_url.
 * - Unchanged https / short SVG preset → keep
 * - Raster data URL → must be uploaded first (caller uploads)
 * - Empty → null
 */
export function classifyAvatarDraft(src: string): {
  kind: "empty" | "https" | "svg-preset" | "raster-data" | "unsupported";
  value: string | null;
} {
  const trimmed = src.trim();
  if (!trimmed) return { kind: "empty", value: null };
  if (isHttpsAvatarUrl(trimmed)) return { kind: "https", value: trimmed };
  if (isSvgDataAvatar(trimmed)) {
    if (trimmed.length > MAX_PROFILE_AVATAR_URL_CHARS) {
      return { kind: "unsupported", value: null };
    }
    return { kind: "svg-preset", value: trimmed };
  }
  if (isRasterDataAvatar(trimmed) || trimmed.startsWith("data:image/")) {
    return { kind: "raster-data", value: trimmed };
  }
  if (trimmed.startsWith("blob:")) {
    return { kind: "unsupported", value: null };
  }
  return { kind: "unsupported", value: null };
}

export { MAX_PROFILE_AVATAR_STORED_BYTES, PROFILE_AVATAR_OBJECT_PREFIX };
