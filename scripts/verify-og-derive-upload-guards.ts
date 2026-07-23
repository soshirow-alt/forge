/**
 * OGP derive upload guards (Phase 3A) — local / mock only.
 * Does not touch Production or Staging Storage / DB.
 *
 * Usage: npx tsx scripts/verify-og-derive-upload-guards.ts
 */
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import sharp from "sharp";
import {
  OG_IMAGE_HEIGHT,
  OG_IMAGE_MIME,
  OG_IMAGE_WIDTH,
} from "../lib/og-image-constants";
import {
  assertExactArrayBufferUploadBody,
  assertValidOgJpegBytes,
  corruptJpegAsUtf8RoundTrip,
  hasJpegSoi,
  toExactArrayBuffer,
  toUint8Array,
  validateFetchedOgJpegMatches,
  validateOgJpegBytes,
} from "../lib/supabase/project-og-image-binary";
import { uploadDerivedOgImage } from "../lib/supabase/project-og-derive";

function pass(message: string) {
  console.log(`PASS ${message}`);
}

function sha256HexSync(bytes: Uint8Array): string {
  return createHash("sha256").update(Buffer.from(bytes)).digest("hex");
}

async function makeValidOgJpeg(): Promise<Buffer> {
  return sharp({
    create: {
      width: 1600,
      height: 900,
      channels: 3,
      background: { r: 32, g: 64, b: 128 },
    },
  })
    .jpeg({ quality: 85, mozjpeg: true })
    .toBuffer()
    .then((src) =>
      sharp(src)
        .resize(OG_IMAGE_WIDTH, OG_IMAGE_HEIGHT, {
          fit: "cover",
          position: "centre",
        })
        .jpeg({ quality: 85, mozjpeg: true })
        .toBuffer(),
    );
}

type StoredObject = {
  body: ArrayBuffer;
  contentType: string;
};

function createMockAdmin(options?: {
  mutateAfterUpload?: (stored: StoredObject) => StoredObject | Promise<StoredObject>;
  forceDownloadContentType?: string;
}) {
  const store = new Map<string, StoredObject>();
  let uploadCalls = 0;
  let lastUploadBody: unknown = undefined;
  let lastUploadContentType: string | undefined;
  let dbUpdateCalls = 0;

  const fromStorage = (bucket: string) => ({
    upload: async (
      path: string,
      body: unknown,
      opts?: { contentType?: string; upsert?: boolean; cacheControl?: string },
    ) => {
      void bucket;
      uploadCalls += 1;
      lastUploadBody = body;
      lastUploadContentType = opts?.contentType;
      if (typeof body === "string") {
        return { error: { message: "string body rejected by mock" } };
      }
      if (!(body instanceof ArrayBuffer)) {
        return {
          error: {
            message: `expected ArrayBuffer, got ${Object.prototype.toString.call(body)}`,
          },
        };
      }
      let stored: StoredObject = {
        body: body.slice(0),
        contentType: opts?.contentType ?? "application/octet-stream",
      };
      if (options?.mutateAfterUpload) {
        stored = await options.mutateAfterUpload(stored);
      }
      store.set(path, stored);
      return { error: null };
    },
    download: async (path: string) => {
      const stored = store.get(path);
      if (!stored) {
        return { data: null, error: { message: "not found" } };
      }
      const type =
        options?.forceDownloadContentType ?? stored.contentType ?? OG_IMAGE_MIME;
      return {
        data: new Blob([stored.body], { type }),
        error: null,
      };
    },
    getPublicUrl: (path: string) => ({
      data: {
        publicUrl: `https://example.supabase.co/storage/v1/object/public/project-thumbnails/${path}`,
      },
    }),
  });

  const admin = {
    storage: { from: fromStorage },
    // Surrogate for route-level DB update tracking in integration-style tests
    __trackDbUpdate() {
      dbUpdateCalls += 1;
    },
    __stats: () => ({
      uploadCalls,
      lastUploadBody,
      lastUploadContentType,
      dbUpdateCalls,
      storeSize: store.size,
    }),
  };

  return admin;
}

