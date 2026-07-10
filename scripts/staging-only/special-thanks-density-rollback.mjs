/**
 * STAGING ONLY — complete rollback for special-thanks-density-seed.mjs
 *
 * Default: dry-run. Writes require --execute.
 * Aborts unless Supabase ref is vuqpwvjvgyxffmvpfrxo.
 * Aborts on production ref bpnisgzxuwdxelhnduuf.
 *
 * Deletes ONLY density-namespace rows / density emails.
 * Does NOT delete Player A, Owner, or mutate Smoke A project fields.
 */

import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync } from "node:fs";

const STAGING_REF = "vuqpwvjvgyxffmvpfrxo";
const PROD_REF = "bpnisgzxuwdxelhnduuf";
const PROJECT_ID = "41ff5a96-105c-42a2-87b4-787bcfeacb45";
const EMAIL_DOMAIN = "forge-st-special-thanks.local";
const EMAIL_PREFIX = "st-st-density-";
const MARKER = "st-special-thanks-density-v1";

const DENSITY_PROMPT_IDS = [
  "bbbbbbbb-bbbb-4ccc-8ddd-000000000001",
  "bbbbbbbb-bbbb-4ccc-8ddd-000000000002",
  "bbbbbbbb-bbbb-4ccc-8ddd-000000000003",
];
const DENSITY_DEVLOG_IDS = [
  "bbbbbbbb-bbbb-4ccc-8ddd-000000000011",
  "bbbbbbbb-bbbb-4ccc-8ddd-000000000012",
];
const DENSITY_MATCHER_ID = "bbbbbbbb-bbbb-4ccc-8ddd-000000000021";

const PLAYER_KEYS = [
  "01",
  "02",
  "03",
  "04",
  "05",
  "06",
  "07",
  "08",
  "09",
  "10",
  "11",
  "12",
];

function earlyVoiceId(key) {
  return `bbbbbbbb-bbbb-4ccc-8eee-${String(key).padStart(12, "0")}`;
}
function adoptionVoiceId(key, index1) {
  return `bbbbbbbb-bbbb-4ccc-8eef-${String(key).padStart(2, "0")}${String(index1).padStart(10, "0")}`;
}
function adoptionId(key, index1) {
  return `bbbbbbbb-bbbb-4ccc-8efa-${String(key).padStart(2, "0")}${String(index1).padStart(10, "0")}`;
}

function allFixedVoiceIds() {
  const ids = [];
  for (const key of PLAYER_KEYS) {
    ids.push(earlyVoiceId(key));
    for (let i = 1; i <= 5; i += 1) {
      ids.push(adoptionVoiceId(key, i));
      ids.push(adoptionId(key, i));
    }
  }
  return { voiceIds: ids.filter((id) => id.includes("-8eee-") || id.includes("-8eef-")), adoptionIds: ids.filter((id) => id.includes("-8efa-")) };
}

function loadEnv(path = ".env.local") {
  const merged = { ...process.env };
  if (!existsSync(path)) return merged;
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const i = trimmed.indexOf("=");
    const key = trimmed.slice(0, i).trim();
    let value = trimmed.slice(i + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    merged[key] = value;
  }
  return merged;
}

function extractRef(url) {
  try {
    const host = new URL(url).hostname;
    const m = host.match(/^([a-z0-9]+)\.supabase\.co$/i);
    return m ? m[1] : null;
  } catch {
    return null;
  }
}

function assertStagingOnly(url) {
  const ref = extractRef(url);
  if (!ref) throw new Error("ABORT: could not parse Supabase ref");
  if (ref === PROD_REF) throw new Error("ABORT: production Supabase ref — refuse to write");
  if (ref !== STAGING_REF) {
    throw new Error(`ABORT: expected staging ref ${STAGING_REF}, got ${ref}`);
  }
  return ref;
}

async function listDensityUsers(supabase) {
  const out = [];
  for (let page = 1; page <= 5; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const batch = data.users ?? [];
    for (const user of batch) {
      if (user.email?.startsWith(EMAIL_PREFIX) && user.email.endsWith(`@${EMAIL_DOMAIN}`)) {
        out.push(user);
      }
    }
    if (batch.length < 200) break;
  }
  return out;
}

