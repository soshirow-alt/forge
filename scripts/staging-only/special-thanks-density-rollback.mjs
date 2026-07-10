/**
 * STAGING ONLY — rollback for special-thanks-density-seed.mjs
 *
 * Default: dry-run. Writes require --execute.
 * Aborts unless Supabase ref is vuqpwvjvgyxffmvpfrxo.
 */

import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync } from "node:fs";

const STAGING_REF = "vuqpwvjvgyxffmvpfrxo";
const PROD_REF = "bpnisgzxuwdxelhnduuf";
const PROJECT_ID = "41ff5a96-105c-42a2-87b4-787bcfeacb45";
const EMAIL_DOMAIN = "forge-st-special-thanks.local";
const EMAIL_PREFIX = "st-st-density-";
const MARKER = "st-special-thanks-density-v1";
const PLAYER_A_ID = "075348c9-6009-464c-920c-4fe6d63249c7";

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

  const plan = {
    mode: execute ? "EXECUTE" : "DRY_RUN",
    ref,
    projectId: PROJECT_ID,
    densityUsersToDelete: densityUsers.map((u) => ({ id: u.id, email: u.email })),
    note: "Player A is kept; only density-tagged rows for Player A are removed where possible via marker tables.",
  };
  console.log(JSON.stringify(plan, null, 2));
  if (!execute) {
    console.log("Dry-run only. Re-run with --execute to write Staging.");
    return;
  }

  // Delete adoptions tied to density matcher / density users
  await supabase.from("voice_adoptions").delete().eq("matcher_run_id", DENSITY_MATCHER_ID);
  if (densityIds.length > 0) {
    await supabase.from("voice_adoptions").delete().eq("project_id", PROJECT_ID).in("user_id", densityIds);
    await supabase.from("project_voice_responses").delete().eq("project_id", PROJECT_ID).in("user_id", densityIds);
    await supabase.from("project_watches").delete().eq("project_id", PROJECT_ID).in("user_id", densityIds);
    await supabase.from("user_x_profiles").delete().in("user_id", densityIds);
  }

  await supabase.from("voice_adoption_matcher_runs").delete().eq("id", DENSITY_MATCHER_ID);
  await supabase.from("project_devlogs").delete().in("id", DENSITY_DEVLOG_IDS);
  await supabase.from("project_version_prompts").delete().in("id", DENSITY_PROMPT_IDS);

  for (const user of densityUsers) {
    const { error } = await supabase.auth.admin.deleteUser(user.id);
    if (error) throw error;
  }

  // Do not delete Player A auth user. Clear density x profile only if it was ours.
  await supabase
    .from("user_x_profiles")
    .delete()
    .eq("user_id", PLAYER_A_ID)
    .eq("x_user_id", "st-density-01");

  console.log(JSON.stringify({ deletedUsers: densityIds.length, marker: MARKER }, null, 2));
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
