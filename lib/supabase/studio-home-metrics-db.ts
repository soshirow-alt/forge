import type { SupabaseClient } from "@supabase/supabase-js";
import { resolvePlayableVersion } from "@/lib/playable-version";
import {
  EMPTY_STUDIO_HOME_CONNECTION_METRICS,
  type StudioHomeConnectionMetrics,
  type StudioHomeGranularity,
  type StudioHomeHighlights,
} from "@/lib/studio-home-metrics";

type RpcRow = {
  months?: string[];
  playDepth?: {
    once?: number;
    twice?: number;
    thricePlus?: number;
    total?: number;
  }[];
  voiceFunnel?: {
    played?: number;
    voiced?: number;
    deep?: number;
  }[];
  witnessCommunity?: {
    watching?: number;
    communityMembers?: number;
  }[];
};

function isRpcMissing(error: { code?: string; message?: string } | null): boolean {
  if (!error) {
    return false;
  }
  return (
    error.code === "PGRST202" ||
    error.code === "42883" ||
    (error.message?.includes("get_studio_home_connection_metrics") ?? false)
  );
}

function normalizeMetrics(payload: RpcRow | null): StudioHomeConnectionMetrics {
  if (!payload) {
    return EMPTY_STUDIO_HOME_CONNECTION_METRICS;
  }

  const months = payload.months ?? [];
  const playDepth = (payload.playDepth ?? []).map((point) => ({
    once: point.once ?? 0,
    twice: point.twice ?? 0,
    thricePlus: point.thricePlus ?? 0,
    total: point.total ?? 0,
  }));
  const voiceFunnel = (payload.voiceFunnel ?? []).map((point) => ({
    played: point.played ?? 0,
    voiced: point.voiced ?? 0,
    deep: point.deep ?? 0,
  }));
  const witnessCommunity = (payload.witnessCommunity ?? []).map((point) => ({
    watching: point.watching ?? 0,
    communityMembers: point.communityMembers ?? 0,
  }));

  return { months, playDepth, voiceFunnel, witnessCommunity };
}

export async function fetchStudioHomeConnectionMetrics(
  supabase: SupabaseClient,
  granularity: StudioHomeGranularity = "month",
): Promise<{
  metrics: StudioHomeConnectionMetrics;
  rpcReady: boolean;
  granularityFallback: boolean;
}> {
  const { data, error } = await supabase.rpc("get_studio_home_connection_metrics", {
    p_granularity: granularity,
  });

  if (!error) {
    return {
      metrics: normalizeMetrics((data ?? null) as RpcRow | null),
      rpcReady: true,
      granularityFallback: false,
    };
  }

  const legacy = await supabase.rpc("get_studio_home_connection_metrics");
  if (!legacy.error) {
    return {
      metrics: normalizeMetrics((legacy.data ?? null) as RpcRow | null),
      rpcReady: true,
      granularityFallback: granularity !== "month",
    };
  }

  if (isRpcMissing(error) || isRpcMissing(legacy.error)) {
    return {
      metrics: EMPTY_STUDIO_HOME_CONNECTION_METRICS,
      rpcReady: false,
      granularityFallback: false,
    };
  }

  throw error;
}

const RECENT_COMMUNITY_REPLY_DAYS = 7;

/** 気になる動き用。主グラフ指標とは別（直近返信の有無のみ）。 */
export async function fetchStudioHomeHighlights(
  supabase: SupabaseClient,
  ownerId: string,
  projects: { projectId: string; playableVersion: string }[],
): Promise<StudioHomeHighlights> {
  if (projects.length === 0) {
    return { unreadVoiceProjectCount: 0, hasRecentCommunityReply: false };
  }

  const projectIds = projects.map((project) => project.projectId);

  const [{ data: voiceRows }, { data: readRows }, { data: communityRow }] =
    await Promise.all([
      supabase
        .from("project_voice_responses")
        .select("project_id, version_key")
        .in("project_id", projectIds),
      supabase
        .from("project_voice_reads")
        .select("project_id, version_key, read_at")
        .eq("user_id", ownerId)
        .eq("source_type", "voice")
        .in("project_id", projectIds),
      supabase
        .from("developer_communities")
        .select("id")
        .eq("owner_id", ownerId)
        .maybeSingle(),
    ]);

  const responseCountByKey = new Map<string, number>();
  for (const row of (voiceRows ?? []) as {
    project_id: string;
    version_key: string;
  }[]) {
    const key = `${row.project_id}:${resolvePlayableVersion(row.version_key)}`;
    responseCountByKey.set(key, (responseCountByKey.get(key) ?? 0) + 1);
  }

  const readByKey = new Set<string>();
  for (const row of (readRows ?? []) as {
    project_id: string;
    version_key: string;
    read_at: string | null;
  }[]) {
    if (row.read_at) {
      readByKey.add(
        `${row.project_id}:${resolvePlayableVersion(row.version_key)}`,
      );
    }
  }

  let unreadVoiceProjectCount = 0;
  for (const project of projects) {
    const version = resolvePlayableVersion(project.playableVersion);
    const key = `${project.projectId}:${version}`;
    const count = responseCountByKey.get(key) ?? 0;
    if (count > 0 && !readByKey.has(key)) {
      unreadVoiceProjectCount += 1;
    }
  }

  let hasRecentCommunityReply = false;
  const communityId = (communityRow as { id?: string } | null)?.id;
  if (communityId) {
    const since = new Date();
    since.setDate(since.getDate() - RECENT_COMMUNITY_REPLY_DAYS);
    const sinceIso = since.toISOString();

    const { data: posts } = await supabase
      .from("community_posts")
      .select("id")
      .eq("community_id", communityId);

    const postIds = ((posts ?? []) as { id: string }[]).map((post) => post.id);
    if (postIds.length > 0) {
      const { count } = await supabase
        .from("community_replies")
        .select("id", { count: "exact", head: true })
        .in("post_id", postIds)
        .neq("author_id", ownerId)
        .gte("created_at", sinceIso);

      hasRecentCommunityReply = (count ?? 0) > 0;
    }
  }

  return { unreadVoiceProjectCount, hasRecentCommunityReply };
}
