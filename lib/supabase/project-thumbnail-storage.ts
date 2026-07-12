import type { SupabaseClient } from "@supabase/supabase-js";
import { MAX_PROJECT_THUMBNAILS } from "@/lib/project-thumbnails";
import {
  ALLOWED_PROJECT_THUMBNAIL_MIME,
  MAX_PROJECT_THUMBNAIL_UPLOAD_BYTES,
  PROJECT_THUMBNAILS_BUCKET,
  extensionForThumbnailMime,
  isHttpsThumbnailUrl,
  isValidThumbnailUploadIndex,
  normalizeAllowedThumbnailMime,
  sha256Hex,
  sniffThumbnailImageMime,
  type AllowedProjectThumbnailMime,
} from "@/lib/project-thumbnail-upload-rules";

export {
  ALLOWED_PROJECT_THUMBNAIL_MIME,
  MAX_PROJECT_THUMBNAIL_UPLOAD_BYTES,
  PROJECT_THUMBNAILS_BUCKET,
  isHttpsThumbnailUrl,
  sha256Hex,
} from "@/lib/project-thumbnail-upload-rules";

const DATA_URL_RE = /^data:([^;,]+)?(;base64)?,([\s\S]*)$/i;

export type DecodedThumbnail = {
  bytes: Uint8Array;
  contentType: AllowedProjectThumbnailMime;
  extension: string;
};

function finalizeDecoded(bytes: Uint8Array): DecodedThumbnail | null {
  if (
    bytes.byteLength === 0 ||
    bytes.byteLength > MAX_PROJECT_THUMBNAIL_UPLOAD_BYTES
  ) {
    return null;
  }
  const sniffed = sniffThumbnailImageMime(bytes);
  if (!sniffed) return null;
  return {
    bytes,
    contentType: sniffed,
    extension: extensionForThumbnailMime(sniffed),
  };
}

export function decodeDataUrlImage(dataUrl: string): DecodedThumbnail | null {
  const match = dataUrl.trim().match(DATA_URL_RE);
  if (!match) return null;
  const declared = normalizeAllowedThumbnailMime(match[1] || "image/jpeg");
  if (!declared) return null;
  const isBase64 = Boolean(match[2]?.toLowerCase().includes("base64"));
  const payload = match[3] ?? "";
  try {
    if (!isBase64) {
      // Only base64 data URLs are accepted for uploads.
      return null;
    }
    // Reject obviously broken base64
    if (!/^[A-Za-z0-9+/=\s]+$/.test(payload)) {
      return null;
    }
    const binary = atob(payload.replace(/\s+/g, ""));
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }
    const decoded = finalizeDecoded(bytes);
    if (!decoded) return null;
    // Declared mime must match sniffed bytes
    if (decoded.contentType !== declared) {
      return null;
    }
    return decoded;
  } catch {
    return null;
  }
}

async function decodeRelativeOrHttpImage(
  url: string,
): Promise<DecodedThumbnail | null> {
  const trimmed = url.trim();
  let absolute = trimmed;
  if (trimmed.startsWith("/")) {
    const origin =
      typeof window !== "undefined" && window.location?.origin
        ? window.location.origin
        : process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
          process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
          "";
    if (!origin) return null;
    absolute = `${origin}${trimmed}`;
  } else if (!/^https?:\/\//i.test(trimmed)) {
    return null;
  }

  try {
    const response = await fetch(absolute, { cache: "no-store" });
    if (!response.ok) return null;
    const buffer = new Uint8Array(await response.arrayBuffer());
    return finalizeDecoded(buffer);
  } catch {
    return null;
  }
}

export async function decodeThumbnailCandidate(
  value: string,
): Promise<DecodedThumbnail | null> {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("data:")) {
    return decodeDataUrlImage(trimmed);
  }
  if (isHttpsThumbnailUrl(trimmed)) {
    return null;
  }
  if (trimmed.startsWith("http://") || trimmed.startsWith("/")) {
    return decodeRelativeOrHttpImage(trimmed);
  }
  return null;
}

export function publicObjectUrl(
  supabase: SupabaseClient,
  objectPath: string,
): string {
  const { data } = supabase.storage
    .from(PROJECT_THUMBNAILS_BUCKET)
    .getPublicUrl(objectPath);
  return data.publicUrl;
}

/**
 * Upload via same-origin server route only (service role write).
 * Never writes Storage from the browser client directly.
 */
export async function uploadProjectThumbnailObject(
  _supabase: SupabaseClient,
  projectId: string,
  index: number,
  decoded: DecodedThumbnail,
): Promise<string> {
  if (!isValidThumbnailUploadIndex(index)) {
    throw new Error(`サムネイル index が不正です（0〜${MAX_PROJECT_THUMBNAILS - 1}）。`);
  }
  if (typeof window === "undefined") {
    throw new Error(
      "サムネイル upload はブラウザから /api/.../thumbnails/upload 経由でのみ行えます。",
    );
  }

  const form = new FormData();
  form.append(
    "file",
    new Blob([new Uint8Array(decoded.bytes)], { type: decoded.contentType }),
    `thumb-${index}.${decoded.extension}`,
  );
  form.append("index", String(index));
  const response = await fetch(
    `/api/projects/${encodeURIComponent(projectId)}/thumbnails/upload`,
    {
      method: "POST",
      body: form,
      credentials: "same-origin",
    },
  );
  const body = (await response.json().catch(() => null)) as {
    url?: string;
    error?: string;
  } | null;
  if (!response.ok || !body?.url || !isHttpsThumbnailUrl(body.url)) {
    throw new Error(body?.error || "サムネイルのアップロードに失敗しました。");
  }
  return body.url.trim();
}

/**
 * Convert form thumbnail values to HTTPS Storage URLs.
 * Uploads all non-https candidates first; throws before returning if any fail
 * so callers must not update DB.
 *
 * Orphan note: failed mid-batch may leave newly uploaded objects in Storage
 * under `{projectId}/{index}-{hash}.*`. Paths are content-hashed + upsert, so
 * retries overwrite the same object and do not unbounded-duplicate identical bytes.
 */
export async function materializeThumbnailUrlsToStorage(
  supabase: SupabaseClient,
  projectId: string,
  urls: string[],
): Promise<string[]> {
  if (urls.length > MAX_PROJECT_THUMBNAILS) {
    throw new Error(`サムネイルは最大 ${MAX_PROJECT_THUMBNAILS} 枚です。`);
  }

  const prepared: Array<{ index: number; value: string }> = [];
  for (let index = 0; index < urls.length; index += 1) {
    const raw = urls[index]?.trim() ?? "";
    if (!raw) continue;
    prepared.push({ index, value: raw });
  }

  const out: string[] = new Array(prepared.length);
  // Phase 1: resolve all uploads without returning partial success to caller.
  for (let i = 0; i < prepared.length; i += 1) {
    const { index, value } = prepared[i]!;
    if (isHttpsThumbnailUrl(value)) {
      out[i] = value;
      continue;
    }
    const decoded = await decodeThumbnailCandidate(value);
    if (!decoded) {
      throw new Error(
        `サムネイル ${index + 1} 枚目を Storage 用に変換できませんでした。`,
      );
    }
    out[i] = await uploadProjectThumbnailObject(
      supabase,
      projectId,
      index,
      decoded,
    );
  }
  return out;
}
