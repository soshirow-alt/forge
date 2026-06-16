/**
 * W4 UI data-layer check — witness grants fetch + display labels
 */
import { readFileSync } from "fs";
import { createClient } from "@supabase/supabase-js";
import { WITNESS_GRANT_PATH_PLAYER_LABELS } from "../lib/witness-grants-display";
import { check014Applied } from "./witness-sandbox-lib";

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
  console.error("Missing env");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  console.log("=== Witness W4 UI data-layer verify ===");

  const applied = await check014Applied(supabase);
  if (!applied) {
    process.exit(2);
  }

  const { data: grants, error } = await supabase
    .from("project_witness_grants")
    .select("user_id, project_id, grant_path, first_released_at, granted_at")
    .order("granted_at", { ascending: false })
    .limit(10);

  if (error) {
    console.error(error.message);
    process.exit(1);
  }

  console.log("Recent grants (up to 10):", grants?.length ?? 0);
  for (const row of grants ?? []) {
    const path = row.grant_path as keyof typeof WITNESS_GRANT_PATH_PLAYER_LABELS;
    console.log(
      `  user ${(row.user_id as string).slice(0, 8)}… project ${(row.project_id as string).slice(0, 8)}… path=${WITNESS_GRANT_PATH_PLAYER_LABELS[path]}`,
    );
  }

  console.log("\nDisplay labels:");
  for (const [key, label] of Object.entries(WITNESS_GRANT_PATH_PLAYER_LABELS)) {
    console.log(`  ${key}: ${label}`);
  }

  const { data: counts, error: countError } = await supabase
    .from("project_witness_grants")
    .select("user_id");

  if (countError) {
    console.error(countError.message);
    process.exit(1);
  }

  const byUser = new Map<string, number>();
  for (const row of counts ?? []) {
    const userId = row.user_id as string;
    byUser.set(userId, (byUser.get(userId) ?? 0) + 1);
  }

  const { resolveWitnessTier } = await import("../lib/witness-tier");
  const sample = [...byUser.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  if (sample.length > 0) {
    console.log("\nTier samples (staging grants):");
    for (const [userId, count] of sample) {
      const tier = resolveWitnessTier(count);
      console.log(
        `  user ${userId.slice(0, 8)}… grants=${count} → ${tier?.label ?? "—"}`,
      );
    }
  }

  console.log("\nPASS — W4 data-layer OK (mypage UI requires login)");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
