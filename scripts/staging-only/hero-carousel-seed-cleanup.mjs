/**
 * STAGING ONLY — Hero carousel seed cleanup.
 *
 * Deletes all rows created by hero-carousel-seed.mjs from Staging only.
 * Guard: aborts unless NEXT_PUBLIC_SUPABASE_URL ref === vuqpwvjvgyxffmvpfrxo
 *        and ref !== bpnisgzxuwdxelhnduuf (production).
 *
 * NEVER deletes:
 *   - Smoke A (41ff5a96-105c-42a2-87b4-787bcfeacb45)
 *   - Smoke B (aa910df8-afdf-4cbb-a00e-42a9518afc52)
 *   - Owner  (4bdc4a2f-2a39-4599-a14c-91303310ef56)
 *
 * Usage:
 *   node scripts/staging-only/hero-carousel-seed-cleanup.mjs           # dry-run
 *   node scripts/staging-only/hero-carousel-seed-cleanup.mjs --execute  # delete staging
 */

import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync } from "node:fs";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STAGING_REF = "vuqpwvjvgyxffmvpfrxo";
const PROD_REF = "bpnisgzxuwdxelhnduuf";
const OWNER_ID = "4bdc4a2f-2a39-4599-a14c-91303310ef56";
const SMOKE_A = "41ff5a96-105c-42a2-87b4-787bcfeacb45";
const SMOKE_B = "aa910df8-afdf-4cbb-a00e-42a9518afc52";
const MARKER = "forge-st-hero-carousel-v1";
const EMAIL_DOMAIN = "forge-st-hero-carousel.local";
const STORAGE_BUCKET = "project-thumbnails";
const STORAGE_PREFIX = "hero-carousel-seed";

// ---------------------------------------------------------------------------
// Fixed IDs (mirrors seed script)
// ---------------------------------------------------------------------------

const DEV_B_ID = "dddddddd-dddd-4ddd-8ddd-000000000001";
const DEV_C_ID = "dddddddd-dddd-4ddd-8ddd-000000000002";

function playerUUID(n) {
  return `dddddddd-dddd-4ddd-8ddd-0000000001${String(n).padStart(2, "0")}`;
}

function projectUUID(n) {
  return `dddddddd-dddd-4ddd-8ddd-0000000002${String(n).padStart(2, "0")}`;
}

function playSessionUUID(userN, projectN, sessionIndex = 1) {
  return `dddddddd-dddd-4ddd-8ddd-0003${String(userN).padStart(2, "0")}${String(projectN).padStart(2, "0")}${String(sessionIndex).padStart(4, "0")}`;
}

function feedbackUUID(userN, projectN) {
  return `dddddddd-dddd-4ddd-8ddd-0004${String(userN).padStart(2, "0")}${String(projectN).padStart(2, "0")}000000`;
}

function devlogUUID(projectN, devlogIndex = 1) {
  return `dddddddd-dddd-4ddd-8ddd-0005${String(projectN).padStart(2, "0")}${String(devlogIndex).padStart(6, "0")}`;
}

const PROJECT_IDS = [1, 2, 3, 4, 5, 6].map(projectUUID);

const PLAYER_UUIDS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(playerUUID);
const DEV_UUIDS = [DEV_B_ID, DEV_C_ID];
const ALL_SEED_USER_IDS = [...DEV_UUIDS, ...PLAYER_UUIDS];

const FEEDBACK_IDS = [
  feedbackUUID(1, 1), feedbackUUID(1, 4),
  feedbackUUID(2, 3),
  feedbackUUID(4, 1),
  feedbackUUID(5, 6),
  feedbackUUID(9, 4),
];

const PLAY_SESSION_IDS = [
  playSessionUUID(1, 1), playSessionUUID(1, 2), playSessionUUID(1, 4),
  playSessionUUID(2, 1), playSessionUUID(2, 3), playSessionUUID(2, 5),
  playSessionUUID(3, 2), playSessionUUID(3, 4),
  playSessionUUID(4, 1),
  playSessionUUID(5, 5), playSessionUUID(5, 6),
  playSessionUUID(7, 3),
  playSessionUUID(9, 4, 1), playSessionUUID(9, 4, 2),
];

