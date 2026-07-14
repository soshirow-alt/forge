/**
 * Client helpers: validate / compress / upload profile avatars to Storage.
 */

import {
  MAX_PROFILE_AVATAR_STORED_BYTES,
  MAX_PROFILE_AVATAR_UPLOAD_BYTES,
  MAX_PROFILE_AVATAR_URL_CHARS,
  normalizeAllowedAvatarMime,
} from "@/lib/profile-avatar-upload-rules";
import {
  assertAvatarUrlFitsDb,
  classifyAvatarDraft,
} from "@/lib/supabase/profile-avatar-storage";

const MAX_AVATAR_EDGE_PX = 512;
const INITIAL_JPEG_QUALITY = 0.82;
const MIN_JPEG_QUALITY = 0.5;

export class ProfileAvatarUserError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProfileAvatarUserError";
  }
}

function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new ProfileAvatarUserError("画像の読み込みに失敗しました。"));
    };
    image.src = objectUrl;
  });
}

/** Compress for local preview (data URL). Not a durable avatar_url. */
export async function compressAvatarFileForPreview(file: File): Promise<string> {
  if (!normalizeAllowedAvatarMime(file.type)) {
    throw new ProfileAvatarUserError(
      "JPG / PNG / WebP の画像を選んでください。",
    );
  }
  if (file.size <= 0 || file.size > MAX_PROFILE_AVATAR_UPLOAD_BYTES) {
    throw new ProfileAvatarUserError(
      "画像が大きすぎます。5MB以下のファイルを選んでください。",
    );
  }

  const image = await loadImageFromFile(file);
  const longestEdge = Math.max(image.naturalWidth, image.naturalHeight);
  const scale =
    longestEdge > MAX_AVATAR_EDGE_PX ? MAX_AVATAR_EDGE_PX / longestEdge : 1;
  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) {
    throw new ProfileAvatarUserError("画像の処理に失敗しました。");
  }
  context.drawImage(image, 0, 0, width, height);

  let quality = INITIAL_JPEG_QUALITY;
  let dataUrl = canvas.toDataURL("image/jpeg", quality);
  while (dataUrl.length > 400_000 && quality > MIN_JPEG_QUALITY) {
    quality -= 0.08;
    dataUrl = canvas.toDataURL("image/jpeg", quality);
  }
  return dataUrl;
}

async function dataUrlToJpegBlob(dataUrl: string): Promise<Blob> {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () =>
      reject(new ProfileAvatarUserError("画像の読み込みに失敗しました。"));
    img.src = dataUrl;
  });

  const longestEdge = Math.max(image.naturalWidth, image.naturalHeight);
  const scale =
    longestEdge > MAX_AVATAR_EDGE_PX ? MAX_AVATAR_EDGE_PX / longestEdge : 1;
  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) {
    throw new ProfileAvatarUserError("画像の処理に失敗しました。");
  }
  context.drawImage(image, 0, 0, width, height);

  let quality = INITIAL_JPEG_QUALITY;
  const toBlob = (q: number) =>
    new Promise<Blob | null>((resolve) => {
      canvas.toBlob((blob) => resolve(blob), "image/jpeg", q);
    });

  let blob = await toBlob(quality);
  while (
    blob &&
    blob.size > MAX_PROFILE_AVATAR_STORED_BYTES &&
    quality > MIN_JPEG_QUALITY
  ) {
    quality -= 0.08;
    blob = await toBlob(quality);
  }

  if (!blob || blob.size <= 0 || blob.size > MAX_PROFILE_AVATAR_STORED_BYTES) {
    throw new ProfileAvatarUserError(
      "画像が大きすぎます。別の画像を選ぶか、解像度を下げて再度お試しください。",
    );
  }
  return blob;
}

export type UploadedProfileAvatar = {
  url: string;
  objectPath: string;
};

export async function uploadProfileAvatarBlob(
  blob: Blob,
): Promise<UploadedProfileAvatar> {
  const form = new FormData();
  form.append("file", blob, "avatar.jpg");
  const response = await fetch("/api/profile/avatar/upload", {
    method: "POST",
    body: form,
    credentials: "same-origin",
  });
  const payload = (await response.json().catch(() => null)) as {
    url?: string;
    objectPath?: string;
    error?: string;
  } | null;

  if (!response.ok || !payload?.url || !payload.objectPath) {
    console.error("[profile-avatar] upload failed", {
      status: response.status,
      error: payload?.error,
    });
    throw new ProfileAvatarUserError(
      payload?.error?.includes("unauthorized")
        ? "ログインの有効期限が切れた可能性があります。再度ログインしてからお試しください。"
        : "プロフィール画像のアップロードに失敗しました。時間をおいて再度お試しください。",
    );
  }

  assertAvatarUrlFitsDb(payload.url);
  return { url: payload.url, objectPath: payload.objectPath };
}

export async function cleanupUploadedProfileAvatar(
  objectPath: string,
): Promise<void> {
  try {
    await fetch("/api/profile/avatar/upload", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ objectPath }),
    });
  } catch (error) {
    console.error("[profile-avatar] cleanup failed", { objectPath, error });
  }
}

/**
 * Turn draft avatar into a durable avatar_url value (https or short SVG preset).
 * Uploads raster data URLs to Storage. Does not clear previousUrl on failure.
 */
export async function resolveAvatarUrlForSave(
  draftAvatar: string,
  previousUrl: string | null | undefined,
): Promise<{ avatarUrl: string | null; uploadedObjectPath: string | null }> {
  const classified = classifyAvatarDraft(draftAvatar);

  if (classified.kind === "empty") {
    return { avatarUrl: null, uploadedObjectPath: null };
  }
  if (classified.kind === "https" || classified.kind === "svg-preset") {
    const value = classified.value!;
    assertAvatarUrlFitsDb(value);
    return { avatarUrl: value, uploadedObjectPath: null };
  }
  if (classified.kind === "unsupported") {
    throw new ProfileAvatarUserError(
      "この画像形式は保存できません。JPG / PNG / WebP を選んでください。",
    );
  }

  // Raster data URL (user-uploaded preview) → Storage public URL
  const blob = await dataUrlToJpegBlob(classified.value!);
  const uploaded = await uploadProfileAvatarBlob(blob);

  // If somehow we produced the same URL as previous, still ok
  if (
    previousUrl &&
    uploaded.url === previousUrl.trim() &&
    previousUrl.length <= MAX_PROFILE_AVATAR_URL_CHARS
  ) {
    return { avatarUrl: uploaded.url, uploadedObjectPath: null };
  }

  return {
    avatarUrl: uploaded.url,
    uploadedObjectPath: uploaded.objectPath,
  };
}

export function mapProfileSaveError(error: unknown): string {
  if (error instanceof ProfileAvatarUserError) {
    return error.message;
  }
  if (error instanceof Error && error.message.trim()) {
    const message = error.message;
    if (/avatar_url|20000|check constraint|23514/i.test(message)) {
      return "プロフィール画像の保存に失敗しました。別の画像で再度お試しください。";
    }
    if (/row-level security|42501/i.test(message)) {
      return "保存権限がありません。ログイン状態を確認して再度お試しください。";
    }
  }
  return "保存に失敗しました。時間をおいて再度お試しください。";
}
