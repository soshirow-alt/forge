/**
 * Production OGP repair — Kick Counter canary prep (Phase 3D).
 *
 * Default: dry-run only. Generates a local repair JPEG for Dashboard manual upload.
 * NEVER uploads to Storage, NEVER updates DB, NEVER calls derive API.
 *
 * Usage:
 *   npx tsx scripts/production-only/repair-corrupted-og-images.ts \
 *     --project-id 3a2f5a74-f468-4d6b-ba66-43452c9025c0
 *
 * --execute is permanently sealed in this phase.
 */
import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { dirname, resolve } from "node:path";
import sharp, { type Metadata as SharpMetadata } from "sharp";
import {
  OG_IMAGE_HEIGHT,
  OG_IMAGE_MIME,
  OG_IMAGE_WIDTH,
} from "../../lib/og-image-constants";
import { PROJECT_THUMBNAILS_BUCKET } from "../../lib/project-thumbnail-upload-rules";
import { renderOgCoverJpeg } from "../../lib/supabase/project-og-derive";
import {
  assertExactArrayBufferUploadBody,
  assertValidOgJpegBytes,
  hasJpegSoi,
  hasUtf8ReplacementPrefix,
  toExactArrayBuffer,
} from "../../lib/supabase/project-og-image-binary";

const PROD_REF = "bpnisgzxuwdxelhnduuf";
const PROD_PUBLIC_ORIGIN = `https://${PROD_REF}.supabase.co`;
const BUCKET = PROJECT_THUMBNAILS_BUCKET;

/** Phase 3D: only Kick Counter is allowed. */
export const ALLOWED_REPAIR_PROJECT_ID =
  "3a2f5a74-f468-4d6b-ba66-43452c9025c0" as const;

const ALLOWED = {
  projectId: ALLOWED_REPAIR_PROJECT_ID,
  title: "Kick Counter - 馬さん、見切れ",
  objectPath: `${ALLOWED_REPAIR_PROJECT_ID}/og-2773640be394917e-1200x630.jpg`,
  /** Primary gallery object that produced the OG hash16 (derive uses thumbnail_url = [0]). */
  sourceObjectPath: `${ALLOWED_REPAIR_PROJECT_ID}/0-2773640be394917e.jpg`,
  sourceHash16: "2773640be394917e",
  expectedCorruptSha256:
    "b76a9dff08f25046cd7ac58c07e183baa2f351547a2c715f2f50d3a3c29db8f1",
} as const;

function publicObjectUrl(objectPath: string): string {
  return `${PROD_PUBLIC_ORIGIN}/storage/v1/object/public/${BUCKET}/${objectPath}`;
}

function extractRef(url: string | undefined): string | null {
  if (!url) return null;
  try {
    return new URL(url).hostname.match(/^([a-z0-9]+)\.supabase\.co$/i)?.[1] ?? null;
  } catch {
    return null;
  }
}

function sha256Hex(buf: Buffer | Uint8Array): string {
  return createHash("sha256").update(buf).digest("hex");
}

function parseArgs(argv: string[]) {
  const projectIds: string[] = [];
  let wantsExecute = false;
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === "--execute") wantsExecute = true;
    if (a === "--dry-run") continue;
    if (a === "--project-id") {
      const id = argv[i + 1];
      if (!id || id.startsWith("--")) {
        throw new Error("--project-id requires a UUID value");
      }
      projectIds.push(id);
      i += 1;
    }
  }
  return { projectIds, wantsExecute };
}

function assertCorruptionMatch(bytes: Buffer): void {
  if (bytes.byteLength < 12) {
    throw new Error("ABORT: current OG object too small");
  }
  const utf8x4 =
    bytes[0] === 0xef &&
    bytes[1] === 0xbf &&
    bytes[2] === 0xbd &&
    bytes[3] === 0xef &&
    bytes[4] === 0xbf &&
    bytes[5] === 0xbd &&
    bytes[6] === 0xef &&
    bytes[7] === 0xbf &&
    bytes[8] === 0xbd &&
    bytes[9] === 0xef &&
    bytes[10] === 0xbf &&
    bytes[11] === 0xbd;
  if (!utf8x4) {
    throw new Error(
      "ABORT: current OG object is not the known UTF-8 replacement corruption (EF BF BD ×4)",
    );
  }
  if (bytes[0] === 0xff && bytes[1] === 0xd8) {
    throw new Error("ABORT: current OG object has JPEG SOI — looks valid; refusing overwrite prep");
  }
}