const DEVLOG_IDS = [
  devlogUUID(1, 1), devlogUUID(1, 2),
  devlogUUID(2, 1),
  devlogUUID(4, 1),
  devlogUUID(5, 1),
];

// Watch pairs [userId-index, projectNum]
const WATCH_PAIRS = [
  [1, 1], [1, 2],
  [3, 4],
  [5, 5], [5, 6],
  [6, 2],
  [9, 4],
];

// Bookmark pairs
const BOOKMARK_PAIRS = [
  [2, 5],
  [8, 1], [8, 6],
];

const SEED_EMAILS = [
  `hc-dev-b@${EMAIL_DOMAIN}`,
  `hc-dev-c@${EMAIL_DOMAIN}`,
  ...Array.from({ length: 10 }, (_, i) => `hc-u${String(i + 1).padStart(2, "0")}@${EMAIL_DOMAIN}`),
];

// ---------------------------------------------------------------------------
// Env / client helpers
// ---------------------------------------------------------------------------

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
    const m = new URL(url).hostname.match(/^([a-z0-9]+)\.supabase\.co$/i);
    return m ? m[1] : null;
  } catch {
    return null;
  }
}

function assertStaging(env) {
  const url = env.NEXT_PUBLIC_SUPABASE_URL || "";
  const ref = extractRef(url);
  if (!ref) throw new Error(`ABORT: could not parse Supabase ref from URL: ${url}`);
  if (ref === PROD_REF) throw new Error("ABORT: production Supabase ref — refuse to delete");
  if (ref !== STAGING_REF) throw new Error(`ABORT: expected staging ref ${STAGING_REF}, got ${ref}`);
  return ref;
}

