import type { SupabaseClient } from "@supabase/supabase-js";

export const PROJECT_THUMBNAILS_BUCKET = "project-thumbnails";
export const MAX_PROJECT_THUMBNAIL_UPLOAD_BYTES = 2_000_000;

const DATA_URL_RE = /^data:([^;,]+)?(;base64)?,([\s\S]*)$/i;

export type DecodedThumbnail = {
  bytes: Uint8Array;
  contentType: string;
  extension: string;
};

function extensionForMime(mime: string): string {
  const normalized = mime.toLowerCase();
  if (normalized === "image/png") return "png";
  if (normalized === "image/webp") return "webp";
  if (normalized === "image/gif") return "gif";
  return "jpg";
}

function normalizeMime(mime: string | null | undefined): string {
  const raw = (mime ?? "").trim().toLowerCase();
  if (raw === "image/png" || raw === "image/webp" || raw === "image/gif") {
    return raw;
  }
  return "image/jpeg";
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

export function decodeDataUrlImage(dataUrl: string): DecodedThumbnail | null {
  const match = dataUrl.trim().match(DATA_URL_RE);
  if (!match) return null;
  const mime = normalizeMime(match[1] || "image/jpeg");
  const isBase64 = Boolean(match[2]?.toLowerCase().includes("base64"));
  const payload = match[3] ?? "";
  try {
    if (isBase64) {
      const binary = atob(payload);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i += 1) {
        bytes[i] = binary.charCodeAt(i);
      }
      if (bytes.byteLength === 0 || bytes.byteLength > MAX_PROJECT_THUMBNAIL_UPLOAD_BYTES) {
        return null;
      }
      return { bytes, contentType: mime, extension: extensionForMime(mime) };
    }
    const decoded = decodeURIComponent(payload);
    const bytes = new TextEncoder().encode(decoded);
    if (bytes.byteLength === 0 || bytes.byteLength > MAX_PROJECT_THUMBNAIL_UPLOAD_BYTES) {
      return null;
    }
    return { bytes, contentType: mime, extension: extensionForMime(mime) };
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
    const mime = normalizeMime(response.headers.get("content-type"));
    const buffer = new Uint8Array(await response.arrayBuffer());
    if (buffer.byteLength === 0 || buffer.byteLength > MAX_PROJECT_THUMBNAIL_UPLOAD_BYTES) {
      return null;
    }
    return {
      bytes: buffer,
      contentType: mime,
      extension: extensionForMime(mime),
    };
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
  if (isHttpsThumbnailUrl(trimmed) || trimmed.startsWith("http://") || trimmed.startsWith("/")) {
    // Existing Storage https URLs are kept by caller; this path is for relative/http re-upload.
    if (isHttpsThumbnailUrl(trimmed)) {
      return null;
    }
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

export async function uploadProjectThumbnailObject(
  supabase: SupabaseClient,
  projectId: string,
  index: number,
  decoded: DecodedThumbnail,
): Promise<string> {
  // Prefer same-origin upload API (works before Storage RLS is applied on Staging).
  if (typeof window !== "undefined") {
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
      throw new Error(
        body?.error || "サムネイルのアップロードに失敗しました。",
      );
    }
    return body.url.trim();
  }

  const hash = (await sha256Hex(decoded.bytes)).slice(0, 16);
  const objectPath = `${projectId}/${index}-${hash}.${decoded.extension}`;
  const { error } = await supabase.storage
    .from(PROJECT_THUMBNAILS_BUCKET)
    .upload(objectPath, decoded.bytes, {
      contentType: decoded.contentType,
      upsert: true,
      cacheControl: "3600",
    });
  if (error) {
    throw new Error(
      error.message || "サムネイルのアップロードに失敗しました。",
    );
  }
  const url = publicObjectUrl(supabase, objectPath);
  if (!isHttpsThumbnailUrl(url)) {
    throw new Error("Storage public URL が https ではありません。");
  }
  return url;
}

/**
 * Convert form thumbnail values to HTTPS Storage URLs.
 * - Existing https URLs are kept as-is (no re-upload).
 * - data: and relative paths are uploaded.
 * Throws if any non-empty candidate fails to materialize (caller must not clear DB).
 */
export async function materializeThumbnailUrlsToStorage(
  supabase: SupabaseClient,
  projectId: string,
  urls: string[],
): Promise<string[]> {
  const out: string[] = [];
  for (let index = 0; index < urls.length; index += 1) {
    const raw = urls[index]?.trim() ?? "";
    if (!raw) continue;
    if (isHttpsThumbnailUrl(raw)) {
      out.push(raw);
      continue;
    }
    const decoded = await decodeThumbnailCandidate(raw);
    if (!decoded) {
      throw new Error(
        `サムネイル ${index + 1} 枚目を Storage 用に変換できませんでした。`,
      );
    }
    const uploaded = await uploadProjectThumbnailObject(
      supabase,
      projectId,
      index,
      decoded,
    );
    out.push(uploaded);
  }
  return out;
}
