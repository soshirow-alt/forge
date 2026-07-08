/**
 * Backfill Storage OGP cards for public projects (requires migration 047).
 * Usage: node scripts/backfill-project-og-images.mjs
 */
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";

function loadEnvLocal() {
  try {
    const raw = readFileSync(".env.local", "utf8");
    for (const line of raw.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq);
      const value = trimmed.slice(eq + 1);
      if (!process.env[key]) process.env[key] = value;
    }
  } catch {
    /* optional */
  }
}

loadEnvLocal();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error("Missing Supabase env");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const OG_W = 1200;
const OG_H = 630;

function parseDataUrl(candidate) {
  const trimmed = candidate?.trim() ?? "";
  if (!trimmed.toLowerCase().startsWith("data:image/")) return null;
  const comma = trimmed.indexOf(",");
  if (comma <= 5) return null;
  const payload = trimmed.slice(comma + 1);
  if (!payload.includes("base64")) return null;
  try {
    return Buffer.from(payload, "base64");
  } catch {
    return null;
  }
}

async function loadBytes(primary, urls) {
  const list = urls?.length ? urls : primary ? [primary] : [];
  for (const item of list) {
    const data = parseDataUrl(item);
    if (data) return data;
    if (/^https?:\/\//i.test(item)) {
      const res = await fetch(item);
      if (res.ok) return Buffer.from(await res.arrayBuffer());
    }
  }
  return null;
}

function overlaySvg(title) {
  const safe = title.replace(/&/g, "&amp;").replace(/</g, "&lt;").slice(0, 48);
  return Buffer.from(`<svg width="${OG_W}" height="${OG_H}" xmlns="http://www.w3.org/2000/svg">
  <defs><linearGradient id="f" x1="0" y1="0" x2="0" y2="1"><stop offset="55%" stop-color="rgba(9,9,11,0)"/><stop offset="100%" stop-color="rgba(9,9,11,0.82)"/></linearGradient></defs>
  <rect x="0" y="320" width="${OG_W}" height="310" fill="url(#f)"/>
  <text x="40" y="560" font-family="sans-serif" font-size="42" font-weight="700" fill="#fafafa">${safe}</text>
  <text x="40" y="598" font-family="sans-serif" font-size="20" fill="#a1a1aa">Forge</text>
</svg>`);
}

async function buildJpeg(title, sourceBytes) {
  const cover = await sharp(sourceBytes)
    .rotate()
    .resize(OG_W, OG_H, { fit: "cover", position: "centre" })
    .jpeg({ quality: 84, mozjpeg: true })
    .toBuffer();
  return sharp(cover)
    .composite([{ input: overlaySvg(title), top: 0, left: 0 }])
    .jpeg({ quality: 84 })
    .toBuffer();
}

function publicUrl(path) {
  const base = url.replace(/\/$/, "");
  return `${base}/storage/v1/object/public/project-og/${path}`;
}

const { data: projects, error } = await supabase
  .from("projects")
  .select("id, title, thumbnail_url, thumbnail_urls, og_image_url, visibility")
  .eq("visibility", "public")
  .order("created_at", { ascending: false });

if (error) {
  console.error(error);
  process.exit(1);
}

const report = [];
for (const project of projects ?? []) {
  if (project.og_image_url?.startsWith("http")) {
    report.push({ id: project.id, title: project.title, status: "skip-existing", url: project.og_image_url });
    continue;
  }
  const bytes = await loadBytes(project.thumbnail_url, project.thumbnail_urls);
  if (!bytes) {
    report.push({ id: project.id, title: project.title, status: "no-thumb" });
    continue;
  }
  const jpeg = await buildJpeg(project.title, bytes);
  const objectPath = `${project.id}/card.jpg`;
  const { error: upErr } = await supabase.storage
    .from("project-og")
    .upload(objectPath, jpeg, {
      contentType: "image/jpeg",
      upsert: true,
      cacheControl: "public, max-age=31536000, immutable",
    });
  if (upErr) {
    report.push({ id: project.id, title: project.title, status: "upload-fail", error: upErr.message });
    continue;
  }
  const ogUrl = publicUrl(objectPath);
  const { error: dbErr } = await supabase
    .from("projects")
    .update({ og_image_url: ogUrl })
    .eq("id", project.id);
  report.push({
    id: project.id,
    title: project.title,
    status: dbErr ? "db-fail" : "ok",
    url: ogUrl,
    bytes: jpeg.length,
    dbError: dbErr?.message,
  });
}

console.log(JSON.stringify(report, null, 2));
