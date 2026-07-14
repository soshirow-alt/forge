import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";

export type ProjectPublicStats = {
  /** voice_responses + feedback の distinct user_id — 投稿件数ではない */
  feedbackParticipantCount: number;
  /** project_watches — 作品フォロー / 更新追跡人数 */
  watchCount: number;
  /** project_witness_grants — 見届け人称号（発見カードでは使わない） */
  witnessGrantCount: number;
  latestDevlogAt: string | null;
  /**
   * Distinct registered players from project_plays (PK user_id+project_id).
   * null = not available (RPC未適用 / 未ロード). 0 is a real empty count.
   */
  playPlayerCount: number | null;
};

const EMPTY_STATS: ProjectPublicStats = {
  feedbackParticipantCount: 0,
  watchCount: 0,
  witnessGrantCount: 0,
  latestDevlogAt: null,
  playPlayerCount: null,
};

type PublicProjectStatsRow = {
  project_id: string;
  feedback_participant_count: number | string | null;
  watch_count: number | string | null;
  witness_grant_count: number | string | null;
  latest_devlog_at: string | null;
  play_player_count?: number | string | null;
};

export function isPublicProjectStatsRpcMissingError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }
  const row = error as PostgrestError;
  const message = row.message ?? "";
  return (
    row.code === "PGRST202" ||
    row.code === "42883" ||
    message.includes("get_public_project_stats") ||
    message.includes("Could not find the function")
  );
}

function toCount(value: number | string | null | undefined): number {
  if (value === null || value === undefined) {
    return 0;
  }
  const parsed = typeof value === "number" ? value : Number.parseInt(String(value), 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

/** Preserve null when the RPC does not yet return play_player_count. */
function toOptionalCount(
  value: number | string | null | undefined,
  present: boolean,
): number | null {
  if (!present) {
    return null;
  }
  return toCount(value);
}

function rowToStats(row: PublicProjectStatsRow): ProjectPublicStats {
  const hasPlay = Object.prototype.hasOwnProperty.call(row, "play_player_count");
  return {
    feedbackParticipantCount: toCount(row.feedback_participant_count),
    watchCount: toCount(row.watch_count),
    witnessGrantCount: toCount(row.witness_grant_count),
    latestDevlogAt: row.latest_devlog_at,
    playPlayerCount: toOptionalCount(row.play_player_count, hasPlay),
  };
}

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
  const uniqueIds = [...new Set(projectIds.filter(Boolean))];
  const result: Record<string, ProjectPublicStats> = {};
  for (const projectId of uniqueIds) {
    result[projectId] = { ...EMPTY_STATS };
  }

  if (uniqueIds.length === 0) {
    return result;
  }

  const { data, error } = await supabase.rpc("get_public_project_stats", {
    p_project_ids: uniqueIds,
  });

  if (error) {
    if (isPublicProjectStatsRpcMissingError(error)) {
      return result;
    }
    throw error;
  }

  for (const row of (data ?? []) as PublicProjectStatsRow[]) {
    result[row.project_id] = rowToStats(row);
  }

  return result;
}

export type DiscoveryCardStats = Pick<
  ProjectPublicStats,
  "feedbackParticipantCount" | "watchCount" | "playPlayerCount"
>;

export const EMPTY_DISCOVERY_CARD_STATS: DiscoveryCardStats = {
  feedbackParticipantCount: 0,
  watchCount: 0,
  playPlayerCount: null,
};