async function verifyClean(supabase, densityIds) {
  const { voiceIds, adoptionIds } = allFixedVoiceIds();

  const [{ count: adoptionByMatcher }, { count: adoptionByIds }, { count: voicesByIds }, { count: prompts }, { count: devlogs }, { count: matcher }] =
    await Promise.all([
      supabase
        .from("voice_adoptions")
        .select("id", { count: "exact", head: true })
        .eq("matcher_run_id", DENSITY_MATCHER_ID),
      supabase
        .from("voice_adoptions")
        .select("id", { count: "exact", head: true })
        .in("id", adoptionIds),
      supabase
        .from("project_voice_responses")
        .select("id", { count: "exact", head: true })
        .in("id", voiceIds),
      supabase
        .from("project_version_prompts")
        .select("id", { count: "exact", head: true })
        .in("id", DENSITY_PROMPT_IDS),
      supabase
        .from("project_devlogs")
        .select("id", { count: "exact", head: true })
        .in("id", DENSITY_DEVLOG_IDS),
      supabase
        .from("voice_adoption_matcher_runs")
        .select("id", { count: "exact", head: true })
        .eq("id", DENSITY_MATCHER_ID),
    ]);

  let watches = 0;
  let xProfiles = 0;
  let voicesByUser = 0;
  let adoptionsByUser = 0;
  if (densityIds.length > 0) {
    const [w, x, v, a] = await Promise.all([
      supabase
        .from("project_watches")
        .select("user_id", { count: "exact", head: true })
        .eq("project_id", PROJECT_ID)
        .in("user_id", densityIds),
      supabase.from("user_x_profiles").select("user_id", { count: "exact", head: true }).in("user_id", densityIds),
      supabase
        .from("project_voice_responses")
        .select("id", { count: "exact", head: true })
        .eq("project_id", PROJECT_ID)
        .in("user_id", densityIds),
      supabase
        .from("voice_adoptions")
        .select("id", { count: "exact", head: true })
        .eq("project_id", PROJECT_ID)
        .in("user_id", densityIds),
    ]);
    watches = w.count ?? 0;
    xProfiles = x.count ?? 0;
    voicesByUser = v.count ?? 0;
    adoptionsByUser = a.count ?? 0;
  }

  const remainingUsers = await listDensityUsers(supabase);

  return {
    densityAuthUsers: remainingUsers.length,
    voice_adoptions_by_matcher: adoptionByMatcher ?? 0,
    voice_adoptions_by_fixed_ids: adoptionByIds ?? 0,
    voice_adoptions_by_density_users: adoptionsByUser,
    project_voice_responses_by_fixed_ids: voicesByIds ?? 0,
    project_voice_responses_by_density_users: voicesByUser,
    project_watches_by_density_users: watches,
    user_x_profiles_by_density_users: xProfiles,
    project_version_prompts: prompts ?? 0,
    project_devlogs: devlogs ?? 0,
    matcher_runs: matcher ?? 0,
    clean:
      remainingUsers.length === 0 &&
      (adoptionByMatcher ?? 0) === 0 &&
      (adoptionByIds ?? 0) === 0 &&
      adoptionsByUser === 0 &&
      (voicesByIds ?? 0) === 0 &&
      voicesByUser === 0 &&
      watches === 0 &&
      xProfiles === 0 &&
      (prompts ?? 0) === 0 &&
      (devlogs ?? 0) === 0 &&
      (matcher ?? 0) === 0,
  };
}

async function main() {
  const execute = process.argv.includes("--execute");
  const env = loadEnv(".env.local");
  const url = env.NEXT_PUBLIC_SUPABASE_URL?.trim() || "";
  const serviceKey = (env.SUPABASE_SERVICE_ROLE_KEY || env.STAGING_SUPABASE_SERVICE_ROLE_KEY || "").trim();
  const ref = assertStagingOnly(url);
  if (!serviceKey) throw new Error("ABORT: SUPABASE_SERVICE_ROLE_KEY missing");

  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const densityUsers = await listDensityUsers(supabase);
  const densityIds = densityUsers.map((u) => u.id);
  const { voiceIds, adoptionIds } = allFixedVoiceIds();

  const plan = {
    mode: execute ? "EXECUTE" : "DRY_RUN",
    ref,
    projectId: PROJECT_ID,
    marker: MARKER,
    densityUsersToDelete: densityUsers.map((u) => ({ id: u.id, email: u.email })),
    fixedIds: {
      prompts: DENSITY_PROMPT_IDS,
      devlogs: DENSITY_DEVLOG_IDS,
      matcher: DENSITY_MATCHER_ID,
      voiceIdCount: voiceIds.length,
      adoptionIdCount: adoptionIds.length,
    },
    note: "Does not touch Player A / Owner auth. Does not mutate Smoke A project fields.",
  };
  console.log(JSON.stringify(plan, null, 2));
  if (!execute) {
    console.log("Dry-run only. Re-run with --execute to write Staging.");
    return;
  }

  // 1) Adoptions first (FK to voices / matcher)
  await supabase.from("voice_adoptions").delete().eq("matcher_run_id", DENSITY_MATCHER_ID);
  await supabase.from("voice_adoptions").delete().in("id", adoptionIds);
  if (densityIds.length > 0) {
    await supabase.from("voice_adoptions").delete().eq("project_id", PROJECT_ID).in("user_id", densityIds);
  }

  // 2) Voice responses by fixed ids + density users
  await supabase.from("project_voice_responses").delete().in("id", voiceIds);
  if (densityIds.length > 0) {
    await supabase
      .from("project_voice_responses")
      .delete()
      .eq("project_id", PROJECT_ID)
      .in("user_id", densityIds);
  }

  // 3) Watches + x profiles
  if (densityIds.length > 0) {
    await supabase.from("project_watches").delete().eq("project_id", PROJECT_ID).in("user_id", densityIds);
    await supabase.from("user_x_profiles").delete().in("user_id", densityIds);
  }
  // Also clear density x_user_id namespace if any orphan
  for (const key of PLAYER_KEYS) {
    await supabase.from("user_x_profiles").delete().eq("x_user_id", `st-density-${key}`);
  }

  // 4) Matcher / devlogs / prompts
  await supabase.from("voice_adoption_matcher_runs").delete().eq("id", DENSITY_MATCHER_ID);
  await supabase.from("project_devlogs").delete().in("id", DENSITY_DEVLOG_IDS);
  await supabase.from("project_version_prompts").delete().in("id", DENSITY_PROMPT_IDS);

  // 5) Auth users
  for (const user of densityUsers) {
    const { error } = await supabase.auth.admin.deleteUser(user.id);
    if (error) throw error;
  }

  const verification = await verifyClean(supabase, densityIds);
  console.log(JSON.stringify({ deletedUsers: densityUsers.length, marker: MARKER, verification }, null, 2));
  if (!verification.clean) {
    throw new Error("ABORT: rollback verification failed — density leftovers remain");
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
