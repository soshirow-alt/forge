/**
 * Binary-safe helpers for derived OGP JPEG upload.
 * Prevents the Production failure mode where a valid JPEG was stored as
 * UTF-8 replacement bytes (Buffer.toString("utf8") round-trip).
 */
import {
  OG_IMAGE_HEIGHT,
  OG_IMAGE_MIME,
  OG_IMAGE_WIDTH,
} from "@/lib/og-image-constants";
import sharp, { type Metadata as SharpMetadata } from "sharp";

/** Exact binary body accepted at the Storage upload boundary (never string). */
export type BinaryOgImage = Uint8Array | ArrayBuffer;

/** Minimum plausible size for a 1200×630 JPEG (rejects empty / tiny garbage). */
export const MIN_OG_JPEG_BYTES = 2_000;

/** Soft ceiling — derived covers are far smaller; keep memory bounded. */
export const MAX_OG_JPEG_BYTES = 5_000_000;

export type OgJpegValidationOk = {
  ok: true;
  bytes: Uint8Array;
  byteLength: number;
  sha256Hex: string;
  width: number;
  height: number;
  format: "jpeg";
};

export type OgJpegValidationFail = {
  ok: false;
  reason: string;
};

export type OgJpegValidationResult = OgJpegValidationOk | OgJpegValidationFail;

function isNodeBuffer(value: unknown): value is Buffer {
  return typeof Buffer !== "undefined" && Buffer.isBuffer(value);
}

/**
 * Reject strings / JSON-Buffer / data URLs / base64 at runtime.
 * Accept only Buffer | Uint8Array | ArrayBuffer.
 */
export function assertBinaryOgImageInput(
  value: unknown,
  label = "og image body",
): asserts value is BinaryOgImage | Buffer {
  if (value == null) {
    throw new Error(`${label}: missing`);
  }
  if (typeof value === "string") {
    throw new Error(`${label}: string is forbidden (UTF-8 corruption risk)`);
  }
  if (isNodeBuffer(value)) {
    return;
  }
  if (value instanceof ArrayBuffer) {
    return;
  }
  if (value instanceof Uint8Array) {
    return;
  }
  // Node Buffer JSON form
  if (
    typeof value === "object" &&
    value !== null &&
    (value as { type?: unknown }).type === "Buffer" &&
    Array.isArray((value as { data?: unknown }).data)
  ) {
    throw new Error(`${label}: JSON Buffer form is forbidden`);
  }
  throw new Error(`${label}: unsupported type ${Object.prototype.toString.call(value)}`);
}

/** Copy into an exact-length ArrayBuffer (no shared offset / spare capacity). */
export function toExactArrayBuffer(value: BinaryOgImage | Buffer): ArrayBuffer {
  assertBinaryOgImageInput(value, "toExactArrayBuffer");
  const view =
    value instanceof ArrayBuffer
      ? new Uint8Array(value)
      : new Uint8Array(
          value.buffer,
          value.byteOffset,
          value.byteLength,
        );
  // Exact copy — never reuse Node Buffer backing store / byteOffset / spare capacity
  const copy = Uint8Array.from(view);
  return copy.buffer.slice(copy.byteOffset, copy.byteOffset + copy.byteLength);
}

export function toUint8Array(value: BinaryOgImage | Buffer): Uint8Array {
  assertBinaryOgImageInput(value, "toUint8Array");
  if (value instanceof ArrayBuffer) {
    return new Uint8Array(value.slice(0));
  }
  return Uint8Array.from(
    new Uint8Array(value.buffer, value.byteOffset, value.byteLength),
  );
}

export function hasJpegSoi(bytes: Uint8Array): boolean {
  return bytes.byteLength >= 2 && bytes[0] === 0xff && bytes[1] === 0xd8;
}

/** Detect UTF-8 U+FFFD prefix used by the Production corruption pattern. */
export function hasUtf8ReplacementPrefix(bytes: Uint8Array): boolean {
  return (
    bytes.byteLength >= 3 &&
    bytes[0] === 0xef &&
    bytes[1] === 0xbf &&
    bytes[2] === 0xbd
  );
}

