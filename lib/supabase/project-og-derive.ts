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
import {
  assertExactArrayBufferUploadBody,
  assertFetchedOgJpegMatches,
  assertValidOgJpegBytes,
  buildImmutableOgObjectPath,
  isStorageObjectAlreadyExistsError,
  toExactArrayBuffer,
  toUint8Array,
  type BinaryOgImage,
} from "@/lib/supabase/project-og-image-binary";
import { publicObjectUrl } from "@/lib/supabase/project-thumbnail-storage";

export { OG_IMAGE_HEIGHT, OG_IMAGE_MIME, OG_IMAGE_WIDTH } from "@/lib/og-image-constants";
export { buildImmutableOgObjectPath } from "@/lib/supabase/project-og-image-binary";

export type DerivedOgImage = {
  url: string;
  objectPath: string;
  contentType: typeof OG_IMAGE_MIME;
  width: number;
  height: number;
  sourceHash16: string;
  derivedJpegHash16: string;
  reusedExistingObject: boolean;
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
  // Binary only — never response.text()
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
 * Re-fetch the just-uploaded object as binary and verify identity.
 * Never uses text() / UTF-8 decode.
 */
async function downloadOgObjectBinary(
  admin: SupabaseClient,
  objectPath: string,
): Promise<BinaryOgImage> {
  const { data, error } = await admin.storage
    .from(PROJECT_THUMBNAILS_BUCKET)
    .download(objectPath);

  if (error || !data) {
    throw new Error(
      `OG post-upload download failed: ${error?.message ?? "empty body"}`,
    );
  }

  if (typeof data === "string") {
    throw new Error("OG post-upload download returned string (forbidden)");
  }

  if (typeof Blob !== "undefined" && data instanceof Blob) {
    const type = (data.type || "").split(";")[0]?.trim().toLowerCase() ?? "";
    if (type && type !== OG_IMAGE_MIME && type !== "image/jpg") {
      throw new Error(
        `OG post-upload content-type ${data.type}, expected ${OG_IMAGE_MIME}`,
      );
    }
    return toExactArrayBuffer(await data.arrayBuffer());
  }

  return toExactArrayBuffer(data as unknown as BinaryOgImage);
}

/**
 * Upload derived OG JPEG via service-role client and return public HTTPS URL.
 *
 * Immutable path: `{projectId}/og-{sourceHash16}-{derivedJpegHash16}-1200x630.jpg`
 * Never overwrites an existing object (upsert:false). Same JPEG bytes → same path
 * → reuse after binary identity check. Different JPEG → new path (CDN-safe).
 * Does not delete any prior og_* objects.
 *
 * Order (must not update projects.og_image_url inside this function):
 * 1) pre-upload JPEG validation + derived SHA
 * 2) immutable path from hashes (no external filenames)
 * 3) exact-length ArrayBuffer upload with upsert:false
 * 4) if already exists: binary re-fetch; match → reuse; mismatch → abort
 * 5) if new: post-upload binary re-fetch + SHA/length/byte identity
 * 6) return public URL — caller commits og_image_url only after this resolves
 */
export async function uploadDerivedOgImage(
  admin: SupabaseClient,
  projectId: string,
  jpeg: Buffer,
  sourceHash16: string,
): Promise<DerivedOgImage> {
  assertServerRuntime();

  // 1) Pre-upload validation — rejects UTF-8 corruption / wrong dims / string
  const pre = await assertValidOgJpegBytes(jpeg);
  const derivedJpegHash16 = pre.sha256Hex.slice(0, 16);

  // 2) Exact-length ArrayBuffer — do not pass Node Buffer (byteOffset / spare capacity)
  const uploadBody = toExactArrayBuffer(jpeg);
  assertExactArrayBufferUploadBody(uploadBody);

  const expectedBytes = toUint8Array(uploadBody);
  if (expectedBytes.byteLength !== pre.byteLength) {
    throw new Error("OG upload body length diverged from pre-upload validation");
  }
  for (let i = 0; i < expectedBytes.byteLength; i += 1) {
    if (expectedBytes[i] !== pre.bytes[i]) {
      throw new Error("OG upload body bytes diverged from pre-upload validation");
    }
  }

  const objectPath = buildImmutableOgObjectPath(
    projectId,
    sourceHash16,
    derivedJpegHash16,
  );

  // 3) upsert:false — never overwrite; content-addressed path replaces cache-busting
  const { error } = await admin.storage
    .from(PROJECT_THUMBNAILS_BUCKET)
    .upload(objectPath, uploadBody, {
      contentType: OG_IMAGE_MIME,
      upsert: false,
      cacheControl: "3600",
    });

  let reusedExistingObject = false;
  if (error) {
    if (!isStorageObjectAlreadyExistsError(error.message)) {
      throw new Error(error.message || "OGP upload failed");
    }
    // Existing object at immutable path — reuse only if bytes are identical
    reusedExistingObject = true;
    const existing = await downloadOgObjectBinary(admin, objectPath);
    await assertFetchedOgJpegMatches(
      existing,
      {
        expectedSha256Hex: pre.sha256Hex,
        expectedByteLength: pre.byteLength,
        expectedBytes: pre.bytes,
      },
      OG_IMAGE_MIME,
    );
  } else {
    // 4) Post-upload binary re-fetch + identity check (before any DB URL commit)
    const fetched = await downloadOgObjectBinary(admin, objectPath);
    await assertFetchedOgJpegMatches(
      fetched,
      {
        expectedSha256Hex: pre.sha256Hex,
        expectedByteLength: pre.byteLength,
        expectedBytes: pre.bytes,
      },
      OG_IMAGE_MIME,
    );
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
    derivedJpegHash16,
    reusedExistingObject,
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
