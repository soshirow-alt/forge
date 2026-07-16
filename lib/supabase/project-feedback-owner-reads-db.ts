import type { SupabaseClient } from "@supabase/supabase-js";

export type OwnedPublicFeedbackUnreadRow = {
  projectId: string;
  unreadCount: number;
};

type UnreadCountRpcRow = {
  project_id: string;
  unread_count: number | string;
};

export async function listOwnedPublicFeedbackUnreadCounts(
  supabase: SupabaseClient,
): Promise<OwnedPublicFeedbackUnreadRow[]> {
  const { data, error } = await supabase.rpc(
    "list_owned_public_feedback_unread_counts",
  );

  if (error) {
    throw error;
  }

  return ((data ?? []) as UnreadCountRpcRow[]).map((row) => ({
    projectId: row.project_id,
    unreadCount: Number(row.unread_count) || 0,
  }));
}

export async function markProjectPublicFeedbackSeen(
  supabase: SupabaseClient,
  projectId: string,
): Promise<void> {
  const { error } = await supabase.rpc("mark_project_public_feedback_seen", {
    p_project_id: projectId,
  });

  if (error) {
    throw error;
  }
}
