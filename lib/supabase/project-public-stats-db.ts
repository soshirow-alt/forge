import type { SupabaseClient } from "@supabase/supabase-js";
import { isWitnessGrantsTableMissingError } from "@/lib/supabase/witness-grants-db";

export type ProjectPublicStats = {
  witnessCount: number;
  voiceCount: number;
  latestDevlogAt: string | null;
};

const EMPTY_STATS: ProjectPublicStats = {
  witnessCount: 0,
  voiceCount: 0,
  latestDevlogAt: null,
};

export async function fetchProjectPublicStats(
  supabase: SupabaseClient,
  projectId: string,
): Promise<ProjectPublicStats> {
  const map = await fetchProjectPublicStatsMap(supabase, [projectId]);
  return map[projectId] ?? EMPTY_STATS;
}

export async function fetchProjectPublicStatsMap(
  supabase: SupabaseClient,
  projectIds: string[],
): Promise<Record<string, ProjectPublicStats>> {
  if (projectIds.length === 0) {
    return {};
  }

  const [witnessResult, voiceResult, feedbackResult, devlogResult] =
    await Promise.all([
      supabase
        .from("project_witness_grants")
        .select("project_id")
        .in("project_id", projectIds),
      supabase
        .from("project_voice_responses")
        .select("project_id, user_id")
        .in("project_id", projectIds),
      supabase
        .from("project_feedback")
        .select("project_id, user_id")
        .in("project_id", projectIds),
      supabase
        .from("project_devlogs")
        .select("project_id, created_at")
        .in("project_id", projectIds)
        .order("created_at", { ascending: false }),
    ]);

  const result: Record<string, ProjectPublicStats> = {};
  for (const projectId of projectIds) {
    result[projectId] = { ...EMPTY_STATS };
  }

  if (
    witnessResult.error &&
    !isWitnessGrantsTableMissingError(witnessResult.error)
  ) {
    throw witnessResult.error;
  }

  if (voiceResult.error) {
    throw voiceResult.error;
  }
  if (feedbackResult.error) {
    throw feedbackResult.error;
  }
  if (devlogResult.error) {
    throw devlogResult.error;
  }

  for (const row of witnessResult.data ?? []) {
    const projectId = row.project_id as string;
    result[projectId]!.witnessCount += 1;
  }

  const voiceUsersByProject = new Map<string, Set<string>>();
  for (const row of voiceResult.data ?? []) {
    const projectId = row.project_id as string;
    const userId = row.user_id as string;
    if (!voiceUsersByProject.has(projectId)) {
      voiceUsersByProject.set(projectId, new Set());
    }
    voiceUsersByProject.get(projectId)!.add(userId);
  }
  for (const row of feedbackResult.data ?? []) {
    const projectId = row.project_id as string;
    const userId = row.user_id as string;
    if (!voiceUsersByProject.has(projectId)) {
      voiceUsersByProject.set(projectId, new Set());
    }
    voiceUsersByProject.get(projectId)!.add(userId);
  }
  for (const [projectId, users] of voiceUsersByProject) {
    if (result[projectId]) {
      result[projectId].voiceCount = users.size;
    }
  }

  for (const row of devlogResult.data ?? []) {
    const projectId = row.project_id as string;
    const createdAt = row.created_at as string;
    const current = result[projectId];
    if (!current) {
      continue;
    }
    if (
      !current.latestDevlogAt ||
      new Date(createdAt).getTime() > new Date(current.latestDevlogAt).getTime()
    ) {
      current.latestDevlogAt = createdAt;
    }
  }

  return result;
}
