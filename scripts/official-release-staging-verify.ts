/**
 * 013 適用確認 + 正式verフロー API 検証（staging）
 *
 * Usage:
 *   npm run verify:official-release:staging          # 013 適用チェックのみ
 *   npm run verify:official-release:staging:flow     # DB フロー検証（Released→Reopened→再Released）
 *
 * Env (optional):
 *   OFFICIAL_RELEASE_TEST_PROJECT_ID — 検証対象 project uuid
 */
import { readFileSync } from "fs";
import { createClient } from "@supabase/supabase-js";
import {
  getFirstReleasedEvent,
  wasActiveBeforeFirstRelease,
  type ProjectReleaseEvent,
} from "../lib/project-release-state";

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

const runFlow = process.argv.includes("--flow");
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const testProjectId = process.env.OFFICIAL_RELEASE_TEST_PROJECT_ID;

if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function check013Applied(): Promise<boolean> {
  const { error: eventsError } = await supabase
    .from("project_release_events")
    .select("id")
    .limit(1);

  if (eventsError) {
    console.log("FAIL 013 — project_release_events:", eventsError.message);
    return false;
  }

  const { error: statusError } = await supabase
    .from("projects")
    .select("release_status")
    .limit(1);

  if (statusError) {
    console.log("FAIL 013 — release_status column:", statusError.message);
    return false;
  }

  console.log("PASS 013 — project_release_events + projects.release_status exist");
  return true;
}

async function findTestProject(): Promise<{
  id: string;
  ownerId: string;
  title: string;
  releaseStatus: string;
} | null> {
  if (testProjectId) {
    const { data, error } = await supabase
      .from("projects")
      .select("id, owner_id, title, release_status")
      .eq("id", testProjectId)
      .maybeSingle();

    if (error || !data) {
      console.log("Test project not found:", testProjectId, error?.message);
      return null;
    }

    return {
      id: data.id as string,
      ownerId: data.owner_id as string,
      title: data.title as string,
      releaseStatus: (data.release_status as string) ?? "in_development",
    };
  }

  const { data: projects, error } = await supabase
    .from("projects")
    .select("id, owner_id, title, release_status, playable_version")
    .not("playable_version", "is", null)
    .limit(20);

  if (error || !projects?.length) {
    console.log("No projects found:", error?.message);
    return null;
  }

  for (const project of projects) {
    const { count } = await supabase
      .from("project_devlogs")
      .select("id", { count: "exact", head: true })
      .eq("project_id", project.id);

    if ((count ?? 0) >= 1) {
      return {
        id: project.id as string,
        ownerId: project.owner_id as string,
        title: project.title as string,
        releaseStatus: (project.release_status as string) ?? "in_development",
      };
    }
  }

  console.log("No project with devlog found");
  return null;
}

async function insertEvent(
  projectId: string,
  ownerId: string,
  eventType: "released" | "release_reopened",
) {
  const nextStatus = eventType === "released" ? "released" : "release_reopened";

  const { data: event, error: eventError } = await supabase
    .from("project_release_events")
    .insert({
      project_id: projectId,
      event_type: eventType,
      actor_user_id: ownerId,
      note: `staging-verify-${eventType}-${Date.now()}`,
    })
    .select("*")
    .single();

  if (eventError) throw eventError;

  const { error: statusError } = await supabase
    .from("projects")
    .update({ release_status: nextStatus })
    .eq("id", projectId);

  if (statusError) throw statusError;

  return event;
}

function rowToEvent(row: {
  id: string;
  project_id: string;
  event_type: "released" | "release_reopened";
  actor_user_id: string;
  note: string | null;
  created_at: string;
}): ProjectReleaseEvent {
  return {
    id: row.id,
    projectId: row.project_id,
    eventType: row.event_type,
    actorUserId: row.actor_user_id,
    note: row.note,
    createdAt: row.created_at,
  };
}

