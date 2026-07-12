/**
 * STAGING ONLY — derive 1200×630 OGP for Comet Rush from primary thumbnail.
 * Does NOT touch Production.
 *
 * Requires migration 063 applied on Staging.
 * Usage:
 *   FORGE_ALLOW_PRODUCTION_SUPABASE_WRITE=0 node scripts/staging-only/backfill-comet-rush-og-image.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import sharp from "sharp";

const STAGING_REF = "vuqpwvjvgyxffmvpfrxo";
const PROD_REF = "bpnisgzxuwdxelhnduuf";
const COMET = "dddddddd-dddd-4ddd-8ddd-000000000206";
const BUCKET = "project-thumbnails";
const W = 1200;
const H = 630;

function loadEnv(path = ".env.local") {
  const env = { ...process.env };
  if (!existsSync(path)) return env;
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    env[trimmed.slice(0, eq).trim()] = value;
  }
  return env;
}

function refOf(url) {
  try {
    return new URL(url).hostname.split(".")[0];
  } catch {
    return null;
  }
}

const env = loadEnv();
const url = env.NEXT_PUBLIC_SUPABASE_URL || "";
const service = env.SUPABASE_SERVICE_ROLE_KEY || "";
const ref = refOf(url);
if (ref !== STAGING_REF || ref === PROD_REF || !service) {
  console.error(JSON.stringify({ abort: "not_staging", ref }));
  process.exit(1);
}

const admin = createClient(url, service, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const anon = createClient(url, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
  auth: { persistSession: false },
});

const { data: project, error } = await admin
  .from("projects")
  .select("id, title, visibility, thumbnail_url, og_image_url")
  .eq("id", COMET)
  .single();
if (error || !project) {
  console.error("load failed", error?.message);
  process.exit(1);
}

const source = String(project.thumbnail_url || "");
if (!source.startsWith("https://")) {
  console.error("Comet Rush primary thumb is not https — run Storage backfill first");
  process.exit(1);
}

const beforeThumb = source;
const beforeOg = project.og_image_url;

const res = await fetch(source, { cache: "no-store" });
if (!res.ok) {
  console.error("source get", res.status);
  process.exit(1);
}
const srcBuf = Buffer.from(await res.arrayBuffer());
const hash16 = createHash("sha256").update(srcBuf).digest("hex").slice(0, 16);
const jpeg = await sharp(srcBuf)
  .rotate()
  .resize(W, H, { fit: "cover", position: "centre" })
  .jpeg({ quality: 85, mozjpeg: true })
  .toBuffer();
const meta = await sharp(jpeg).metadata();
if (meta.width !== W || meta.height !== H) {
  console.error("size mismatch", meta.width, meta.height);
  process.exit(1);
}

const objectPath = `${COMET}/og-${hash16}-1200x630.jpg`;
const { error: upErr } = await admin.storage.from(BUCKET).upload(objectPath, jpeg, {
  contentType: "image/jpeg",
  upsert: true,
  cacheControl: "3600",
});
if (upErr) {
  console.error("upload", upErr.message);
  process.exit(1);
}
const { data: pub } = admin.storage.from(BUCKET).getPublicUrl(objectPath);
const ogUrl = pub.publicUrl;
const getRes = await fetch(ogUrl, { cache: "no-store" });
const getBuf = Buffer.from(await getRes.arrayBuffer());
const getMeta = await sharp(getBuf).metadata();

const { error: updErr } = await admin
  .from("projects")
  .update({ og_image_url: ogUrl })
  .eq("id", COMET);
if (updErr) {
  console.error("db", updErr.message);
  process.exit(1);
}

// Confirm thumbnails unchanged
const { data: after } = await admin
  .from("projects")
  .select("thumbnail_url, og_image_url")
  .eq("id", COMET)
  .single();

const { data: rpcData, error: rpcErr } = await anon.rpc(
  "get_public_project_og_image_url",
  { p_project_id: COMET },
);

const report = {
  projectId: COMET,
  objectPath,
  ogUrl,
  getStatus: getRes.status,
  contentType: getRes.headers.get("content-type"),
  dimensions: { width: getMeta.width, height: getMeta.height },
  thumbUnchanged: after?.thumbnail_url === beforeThumb,
  ogUpdated: after?.og_image_url === ogUrl,
  beforeOgKind: beforeOg
    ? String(beforeOg).startsWith("https://")
      ? "https"
      : "other"
    : "null",
  rpc: {
    ok: !rpcErr,
    matches: rpcData === ogUrl,
    isHttps: typeof rpcData === "string" && rpcData.startsWith("https://"),
  },
};
writeFileSync(
  ".tmp-ogp-p0/staging-comet-og-derive.json",
  JSON.stringify(report, null, 2),
);
console.log(JSON.stringify(report, null, 2));
if (
  !report.thumbUnchanged ||
  !report.ogUpdated ||
  report.getStatus !== 200 ||
  report.dimensions.width !== W ||
  report.dimensions.height !== H ||
  !report.rpc.matches
) {
  process.exit(2);
}
