/**
 * STAGING ONLY — backfill Comet Rush thumbnails to project-thumbnails Storage.
 * Does NOT touch Production.
 *
 * Usage:
 *   node scripts/staging-only/backfill-comet-rush-thumbnails-storage.mjs
 *
 * Steps:
 * 1. Guard staging ref
 * 2. Read Comet Rush thumbnail fields (format only logged)
 * 3. Load image bytes (data URL decode, or fetch relative/http)
 * 4. Upload to Storage as owner via service role (Staging only)
 * 5. GET public URL (200) then UPDATE projects thumbnail_* to https
 */
import { createClient } from "@supabase/supabase-js";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const STAGING_REF = "vuqpwvjvgyxffmvpfrxo";
const PROD_REF = "bpnisgzxuwdxelhnduuf";
const COMET_ID = "dddddddd-dddd-4ddd-8ddd-000000000206";
const BUCKET = "project-thumbnails";
const PREVIEW_ORIGIN =
  process.env.PREVIEW_ORIGIN ||
  "https://forge-git-preview-landing-01-soshirow-alts-projects.vercel.app";

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

function extractRef(url) {
  try {
    return new URL(url).hostname.match(/^([a-z0-9]+)\.supabase\.co$/i)?.[1] ?? null;
  } catch {
    return null;
  }
}

function classify(value) {
  if (value == null) return { kind: "null", len: 0 };
  if (typeof value !== "string") return { kind: "other", len: 0 };
  if (!value) return { kind: "empty", len: 0 };
  if (value.startsWith("https://")) return { kind: "https", len: value.length };
  if (value.startsWith("http://")) return { kind: "http", len: value.length };
  if (value.startsWith("data:image/")) return { kind: "data:image", len: value.length };
  if (value.startsWith("/")) return { kind: "relative_path", len: value.length };
  return { kind: "other", len: value.length };
}

function decodeDataUrl(dataUrl) {
  const m = dataUrl.match(/^data:([^;,]+)?(;base64)?,([\s\S]*)$/i);
  if (!m) return null;
  const mime = (m[1] || "image/jpeg").toLowerCase();
  const buf = Buffer.from(m[3], m[2]?.includes("base64") ? "base64" : "utf8");
  return { buf, mime };
}

function extForMime(mime) {
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  if (mime === "image/gif") return "gif";
  return "jpg";
}

async function loadBytes(value) {
  const c = classify(value);
  if (c.kind === "data:image") {
    const decoded = decodeDataUrl(value);
    if (!decoded) throw new Error("data URL decode failed");
    return decoded;
  }
  if (c.kind === "relative_path" || c.kind === "http" || c.kind === "https") {
    const absolute = value.startsWith("/")
      ? `${PREVIEW_ORIGIN}${value}`
      : value;
    // Prefer local public file for relative demo paths
    if (value.startsWith("/")) {
      const local = resolve(`public${value}`);
      if (existsSync(local)) {
        const buf = readFileSync(local);
        const mime = value.endsWith(".png")
          ? "image/png"
          : value.endsWith(".webp")
            ? "image/webp"
            : value.endsWith(".gif")
              ? "image/gif"
              : value.endsWith(".svg")
                ? "image/svg+xml"
                : "image/jpeg";
        if (mime === "image/svg+xml") {
          throw new Error("SVG thumbnails are not allowed in project-thumbnails bucket");
        }
        return { buf, mime };
      }
    }
    const res = await fetch(absolute, { cache: "no-store" });
    if (!res.ok) throw new Error(`fetch ${absolute} -> ${res.status}`);
    const mime = (res.headers.get("content-type") || "image/jpeg").split(";")[0].trim();
    if (mime === "image/svg+xml") {
      throw new Error("SVG response not allowed");
    }
    const buf = Buffer.from(await res.arrayBuffer());
    return { buf, mime: mime.startsWith("image/") ? mime : "image/jpeg" };
  }
  throw new Error(`unsupported kind ${c.kind}`);
}