async function verifyWitnessLogic(projectId: string) {
  const { data: eventsRaw } = await supabase
    .from("project_release_events")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: true });

  const events = ((eventsRaw ?? []) as Parameters<typeof rowToEvent>[0][]).map(
    rowToEvent,
  );
  const firstReleased = getFirstReleasedEvent(events);
  if (!firstReleased) {
    console.log("Witness check — no released event yet");
    return;
  }

  const { data: plays } = await supabase
    .from("project_plays")
    .select("user_id, created_at")
    .eq("project_id", projectId);

  const { data: sessions } = await supabase
    .from("project_play_sessions")
    .select("user_id, played_at")
    .eq("project_id", projectId);

  const firstPlayByUser = new Map<string, string>();

  for (const row of plays ?? []) {
    firstPlayByUser.set(row.user_id as string, row.created_at as string);
  }

  for (const row of sessions ?? []) {
    const userId = row.user_id as string;
    const playedAt = row.played_at as string;
    const existing = firstPlayByUser.get(userId);
    if (!existing || new Date(playedAt).getTime() < new Date(existing).getTime()) {
      firstPlayByUser.set(userId, playedAt);
    }
  }

  let witnessCount = 0;
  for (const [userId, firstPlayedAt] of firstPlayByUser) {
    if (
      wasActiveBeforeFirstRelease({
        firstPlayedAt,
        firstReleasedAt: firstReleased.createdAt,
      })
    ) {
      witnessCount += 1;
      console.log(
        `Witness candidate user ${userId.slice(0, 8)}… — played before first Released`,
      );
    }
  }

  console.log(
    `Witness check — ${witnessCount} user(s) played before first Released (${firstReleased.createdAt})`,
  );
}

async function main() {
  console.log("=== Official Release staging verify ===");
  console.log("Supabase:", url);
  console.log("Mode:", runFlow ? "013 + flow" : "013 check only");

  const applied = await check013Applied();
  if (!applied) {
    console.log("\nNext: Supabase Dashboard SQL Editor");
    console.log("File: supabase/migrations/013_project_release_events.sql");
    console.log("Then: npm run verify:official-release:staging:flow");
    process.exit(2);
  }

  if (!runFlow) {
    console.log("\n013 OK. Run with --flow for Released/Reopened DB test.");
    process.exit(0);
  }

  const project = await findTestProject();
  if (!project) {
    process.exit(1);
  }

  console.log(`\nTest project: ${project.title} (${project.id})`);

  console.log("\n--- Released ---");
  await insertEvent(project.id, project.ownerId, "released");
  let { data: statusRow } = await supabase
    .from("projects")
    .select("release_status")
    .eq("id", project.id)
    .single();
  console.log("release_status:", statusRow?.release_status);
  if (statusRow?.release_status !== "released") process.exit(1);

  console.log("\n--- Release Reopened ---");
  await insertEvent(project.id, project.ownerId, "release_reopened");
  ({ data: statusRow } = await supabase
    .from("projects")
    .select("release_status")
    .eq("id", project.id)
    .single());
  console.log("release_status:", statusRow?.release_status);
  if (statusRow?.release_status !== "release_reopened") process.exit(1);

  console.log("\n--- Re-Released ---");
  await insertEvent(project.id, project.ownerId, "released");
  ({ data: statusRow } = await supabase
    .from("projects")
    .select("release_status")
    .eq("id", project.id)
    .single());
  console.log("release_status:", statusRow?.release_status);
  if (statusRow?.release_status !== "released") process.exit(1);

  const { data: events } = await supabase
    .from("project_release_events")
    .select("event_type, created_at, note")
    .eq("project_id", project.id)
    .order("created_at", { ascending: true });

  console.log("\n--- project_release_events rows ---");
  for (const row of events ?? []) {
    console.log(`  ${row.created_at}  ${row.event_type}`);
  }

  if ((events ?? []).length < 3) {
    console.error("Expected at least 3 event rows");
    process.exit(1);
  }

  await verifyWitnessLogic(project.id);

  console.log("\nPASS — DB flow complete.");
  console.log("UI: Studio #official-release, /mypage #official-release, #play-history");
}

main().catch((error) => {
  console.error("FAIL:", error);
  process.exit(1);
});
