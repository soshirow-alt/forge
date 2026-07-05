import type { SupabaseClient } from "@supabase/supabase-js";
import type { GameFeedbackItem, ReplayIntent } from "@/lib/game-feedback-storage";
import {
  insertProjectPlaySession,
  type PlaySessionContext,
  type ProjectPlaySession,
  fetchPlaySessionsForUser,
  fetchProjectPlayFirstSeen,
  isPlaySessionsTableMissingError,
} from "@/lib/supabase/play-sessions-db";

export type {
  PlaySessionContext,
  ProjectPlaySession,
} from "@/lib/supabase/play-sessions-db";
export {
  fetchPlaySessionsForUser,
  fetchProjectPlayFirstSeen,
  isPlaySessionsTableMissingError,
} from "@/lib/supabase/play-sessions-db";

export type UserEngagementState = {
  supportedProjectIds: string[];
  bookmarkedProjectIds: string[];
  watchedProjectIds: string[];
  playedProjectIds: string[];
};

type FeedbackRow = {
  id: string;
  user_id: string;
  project_id: string;
  good_points: string | null;
  concerns: string | null;
  bugs: string | null;
  other_notes: string | null;
  focus_response: string | null;
  would_replay: ReplayIntent | null;
  version_key: string;
  updated_at: string | null;
  created_at: string;
};

function feedbackRowToItem(row: FeedbackRow): GameFeedbackItem {
  return {
    id: row.id,
    createdAt: row.created_at,
    goodPoints: row.good_points ?? undefined,
    concerns: row.concerns ?? undefined,
    bugs: row.bugs ?? undefined,
    otherNotes: row.other_notes ?? undefined,
    focusResponse: row.focus_response ?? undefined,
    wouldReplay: row.would_replay ?? undefined,
    versionKey: row.version_key,
    updatedAt: row.updated_at ?? undefined,
  };
}

export async function fetchUserEngagement(
  supabase: SupabaseClient,
  userId: string,
): Promise<UserEngagementState> {
  const [supports, bookmarks, watches, plays] = await Promise.all([
    supabase.from("project_supports").select("project_id").eq("user_id", userId),
    supabase.from("project_bookmarks").select("project_id").eq("user_id", userId),
    supabase.from("project_watches").select("project_id").eq("user_id", userId),
    supabase.from("project_plays").select("project_id").eq("user_id", userId),
  ]);

  return {
    supportedProjectIds: (supports.data ?? []).map((row) => row.project_id),
    bookmarkedProjectIds: (bookmarks.data ?? []).map((row) => row.project_id),
    watchedProjectIds: (watches.data ?? []).map((row) => row.project_id),
    playedProjectIds: (plays.data ?? []).map((row) => row.project_id),
  };
}

export async function fetchSupportCounts(
  supabase: SupabaseClient,
): Promise<Record<string, number>> {
  const { data, error } = await supabase.from("project_supports").select("project_id");

  if (error) {
    throw error;
  }

  const counts: Record<string, number> = {};
  for (const row of data ?? []) {
    counts[row.project_id] = (counts[row.project_id] ?? 0) + 1;
  }
  return counts;
}

export async function addProjectSupport(
  supabase: SupabaseClient,
  userId: string,
  projectId: string,
): Promise<boolean> {
  const { error } = await supabase.from("project_supports").insert({
    user_id: userId,
    project_id: projectId,
  });

  if (error) {
    if (error.code === "23505") {
      return false;
    }
    throw error;
  }

  return true;
}

export async function addProjectBookmark(
  supabase: SupabaseClient,
  userId: string,
  projectId: string,
): Promise<void> {
  const { error } = await supabase.from("project_bookmarks").upsert({
    user_id: userId,
    project_id: projectId,
  });

  if (error) {
    throw error;
  }
}

export async function removeProjectBookmark(
  supabase: SupabaseClient,
  userId: string,
  projectId: string,
): Promise<void> {
  const { error } = await supabase
    .from("project_bookmarks")
    .delete()
    .eq("user_id", userId)
    .eq("project_id", projectId);

  if (error) {
    throw error;
  }
}

export async function removeProjectWatch(
  supabase: SupabaseClient,
  userId: string,
  projectId: string,
): Promise<void> {
  const { error } = await supabase
    .from("project_watches")
    .delete()
    .eq("user_id", userId)
    .eq("project_id", projectId);

  if (error) {
    throw error;
  }
}

export async function addProjectWatch(
  supabase: SupabaseClient,
  userId: string,
  projectId: string,
): Promise<void> {
  const { error } = await supabase.from("project_watches").upsert({
    user_id: userId,
    project_id: projectId,
  });

  if (error) {
    throw error;
  }
}

