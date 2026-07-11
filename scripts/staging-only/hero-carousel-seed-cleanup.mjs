/**
 * STAGING ONLY — Hero carousel seed cleanup.
 *
 * Deletes rows created by hero-carousel-seed.mjs from Staging only.
 * Targets are derived from live Staging DB using:
 *   - marker forge-st-hero-carousel-v1
 *   - email domain @forge-st-hero-carousel.local
 *   - fixed UUID namespace dddddddd-dddd-4ddd-8ddd-*
 *
 * Guard: aborts unless NEXT_PUBLIC_SUPABASE_URL ref === vuqpwvjvgyxffmvpfrxo
 *        and ref !== bpnisgzxuwdxelhnduuf (production).
 *
 * NEVER deletes:
 *   - Smoke A (41ff5a96-105c-42a2-87b4-787bcfeacb45)
 *   - Smoke B (aa910df8-afdf-4cbb-a00e-42a9518afc52)
 *   - Owner  (4bdc4a2f-2a39-4599-a14c-91303310ef56)
 *   - rows unrelated to seed users/projects (no public-wide deletes)
 *
 * Usage:
 *   node scripts/staging-only/hero-carousel-seed-cleanup.mjs           # dry-run (counts from DB)
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
const DESC_PREFIX = "[hero-carousel-seed]";
const UUID_PREFIX = "dddddddd-dddd-4ddd-8ddd-";
const STORAGE_BUCKET = "project-thumbnails";
const STORAGE_PREFIX = "hero-carousel-seed";

const DEV_B_ID = "dddddddd-dddd-4ddd-8ddd-000000000001";
const DEV_C_ID = "dddddddd-dddd-4ddd-8ddd-000000000002";

function playerUUID(n) {
  return `dddddddd-dddd-4ddd-8ddd-0000000001${String(n).padStart(2, "0")}`;
}

function projectUUID(n) {
  return `dddddddd-dddd-4ddd-8ddd-0000000002${String(n).padStart(2, "0")}`;
}

const FIXED_PROJECT_IDS = [1, 2, 3, 4, 5, 6].map(projectUUID);
const FIXED_USER_IDS = [
  DEV_B_ID,
  DEV_C_ID,
  ...[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(playerUUID),
];

const PROTECTED_PROJECT_IDS = new Set([SMOKE_A, SMOKE_B]);
const PROTECTED_USER_IDS = new Set([OWNER_ID]);

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
  if (ref !== STAGING_REF) {
    throw new Error(`ABORT: expected staging ref ${STAGING_REF}, got ${ref}`);
  }
  return ref;
}

function makeClient(url, key) {
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function step(label, ok, count, err) {
  return {
    label,
    ok,
    count: count ?? null,
    error: err ? String(err?.message ?? err) : null,
  };
}

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

function isSeedAuthUser(user) {
  if (!user?.id || PROTECTED_USER_IDS.has(user.id)) return false;
  const email = user.email || "";
  const meta = user.user_metadata || {};
  if (email.endsWith(`@${EMAIL_DOMAIN}`)) return true;
  if (FIXED_USER_IDS.includes(user.id)) return true;
  if (user.id.startsWith(UUID_PREFIX) && meta.forge_seed_marker === MARKER) return true;
  if (meta.forge_seed_marker === MARKER && email.endsWith(`@${EMAIL_DOMAIN}`)) return true;
  return false;
}

function tagsIncludeMarker(tags) {
  if (!Array.isArray(tags)) return false;
  return tags.some((t) => String(t) === MARKER);
}

// ---------------------------------------------------------------------------
// Discover seed scope from live DB
// ---------------------------------------------------------------------------

async function discoverSeedScope(sb) {
  const allUsers = await listAllUsers(sb);
  const seedAuthUsers = allUsers.filter(isSeedAuthUser);
  const seedUserIds = [...new Set(seedAuthUsers.map((u) => u.id))];

  // Projects: fixed UUID namespace OR marker in tags / description
  const { data: byFixedIds, error: fixedErr } = await sb
    .from("projects")
    .select("id, title, tags, description, owner_id")
    .in("id", FIXED_PROJECT_IDS);
  if (fixedErr) throw fixedErr;

  const { data: byMarkerTag, error: tagErr } = await sb
    .from("projects")
    .select("id, title, tags, description, owner_id")
    .contains("tags", [MARKER]);
  if (tagErr) throw tagErr;

  const { data: byDesc, error: descErr } = await sb
    .from("projects")
    .select("id, title, tags, description, owner_id")
    .ilike("description", `${DESC_PREFIX}%`);
  if (descErr) throw descErr;

  const projectMap = new Map();
  for (const row of [...(byFixedIds || []), ...(byMarkerTag || []), ...(byDesc || [])]) {
    if (!row?.id) continue;
    if (PROTECTED_PROJECT_IDS.has(row.id)) continue;
    const marked =
      FIXED_PROJECT_IDS.includes(row.id) ||
      tagsIncludeMarker(row.tags) ||
      String(row.description || "").includes(DESC_PREFIX);
    if (!marked) continue;
    projectMap.set(row.id, row);
  }

  const seedProjectIds = [...projectMap.keys()];
  if (seedProjectIds.some((id) => PROTECTED_PROJECT_IDS.has(id))) {
    throw new Error("ABORT: protected Smoke project leaked into seed project set");
  }

  // Child rows related to seed projects (primary) or seed users
  async function selectByProject(table, columns = "id") {
    if (!seedProjectIds.length) return [];
    const { data, error } = await sb
      .from(table)
      .select(columns)
      .in("project_id", seedProjectIds);
    if (error) throw error;
    return data || [];
  }

  const bookmarks = await selectByProject("project_bookmarks", "user_id, project_id");
  const watches = await selectByProject("project_watches", "user_id, project_id");
  const feedback = await selectByProject("project_feedback", "id, user_id, project_id");
  const playSessions = await selectByProject(
    "project_play_sessions",
    "id, user_id, project_id",
  );
  const devlogs = await selectByProject("project_devlogs", "id, project_id, author_id");

  // developer_follows: follower is seed user OR developer is seed user
  let follows = [];
  if (seedUserIds.length) {
    const { data: byFollower, error: e1 } = await sb
      .from("developer_follows")
      .select("follower_id, developer_user_id")
      .in("follower_id", seedUserIds);
    if (e1) throw e1;
    const { data: byDeveloper, error: e2 } = await sb
      .from("developer_follows")
      .select("follower_id, developer_user_id")
      .in("developer_user_id", seedUserIds);
    if (e2) throw e2;
    const key = (r) => `${r.follower_id}|${r.developer_user_id}`;
    const map = new Map();
    for (const r of [...(byFollower || []), ...(byDeveloper || [])]) {
      map.set(key(r), r);
    }
    follows = [...map.values()];
  }

  const { data: profiles, error: profileErr } = seedUserIds.length
    ? await sb
        .from("developer_profiles")
        .select("user_id, creator_id, public_name")
        .in("user_id", seedUserIds)
    : { data: [], error: null };
  if (profileErr) throw profileErr;

  // Storage objects under prefix (optional; Staging may have no bucket)
  let storageObjectCount = 0;
  let storageNote = `${STORAGE_PREFIX}/*`;
  try {
    const { data: folders, error: listErr } = await sb.storage
      .from(STORAGE_BUCKET)
      .list(STORAGE_PREFIX, { limit: 200 });
    if (listErr) {
      storageNote = `bucket unavailable or empty: ${listErr.message}`;
    } else {
      for (const folder of folders || []) {
        const folderPath = `${STORAGE_PREFIX}/${folder.name}`;
        const { data: files } = await sb.storage
          .from(STORAGE_BUCKET)
          .list(folderPath, { limit: 100 });
        storageObjectCount += files?.length ?? 0;
      }
    }
  } catch (e) {
    storageNote = `storage probe skipped: ${String(e?.message ?? e)}`;
  }

  return {
    seedAuthUsers: seedAuthUsers.map((u) => ({
      id: u.id,
      email: u.email,
      marker: u.user_metadata?.forge_seed_marker ?? null,
    })),
    seedUserIds,
    seedProjects: [...projectMap.values()].map((p) => ({
      id: p.id,
      title: p.title,
      owner_id: p.owner_id,
    })),
    seedProjectIds,
    counts: {
      auth_users: seedAuthUsers.length,
      projects: seedProjectIds.length,
      project_feedback: feedback.length,
      project_watches: watches.length,
      project_bookmarks: bookmarks.length,
      project_play_sessions: playSessions.length,
      project_devlogs: devlogs.length,
      developer_follows: follows.length,
      developer_profiles: (profiles || []).length,
      storage_objects: storageObjectCount,
    },
    rows: {
      bookmarks,
      watches,
      feedback,
      playSessions,
      devlogs,
      follows,
      profiles: profiles || [],
    },
    storageNote,
    protected: {
      SMOKE_A,
      SMOKE_B,
      OWNER_ID,
      smokeInSeedProjects: false,
      ownerInSeedUsers: seedUserIds.includes(OWNER_ID),
    },
  };
}

// ---------------------------------------------------------------------------
// Storage cleanup (execute only)
// ---------------------------------------------------------------------------

async function removeStorageObjects(sb) {
  const results = [];
  try {
    const { data: objects, error: listError } = await sb.storage
      .from(STORAGE_BUCKET)
      .list(STORAGE_PREFIX, { limit: 200 });

    if (listError) {
      results.push({ label: "storage-list", ok: false, error: listError.message, count: 0 });
      return results;
    }

    if (!objects || objects.length === 0) {
      results.push({ label: "storage-list", ok: true, count: 0 });
      return results;
    }

    for (const folder of objects) {
      const folderPath = `${STORAGE_PREFIX}/${folder.name}`;
      const { data: files, error: filesErr } = await sb.storage
        .from(STORAGE_BUCKET)
        .list(folderPath, { limit: 100 });

      if (filesErr) {
        results.push({
          label: `storage-list-${folderPath}`,
          ok: false,
          error: filesErr.message,
          count: 0,
        });
        continue;
      }

      if (!files || files.length === 0) continue;

      const paths = files.map((f) => `${folderPath}/${f.name}`);
      const { error: removeErr } = await sb.storage.from(STORAGE_BUCKET).remove(paths);
      if (removeErr) {
        results.push({
          label: `storage-remove-${folderPath}`,
          ok: false,
          error: removeErr.message,
          count: 0,
        });
      } else {
        results.push({
          label: `storage-remove-${folderPath}`,
          ok: true,
          count: paths.length,
        });
      }
    }
  } catch (e) {
    results.push({
      label: "storage-cleanup",
      ok: false,
      error: String(e?.message ?? e),
      count: 0,
    });
  }
  return results;
}

// ---------------------------------------------------------------------------
// Execute deletes (seed scope only)
// ---------------------------------------------------------------------------

async function executeCleanup(sb, scope) {
  const steps = [];
  const projectIds = scope.seedProjectIds;
  const userIds = scope.seedUserIds;

  if (projectIds.some((id) => PROTECTED_PROJECT_IDS.has(id))) {
    throw new Error("ABORT: refuse to delete — Smoke project in scope");
  }
  if (userIds.some((id) => PROTECTED_USER_IDS.has(id))) {
    throw new Error("ABORT: refuse to delete — protected user in scope");
  }

  const { data: smokeABefore } = await sb
    .from("projects")
    .select("id")
    .eq("id", SMOKE_A)
    .maybeSingle();
  const { data: smokeBBefore } = await sb
    .from("projects")
    .select("id")
    .eq("id", SMOKE_B)
    .maybeSingle();
  if (!smokeABefore) throw new Error("ABORT: Smoke A not found before cleanup");
  if (!smokeBBefore) throw new Error("ABORT: Smoke B not found before cleanup");

  // 1–6: child rows by seed project_id
  for (const table of [
    "project_bookmarks",
    "project_watches",
    "project_feedback",
    "project_play_sessions",
    "project_devlogs",
  ]) {
    if (!projectIds.length) {
      steps.push(step(table, true, 0, null));
      continue;
    }
    const expected = scope.counts[table];
    const { error } = await sb.from(table).delete().in("project_id", projectIds);
    steps.push(step(table, !error, expected, error));
  }

  // 7: developer_follows by seed users (follower or developer)
  if (userIds.length) {
    const { error: e1 } = await sb
      .from("developer_follows")
      .delete()
      .in("follower_id", userIds);
    const { error: e2 } = await sb
      .from("developer_follows")
      .delete()
      .in("developer_user_id", userIds);
    steps.push(
      step("developer_follows", !e1 && !e2, scope.counts.developer_follows, e1 ?? e2),
    );
  } else {
    steps.push(step("developer_follows", true, 0, null));
  }

  // 8: projects (seed ids only; Smoke excluded by construction)
  {
    const { error } = await sb.from("projects").delete().in("id", projectIds);
    steps.push(step("projects", !error, projectIds.length, error));
  }

  // 9: developer_profiles for seed users
  if (userIds.length) {
    const { error } = await sb
      .from("developer_profiles")
      .delete()
      .in("user_id", userIds);
    steps.push(
      step("developer_profiles", !error, scope.counts.developer_profiles, error),
    );
  } else {
    steps.push(step("developer_profiles", true, 0, null));
  }

  // 10: auth users (seed email / fixed UUID / marker only)
  {
    let deleteOk = true;
    let deleteErr = null;
    for (const u of scope.seedAuthUsers) {
      if (PROTECTED_USER_IDS.has(u.id)) continue;
      const { error } = await sb.auth.admin.deleteUser(u.id);
      if (error) {
        console.warn(`  deleteUser ${u.email}: ${error.message}`);
        deleteOk = false;
        deleteErr = error.message;
      }
    }
    steps.push(step("auth_users", deleteOk, scope.seedAuthUsers.length, deleteErr));
  }

  // 11: storage prefix
  {
    const storageResults = await removeStorageObjects(sb);
    for (const r of storageResults) {
      steps.push(step(`storage:${r.label}`, r.ok, r.count, r.error));
    }
  }

  const { data: smokeAAfter } = await sb
    .from("projects")
    .select("id")
    .eq("id", SMOKE_A)
    .maybeSingle();
  const { data: smokeBAfter } = await sb
    .from("projects")
    .select("id")
    .eq("id", SMOKE_B)
    .maybeSingle();

  return {
    steps,
    smokeA: { id: SMOKE_A, present: !!smokeAAfter },
    smokeB: { id: SMOKE_B, present: !!smokeBAfter },
  };
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
  const serviceKey = (
    env.SUPABASE_SERVICE_ROLE_KEY ||
    env.STAGING_SUPABASE_SERVICE_ROLE_KEY ||
    ""
  ).trim();
  if (!serviceKey) throw new Error("ABORT: SUPABASE_SERVICE_ROLE_KEY missing");

  const sb = makeClient(url, serviceKey);
  const scope = await discoverSeedScope(sb);

  if (scope.protected.ownerInSeedUsers) {
    throw new Error("ABORT: owner id matched seed user filter — refuse to proceed");
  }

  const expectedBaseline = {
    auth_users: 12,
    projects: 6,
    project_feedback: 12,
    project_watches: 16,
    project_bookmarks: 6,
    project_play_sessions: 25,
    project_devlogs: 5,
    developer_follows: 2,
    developer_profiles: 2,
  };

  const mismatches = Object.entries(expectedBaseline)
    .filter(([k, v]) => scope.counts[k] !== v)
    .map(([k, v]) => ({ key: k, expected: v, actual: scope.counts[k] }));

  const plan = {
    mode: execute ? "EXECUTE" : "DRY_RUN",
    staging_ref: ref,
    production_detected: false,
    marker: MARKER,
    derivation: {
      auth_users:
        "email @forge-st-hero-carousel.local OR fixed UUID namespace OR user_metadata.forge_seed_marker",
      projects:
        "fixed project UUIDs OR tags contains marker OR description starts with [hero-carousel-seed]",
      child_rows: "rows whose project_id is a seed project (follows: seed user as follower or developer)",
      exclusions: "Smoke A/B, owner, non-marker / non-namespace rows",
    },
    willDelete: scope.counts,
    storage_note: scope.storageNote,
    seed_auth_user_emails: scope.seedAuthUsers.map((u) => u.email),
    seed_project_titles: scope.seedProjects.map((p) => p.title),
    protectedIds: { SMOKE_A, SMOKE_B, OWNER_ID },
    baseline_check: {
      expected: expectedBaseline,
      mismatches,
      ok: mismatches.length === 0,
    },
  };

  console.log(JSON.stringify(plan, null, 2));

  if (!execute) {
    if (mismatches.length > 0) {
      console.warn(
        "\nWARNING: dry-run counts differ from expected seed baseline (see baseline_check).",
      );
    } else {
      console.log("\nDry-run counts match expected seed baseline.");
    }
    console.log("Dry-run only. Re-run with --execute to delete from Staging.");
    return;
  }

  const result = await executeCleanup(sb, scope);
  console.log(JSON.stringify(result, null, 2));

  if (!result.smokeA.present || !result.smokeB.present) {
    console.error("CRITICAL: Smoke A or B missing after cleanup!");
    process.exit(1);
  }

  const failed = result.steps.filter((s) => !s.ok);
  if (failed.length > 0) {
    console.error(`Cleanup completed with ${failed.length} step(s) with errors:`);
    for (const f of failed) console.error(`  ${f.label}: ${f.error}`);
    process.exit(1);
  }

  console.log("\nCleanup complete. Smoke A and B intact.");
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
