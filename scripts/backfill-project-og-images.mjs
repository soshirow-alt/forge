/**
 * Backfill Storage OGP cards for public projects (requires migration 047).
 *
 * Usage:
 *   node scripts/backfill-project-og-images.mjs --dry-run
 *   node scripts/backfill-project-og-images.mjs --project-id <uuid> [--project-id <uuid>]
 *   node scripts/backfill-project-og-images.mjs --limit 5
 *   node scripts/backfill-project-og-images.mjs --project-id 0aea6406-... --project-id ca75ee30-...
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

function parseArgs(argv) {
  const options = {
    dryRun: false,
    limit: null,
    projectIds: [],
  };

  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--dry-run") {
      options.dryRun = true;
      continue;
    }
    if (arg === "--limit") {
      const value = Number.parseInt(argv[++i] ?? "", 10);
      if (Number.isFinite(value) && value > 0) {
        options.limit = value;
      }
      continue;
    }
    if (arg === "--project-id") {
      const value = argv[++i]?.trim();
      if (value) {
        options.projectIds.push(value);
      }
    }
  }

  return options;
}

loadEnvLocal();

const args = parseArgs(process.argv);
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const OG_W = 1200;
const OG_H = 630;
const PROJECT_OG_BUCKET = "project-og";
const PROJECT_THUMBNAILS_BUCKET = "project-thumbnails";

function storagePublicUrl(bucket, objectPath) {
  const base = url.replace(/\/$/, "");
  const encoded = objectPath
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
  return `${base}/storage/v1/object/public/${bucket}/${encoded}`;
}

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
    if (data) return { bytes: data, source: "data-url", length: item.length };
    if (/^https?:\/\//i.test(item)) {
      const res = await fetch(item, { signal: AbortSignal.timeout(15_000) });
      if (res.ok) {
        const bytes = Buffer.from(await res.arrayBuffer());
        return { bytes, source: "http", length: bytes.length };
      }
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

async function normalizeThumbnails(project, dryRun) {
  const sources =
    project.thumbnail_urls?.length > 0
      ? project.thumbnail_urls
      : project.thumbnail_url
        ? [project.thumbnail_url]
        : [];

  const normalized = [];
  const actions = [];

  for (let index = 0; index < sources.length; index++) {
    const source = sources[index]?.trim() ?? "";
    if (!source) continue;

    if (parseDataUrl(source)) {
      const objectPath = `${project.id}/${index}.jpg`;
      const publicThumbUrl = storagePublicUrl(
        PROJECT_THUMBNAILS_BUCKET,
        objectPath,
      );
      actions.push({
        type: "upload-thumbnail",
        from: `data-url (${source.length} chars)`,
        to: publicThumbUrl,
        objectPath,
      });
      if (!dryRun) {
        const bytes = parseDataUrl(source);
        const jpeg = await sharp(bytes)
          .rotate()
          .jpeg({ quality: 86, mozjpeg: true })
          .toBuffer();
        const { error } = await supabase.storage
          .from(PROJECT_THUMBNAILS_BUCKET)
          .upload(objectPath, jpeg, {
            contentType: "image/jpeg",
            upsert: true,
            cacheControl: "public, max-age=31536000, immutable",
          });
        if (error) {
          return { ok: false, error: error.message, actions };
        }
      }
      normalized.push(
        dryRun
          ? storagePublicUrl(PROJECT_THUMBNAILS_BUCKET, objectPath)
          : storagePublicUrl(PROJECT_THUMBNAILS_BUCKET, objectPath),
      );
      continue;
    }

    if (/^https?:\/\//i.test(source)) {
      normalized.push(source);
      actions.push({ type: "keep-thumbnail", url: source });
    }
  }

  const thumbnail_url = normalized[0] ?? project.thumbnail_url;
  const thumbnail_urls = normalized.length ? normalized : project.thumbnail_urls ?? [];
  const wouldUpdateDb =
    thumbnail_url !== project.thumbnail_url ||
    JSON.stringify(thumbnail_urls) !== JSON.stringify(project.thumbnail_urls ?? []);

  if (wouldUpdateDb) {
    actions.push({
      type: "update-thumbnail-columns",
      thumbnail_url,
      thumbnail_urls,
    });
    if (!dryRun) {
      const { error } = await supabase
        .from("projects")
        .update({ thumbnail_url, thumbnail_urls })
        .eq("id", project.id);
      if (error) {
        return { ok: false, error: error.message, actions };
      }
    }
  }

  return { ok: true, actions, thumbnail_url, thumbnail_urls };
}

async function checkMigration047() {
  const { error } = await supabase
    .from("projects")
    .select("og_image_url")
    .limit(1);

  if (!error) {
    return { applied: true };
  }
  if (
    error.message?.includes("og_image_url") ||
    error.message?.includes("does not exist")
  ) {
    return { applied: false, message: error.message };
  }
  return { applied: false, message: error.message };
}

async function probeBucket(bucket) {
  const { error } = await supabase.storage.from(bucket).list("", { limit: 1 });
  return { bucket, ok: !error, error: error?.message ?? null };
}

const migration = await checkMigration047();
const bucketOg = await probeBucket(PROJECT_OG_BUCKET);
const bucketThumbs = await probeBucket(PROJECT_THUMBNAILS_BUCKET);

const selectWithOg =
  "id, title, thumbnail_url, thumbnail_urls, og_image_url, visibility";
const selectBase = "id, title, thumbnail_url, thumbnail_urls, visibility";

let query = supabase
  .from("projects")
  .select(migration.applied ? selectWithOg : selectBase)
  .eq("visibility", "public")
  .order("created_at", { ascending: false });

if (args.projectIds.length > 0) {
  query = query.in("id", args.projectIds);
}
if (args.limit) {
  query = query.limit(args.limit);
}

const { data: projects, error } = await query;

if (error) {
  console.error(JSON.stringify({ ok: false, error: error.message }, null, 2));
  process.exit(1);
}

const report = {
  mode: args.dryRun ? "dry-run" : "execute",
  migration047: migration,
  buckets: { projectOg: bucketOg, projectThumbnails: bucketThumbs },
  filters: {
    projectIds: args.projectIds,
    limit: args.limit,
  },
  projects: [],
};

for (const row of projects ?? []) {
  const project = {
    ...row,
    og_image_url: migration.applied ? (row.og_image_url ?? null) : null,
  };
  const entry = {
    id: project.id,
    title: project.title,
    visibility: project.visibility,
    current: {
      og_image_url: project.og_image_url ?? null,
      thumbnail_url_kind: project.thumbnail_url?.startsWith("data:")
        ? "data-url"
        : project.thumbnail_url?.startsWith("http")
          ? "http"
          : project.thumbnail_url
            ? "other"
            : "empty",
      thumbnail_url_length: project.thumbnail_url?.length ?? 0,
      thumbnail_urls_count: project.thumbnail_urls?.length ?? 0,
    },
    planned: [],
    status: "pending",
  };

  if (project.og_image_url?.startsWith("http")) {
    entry.status = "skip-existing-og";
    entry.planned.push({ action: "skip", reason: "og_image_url already set" });
    report.projects.push(entry);
    continue;
  }

  const thumb = await loadBytes(project.thumbnail_url, project.thumbnail_urls);
  if (!thumb) {
    entry.status = "no-thumb";
    entry.planned.push({ action: "skip", reason: "no usable thumbnail bytes" });
    report.projects.push(entry);
    continue;
  }

  entry.planned.push({
    action: "normalize-thumbnails",
    thumbSource: thumb.source,
    thumbBytes: thumb.bytes.length,
  });
  entry.planned.push({
    action: "upload-og-card",
    objectPath: `${project.id}/card.jpg`,
    expectedUrl: storagePublicUrl(PROJECT_OG_BUCKET, `${project.id}/card.jpg`),
    estimatedFromThumbBytes: thumb.bytes.length,
  });
  entry.planned.push({
    action: "update-og_image_url",
    column: "projects.og_image_url",
  });

  if (args.dryRun && !migration.applied) {
    entry.planned.push({
      action: "requires-migration-047",
      note: "execute blocked until og_image_url column and buckets exist",
    });
  }

  if (args.dryRun) {
    const thumbPlan = await normalizeThumbnails(project, true);
    entry.planned.push(...thumbPlan.actions);
    entry.status = "dry-run-ok";
    report.projects.push(entry);
    continue;
  }

  if (!migration.applied) {
    entry.status = "blocked-migration-047";
    report.projects.push(entry);
    continue;
  }

  const thumbResult = await normalizeThumbnails(project, false);
  if (!thumbResult.ok) {
    entry.status = "thumbnail-normalize-fail";
    entry.error = thumbResult.error;
    entry.planned.push(...(thumbResult.actions ?? []));
    report.projects.push(entry);
    continue;
  }

  const jpeg = await buildJpeg(project.title, thumb.bytes);
  const objectPath = `${project.id}/card.jpg`;
  const { error: upErr } = await supabase.storage
    .from(PROJECT_OG_BUCKET)
    .upload(objectPath, jpeg, {
      contentType: "image/jpeg",
      upsert: true,
      cacheControl: "public, max-age=31536000, immutable",
    });

  if (upErr) {
    entry.status = "upload-fail";
    entry.error = upErr.message;
    report.projects.push(entry);
    continue;
  }

  const ogUrl = storagePublicUrl(PROJECT_OG_BUCKET, objectPath);
  const { error: dbErr } = await supabase
    .from("projects")
    .update({ og_image_url: ogUrl })
    .eq("id", project.id);

  const meta = await sharp(jpeg).metadata();
  entry.result = {
    og_image_url: ogUrl,
    jpegBytes: jpeg.length,
    width: meta.width,
    height: meta.height,
    thumbnailActions: thumbResult.actions,
    dbError: dbErr?.message ?? null,
  };
  entry.status = dbErr ? "db-fail" : "ok";
  report.projects.push(entry);
}

console.log(JSON.stringify(report, null, 2));
process.exit(
  args.dryRun
    ? 0
    : report.projects.some((p) =>
        [
          "upload-fail",
          "db-fail",
          "blocked-migration-047",
          "thumbnail-normalize-fail",
        ].includes(p.status),
      )
      ? 2
      : 0,
);
