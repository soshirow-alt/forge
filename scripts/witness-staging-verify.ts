/**
 * 見届け人 W1 — staging 判定 verify
 *
 * Usage:
 *   npm run verify:witness:staging
 *
 * Env (optional):
 *   WITNESS_TEST_PROJECT_ID — 単一 project に絞る
 *   OFFICIAL_RELEASE_TEST_PROJECT_ID — 上記の別名
 */
import { readFileSync } from "fs";
import { createClient } from "@supabase/supabase-js";
import {
  evaluateWitnessEligibility,
  formatWitnessEligibilitySummary,
  isOnOrBeforeCutoff,
  type WitnessGrantPath,
  type WitnessPlaySession,
} from "../lib/witness-eligibility";
import {
  getFirstReleasedEvent,
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

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const testProjectId =
  process.env.WITNESS_TEST_PROJECT_ID ??
  process.env.OFFICIAL_RELEASE_TEST_PROJECT_ID;

if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

type ProjectRow = {
  id: string;
  title: string;
  owner_id: string;
};

function rowToReleaseEvent(row: {
  id: string;
  project_id: string;
  event_type: "released" | "release_reopened";
  actor_user_id: string;
  note: string | null;
  source?: "studio" | "onboarding" | null;
  created_at: string;
}): ProjectReleaseEvent {
  return {
    id: row.id,
    projectId: row.project_id,
    eventType: row.event_type,
    actorUserId: row.actor_user_id,
    note: row.note,
    source: row.source ?? "studio",
    createdAt: row.created_at,
  };
}

async function findReleasedProjects(): Promise<ProjectRow[]> {
  if (testProjectId) {
    const { data, error } = await supabase
      .from("projects")
      .select("id, title, owner_id")
      .eq("id", testProjectId)
      .maybeSingle();

    if (error || !data) {
      console.error("Project not found:", testProjectId, error?.message);
      return [];
    }

    return [data as ProjectRow];
  }

  const { data: releasedEvents, error } = await supabase
    .from("project_release_events")
    .select("project_id")
    .eq("event_type", "released");

  if (error) {
    console.error("Failed to load release events:", error.message);
    return [];
  }

  const projectIds = [...new Set((releasedEvents ?? []).map((row) => row.project_id))];
  if (projectIds.length === 0) {
    return [];
  }

  const { data: projects } = await supabase
    .from("projects")
    .select("id, title, owner_id")
    .in("id", projectIds);

  return (projects ?? []) as ProjectRow[];
}

function earliestTimestamp(values: string[]): string | null {
  if (values.length === 0) {
    return null;
  }

  return values.reduce((earliest, value) =>
    new Date(value).getTime() < new Date(earliest).getTime() ? value : earliest,
  );
}

async function evaluateProject(project: ProjectRow) {
  const { data: eventsRaw } = await supabase
    .from("project_release_events")
    .select("*")
    .eq("project_id", project.id)
    .order("created_at", { ascending: true });

  const events = ((eventsRaw ?? []) as Parameters<typeof rowToReleaseEvent>[0][]).map(
    rowToReleaseEvent,
  );
  const firstReleased = getFirstReleasedEvent(events);

  if (!firstReleased) {
    console.log(`\nSKIP ${project.title} — no released event`);
    return null;
  }

  const cutoff = firstReleased.createdAt;

  const [
    { data: sessionsRaw },
    { data: voicesRaw },
    { data: watchesRaw },
    { data: playsRaw },
  ] = await Promise.all([
    supabase
      .from("project_play_sessions")
      .select("user_id, version_key, played_at")
      .eq("project_id", project.id),
    supabase
      .from("project_voice_responses")
      .select("user_id, created_at")
      .eq("project_id", project.id),
    supabase
      .from("project_watches")
      .select("user_id, created_at")
      .eq("project_id", project.id),
    supabase
      .from("project_plays")
      .select("user_id, created_at")
      .eq("project_id", project.id),
  ]);

  const userIds = new Set<string>();
  for (const row of sessionsRaw ?? []) userIds.add(row.user_id as string);
  for (const row of voicesRaw ?? []) userIds.add(row.user_id as string);
  for (const row of watchesRaw ?? []) userIds.add(row.user_id as string);
  for (const row of playsRaw ?? []) userIds.add(row.user_id as string);

  const pathCounts: Record<WitnessGrantPath, number> = {
    multi_version: 0,
    voice: 0,
    watch: 0,
  };

  const eligibleUsers: {
    userId: string;
    grantPath: WitnessGrantPath;
    matchedPaths: WitnessGrantPath[];
    summary: string;
    pathDetails: string;
  }[] = [];

  const ineligibleExamples: {
    userId: string;
    reason: string;
    paths: string;
    playedBeforeRelease: boolean;
    sessionCount: number;
    hasWatch: boolean;
  }[] = [];

  for (const userId of userIds) {
    const sessionsBeforeRelease: WitnessPlaySession[] = (sessionsRaw ?? [])
      .filter(
        (row) =>
          row.user_id === userId &&
          isOnOrBeforeCutoff(row.played_at as string, cutoff),
      )
      .map((row) => ({
        versionKey: row.version_key as string,
        playedAt: row.played_at as string,
      }));

    const voicesBeforeRelease = (voicesRaw ?? [])
      .filter(
        (row) =>
          row.user_id === userId &&
          isOnOrBeforeCutoff(row.created_at as string, cutoff),
      )
      .map((row) => ({ createdAt: row.created_at as string }));

    const watchRows = (watchesRaw ?? []).filter(
      (row) =>
        row.user_id === userId &&
        isOnOrBeforeCutoff(row.created_at as string, cutoff),
    );
    const watchCreatedAt =
      watchRows.length > 0
        ? earliestTimestamp(watchRows.map((row) => row.created_at as string))
        : null;

    const playTimestamps: string[] = [];
    for (const row of playsRaw ?? []) {
      if (row.user_id === userId) {
        playTimestamps.push(row.created_at as string);
      }
    }
    for (const session of sessionsBeforeRelease) {
      playTimestamps.push(session.playedAt);
    }

    const firstPlayedAt = earliestTimestamp(playTimestamps);

    const result = evaluateWitnessEligibility({
      userId,
      ownerId: project.owner_id,
      firstReleasedAt: cutoff,
      firstPlayedAt,
      sessionsBeforeRelease,
      voicesBeforeRelease,
      watchCreatedAt,
    });

    const playedBeforeRelease = Boolean(
      firstPlayedAt && isOnOrBeforeCutoff(firstPlayedAt, cutoff),
    );

    if (result.eligible && result.grantPath) {
      for (const path of result.matchedPaths) {
        pathCounts[path] += 1;
      }

      eligibleUsers.push({
        userId,
        grantPath: result.grantPath,
        matchedPaths: result.matchedPaths,
        summary: formatWitnessEligibilitySummary(result),
        pathDetails: result.paths
          .map((path) => `${path.path}=${path.met} (${path.detail})`)
          .join("; "),
      });
    } else if (ineligibleExamples.length < 5) {
      ineligibleExamples.push({
        userId,
        reason: result.rejectionReason ?? "unknown",
        paths: result.paths
          .map((path) => `${path.path}=${path.met} (${path.detail})`)
          .join("; "),
        playedBeforeRelease,
        sessionCount: sessionsBeforeRelease.length,
        hasWatch: watchCreatedAt !== null,
      });
    }
  }

  return {
    project,
    firstReleased,
    eligibleUsers,
    pathCounts,
    ineligibleExamples,
    candidateUserCount: userIds.size,
  };
}

async function main() {
  console.log("=== Witness eligibility staging verify (W1) ===");
  console.log("Supabase:", url);
  console.log("Conditions: D (OR) — A | B | C' (watch + session>=2)");
  console.log("Out: migration 014, grants, UI, notifications");

  const projects = await findReleasedProjects();
  if (projects.length === 0) {
    console.error("No released projects found");
    process.exit(1);
  }

  let totalEligible = 0;
  const aggregatePathCounts: Record<WitnessGrantPath, number> = {
    multi_version: 0,
    voice: 0,
    watch: 0,
  };

  for (const project of projects) {
    const report = await evaluateProject(project);
    if (!report) {
      continue;
    }

    console.log(`\n--- ${report.project.title} (${report.project.id}) ---`);
    console.log("firstReleasedAt:", report.firstReleased.createdAt);
    console.log("candidate users:", report.candidateUserCount);
    console.log("eligible users:", report.eligibleUsers.length);

    console.log("\nPath counts (matched paths — user may match multiple):");
    console.log(`  multi_version (A): ${report.pathCounts.multi_version}`);
    console.log(`  voice (B):         ${report.pathCounts.voice}`);
    console.log(`  watch (C'):       ${report.pathCounts.watch}`);

    if (report.eligibleUsers.length > 0) {
      console.log("\nEligible users:");
      for (const user of report.eligibleUsers) {
        console.log(
          `  ${user.userId.slice(0, 8)}… primary=${user.grantPath} matched=[${user.matchedPaths.join(", ")}]`,
        );
        console.log(`    ${user.summary}`);
        console.log(`    paths: ${user.pathDetails}`);
      }
    }

    if (report.ineligibleExamples.length > 0) {
      console.log("\nIneligible examples (up to 5):");
      for (const example of report.ineligibleExamples) {
        console.log(
          `  ${example.userId.slice(0, 8)}… — ${example.reason}`,
        );
        console.log(
          `    playedBeforeRelease=${example.playedBeforeRelease} sessions=${example.sessionCount} watch=${example.hasWatch}`,
        );
        console.log(`    paths: ${example.paths}`);
      }
    }

    totalEligible += report.eligibleUsers.length;
    for (const path of Object.keys(aggregatePathCounts) as WitnessGrantPath[]) {
      aggregatePathCounts[path] += report.pathCounts[path];
    }
  }

  console.log("\n=== Aggregate ===");
  console.log("projects:", projects.length);
  console.log("total eligible users:", totalEligible);
  console.log("path matches (may double-count per user):");
  console.log(`  multi_version: ${aggregatePathCounts.multi_version}`);
  console.log(`  voice:         ${aggregatePathCounts.voice}`);
  console.log(`  watch:         ${aggregatePathCounts.watch}`);

  console.log("\nPASS — W1 verify complete.");
  console.log("Next: owner review → W2 migration 014 (project_witness_grants)");
}

main().catch((error) => {
  console.error("FAIL:", error);
  process.exit(1);
});
