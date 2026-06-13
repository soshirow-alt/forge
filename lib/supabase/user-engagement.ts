import type { SupabaseClient } from "@supabase/supabase-js";
import type { GameFeedbackItem, ReplayIntent } from "@/lib/game-feedback-storage";

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
  focus_response: string | null;
  would_replay: ReplayIntent | null;
  created_at: string;
};

function feedbackRowToItem(row: FeedbackRow): GameFeedbackItem {
  return {
    id: row.id,
    createdAt: row.created_at,
    goodPoints: row.good_points ?? undefined,
    concerns: row.concerns ?? undefined,
    bugs: row.bugs ?? undefined,
    focusResponse: row.focus_response ?? undefined,
    wouldReplay: row.would_replay ?? undefined,
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

export async function insertProjectFeedback(
  supabase: SupabaseClient,
  userId: string,
  projectId: string,
  feedback: Omit<GameFeedbackItem, "id" | "createdAt">,
): Promise<GameFeedbackItem> {
  const { data, error } = await supabase
    .from("project_feedback")
    .insert({
      user_id: userId,
      project_id: projectId,
      good_points: feedback.goodPoints ?? null,
      concerns: feedback.concerns ?? null,
      bugs: feedback.bugs ?? null,
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