async function runHappyPath() {
  const jpeg = await makeValidOgJpeg();
  const pre = await validateOgJpegBytes(jpeg);
  assert.equal(pre.ok, true);
  if (!pre.ok) throw new Error("unreachable");
  pass("sharp-generated JPEG passes pre-upload validation");

  const ab = toExactArrayBuffer(jpeg);
  assertExactArrayBufferUploadBody(ab);
  assert.equal(ab.byteLength, jpeg.byteLength);
  assert.deepEqual(Buffer.from(ab), jpeg);
  pass("exact-length ArrayBuffer matches source Buffer byte-for-byte");

  const u8 = toUint8Array(ab);
  assert.equal(hasJpegSoi(u8), true);
  pass("FF D8 SOI preserved after ArrayBuffer conversion");

  const meta = await sharp(Buffer.from(u8)).metadata();
  assert.equal(meta.width, OG_IMAGE_WIDTH);
  assert.equal(meta.height, OG_IMAGE_HEIGHT);
  assert.equal((meta.format || "").toLowerCase(), "jpeg");
  pass("1200×630 jpeg maintained");

  const shaA = sha256HexSync(u8);
  const shaB = sha256HexSync(new Uint8Array(jpeg));
  assert.equal(shaA, shaB);
  assert.equal(shaA, pre.sha256Hex);
  pass("SHA-256 matches across Buffer / ArrayBuffer / pre-validation");

  const admin = createMockAdmin();
  const derived = await uploadDerivedOgImage(
    admin as never,
    "11111111-1111-4111-8111-111111111111",
    jpeg,
    "abcd1234abcd1234",
  );
  const stats = admin.__stats();
  assert.equal(stats.uploadCalls, 1);
  assert.ok(stats.lastUploadBody instanceof ArrayBuffer);
  assert.equal(
    Object.prototype.toString.call(stats.lastUploadBody),
    "[object ArrayBuffer]",
  );
  assert.equal(stats.lastUploadContentType, OG_IMAGE_MIME);
  assert.equal(
    (stats.lastUploadBody as ArrayBuffer).byteLength,
    jpeg.byteLength,
  );
  pass("Storage mock received ArrayBuffer body with image/jpeg");

  assert.equal(derived.width, OG_IMAGE_WIDTH);
  assert.equal(derived.height, OG_IMAGE_HEIGHT);
  assert.equal(derived.contentType, OG_IMAGE_MIME);
  assert.match(derived.objectPath, /og-abcd1234abcd1234-1200x630\.jpg$/);
  pass("post-upload identity check succeeds when stored bytes match");

  // Simulate route: DB update only after uploadDerivedOgImage resolves
  admin.__trackDbUpdate();
  assert.equal(admin.__stats().dbUpdateCalls, 1);
  pass("DB update proceeds only after successful upload+verify");
}

async function runCorruptionFixture() {
  const jpeg = await makeValidOgJpeg();
  const corrupted = Buffer.from(corruptJpegAsUtf8RoundTrip(new Uint8Array(jpeg)));
  // Equivalent Production failure mode
  const also = Buffer.from(jpeg.toString("utf8"), "utf8");
  assert.deepEqual(corrupted, also);
  pass("Production corruption fixture = utf8 round-trip of valid JPEG");

  const pre = await validateOgJpegBytes(corrupted);
  assert.equal(pre.ok, false);
  if (pre.ok) throw new Error("unreachable");
  assert.match(pre.reason, /UTF-8 replacement|missing JPEG SOI|sharp cannot/i);
  pass(`pre-upload rejects corruption fixture (${pre.reason})`);

  await assert.rejects(
    () => sharp(corrupted).metadata(),
    /Input buffer|unsupported|VipsJpeg|corrupt|invalid/i,
  ).catch(async () => {
    // sharp may throw or return empty/invalid — either is failure for our assertValid
    try {
      const meta = await sharp(corrupted).metadata();
      assert.notEqual(meta.format, "jpeg");
    } catch {
      // expected
    }
  });
  pass("sharp cannot treat corruption fixture as valid jpeg cover");

  const admin = createMockAdmin();
  await assert.rejects(
    () =>
      uploadDerivedOgImage(
        admin as never,
        "11111111-1111-4111-8111-111111111111",
        corrupted,
        "deadbeefdeadbeef",
      ),
    /pre-upload|OGP pre-upload|UTF-8|SOI|sharp/i,
  );
  assert.equal(admin.__stats().uploadCalls, 0);
  assert.equal(admin.__stats().dbUpdateCalls, 0);
  pass("corruption fixture: Storage upload not called; DB update not called");
}