async function assertNotValidOgJpeg(bytes: Buffer): Promise<void> {
  try {
    await sharp(bytes).metadata();
    throw new Error(
      "ABORT: sharp decoded current OG object — refusing to prepare overwrite for a readable image",
    );
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("ABORT:")) throw error;
    // expected: undecodable corrupt bytes
  }
}

async function fetchBinary(url: string): Promise<{
  status: number;
  contentType: string | null;
  etag: string | null;
  lastModified: string | null;
  bytes: Buffer;
}> {
  const res = await fetch(url, { cache: "no-store", redirect: "follow" });
  // Binary only — never res.text()
  const ab = await res.arrayBuffer();
  return {
    status: res.status,
    contentType: res.headers.get("content-type"),
    etag: res.headers.get("etag"),
    lastModified: res.headers.get("last-modified"),
    bytes: Buffer.from(new Uint8Array(ab)),
  };
}

async function deriveRepairJpeg(sourceBytes: Buffer): Promise<{
  bytes: Buffer;
  sha256: string;
  byteLength: number;
  head16: string;
  sourceHash16: string;
  width: number;
  height: number;
  format: string;
  uploadBodyType: string;
}> {
  const { jpeg, sourceHash16 } = await renderOgCoverJpeg(new Uint8Array(sourceBytes));
  const pre = await assertValidOgJpegBytes(jpeg);
  const body = toExactArrayBuffer(jpeg);
  assertExactArrayBufferUploadBody(body);
  const u8 = new Uint8Array(body);
  if (!hasJpegSoi(u8)) throw new Error("derived JPEG missing SOI");
  if (hasUtf8ReplacementPrefix(u8)) {
    throw new Error("derived JPEG has UTF-8 replacement prefix");
  }
  const meta = await sharp(Buffer.from(u8)).metadata();
  if (meta.format !== "jpeg") {
    throw new Error(`derived format ${meta.format}`);
  }
  if (meta.width !== OG_IMAGE_WIDTH || meta.height !== OG_IMAGE_HEIGHT) {
    throw new Error(`derived dims ${meta.width}x${meta.height}`);
  }
  if (pre.sha256Hex !== sha256Hex(u8)) {
    throw new Error("pre-validation SHA diverged from upload body");
  }
  return {
    bytes: Buffer.from(u8),
    sha256: pre.sha256Hex,
    byteLength: u8.byteLength,
    head16: Buffer.from(u8.subarray(0, 16)).toString("hex"),
    sourceHash16,
    width: OG_IMAGE_WIDTH,
    height: OG_IMAGE_HEIGHT,
    format: "jpeg",
    uploadBodyType: Object.prototype.toString.call(body),
  };
}

