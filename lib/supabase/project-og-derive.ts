import {
  OG_IMAGE_HEIGHT,
  OG_IMAGE_MIME,
  OG_IMAGE_WIDTH,
} from "@/lib/og-image-constants";
import sharp from "sharp";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  MAX_PROJECT_THUMBNAIL_UPLOAD_BYTES,
  PROJECT_THUMBNAILS_BUCKET,
  isHttpsThumbnailUrl,
  sha256Hex,
  sniffThumbnailImageMime,
} from "@/lib/project-thumbnail-upload-rules";
import { publicObjectUrl } from "@/lib/supabase/project-thumbnail-storage";

export { OG_IMAGE_HEIGHT, OG_IMAGE_MIME, OG_IMAGE_WIDTH } from "@/lib/og-image-constants";

export type DerivedOgImage = {
  url: string;
  objectPath: string;
  contentType: typeof OG_IMAGE_MIME;
  width: number;
  height: number;
  sourceHash16: string;
};

function assertServerRuntime(): void {
  if (typeof window !== "undefined") {
    throw new Error("OGP派生画像の生成はサーバーでのみ実行できます。");
  }
}

export async function loadHttpsImageBytes(url: string): Promise<Uint8Array> {
  if (!isHttpsThumbnailUrl(url)) {
    throw new Error("OGP source must be https://");
  }
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`OGP source fetch failed: ${response.status}`);
  }
  const bytes = new Uint8Array(await response.arrayBuffer());
  if (
    bytes.byteLength === 0 ||
    bytes.byteLength > MAX_PROJECT_THUMBNAIL_UPLOAD_BYTES * 4
  ) {
    // Allow slightly larger source for OG derive (gallery may be up to 2MB;
    // keep a hard ceiling to avoid memory blowups).
    throw new Error("OGP source size invalid");
  }
  if (bytes.byteLength > 8_000_000) {
    throw new Error("OGP source too large");
  }
  if (!sniffThumbnailImageMime(bytes)) {
    throw new Error("OGP source is not a supported image");
  }
  return bytes;
}

export async function renderOgCoverJpeg(
  sourceBytes: Uint8Array,
): Promise<{ jpeg: Buffer; sourceHash16: string }> {
  assertServerRuntime();
  const sourceHash16 = (await sha256Hex(sourceBytes)).slice(0, 16);
  const jpeg = await sharp(Buffer.from(sourceBytes))
    .rotate()
    .resize(OG_IMAGE_WIDTH, OG_IMAGE_HEIGHT, {
      fit: "cover",
      position: "centre",
      withoutEnlargement: false,
    })
    .jpeg({ quality: 85, mozjpeg: true })
    .toBuffer();

  // Confirm exact output dimensions
  const meta = await sharp(jpeg).metadata();
  if (meta.width !== OG_IMAGE_WIDTH || meta.height !== OG_IMAGE_HEIGHT) {
    throw new Error(
      `OGP output size mismatch: ${meta.width}x${meta.height}`,
    );
  }
  return { jpeg, sourceHash16 };
}

/**
 * Upload derived OG JPEG via service-role client and return public HTTPS URL.
 * Caller updates projects.og_image_url only after this succeeds.
 */
export async function uploadDerivedOgImage(
  admin: SupabaseClient,
  projectId: string,
  jpeg: Buffer,
  sourceHash16: string,
): Promise<DerivedOgImage> {
  assertServerRuntime();
  const objectPath = `${projectId}/og-${sourceHash16}-1200x630.jpg`;
  const { error } = await admin.storage
    .from(PROJECT_THUMBNAILS_BUCKET)
    .upload(objectPath, jpeg, {
      contentType: OG_IMAGE_MIME,
      upsert: true,
      cacheControl: "3600",
    });
  if (error) {
    throw new Error(error.message || "OGP upload failed");
  }
  const url = publicObjectUrl(admin, objectPath);
  if (!isHttpsThumbnailUrl(url)) {
    throw new Error("invalid OGP public url");
  }
  return {
    url: url.trim(),
    objectPath,
    contentType: OG_IMAGE_MIME,
    width: OG_IMAGE_WIDTH,
    height: OG_IMAGE_HEIGHT,
    sourceHash16,
  };
}

export async function deriveAndUploadProjectOgImage(
  admin: SupabaseClient,
  projectId: string,
  sourceHttpsUrl: string,
): Promise<DerivedOgImage> {
  const bytes = await loadHttpsImageBytes(sourceHttpsUrl);
  const { jpeg, sourceHash16 } = await renderOgCoverJpeg(bytes);
  return uploadDerivedOgImage(admin, projectId, jpeg, sourceHash16);
}
