import type { SupabaseClient } from "@supabase/supabase-js";

export type FeedbackCardReply = {
  id: string;
  body: string;
  createdAt: string;
  authorDisplayName: string;
  authorAvatarUrl: string | null;
  isDeveloper: boolean;
  isOwn: boolean;
};

export async function toggleFeedbackCardEmpathy(
  supabase: SupabaseClient,
  projectId: string,
  versionKey: string,
  cardId: string,
): Promise<{ empathyCount: number; viewerHasEmpathy: boolean }> {
  const { data, error } = await supabase.rpc("toggle_feedback_card_empathy", {
    p_project_id: projectId,
    p_version_key: versionKey,
    p_card_id: cardId,
  });
  if (error) {
    throw error;
  }
  const row = Array.isArray(data) ? data[0] : data;
  return {
    empathyCount: Number(row?.empathy_count) || 0,
    viewerHasEmpathy: Boolean(row?.viewer_has_empathy),
  };
}

export async function toggleFeedbackCardHelpful(
  supabase: SupabaseClient,
  projectId: string,
  versionKey: string,
  cardId: string,
): Promise<{ developerMarkedHelpful: boolean }> {
  const { data, error } = await supabase.rpc("toggle_feedback_card_helpful", {
    p_project_id: projectId,
    p_version_key: versionKey,
    p_card_id: cardId,
  });
  if (error) {
    throw error;
  }
  const row = Array.isArray(data) ? data[0] : data;
  return {
    developerMarkedHelpful: Boolean(row?.developer_marked_helpful),
  };
}

export async function listFeedbackCardReplies(
  supabase: SupabaseClient,
  projectId: string,
  versionKey: string,
  cardId: string,
): Promise<FeedbackCardReply[]> {
  const { data, error } = await supabase.rpc("list_feedback_card_replies", {
    p_project_id: projectId,
    p_version_key: versionKey,
    p_card_id: cardId,
  });
  if (error) {
    throw error;
  }
  return ((data ?? []) as Array<{
    id: string;
    body: string;
    created_at: string;
    author_display_name: string | null;
    author_avatar_url: string | null;
    is_developer: boolean;
    is_own: boolean;
  }>).map((row) => ({
    id: row.id,
    body: row.body,
    createdAt: row.created_at,
    authorDisplayName: row.author_display_name?.trim() || "プレイヤー",
    authorAvatarUrl: row.author_avatar_url,
    isDeveloper: Boolean(row.is_developer),
    isOwn: Boolean(row.is_own),
  }));
}

export async function createFeedbackCardReply(
  supabase: SupabaseClient,
  projectId: string,
  versionKey: string,
  cardId: string,
  body: string,
): Promise<string> {
  const { data, error } = await supabase.rpc("create_feedback_card_reply", {
    p_project_id: projectId,
    p_version_key: versionKey,
    p_card_id: cardId,
    p_body: body,
  });
  if (error) {
    throw error;
  }
  return String(data);
}

export async function deleteFeedbackCardReply(
  supabase: SupabaseClient,
  replyId: string,
): Promise<boolean> {
  const { data, error } = await supabase.rpc("delete_feedback_card_reply", {
    p_reply_id: replyId,
  });
  if (error) {
    throw error;
  }
  return Boolean(data);
}
