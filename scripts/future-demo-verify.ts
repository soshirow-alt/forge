/**
 * Future demo world — staging verify
 *
 * Usage: npm run verify:future-demo:staging
 */
import { createClient } from "@supabase/supabase-js";
import {
  DEMO_NEW_USER_EMAIL,
  DEMO_VETERAN_EMAIL,
  FUTURE_DEMO_TITLE_PREFIX,
  VETERAN_DEVELOPER_THRESHOLDS,
  VETERAN_OWNED_PROJECT_COUNT,
  VERIFY_THRESHOLDS,
  assertVeteranGold,
  check014Applied,
  listFutureDemoProjects,
  loadEnvLocal,
  loadWorldState,
  printLoginCredentials,
} from "./future-demo-lib";
import { resolveWitnessTier } from "../lib/witness-tier";

loadEnvLocal();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

type CheckResult = { label: string; ok: boolean; detail: string };

async function resolveUserId(email: string): Promise<string | null> {
  const { data, error } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  if (error) {
    throw error;
  }
  return (data.users ?? []).find((user) => user.email === email)?.id ?? null;
}

async function main() {
  console.log("=== Future demo world verify (staging) ===");
  console.log("Supabase:", url);

  const checks: CheckResult[] = [];
  let failed = 0;

  function record(label: string, ok: boolean, detail: string) {
    checks.push({ label, ok, detail });
    console.log(`${ok ? "PASS" : "FAIL"} — ${label}: ${detail}`);
    if (!ok) {
      failed += 1;
    }
  }

  if (!(await check014Applied(supabase))) {
    process.exit(2);
  }

  const projects = await listFutureDemoProjects(supabase);
  const projectIds = projects.map((project) => project.id as string);

  record(
    "projects",
    projects.length >= VERIFY_THRESHOLDS.projects + VETERAN_OWNED_PROJECT_COUNT - 1,
    `${projects.length} (min ${VERIFY_THRESHOLDS.projects + VETERAN_OWNED_PROJECT_COUNT - 1} with veteran patch)`,
  );

  const { count: devlogCount, error: devlogError } = await supabase
    .from("project_devlogs")
    .select("id", { count: "exact", head: true })
    .in("project_id", projectIds.map(String));

  if (devlogError) {
    throw devlogError;
  }

  record(
    "devlogs",
    (devlogCount ?? 0) >= VERIFY_THRESHOLDS.devlogs,
    `${devlogCount ?? 0} (min ${VERIFY_THRESHOLDS.devlogs})`,
  );

  const { count: voiceCount, error: voiceError } = await supabase
    .from("project_voice_responses")
    .select("id", { count: "exact", head: true })
    .in("project_id", projectIds.map(String));

  if (voiceError) {
    throw voiceError;
  }

  record(
    "voices",
    (voiceCount ?? 0) >= VERIFY_THRESHOLDS.voices,
    `${voiceCount ?? 0} (min ${VERIFY_THRESHOLDS.voices})`,
  );

  const { count: releasedCount, error: releasedError } = await supabase
    .from("project_release_events")
    .select("id", { count: "exact", head: true })
    .in("project_id", projectIds)
    .eq("event_type", "released");

  if (releasedError) {
    throw releasedError;
  }

  record(
    "released",
    (releasedCount ?? 0) >= VERIFY_THRESHOLDS.released,
    `${releasedCount ?? 0} (min ${VERIFY_THRESHOLDS.released})`,
  );

  const { count: reopenedCount, error: reopenedError } = await supabase
    .from("project_release_events")
    .select("id", { count: "exact", head: true })
    .in("project_id", projectIds)
    .eq("event_type", "release_reopened");

  if (reopenedError) {
    throw reopenedError;
  }

  record(
    "reopened",
    (reopenedCount ?? 0) >= VERIFY_THRESHOLDS.reopened,
    `${reopenedCount ?? 0} (min ${VERIFY_THRESHOLDS.reopened})`,
  );

  const { count: worldGrantCount, error: worldGrantError } = await supabase
    .from("project_witness_grants")
    .select("id", { count: "exact", head: true })
    .in("project_id", projectIds);

  if (worldGrantError) {
    throw worldGrantError;
  }

  record(
    "world grants",
    (worldGrantCount ?? 0) >= VERIFY_THRESHOLDS.worldGrants,
    `${worldGrantCount ?? 0} (min ${VERIFY_THRESHOLDS.worldGrants})`,
  );

  const veteranId = await resolveUserId(DEMO_VETERAN_EMAIL);
  const newUserId = await resolveUserId(DEMO_NEW_USER_EMAIL);

  if (!veteranId || !newUserId) {
    console.error("Demo login users missing — run seed first.");
    process.exit(1);
  }

  const { count: veteranGrantCount, error: veteranGrantError } = await supabase
    .from("project_witness_grants")
    .select("id", { count: "exact", head: true })
    .eq("user_id", veteranId);

  if (veteranGrantError) {
    throw veteranGrantError;
  }

  record(
    "veteran grants",
    (veteranGrantCount ?? 0) >= VERIFY_THRESHOLDS.veteranGrants,
    `${veteranGrantCount ?? 0} (min ${VERIFY_THRESHOLDS.veteranGrants})`,
  );

  const tier = resolveWitnessTier(veteranGrantCount ?? 0);
  record(
    "veteran tier",
    assertVeteranGold(veteranGrantCount ?? 0),
    tier?.label ?? "none",
  );

  const { count: veteranSessionCount, error: veteranSessionError } = await supabase
    .from("project_play_sessions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", veteranId);

  if (veteranSessionError) {
    throw veteranSessionError;
  }

  record(
    "veteran sessions",
    (veteranSessionCount ?? 0) >= VERIFY_THRESHOLDS.veteranSessions,
    `${veteranSessionCount ?? 0} (min ${VERIFY_THRESHOLDS.veteranSessions})`,
  );

  const { count: veteranVoiceCount, error: veteranVoiceError } = await supabase
    .from("project_voice_responses")
    .select("id", { count: "exact", head: true })
    .eq("user_id", veteranId);

  if (veteranVoiceError) {
    throw veteranVoiceError;
  }

  record(
    "veteran voices",
    (veteranVoiceCount ?? 0) >= VERIFY_THRESHOLDS.veteranVoices,
    `${veteranVoiceCount ?? 0} (min ${VERIFY_THRESHOLDS.veteranVoices})`,
  );

  const { count: newUserGrantCount, error: newUserGrantError } = await supabase
    .from("project_witness_grants")
    .select("id", { count: "exact", head: true })
    .eq("user_id", newUserId);

  if (newUserGrantError) {
    throw newUserGrantError;
  }

  record("new user grants", (newUserGrantCount ?? 0) === 0, `${newUserGrantCount ?? 0}`);

  const { count: newUserSessionCount, error: newUserSessionError } = await supabase
    .from("project_play_sessions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", newUserId);

  if (newUserSessionError) {
    throw newUserSessionError;
  }

  record("new user sessions", (newUserSessionCount ?? 0) === 0, `${newUserSessionCount ?? 0}`);

  const veteranOwnedProjects = projects.filter(
    (project) => project.owner_id === veteranId,
  );
  const veteranOwnedIds = veteranOwnedProjects.map((project) => project.id as string);

  record(
    "veteran owned projects",
    veteranOwnedProjects.length >= VETERAN_DEVELOPER_THRESHOLDS.ownedProjects,
    `${veteranOwnedProjects.length} (min ${VETERAN_DEVELOPER_THRESHOLDS.ownedProjects}, target ${VETERAN_OWNED_PROJECT_COUNT})`,
  );

  if (veteranOwnedIds.length > 0) {
    const { count: veteranOwnedDevlogCount, error: veteranOwnedDevlogError } =
      await supabase
        .from("project_devlogs")
        .select("id", { count: "exact", head: true })
        .in("project_id", veteranOwnedIds);

    if (veteranOwnedDevlogError) {
      throw veteranOwnedDevlogError;
    }

    record(
      "veteran owned devlogs",
      (veteranOwnedDevlogCount ?? 0) >= VETERAN_DEVELOPER_THRESHOLDS.ownedDevlogs,
      `${veteranOwnedDevlogCount ?? 0} (min ${VETERAN_DEVELOPER_THRESHOLDS.ownedDevlogs})`,
    );

    const { count: veteranOwnedVoiceCount, error: veteranOwnedVoiceError } =
      await supabase
        .from("project_voice_responses")
        .select("id", { count: "exact", head: true })
        .in("project_id", veteranOwnedIds)
        .neq("user_id", veteranId);

    if (veteranOwnedVoiceError) {
      throw veteranOwnedVoiceError;
    }

    record(
      "veteran owned npc voices",
      (veteranOwnedVoiceCount ?? 0) >= VETERAN_DEVELOPER_THRESHOLDS.ownedVoices,
      `${veteranOwnedVoiceCount ?? 0} (min ${VETERAN_DEVELOPER_THRESHOLDS.ownedVoices})`,
    );

    const { count: veteranOwnedReleasedCount, error: veteranOwnedReleasedError } =
      await supabase
        .from("project_release_events")
        .select("id", { count: "exact", head: true })
        .in("project_id", veteranOwnedIds)
        .eq("event_type", "released");

    if (veteranOwnedReleasedError) {
      throw veteranOwnedReleasedError;
    }

    record(
      "veteran owned released",
      (veteranOwnedReleasedCount ?? 0) >= VETERAN_DEVELOPER_THRESHOLDS.ownedReleased,
      `${veteranOwnedReleasedCount ?? 0} (min ${VETERAN_DEVELOPER_THRESHOLDS.ownedReleased})`,
    );

    const { count: veteranOwnedReopenedCount, error: veteranOwnedReopenedError } =
      await supabase
        .from("project_release_events")
        .select("id", { count: "exact", head: true })
        .in("project_id", veteranOwnedIds)
        .eq("event_type", "release_reopened");

    if (veteranOwnedReopenedError) {
      throw veteranOwnedReopenedError;
    }

    record(
      "veteran owned reopened",
      (veteranOwnedReopenedCount ?? 0) >= VETERAN_DEVELOPER_THRESHOLDS.ownedReopened,
      `${veteranOwnedReopenedCount ?? 0} (min ${VETERAN_DEVELOPER_THRESHOLDS.ownedReopened})`,
    );
  } else {
    record(
      "veteran owned devlogs",
      false,
      "0 — run patch:veteran-developer:staging",
    );
    record("veteran owned npc voices", false, "0 — run patch");
    record("veteran owned released", false, "0 — run patch");
    record("veteran owned reopened", false, "0 — run patch");
  }

  const publicCount = projects.filter((project) => project.visibility === "public").length;
  record(
    "visibility",
    publicCount >= VERIFY_THRESHOLDS.projects,
    `${publicCount} public ${FUTURE_DEMO_TITLE_PREFIX} projects`,
  );

  const state = loadWorldState();
  if (state) {
    console.log(`\nWorld state file: scripts/.future-demo-world-state.json (${state.worldId})`);
  }

  console.log("\n--- Summary ---");
  console.log(`checks: ${checks.length - failed}/${checks.length} passed`);

  if (failed > 0) {
    console.log("\nFAIL — future demo world verify");
    process.exit(1);
  }

  console.log("\nPASS — future demo world verify");
  console.log("Purpose: 活気のある Forge 世界が成立（件数は下限保証）");
  printLoginCredentials();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
