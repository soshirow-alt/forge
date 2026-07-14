import type { SupabaseClient } from "@supabase/supabase-js";
import {
  feedbackHasContent,
  type GameFeedbackItem,
} from "@/lib/game-feedback-storage";

type FeedbackListRow = {
  id: string;
  user_id: string;
  project_id: string;
  good_points: string | null;
  concerns: string | null;
  bugs: string | null;
  other_notes: string | null;
  focus_response: string | null;
  would_replay: "yes" | "maybe" | "no" | null;
  version_key: string;
  updated_at: string | null;
  created_at: string;
  moderation_status?: string | null;
};

function rowToItem(row: FeedbackListRow): GameFeedbackItem & { projectId: string } {
  return {
    id: row.id,
    projectId: row.project_id,
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

/** All deep feedback rows for the signed-in user (newest first). */
export async function fetchAllUserFeedback(
  supabase: SupabaseClient,
  userId: string,
): Promise<Array<GameFeedbackItem & { projectId: string }>> {
  const { data, error } = await supabase
    .from("project_feedback")
    .select(
      "id, user_id, project_id, good_points, concerns, bugs, other_notes, focus_response, would_replay, version_key, updated_at, created_at, moderation_status",
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    const fallback = await supabase
      .from("project_feedback")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (fallback.error) {
      throw fallback.error;
    }
    return ((fallback.data ?? []) as FeedbackListRow[])
      .map(rowToItem)
      .filter((item) => feedbackHasContent(item));
  }

  return ((data ?? []) as FeedbackListRow[])
    .filter(
      (row) =>
        !row.moderation_status || row.moderation_status === "visible",
    )
    .map(rowToItem)
    .filter((item) => feedbackHasContent(item));
}