const env = loadEnv();
const url = env.NEXT_PUBLIC_SUPABASE_URL || "";
const ref = extractRef(url);
if (ref !== STAGING_REF) {
  console.error(`Abort: staging ref required (${STAGING_REF}), got ${ref}`);
  process.exit(1);
}
if (ref === PROD_REF) {
  console.error("Abort: production");
  process.exit(1);
}
const service = env.SUPABASE_SERVICE_ROLE_KEY?.trim();
if (!service) {
  console.error("Abort: SUPABASE_SERVICE_ROLE_KEY required for Staging backfill upload");
  process.exit(1);
}

const admin = createClient(url, service, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const { data: row, error } = await admin
  .from("projects")
  .select("id, title, visibility, thumbnail_url, thumbnail_urls")
  .eq("id", COMET_ID)
  .maybeSingle();
if (error || !row) {
  console.error("Comet Rush not found", error);
  process.exit(1);
}

const sources = Array.isArray(row.thumbnail_urls) && row.thumbnail_urls.length
  ? row.thumbnail_urls
  : row.thumbnail_url
    ? [row.thumbnail_url]
    : [];

const before = {
  title: row.title,
  visibility: row.visibility,
  thumbnail_url: classify(row.thumbnail_url),
  thumbnail_urls: sources.map((s, i) => ({ i, ...classify(s) })),
};

if (sources.length === 0) {
  console.error("No thumbnail sources on Comet Rush");
  process.exit(1);
}

// If already all https, skip
if (sources.every((s) => classify(s).kind === "https")) {
  console.log(JSON.stringify({ skipped: true, reason: "already_https", before }, null, 2));
  process.exit(0);
}

const httpsUrls = [];
for (let i = 0; i < sources.length; i += 1) {
  const { buf, mime } = await loadBytes(sources[i]);
  const hash = createHash("sha256").update(buf).digest("hex").slice(0, 16);
  const ext = extForMime(mime);
  const path = `${COMET_ID}/${i}-${hash}.${ext}`;
  const { error: upErr } = await admin.storage.from(BUCKET).upload(path, buf, {
    contentType: mime,
    upsert: true,
    cacheControl: "3600",
  });
  if (upErr) {
    console.error("upload failed", upErr);
    process.exit(1);
  }
  const { data: pub } = admin.storage.from(BUCKET).getPublicUrl(path);
  const publicUrl = pub.publicUrl;
  const probe = await fetch(publicUrl, { method: "GET", cache: "no-store" });
  if (!probe.ok) {
    console.error(`public GET failed ${probe.status} ${publicUrl}`);
    process.exit(1);
  }
  const ctype = probe.headers.get("content-type") || "";
  if (!ctype.startsWith("image/")) {
    console.error(`unexpected content-type ${ctype}`);
    process.exit(1);
  }
  httpsUrls.push(publicUrl);
}

const { data: updated, error: updErr } = await admin
  .from("projects")
  .update({
    thumbnail_url: httpsUrls[0],
    thumbnail_urls: httpsUrls,
  })
  .eq("id", COMET_ID)
  .select("id, title, thumbnail_url, thumbnail_urls")
  .single();

if (updErr) {
  console.error("DB update failed — Storage objects left in place", updErr);
  process.exit(1);
}

const report = {
  stagingRef: ref,
  projectId: COMET_ID,
  before,
  after: {
    thumbnail_url: classify(updated.thumbnail_url),
    thumbnail_urls: (updated.thumbnail_urls || []).map((s, i) => ({
      i,
      ...classify(s),
    })),
    httpsUrlsCount: httpsUrls.length,
    // Show host+path shape only (no query secrets)
    urlShape: httpsUrls.map((u) => {
      const x = new URL(u);
      return `${x.origin}${x.pathname.replace(/\/[0-9a-f-]{36}\//, "/{projectId}/")}`;
    }),
  },
};
writeFileSync(
  ".tmp-ogp-p0/comet-rush-backfill.json",
  JSON.stringify(report, null, 2),
);
console.log(JSON.stringify(report, null, 2));