export function looksLikeDataUrlOrBase64String(value: string): boolean {
  const trimmed = value.trim();
  if (/^data:/i.test(trimmed)) return true;
  if (/^data:image\//i.test(trimmed)) return true;
  // Long base64-ish payloads without data: prefix
  if (trimmed.length > 64 && /^[A-Za-z0-9+/=\s]+$/.test(trimmed)) return true;
  return false;
}

async function sha256HexOf(bytes: Uint8Array): Promise<string> {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  const digest = await crypto.subtle.digest("SHA-256", copy);
  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Pre-upload validation for derived OGP JPEG.
 * Does not mutate input. Never accepts string.
 */
export async function validateOgJpegBytes(
  value: unknown,
): Promise<OgJpegValidationResult> {
  try {
    if (typeof value === "string") {
      if (looksLikeDataUrlOrBase64String(value)) {
        return { ok: false, reason: "data URL / base64 string forbidden" };
      }
      return { ok: false, reason: "string body forbidden" };
    }
    assertBinaryOgImageInput(value);
  } catch (error) {
    return {
      ok: false,
      reason: error instanceof Error ? error.message : "invalid binary type",
    };
  }

  const bytes = toUint8Array(value);
  if (bytes.byteLength < MIN_OG_JPEG_BYTES) {
    return { ok: false, reason: `too small (${bytes.byteLength} bytes)` };
  }
  if (bytes.byteLength > MAX_OG_JPEG_BYTES) {
    return { ok: false, reason: `too large (${bytes.byteLength} bytes)` };
  }
  if (hasUtf8ReplacementPrefix(bytes)) {
    return {
      ok: false,
      reason: "UTF-8 replacement prefix (EF BF BD) — corrupt payload",
    };
  }
  if (!hasJpegSoi(bytes)) {
    return { ok: false, reason: "missing JPEG SOI (FF D8)" };
  }

  let meta: SharpMetadata;
  try {
    meta = await sharp(Buffer.from(bytes)).metadata();
  } catch {
    return { ok: false, reason: "sharp cannot decode bytes as image" };
  }

  const format = (meta.format || "").toLowerCase();
  if (format !== "jpeg" && format !== "jpg") {
    return { ok: false, reason: `format is ${format || "unknown"}, expected jpeg` };
  }
  if (meta.width !== OG_IMAGE_WIDTH || meta.height !== OG_IMAGE_HEIGHT) {
    return {
      ok: false,
      reason: `dimensions ${meta.width}x${meta.height}, expected ${OG_IMAGE_WIDTH}x${OG_IMAGE_HEIGHT}`,
    };
  }

  const digest = await sha256HexOf(bytes);
  return {
    ok: true,
    bytes,
    byteLength: bytes.byteLength,
    sha256Hex: digest,
    width: OG_IMAGE_WIDTH,
    height: OG_IMAGE_HEIGHT,
    format: "jpeg",
  };
}

export async function assertValidOgJpegBytes(
  value: unknown,
): Promise<OgJpegValidationOk> {
  const result = await validateOgJpegBytes(value);
  if (!result.ok) {
    throw new Error(`OGP pre-upload validation failed: ${result.reason}`);
  }
  return result;
}

/**
 * Ensure Storage upload body is an exact-length ArrayBuffer (not string).
 */
export function assertExactArrayBufferUploadBody(
  body: unknown,
): asserts body is ArrayBuffer {
  if (typeof body === "string") {
    throw new Error("upload body must not be a string");
  }
  if (!(body instanceof ArrayBuffer)) {
    throw new Error(
      `upload body must be ArrayBuffer, got ${Object.prototype.toString.call(body)}`,
    );
  }
  if (body.byteLength < MIN_OG_JPEG_BYTES) {
    throw new Error("upload ArrayBuffer too small");
  }
}

export type StoredOgMatchExpectation = {
  expectedSha256Hex: string;
  expectedByteLength: number;
  expectedBytes: Uint8Array;
};

/**
 * Compare re-fetched Storage object bytes to the pre-upload payload.
 * Caller must pass raw binary (never text-decoded).
 */
export async function validateFetchedOgJpegMatches(
  fetched: unknown,
  expectation: StoredOgMatchExpectation,
  contentType?: string | null,
): Promise<OgJpegValidationResult> {
  if (contentType != null) {
    const normalized = contentType.split(";")[0]?.trim().toLowerCase() ?? "";
    if (normalized && normalized !== OG_IMAGE_MIME && normalized !== "image/jpg") {
      return {
        ok: false,
        reason: `content-type ${contentType}, expected ${OG_IMAGE_MIME}`,
      };
    }
  }

  const pre = await validateOgJpegBytes(fetched);
  if (!pre.ok) {
    return pre;
  }

  if (pre.byteLength !== expectation.expectedByteLength) {
    return {
      ok: false,
      reason: `byteLength mismatch: got ${pre.byteLength}, expected ${expectation.expectedByteLength}`,
    };
  }
  if (pre.sha256Hex !== expectation.expectedSha256Hex) {
    return {
      ok: false,
      reason: `SHA-256 mismatch: got ${pre.sha256Hex}, expected ${expectation.expectedSha256Hex}`,
    };
  }
  if (pre.bytes.byteLength !== expectation.expectedBytes.byteLength) {
    return { ok: false, reason: "byte array length mismatch vs expectedBytes" };
  }
  for (let i = 0; i < pre.bytes.byteLength; i += 1) {
    if (pre.bytes[i] !== expectation.expectedBytes[i]) {
      return { ok: false, reason: `byte mismatch at offset ${i}` };
    }
  }
  return pre;
}

export async function assertFetchedOgJpegMatches(
  fetched: unknown,
  expectation: StoredOgMatchExpectation,
  contentType?: string | null,
): Promise<OgJpegValidationOk> {
  const result = await validateFetchedOgJpegMatches(
    fetched,
    expectation,
    contentType,
  );
  if (!result.ok) {
    throw new Error(`OGP post-upload validation failed: ${result.reason}`);
  }
  return result;
}

/** Reproduce Production corruption for fixtures / tests only. */
export function corruptJpegAsUtf8RoundTrip(validJpeg: Uint8Array): Uint8Array {
  const asString = Buffer.from(validJpeg).toString("utf8");
  return new Uint8Array(Buffer.from(asString, "utf8"));
}

/** Hex hash prefix used in immutable OG object names (path-safe). */
const OG_PATH_HASH16_RE = /^[a-f0-9]{16}$/;

/**
 * Build immutable OG object path inside the project UUID folder.
 * Format: `{projectId}/og-{sourceHash16}-{derivedJpegHash16}-1200x630.jpg`
 *
 * - derivedJpegHash16 is always required (content-addressed)
 * - external filenames are never used
 * - rejects path traversal / non-hex hashes
 */
export function buildImmutableOgObjectPath(
  projectId: string,
  sourceHash16: string,
  derivedJpegHash16: string,
): string {
  const id = projectId.trim();
  const src = sourceHash16.trim().toLowerCase();
  const derived = derivedJpegHash16.trim().toLowerCase();

  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      id,
    )
  ) {
    throw new Error("invalid projectId for OG object path");
  }
  if (!OG_PATH_HASH16_RE.test(src)) {
    throw new Error("invalid sourceHash16 for OG object path");
  }
  if (!OG_PATH_HASH16_RE.test(derived)) {
    throw new Error("invalid derivedJpegHash16 for OG object path");
  }
  if (
    src.includes("..") ||
    derived.includes("..") ||
    src.includes("/") ||
    derived.includes("/")
  ) {
    throw new Error("OG object path hash must not contain path segments");
  }

  return `${id}/og-${src}-${derived}-1200x630.jpg`;
}

/** True when Storage upload failed because the object already exists. */
export function isStorageObjectAlreadyExistsError(
  message: string | null | undefined,
): boolean {
  const m = (message || "").toLowerCase();
  return (
    m.includes("already exists") ||
    m.includes("resource already exists") ||
    m.includes("duplicate") ||
    m.includes("409")
  );
}