export async function recordProjectPlay(
  supabase: SupabaseClient,
  userId: string,
  projectId: string,
): Promise<void> {
  const { error } = await supabase.from("project_plays").upsert({
    user_id: userId,
    project_id: projectId,
  });

  if (error) {
    throw error;
  }
}

export type RecordProjectPlayWithSessionInput = {
  projectId: string;
  versionKey: string;
  context?: PlaySessionContext;
  adoptionId?: string | null;
};

export async function recordProjectPlayWithSession(
  supabase: SupabaseClient,
  userId: string,
  input: RecordProjectPlayWithSessionInput,
): Promise<{ session: ProjectPlaySession | null }> {
  await recordProjectPlay(supabase, userId, input.projectId);

  const session = await insertProjectPlaySession(supabase, userId, {
    projectId: input.projectId,
    versionKey: input.versionKey,
    context: input.context,
    adoptionId: input.adoptionId,
  });

  return { session };
}

export async function insertProjectFeedback(
  supabase: SupabaseClient,
  userId: string,
  projectId: string,
  versionKey: string,
  feedback: Omit<GameFeedbackItem, "id" | "createdAt" | "versionKey" | "updatedAt">,
): Promise<GameFeedbackItem> {
  const { data, error } = await supabase
    .from("project_feedback")
    .insert({
      user_id: userId,
      project_id: projectId,
      version_key: versionKey,
      good_points: feedback.goodPoints ?? null,
      concerns: feedback.concerns ?? null,
      bugs: feedback.bugs ?? null,
      other_notes: feedback.otherNotes ?? null,
      focus_response: feedback.focusResponse ?? null,
      would_replay: feedback.wouldReplay ?? null,
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return feedbackRowToItem(data as FeedbackRow);
}

export async function updateProjectFeedback(
  supabase: SupabaseClient,
  feedbackId: string,
  userId: string,
  feedback: Omit<GameFeedbackItem, "id" | "createdAt" | "versionKey" | "updatedAt">,
): Promise<GameFeedbackItem> {
  const { data, error } = await supabase
    .from("project_feedback")
    .update({
      good_points: feedback.goodPoints ?? null,
      concerns: feedback.concerns ?? null,
      bugs: feedback.bugs ?? null,
      other_notes: feedback.otherNotes ?? null,
      focus_response: feedback.focusResponse ?? null,
      would_replay: feedback.wouldReplay ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", feedbackId)
    .eq("user_id", userId)
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return feedbackRowToItem(data as FeedbackRow);
}

export async function fetchUserFeedbackForVersion(
  supabase: SupabaseClient,
  userId: string,
  projectId: string,
  versionKey: string,
): Promise<GameFeedbackItem | null> {
  const { data, error } = await supabase
    .from("project_feedback")
    .select("*")
    .eq("user_id", userId)
    .eq("project_id", projectId)
    .eq("version_key", versionKey)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  return feedbackRowToItem(data as FeedbackRow);
}

export async function fetchUserFeedbackForProject(
  supabase: SupabaseClient,
  userId: string,
  projectId: string,
): Promise<GameFeedbackItem[]> {
  const { data, error } = await supabase
    .from("project_feedback")
    .select("*")
    .eq("user_id", userId)
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return ((data ?? []) as FeedbackRow[]).map(feedbackRowToItem);
}

export async function fetchUserLatestFeedbackVersionKey(
  supabase: SupabaseClient,
  userId: string,
  projectId: string,
): Promise<string | null> {
  const { data, error } = await supabase
    .from("project_feedback")
    .select("version_key")
    .eq("user_id", userId)
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data?.version_key ?? null;
}

export async function fetchProjectFeedback(
  supabase: SupabaseClient,
  projectId: string,
): Promise<GameFeedbackItem[]> {
  const { data, error } = await supabase
    .from("project_feedback")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return ((data ?? []) as FeedbackRow[]).map(feedbackRowToItem);
}

export type ProjectFeedbackEntry = {
  projectId: string;
  item: GameFeedbackItem;
  isGuest?: boolean;
};

export async function fetchFeedbackForProjects(
  supabase: SupabaseClient,
  projectIds: string[],
): Promise<ProjectFeedbackEntry[]> {
  if (projectIds.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from("project_feedback")
    .select("*")
    .in("project_id", projectIds)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return ((data ?? []) as FeedbackRow[]).map((row) => ({
    projectId: row.project_id,
    item: feedbackRowToItem(row),
  }));
}