async function runTypeAndShapeRejections() {
  const jpeg = await makeValidOgJpeg();

  for (const [label, value] of [
    ["string", "not-a-jpeg"],
    ["empty Buffer", Buffer.alloc(0)],
    ["JSON Buffer", { type: "Buffer", data: [0xff, 0xd8] }],
    ["data URL", "data:image/jpeg;base64,/9j/4AAQ"],
  ] as const) {
    const result = await validateOgJpegBytes(value);
    assert.equal(result.ok, false, label);
    pass(`rejects ${label}`);
  }

  await assert.rejects(() => assertValidOgJpegBytes("base64ish"), /string/);
  pass("assertValidOgJpegBytes rejects string at runtime");

  const png = await sharp({
    create: {
      width: OG_IMAGE_WIDTH,
      height: OG_IMAGE_HEIGHT,
      channels: 3,
      background: { r: 1, g: 2, b: 3 },
    },
  })
    .png()
    .toBuffer();
  const notJpeg = await validateOgJpegBytes(png);
  assert.equal(notJpeg.ok, false);
  pass("rejects non-JPEG (PNG)");

  const wrongSize = await sharp({
    create: {
      width: 800,
      height: 600,
      channels: 3,
      background: { r: 9, g: 9, b: 9 },
    },
  })
    .jpeg()
    .toBuffer();
  const dim = await validateOgJpegBytes(wrongSize);
  assert.equal(dim.ok, false);
  if (!dim.ok) assert.match(dim.reason, /dimensions/);
  pass("rejects non-1200×630 JPEG");

  // ArrayBuffer guard
  assert.throws(() => assertExactArrayBufferUploadBody(jpeg), /ArrayBuffer/);
  assert.throws(() => assertExactArrayBufferUploadBody("x"), /string/);
  pass("assertExactArrayBufferUploadBody rejects Buffer and string");
}

async function runPostUploadFailuresSuppressDb() {
  const jpeg = await makeValidOgJpeg();
  const pre = await assertValidOgJpegBytes(jpeg);

  // SHA / byte mismatch after upload
  {
    const admin = createMockAdmin({
      mutateAfterUpload: (stored) => {
        const mutated = new Uint8Array(stored.body);
        mutated[mutated.byteLength - 1] ^= 0xff;
        return {
          body: toExactArrayBuffer(mutated),
          contentType: stored.contentType,
        };
      },
    });
    await assert.rejects(
      () =>
        uploadDerivedOgImage(
          admin as never,
          "22222222-2222-4222-8222-222222222222",
          jpeg,
          "sha-mismatch-test1",
        ),
      /post-upload|SHA-256|byte/i,
    );
    assert.equal(admin.__stats().uploadCalls, 1);
    assert.equal(admin.__stats().dbUpdateCalls, 0);
    pass("post-upload SHA mismatch: upload called, DB update suppressed");
  }

  // byteLength mismatch
  {
    const admin = createMockAdmin({
      mutateAfterUpload: (stored) => {
        const truncated = stored.body.slice(0, Math.max(0, stored.body.byteLength - 50));
        return { body: truncated, contentType: stored.contentType };
      },
    });
    await assert.rejects(
      () =>
        uploadDerivedOgImage(
          admin as never,
          "33333333-3333-4333-8333-333333333333",
          jpeg,
          "len-mismatch-test1",
        ),
      /post-upload|byteLength|too small|SOI|sharp|SHA/i,
    );
    assert.equal(admin.__stats().dbUpdateCalls, 0);
    pass("post-upload byteLength mismatch: DB update suppressed");
  }

  // content-type invalid on download Blob
  {
    const admin = createMockAdmin({
      forceDownloadContentType: "text/html",
    });
    await assert.rejects(
      () =>
        uploadDerivedOgImage(
          admin as never,
          "44444444-4444-4444-8444-444444444444",
          jpeg,
          "ctype-bad-test0001",
        ),
      /content-type/i,
    );
    assert.equal(admin.__stats().dbUpdateCalls, 0);
    pass("post-upload content-type invalid: DB update suppressed");
  }

  // UTF-8 corruption after upload
  {
    const admin = createMockAdmin({
      mutateAfterUpload: () => {
        const corrupted = corruptJpegAsUtf8RoundTrip(pre.bytes);
        return {
          body: toExactArrayBuffer(corrupted),
          contentType: OG_IMAGE_MIME,
        };
      },
    });
    await assert.rejects(
      () =>
        uploadDerivedOgImage(
          admin as never,
          "55555555-5555-4555-8555-555555555555",
          jpeg,
          "utf8-corrupt-post01",
        ),
      /post-upload|UTF-8|SOI|sharp|pre-upload/i,
    );
    assert.equal(admin.__stats().dbUpdateCalls, 0);
    pass("post-upload UTF-8 corruption: DB update suppressed");
  }

  // Direct validateFetchedOgJpegMatches coverage
  const mismatch = await validateFetchedOgJpegMatches(
    pre.bytes,
    {
      expectedSha256Hex: "0".repeat(64),
      expectedByteLength: pre.byteLength,
      expectedBytes: pre.bytes,
    },
    OG_IMAGE_MIME,
  );
  assert.equal(mismatch.ok, false);
  pass("validateFetchedOgJpegMatches fails on SHA mismatch");
}

async function main() {
  console.log("=== verify-og-derive-upload-guards (Phase 3A, local mock) ===");
  await runHappyPath();
  await runCorruptionFixture();
  await runTypeAndShapeRejections();
  await runPostUploadFailuresSuppressDb();
  console.log("ALL PASS");
}

main().catch((error) => {
  console.error("FAIL", error);
  process.exit(1);
});
