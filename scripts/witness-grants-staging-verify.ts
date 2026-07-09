/**
 * Witness W3 — grant trigger verify (staging)
 *
 * Usage:
 *   npm run verify:witness:grants:staging
 *   npm run verify:witness:grants:staging -- --seed   # cleanup + reseed first
 *   npm run verify:witness:grants:staging -- --execute
 *   npm run verify:witness:grants:staging -- --seed --execute
 *   npm run verify:witness:grants:staging -- --cleanup --execute
 */
import { readFileSync } from "fs";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  check014Applied,
  decodeSandboxUsersMeta,
  findSandboxProject,
  resolveSandboxUsers,
} from "./witness-sandbox-lib";
import type { WitnessGrantPath } from "../lib/witness-eligibility";
import {
  createScriptServiceClient,
  exitIfDryRun,
  logSupabaseTarget,
  parseScriptExecuteArgs,
} from "./lib/script-cli";

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

const { execute } = parseScriptExecuteArgs(process.argv);
const shouldCleanup = process.argv.includes("--cleanup");

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function createReadClient(): SupabaseClient {
  if (!url || !anonKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }
  return createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

let supabase!: SupabaseClient;

type GrantRow = {
  user_id: string;
  grant_path: WitnessGrantPath;
};

async function runSeedScript() {
  const { execSync } = await import("child_process");
  execSync(`npx --yes tsx scripts/witness-sandbox-seed.ts --fresh --execute`, {
    stdio: "inherit",
    cwd: process.cwd(),
  });
}

async function getGrants(projectId: string): Promise<GrantRow[]> {
  const { data, error } = await supabase
    .from("project_witness_grants")
    .select("user_id, grant_path")
    .eq("project_id", projectId);

  if (error) {
    throw error;
  }

  return (data ?? []) as GrantRow[];
}

async function insertReleaseEvent(
  projectId: string,
  ownerId: string,
  eventType: "released" | "release_reopened",
  note: string,
) {
  const nextStatus = eventType === "released" ? "released" : "release_reopened";

  const { error: eventError } = await supabase.from("project_release_events").insert({
    project_id: projectId,
    event_type: eventType,
    actor_user_id: ownerId,
    note,
  });

  if (eventError) {
    throw eventError;
  }

  const { error: statusError } = await supabase
    .from("projects")
    .update({ release_status: nextStatus })
    .eq("id", projectId);

  if (statusError) {
    throw statusError;
  }
}

function countByPath(grants: GrantRow[]) {
  const counts: Record<WitnessGrantPath, number> = {
    multi_version: 0,
    voice: 0,
    watch: 0,
  };

  for (const grant of grants) {
    counts[grant.grant_path] += 1;
  }

  return counts;
}

async function main() {
  console.log("=== Witness grants staging verify (W3) ===");
  console.log("Supabase:", url ? new URL(url).hostname : "missing");

  supabase = createReadClient();

  const applied = await check014Applied(supabase);
  if (!applied) {
    console.log("\nApply: supabase/migrations/014_project_witness_grants.sql");
    process.exit(2);
  }

  exitIfDryRun("verify:witness:grants:staging", execute);
  logSupabaseTarget("verify:witness:grants:staging");
  supabase = createScriptServiceClient("verify:witness:grants:staging");

  // Always create a fresh sandbox for grant trigger test
  console.log("\n--- Seed fresh sandbox ---");
  await runSeedScript();

  let sandbox = await findSandboxProject(supabase);
  if (!sandbox) {
    console.error("Sandbox project missing after seed");
    process.exit(1);
  }

  const users =
    decodeSandboxUsersMeta(sandbox.description, sandbox.owner_id) ??
    (await resolveSandboxUsers(supabase, sandbox.owner_id));
  if (!users) {
    process.exit(1);
  }

  const projectId = sandbox.id;

  console.log(`\nSandbox: ${sandbox.title}`);
  console.log("project_id:", projectId);

  console.log("\n--- First Released (trigger grants) ---");
  await insertReleaseEvent(
    projectId,
    users.ownerId,
    "released",
    "witness-w3-first-released",
  );

  let grants = await getGrants(projectId);
  console.log("grant count:", grants.length);
  const pathCounts = countByPath(grants);
  console.log("path counts:", pathCounts);

  const grantByUser = new Map(grants.map((g) => [g.user_id, g.grant_path]));

  function assertGrant(userId: string, label: string, expected: WitnessGrantPath | null) {
    const actual = grantByUser.get(userId) ?? null;
    const ok = actual === expected;
    console.log(
      `  ${ok ? "PASS" : "FAIL"} ${label} (${userId.slice(0, 8)}…) expected=${expected ?? "none"} actual=${actual ?? "none"}`,
    );
    if (!ok) {
      process.exitCode = 1;
    }
  }

  console.log("\n--- Path grants ---");
  assertGrant(users.userA, "User A multi_version", "multi_version");
  assertGrant(users.userB, "User B voice", "voice");
  assertGrant(users.userC, "User C watch", "watch");
  assertGrant(users.userNegative, "Negative 1-play", null);
  assertGrant(users.ownerId, "Owner excluded", null);

  if (grants.length !== 3) {
    console.error(`FAIL — expected 3 grants, got ${grants.length}`);
    process.exit(1);
  }

  const grantsAfterFirst = grants.length;

  console.log("\n--- Release Reopened (no revocation) ---");
  await insertReleaseEvent(
    projectId,
    users.ownerId,
    "release_reopened",
    "witness-w3-reopened",
  );

  grants = await getGrants(projectId);
  if (grants.length !== grantsAfterFirst) {
    console.error(
      `FAIL — grants changed after Reopened: ${grantsAfterFirst} → ${grants.length}`,
    );
    process.exit(1);
  }
  console.log("PASS — grant count unchanged:", grants.length);

  console.log("\n--- Re-Released (no double grant) ---");
  await insertReleaseEvent(
    projectId,
    users.ownerId,
    "released",
    "witness-w3-rereleased",
  );

  grants = await getGrants(projectId);
  if (grants.length !== grantsAfterFirst) {
    console.error(
      `FAIL — grants changed after re-Released: ${grantsAfterFirst} → ${grants.length}`,
    );
    process.exit(1);
  }
  console.log("PASS — grant count unchanged:", grants.length);

  if (process.exitCode === 1) {
    console.error("\nFAIL — grant path assertions");
    process.exit(1);
  }

  console.log("\n=== Summary ===");
  console.log("014: applied");
  console.log("sandbox:", projectId);
  console.log("grants:", grantsAfterFirst);
  console.log("paths:", pathCounts);
  console.log("Reopened: no revocation PASS");
  console.log("re-Released: no double grant PASS");

  if (shouldCleanup) {
    console.log("\n--- Cleanup note ---");
    console.log(
      "project_witness_grants is append-only — grants are NOT deleted.",
    );
    console.log(
      "Sandbox project remains private; use --seed --fresh for a new run.",
    );
  } else {
    console.log("\nCleanup: grants append-only — sandbox retained after verify");
    console.log("Reseed: npm run verify:witness:grants:staging -- --seed");
  }

  console.log("\nPASS — W3 grant verify complete");
}

main().catch((error) => {
  console.error("FAIL:", error);
  process.exit(1);
});