function makeClient(url, key) {
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

// ---------------------------------------------------------------------------
// Safe delete helpers
// ---------------------------------------------------------------------------

function step(label, ok, count, err) {
  return { label, ok, count: count ?? null, error: err ? String(err?.message ?? err) : null };
}

async function safeDelete(sb, table, filter, label) {
  try {
    const q = sb.from(table).delete();
    const { error, count } = await filter(q).select("id", { count: "exact", head: true }).then(
      // PostgREST delete returns count via Prefer: return=minimal or count header
      // Use a workaround: just delete and log
      async () => {
        const r = await filter(sb.from(table).delete());
        return r;
      }
    );
    if (error) return step(label, false, null, error);
    return step(label, true, null, null);
  } catch (e) {
    return step(label, false, null, e);
  }
}

// ---------------------------------------------------------------------------
// Storage cleanup
// ---------------------------------------------------------------------------

async function removeStorageObjects(sb) {
  const results = [];
  try {
    // List objects under STORAGE_PREFIX/
    const { data: objects, error: listError } = await sb.storage
      .from(STORAGE_BUCKET)
      .list(STORAGE_PREFIX, { limit: 200 });

    if (listError) {
      results.push({ label: "storage-list", ok: false, error: listError.message });
      return results;
    }

    if (!objects || objects.length === 0) {
      results.push({ label: "storage-list", ok: true, count: 0 });
      return results;
    }

    // For each project folder, list and delete
    for (const folder of objects) {
      const folderPath = `${STORAGE_PREFIX}/${folder.name}`;
      const { data: files, error: filesErr } = await sb.storage
        .from(STORAGE_BUCKET)
        .list(folderPath, { limit: 100 });

      if (filesErr) {
        results.push({ label: `storage-list-${folderPath}`, ok: false, error: filesErr.message });
        continue;
      }

      if (!files || files.length === 0) continue;

      const paths = files.map((f) => `${folderPath}/${f.name}`);
      const { error: removeErr } = await sb.storage.from(STORAGE_BUCKET).remove(paths);
      if (removeErr) {
        results.push({ label: `storage-remove-${folderPath}`, ok: false, error: removeErr.message });
      } else {
        results.push({ label: `storage-remove-${folderPath}`, ok: true, count: paths.length });
      }
    }
  } catch (e) {
    results.push({ label: "storage-cleanup", ok: false, error: String(e?.message ?? e) });
  }
  return results;
}

// ---------------------------------------------------------------------------
// Resolve actual user IDs from emails (may differ from fixed IDs if user
// already existed with a different UUID before seed ran)
// ---------------------------------------------------------------------------

async function listAllUsers(sb) {
  const users = [];
  for (let page = 1; page <= 10; page++) {
    const { data, error } = await sb.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const batch = data?.users ?? [];
    users.push(...batch);
    if (batch.length < 200) break;
  }
  return users;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const execute = process.argv.includes("--execute");
  const env = loadEnv(".env.local");

  const ref = assertStaging(env);
  console.log(`Staging ref: ${ref}`);

  const url = env.NEXT_PUBLIC_SUPABASE_URL.trim();
  const serviceKey = (env.SUPABASE_SERVICE_ROLE_KEY || env.STAGING_SUPABASE_SERVICE_ROLE_KEY || "").trim();
  if (!serviceKey) throw new Error("ABORT: SUPABASE_SERVICE_ROLE_KEY missing");

  const plan = {
    mode: execute ? "EXECUTE" : "DRY_RUN",
    staging_ref: ref,
    marker: MARKER,
    willDelete: {
      project_bookmarks: BOOKMARK_PAIRS.length,
      project_watches: WATCH_PAIRS.length,
      project_feedback: FEEDBACK_IDS.length,
      project_play_sessions: PLAY_SESSION_IDS.length,
      developer_follows: 2,
      project_devlogs: DEVLOG_IDS.length,
      projects: PROJECT_IDS.length,
      developer_profiles: 2,
      auth_users: SEED_EMAILS.length,
      storage_objects: "hero-carousel-seed/* (all under prefix)",
    },
    protectedIds: { SMOKE_A, SMOKE_B, OWNER_ID },
    noteOnUsers: "auth.admin.deleteUser targets only @forge-st-hero-carousel.local emails",
  };
  console.log(JSON.stringify(plan, null, 2));

  if (!execute) {
    console.log("\nDry-run only. Re-run with --execute to delete from Staging.");
    return;
  }

  const sb = makeClient(url, serviceKey);
  const steps = [];

  // Verify smoke projects before deletion
  const { data: smokeABefore } = await sb.from("projects").select("id").eq("id", SMOKE_A).maybeSingle();
  const { data: smokeBBefore } = await sb.from("projects").select("id").eq("id", SMOKE_B).maybeSingle();
  if (!smokeABefore) throw new Error("ABORT: Smoke A not found before cleanup — check DB state");
  if (!smokeBBefore) throw new Error("ABORT: Smoke B not found before cleanup — check DB state");

  // Resolve actual user IDs from emails (seed may have reused pre-existing UUIDs)
  const allUsers = await listAllUsers(sb);
  const resolvedIds = {};
  for (const email of SEED_EMAILS) {
    const u = allUsers.find((x) => x.email === email);
    if (u) resolvedIds[email] = u.id;
  }

  function devId(email) { return resolvedIds[email] ?? null; }
  function playerId(n) { return resolvedIds[`hc-u${String(n).padStart(2, "0")}@${EMAIL_DOMAIN}`] ?? PLAYER_UUIDS[n - 1]; }
  const resolvedDevBId = devId(`hc-dev-b@${EMAIL_DOMAIN}`) ?? DEV_B_ID;
  const resolvedDevCId = devId(`hc-dev-c@${EMAIL_DOMAIN}`) ?? DEV_C_ID;
  const resolvedDevIds = [resolvedDevBId, resolvedDevCId];

  // --- Delete in safe order ---

  // 1. Bookmarks — delete by project_id (seed projects only, covers all user UUID variants)
  {
    const { error } = await sb.from("project_bookmarks").delete().in("project_id", PROJECT_IDS);
    steps.push(step("project_bookmarks", !error, BOOKMARK_PAIRS.length, error));
  }

  // 2. Watches — delete by project_id
  {
    const { error } = await sb.from("project_watches").delete().in("project_id", PROJECT_IDS);
    steps.push(step("project_watches", !error, WATCH_PAIRS.length, error));
  }

  // 3. Feedback — delete by id (fixed) + safety net by project_id
  {
    const { error } = await sb.from("project_feedback").delete().in("id", FEEDBACK_IDS);
    await sb.from("project_feedback").delete().in("project_id", PROJECT_IDS);
    steps.push(step("project_feedback", !error, FEEDBACK_IDS.length, error));
  }

  // 4. Play sessions — by fixed id + safety net by project_id
  {
    const { error } = await sb.from("project_play_sessions").delete().in("id", PLAY_SESSION_IDS);
    await sb.from("project_play_sessions").delete().in("project_id", PROJECT_IDS);
    steps.push(step("project_play_sessions", !error, PLAY_SESSION_IDS.length, error));
  }

  // 5. Developer follows — delete by resolved follower IDs and developer IDs
  {
    const resolvedPlayerIds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(playerId).filter(Boolean);
    const { error: e1 } = await sb.from("developer_follows").delete()
      .in("follower_id", resolvedPlayerIds);
    const { error: e2 } = await sb.from("developer_follows").delete()
      .in("developer_user_id", resolvedDevIds);
    steps.push(step("developer_follows", !e1 && !e2, 2, e1 ?? e2));
  }

  // 6. Devlogs — by fixed id + safety net by project_id
  {
    const { error } = await sb.from("project_devlogs").delete().in("id", DEVLOG_IDS);
    await sb.from("project_devlogs").delete().in("project_id", PROJECT_IDS);
    steps.push(step("project_devlogs", !error, DEVLOG_IDS.length, error));
  }

  // 7. Projects — extra guard: never delete SMOKE_A/B
  {
    const safeIds = PROJECT_IDS.filter((id) => id !== SMOKE_A && id !== SMOKE_B);
    const { error } = await sb.from("projects").delete().in("id", safeIds);
    steps.push(step("projects", !error, safeIds.length, error));
  }

  // 8. Developer profiles — by resolved dev user IDs
  {
    const { error } = await sb.from("developer_profiles").delete().in("user_id", resolvedDevIds);
    steps.push(step("developer_profiles", !error, resolvedDevIds.length, error));
  }

  // 9. Auth users — only @forge-st-hero-carousel.local, never OWNER_ID
  {
    const seedUsers = allUsers.filter(
      (u) => u.email && u.email.endsWith(`@${EMAIL_DOMAIN}`) && u.id !== OWNER_ID,
    );
    let deleteOk = true;
    let deleteErr = null;
    for (const u of seedUsers) {
      const { error } = await sb.auth.admin.deleteUser(u.id);
      if (error) {
        console.warn(`  deleteUser ${u.email}: ${error.message}`);
        deleteOk = false;
        deleteErr = error.message;
      }
    }
    steps.push(step("auth_users", deleteOk, seedUsers.length, deleteErr));
  }

  // 10. Storage
  {
    const storageResults = await removeStorageObjects(sb);
    for (const r of storageResults) {
      steps.push(step(`storage:${r.label}`, r.ok, r.count, r.error));
    }
  }

  console.log(JSON.stringify({ steps }, null, 2));

  // 11. Final: confirm Smoke A/B still present
  const { data: smokeAAfter } = await sb.from("projects").select("id").eq("id", SMOKE_A).maybeSingle();
  const { data: smokeBAfter } = await sb.from("projects").select("id").eq("id", SMOKE_B).maybeSingle();
  const smokeAOk = !!smokeAAfter;
  const smokeBOk = !!smokeBAfter;
  console.log(JSON.stringify({
    smokeA: { id: SMOKE_A, present: smokeAOk },
    smokeB: { id: SMOKE_B, present: smokeBOk },
  }, null, 2));

  if (!smokeAOk || !smokeBOk) {
    console.error("CRITICAL: Smoke A or B was deleted — investigate immediately!");
    process.exit(1);
  }

  const failed = steps.filter((s) => !s.ok);
  if (failed.length > 0) {
    console.error(`Cleanup completed with ${failed.length} step(s) with errors:`);
    for (const f of failed) {
      console.error(`  ${f.label}: ${f.error}`);
    }
    process.exit(1);
  }

  console.log("\nCleanup complete. Smoke A and B intact.");
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