async function main(): Promise<void> {
  const { projectIds, wantsExecute } = parseArgs(process.argv.slice(2));

  if (wantsExecute) {
    console.error(
      "ABORT: --execute is permanently sealed for Phase 3D. Manual Dashboard upload only.",
    );
    process.exit(2);
  }

  if (projectIds.length === 0) {
    console.error("ABORT: --project-id <uuid> is required (exactly one)");
    process.exit(2);
  }
  if (projectIds.length !== 1) {
    console.error("ABORT: exactly one --project-id allowed (no multi-UUID)");
    process.exit(2);
  }

  const projectId = projectIds[0]!;
  if (projectId !== ALLOWED.projectId) {
    console.error(
      `ABORT: project-id not allowed for Phase 3D canary. expected ${ALLOWED.projectId}`,
    );
    process.exit(2);
  }

  // Prefer explicit Production URL confirmation. Env may point at Staging in this agent —
  // dry-run uses hard-coded Production public URLs and still requires Production ref identity.
  const envRef = extractRef(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const productionRefConfirmed = PROD_REF;
  if (envRef && envRef !== PROD_REF && envRef !== "vuqpwvjvgyxffmvpfrxo") {
    console.error(`ABORT: unrecognized NEXT_PUBLIC_SUPABASE_URL ref ${envRef}`);
    process.exit(2);
  }
  // Always operate against hard-coded Production public URLs for this canary prep.
  void envRef;

  const ogUrl = publicObjectUrl(ALLOWED.objectPath);
  const sourceUrl = publicObjectUrl(ALLOWED.sourceObjectPath);
  const outRel = `.tmp-ogp-repair/${ALLOWED.projectId}/og-2773640be394917e-1200x630.jpg`;
  const outAbs = resolve(process.cwd(), outRel);
  if (!outAbs.includes(`${ALLOWED.projectId}`)) {
    console.error("ABORT: output path is not UUID-scoped");
    process.exit(2);
  }

  console.log("=== Production OGP repair dry-run (Phase 3D, Kick Counter only) ===");
  console.log(`title: ${ALLOWED.title}`);
  console.log(`UUID: ${ALLOWED.projectId}`);
  console.log(`Production ref: ${productionRefConfirmed}`);
  console.log(`bucket: ${BUCKET}`);
  console.log(`object path: ${ALLOWED.objectPath}`);
  console.log(`env ref (informational): ${envRef ?? "(none)"}`);

  const current = await fetchBinary(ogUrl);
  if (current.status !== 200) {
    console.error(`ABORT: current OG HTTP ${current.status}`);
    process.exit(2);
  }
  const ct = (current.contentType || "").split(";")[0]?.trim().toLowerCase() ?? "";
  if (ct !== OG_IMAGE_MIME && ct !== "image/jpg") {
    console.error(`ABORT: current content-type ${current.contentType}`);
    process.exit(2);
  }
  assertCorruptionMatch(current.bytes);
  await assertNotValidOgJpeg(current.bytes);
  const currentSha = sha256Hex(current.bytes);
  if (currentSha !== ALLOWED.expectedCorruptSha256) {
    console.error(
      `ABORT: current OG SHA ${currentSha} != expected corrupt ${ALLOWED.expectedCorruptSha256}`,
    );
    process.exit(2);
  }
  console.log("current object corruption: CONFIRMED (EF BF BD ×4, no SOI, sharp undecodable)");
  console.log(`current SHA-256: ${currentSha}`);
  console.log(`current byteLength: ${current.bytes.byteLength}`);
  console.log(`current ETag: ${current.etag ?? "(none)"}`);

  const source = await fetchBinary(sourceUrl);
  if (source.status !== 200) {
    console.error(`ABORT: source thumbnail HTTP ${source.status}`);
    process.exit(2);
  }
  let sourceMeta: SharpMetadata;
  try {
    sourceMeta = await sharp(source.bytes).metadata();
  } catch {
    console.error("ABORT: source thumbnail is not a decodable image");
    process.exit(2);
  }
  const sourceSha = sha256Hex(source.bytes);
  if (!sourceSha.startsWith(ALLOWED.sourceHash16)) {
    console.error(
      `ABORT: source SHA prefix ${sourceSha.slice(0, 16)} != ${ALLOWED.sourceHash16}`,
    );
    process.exit(2);
  }
  console.log(`source thumbnail: ${sourceUrl}`);
  console.log(
    `source: ${sourceMeta.format} ${sourceMeta.width}x${sourceMeta.height} sha=${sourceSha}`,
  );

  const pass1 = await deriveRepairJpeg(source.bytes);
  const pass2 = await deriveRepairJpeg(source.bytes);
  if (pass1.sha256 !== pass2.sha256 || pass1.byteLength !== pass2.byteLength) {
    console.error("ABORT: derive is non-deterministic across two local passes");
    process.exit(2);
  }
  if (pass1.sourceHash16 !== ALLOWED.sourceHash16) {
    console.error(`ABORT: derive sourceHash16 ${pass1.sourceHash16}`);
    process.exit(2);
  }
  if (pass1.sha256 === currentSha) {
    console.error("ABORT: repair JPEG SHA unexpectedly equals corrupt object");
    process.exit(2);
  }

  mkdirSync(dirname(outAbs), { recursive: true });
  writeFileSync(outAbs, pass1.bytes);
  if (!existsSync(outAbs)) {
    console.error("ABORT: failed to write repair JPEG");
    process.exit(2);
  }
  // Confirm written file matches
  const written = readFileSync(outAbs);
  if (sha256Hex(written) !== pass1.sha256) {
    console.error("ABORT: written file SHA mismatch");
    process.exit(2);
  }

  console.log(`repair output file: ${outAbs}`);
  console.log(`repair relative: ${outRel}`);
  console.log(`repair SHA-256: ${pass1.sha256}`);
  console.log(`repair byteLength: ${pass1.byteLength}`);
  console.log(`repair head16: ${pass1.head16}`);
  console.log(`repair dims: ${pass1.width}x${pass1.height}`);
  console.log(`repair format: ${pass1.format}`);
  console.log(`repair uploadBodyType: ${pass1.uploadBodyType}`);
  console.log(`dual-pass SHA match: yes`);
  console.log("NO PRODUCTION WRITE PERFORMED");
  console.log(
    "Next: owner manually overwrites the same object path via Supabase Dashboard (Production).",
  );
}

main().catch((error) => {
  console.error("FAIL", error instanceof Error ? error.message : error);
  process.exit(1);
});
