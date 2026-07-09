/**
 * Incident thumbnail restore — REALIA + Folk STG only.
 * Usage:
 *   node scripts/tmp-restore-incident-thumbs.mjs --dry-run
 *   node scripts/tmp-restore-incident-thumbs.mjs --execute
 *
 * --execute requires FORGE_ALLOW_PRODUCTION_SUPABASE_WRITE=1 when targeting production ref.
 */
import { execSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { assertSupabaseWriteAllowed } from "./lib/supabase-write-guard.mjs";

const STASH_UNTRACKED = "stash@{0}^3";
const REALIA_ID = "0aea6406-fc8b-4477-bd6e-231c8045878b";
const FOLK_ID = "ca75ee30-3812-407a-b76d-7e4e63dbad5b";
const TARGET_IDS = [REALIA_ID, FOLK_ID];

const EXPECT = {
  [REALIA_ID]: {
    title: "REALIA",
    charLen: 111671,
    byteLen: 83734,
    sha256: "e14a919a7f2c624a07d57d8cb1cc8648dbc816053d9863f384675cafc5013660",
  },
  [FOLK_ID]: {
    title: "インターネット民俗STG",
    charLen: 497203,
    byteLen: 372885,
    sha256: "fd9f661fb964249f982d347fe7d043965fc6795b614c53b700d6643eaa5e1964",
  },
};

const args = new Set(process.argv.slice(2));
const execute = args.has("--execute");
const dryRun = args.has("--dry-run") || !execute;

if (!dryRun && !execute) {
  console.error("Pass --dry-run or --execute");
  process.exit(2);
}

function sha256(buf) {
  return createHash("sha256").update(buf).digest("hex");
}

function dataUrlInfo(dataUrl) {
  const m = dataUrl.match(/^data:(image\/[^;]+);base64,(.+)$/s);
  if (!m) return null;
  const bytes = Buffer.from(m[2], "base64");
  return {
    mime: m[1],
    charLen: dataUrl.length,
    byteLen: bytes.length,
    sha256: sha256(bytes),
  };
}

function stashShow(path) {
  return execSync(`git show "${STASH_UNTRACKED}:${path}"`, {
    encoding: "buffer",
    maxBuffer: 50 * 1024 * 1024,
  });
}

function stashJson(path) {
  return JSON.parse(stashShow(path).toString("utf8"));
}

function jpegToDataUrl(buf) {
  return `data:image/jpeg;base64,${buf.toString("base64")}`;
}

function loadEnvLocal() {
  const raw = readFileSync(".env.local", "utf8");
  const env = {};
  for (const line of raw.split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq === -1) continue;
    env[t.slice(0, eq)] = t.slice(eq + 1).replace(/^["']|["']$/g, "");
  }
  return env;
}

function pickRealiaDataUrl(lookup) {
  for (const key of Object.keys(lookup)) {
    const rows = lookup[key];
    if (!Array.isArray(rows)) continue;
    const row = rows.find((r) => r.id === REALIA_ID);
    if (row?.thumbnail_url?.startsWith("data:image/")) {
      return row.thumbnail_url;
    }
  }
  return null;
}

function loadRecoveryPayloads() {
  const lookup = stashJson(".tmp-og-project-lookup.json");
  const realiaDataUrl = pickRealiaDataUrl(lookup);
  if (!realiaDataUrl) {
    throw new Error("REALIA data URL not found in stash lookup");
  }

  const folkBin = stashShow(".tmp-ogp/ca75ee30-3812-407a-b76d-7e4e63dbad5b-og.bin");
  const folkDataUrl = jpegToDataUrl(folkBin);

  return {
    [REALIA_ID]: realiaDataUrl,
    [FOLK_ID]: folkDataUrl,
  };
}

function validatePayload(id, dataUrl) {
  const info = dataUrlInfo(dataUrl);
  const exp = EXPECT[id];
  if (!info) {
    return { ok: false, reason: "invalid data URL format" };
  }
  const mismatches = [];
  if (info.charLen !== exp.charLen) mismatches.push(`charLen ${info.charLen} != ${exp.charLen}`);
  if (info.byteLen !== exp.byteLen) mismatches.push(`byteLen ${info.byteLen} != ${exp.byteLen}`);
  if (info.sha256 !== exp.sha256) mismatches.push(`sha256 mismatch`);
  return {
    ok: mismatches.length === 0,
    info,
    mismatches,
    title: exp.title,
  };
}

async function fetchRows(supabase, ids) {
  const { data, error } = await supabase
    .from("projects")
    .select("id, title, thumbnail_url, thumbnail_urls, updated_at")
    .in("id", ids);
  if (error) throw error;
  return data ?? [];
}

async function fetchOtherSnapshot(supabase) {
  const { data, error } = await supabase
    .from("projects")
    .select("id, title, thumbnail_url, thumbnail_urls, updated_at");
  if (error) throw error;
  const targetSet = new Set(TARGET_IDS);
  return (data ?? [])
    .filter((r) => !targetSet.has(r.id))
    .map((r) => ({
      id: r.id,
      title: r.title,
      thumbnail_url_len: r.thumbnail_url?.length ?? 0,
      thumbnail_urls_count: Array.isArray(r.thumbnail_urls) ? r.thumbnail_urls.length : 0,
      updated_at: r.updated_at,
    }));
}

function rowSummary(row) {
  return {
    id: row.id,
    title: row.title,
    thumbnail_url_len: row.thumbnail_url?.length ?? 0,
    thumbnail_urls_count: Array.isArray(row.thumbnail_urls) ? row.thumbnail_urls.length : 0,
    updated_at: row.updated_at,
  };
}

async function main() {
  const payloads = loadRecoveryPayloads();
  const validation = {};
  for (const id of TARGET_IDS) {
    validation[id] = validatePayload(id, payloads[id]);
    if (!validation[id].ok) {
      console.error(JSON.stringify({ phase: "validate", id, ...validation[id] }, null, 2));
      process.exit(1);
    }
  }

  const env = loadEnvLocal();
  const supabase = createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } },
  );

  const beforeTargets = await fetchRows(supabase, TARGET_IDS);
  const otherBefore = await fetchOtherSnapshot(supabase);

  const eligible = beforeTargets.filter(
    (r) => (r.thumbnail_url?.length ?? 0) === 0,
  );

  const report = {
    mode: dryRun ? "dry-run" : "execute",
    measuredAt: new Date().toISOString(),
    validation: Object.fromEntries(
      TARGET_IDS.map((id) => [
        id,
        {
          title: validation[id].title,
          charLen: validation[id].info.charLen,
          byteLen: validation[id].info.byteLen,
          sha256: validation[id].info.sha256,
        },
      ]),
    ),
    beforeTargets: beforeTargets.map(rowSummary),
    eligibleCount: eligible.length,
    eligibleIds: eligible.map((r) => r.id),
    updatesPlanned: eligible.map((row) => ({
      id: row.id,
      title: row.title,
      willSetCharLen: validation[row.id].info.charLen,
      willSetUrlsCount: 1,
    })),
  };

  if (dryRun) {
    report.otherProjectsSnapshotCount = otherBefore.length;
    console.log(JSON.stringify(report, null, 2));
    if (eligible.length !== TARGET_IDS.length) {
      console.error(
        JSON.stringify({
          error: "Not all targets eligible (thumbnail_url must be empty)",
          eligibleCount: eligible.length,
          expected: TARGET_IDS.length,
        }),
      );
      process.exit(1);
    }
    process.exit(0);
  }

  assertSupabaseWriteAllowed("tmp-restore-incident-thumbs");

  if (eligible.length !== TARGET_IDS.length) {
    console.error(JSON.stringify({ error: "execute blocked: eligibility mismatch", eligibleCount: eligible.length }));
    process.exit(1);
  }

  let updatedCount = 0;
  const updateResults = [];

  for (const row of eligible) {
    const dataUrl = payloads[row.id];
    const currentLen = row.thumbnail_url?.length ?? 0;
    if (currentLen !== 0) {
      updateResults.push({ id: row.id, skipped: true, reason: "thumbnail_url not empty" });
      continue;
    }

    const { data, error } = await supabase
      .from("projects")
      .update({
        thumbnail_url: dataUrl,
        thumbnail_urls: [dataUrl],
      })
      .eq("id", row.id)
      .or("thumbnail_url.is.null,thumbnail_url.eq.")
      .select("id, title, thumbnail_url, thumbnail_urls, updated_at");

    if (error) {
      updateResults.push({ id: row.id, error: error.message });
      continue;
    }
    if (!data?.length) {
      updateResults.push({ id: row.id, error: "no row updated (guard)" });
      continue;
    }
    updatedCount += 1;
    const info = dataUrlInfo(dataUrl);
    updateResults.push({
      id: row.id,
      title: data[0].title,
      updated: true,
      thumbnail_url_len: data[0].thumbnail_url?.length ?? 0,
      thumbnail_urls_count: data[0].thumbnail_urls?.length ?? 0,
      byteLen: info?.byteLen,
      sha256: info?.sha256,
      updated_at: data[0].updated_at,
    });
  }

  const afterTargets = await fetchRows(supabase, TARGET_IDS);
  const otherAfter = await fetchOtherSnapshot(supabase);

  const otherUnchanged = otherBefore.every((before) => {
    const after = otherAfter.find((a) => a.id === before.id);
    if (!after) return false;
    return (
      before.thumbnail_url_len === after.thumbnail_url_len &&
      before.thumbnail_urls_count === after.thumbnail_urls_count &&
      before.updated_at === after.updated_at
    );
  });

  const executeReport = {
    mode: "execute",
    measuredAt: new Date().toISOString(),
    updatedCount,
    updateResults,
    afterTargets: afterTargets.map((r) => {
      const info = dataUrlInfo(r.thumbnail_url ?? "");
      return {
        ...rowSummary(r),
        byteLen: info?.byteLen ?? 0,
        sha256: info?.sha256 ?? null,
      };
    }),
    otherProjectsUnchanged: otherUnchanged,
    otherProjectsChecked: otherBefore.length,
  };

  writeFileSync(".tmp-restore-incident-result.json", JSON.stringify(executeReport, null, 2));
  console.log(JSON.stringify(executeReport, null, 2));

  if (updatedCount !== TARGET_IDS.length || !otherUnchanged) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(JSON.stringify({ error: err.message }));
  process.exit(1);
});
