/**
 * Witness sandbox — seed only
 *
 * Usage:
 *   npm run seed:witness:sandbox
 *   npm run seed:witness:sandbox -- --execute
 *   npm run seed:witness:sandbox -- --cleanup --execute
 *   npm run seed:witness:sandbox -- --fresh --execute
 *
 * Creates dedicated sandbox project + A/B/C/negative engagement (no Released yet).
 */
import { readFileSync } from "fs";
import { type SupabaseClient } from "@supabase/supabase-js";
import {
  WITNESS_SANDBOX_MARKER,
  encodeSandboxUsersMeta,
  findSandboxProject,
  resolveSandboxUsers,
  sandboxTitleFresh,
} from "./witness-sandbox-lib";
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
const cleanup = process.argv.includes("--cleanup");
const fresh = process.argv.includes("--fresh");

let supabase!: SupabaseClient;

const baseTime = new Date("2026-06-10T10:00:00.000Z");

function ts(offsetMinutes: number) {
  return new Date(baseTime.getTime() + offsetMinutes * 60_000).toISOString();
}

async function cleanupSandboxPartial(projectId: string, projectIdText: string) {
  const { count: grantCount } = await supabase
    .from("project_witness_grants")
    .select("id", { count: "exact", head: true })
    .eq("project_id", projectId);

  if ((grantCount ?? 0) > 0) {
    console.log(
      "Skip delete — project_witness_grants is append-only (grants retained)",
    );
    return false;
  }

  console.log("Cleanup pre-release sandbox", projectId);
  await supabase.from("project_release_events").delete().eq("project_id", projectId);
  await supabase.from("project_play_sessions").delete().eq("project_id", projectIdText);
  await supabase.from("project_plays").delete().eq("project_id", projectIdText);
  await supabase.from("project_voice_responses").delete().eq("project_id", projectIdText);
  await supabase.from("project_watches").delete().eq("project_id", projectIdText);
  await supabase.from("project_version_prompts").delete().eq("project_id", projectIdText);
  await supabase.from("project_devlogs").delete().eq("project_id", projectIdText);
  await supabase.from("projects").delete().eq("id", projectId);
  console.log("Cleanup done");
  return true;
}

async function ensureVersionPrompt(projectIdText: string, versionKey: string) {
  const { data: existing } = await supabase
    .from("project_version_prompts")
    .select("id")
    .eq("project_id", projectIdText)
    .eq("version_key", versionKey)
    .eq("source", "platform_default")
    .maybeSingle();

  if (existing?.id) {
    return existing.id as string;
  }

  const { data, error } = await supabase
    .from("project_version_prompts")
    .insert({
      project_id: projectIdText,
      version_key: versionKey,
      prompt_text: "witness sandbox prompt",
      response_kind: "yes_no",
      options: [{ value: "yes", label: "はい" }, { value: "no", label: "いいえ" }],
      sort_order: 0,
      source: "platform_default",
    })
    .select("id")
    .single();

  if (error) {
    throw error;
  }

  return data.id as string;
}

async function upsertPlay(
  userId: string,
  projectIdText: string,
  playedAt: string,
) {
  await supabase.from("project_plays").upsert(
    { user_id: userId, project_id: projectIdText, created_at: playedAt },
    { onConflict: "user_id,project_id" },
  );
}

async function insertSession(input: {
  userId: string;
  projectIdText: string;
  versionKey: string;
  playedAt: string;
}) {
  const { error } = await supabase.from("project_play_sessions").insert({
    user_id: input.userId,
    project_id: input.projectIdText,
    version_key: input.versionKey,
    played_at: input.playedAt,
    context: "general",
  });

  if (error) {
    throw error;
  }
}

async function main() {
  exitIfDryRun("seed:witness:sandbox", execute);
  logSupabaseTarget("seed:witness:sandbox");
  supabase = createScriptServiceClient("seed:witness:sandbox");

  console.log("=== Witness sandbox seed ===");

  const existing = await findSandboxProject(supabase);
  if (existing && cleanup && !fresh) {
    await cleanupSandboxPartial(existing.id, existing.id);
  } else if (existing && !cleanup && !fresh) {
    console.log("Sandbox already exists:", existing.id, existing.title);
    console.log("Use --fresh for new sandbox, or --cleanup before first Released");
    process.exit(0);
  }

  const title = sandboxTitleFresh();

  const ownerId =
    process.env.WITNESS_SANDBOX_OWNER_ID ??
    (await (async () => {
      const { data } = await supabase
        .from("projects")
        .select("owner_id")
        .not("playable_version", "is", null)
        .limit(1)
        .single();
      return data?.owner_id as string | undefined;
    })());

  if (!ownerId) {
    console.error("No owner id — set WITNESS_SANDBOX_OWNER_ID");
    process.exit(1);
  }

  const users = await resolveSandboxUsers(supabase, ownerId);
  if (!users) {
    process.exit(1);
  }

  console.log("Owner:", users.ownerId.slice(0, 8) + "…");
  console.log("User A:", users.userA.slice(0, 8) + "…");
  console.log("User B:", users.userB.slice(0, 8) + "…");
  console.log("User C:", users.userC.slice(0, 8) + "…");
  console.log("Negative:", users.userNegative.slice(0, 8) + "…");

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .insert({
      owner_id: users.ownerId,
      owner_name: "witness-sandbox-owner",
      title,
      creator: "witness-sandbox",
      genre: "sandbox",
      genres: ["sandbox"],
      description: encodeSandboxUsersMeta(users),
      phase: "beta",
      status: "active",
      play_url: "https://example.com/witness-sandbox",
      visibility: "private",
      playable_version: "0.2",
      release_status: "in_development",
    })
    .select("id")
    .single();

  if (projectError || !project) {
    console.error("project insert:", projectError?.message);
    process.exit(1);
  }

  const projectId = project.id as string;
  const projectIdText = projectId;

  await supabase.from("project_devlogs").insert({
    project_id: projectIdText,
    author_id: users.ownerId,
    title: "witness sandbox devlog",
    content: WITNESS_SANDBOX_MARKER,
    created_at: ts(0),
  });

  const promptId = await ensureVersionPrompt(projectIdText, "0.1");

  // User A — 2 versions
  await upsertPlay(users.userA, projectIdText, ts(10));
  await insertSession({
    userId: users.userA,
    projectIdText,
    versionKey: "0.1",
    playedAt: ts(10),
  });
  await insertSession({
    userId: users.userA,
    projectIdText,
    versionKey: "0.2",
    playedAt: ts(20),
  });

  // User B — 1 play + voice
  await upsertPlay(users.userB, projectIdText, ts(15));
  await insertSession({
    userId: users.userB,
    projectIdText,
    versionKey: "0.1",
    playedAt: ts(15),
  });
  await supabase.from("project_voice_responses").insert({
    user_id: users.userB,
    project_id: projectIdText,
    version_key: "0.1",
    prompt_id: promptId,
    answer_value: "yes",
    answer_label: "はい",
    created_at: ts(16),
  });

  // User C — watch + 2 sessions
  await upsertPlay(users.userC, projectIdText, ts(12));
  await supabase.from("project_watches").insert({
    user_id: users.userC,
    project_id: projectIdText,
    created_at: ts(5),
  });
  await insertSession({
    userId: users.userC,
    projectIdText,
    versionKey: "0.1",
    playedAt: ts(12),
  });
  await insertSession({
    userId: users.userC,
    projectIdText,
    versionKey: "0.1",
    playedAt: ts(25),
  });

  // Negative — 1 session only
  await upsertPlay(users.userNegative, projectIdText, ts(18));
  await insertSession({
    userId: users.userNegative,
    projectIdText,
    versionKey: "0.1",
    playedAt: ts(18),
  });

  // Owner — engagement but must not grant
  await upsertPlay(users.ownerId, projectIdText, ts(8));
  await insertSession({
    userId: users.ownerId,
    projectIdText,
    versionKey: "0.1",
    playedAt: ts(8),
  });
  await insertSession({
    userId: users.ownerId,
    projectIdText,
    versionKey: "0.2",
    playedAt: ts(22),
  });

  console.log("\nPASS — sandbox seeded (not Released yet)");
  console.log("project_id:", projectId);
  console.log("Next: npm run verify:witness:grants:staging");
}

main().catch((error) => {
  console.error("FAIL:", error);
  process.exit(1);
});
