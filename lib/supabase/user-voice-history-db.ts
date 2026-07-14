import type { SupabaseClient } from "@supabase/supabase-js";

export type UserVoiceHistoryRow = {
  id: string;
  projectId: string;
  versionKey: string;
  promptId: string;
  answerValue: string;
  answerLabel: string | null;
  optionalComment: string | null;
  createdAt: string;
  updatedAt: string;
  moderationStatus: string | null;
};

type VoiceDbRow = {
  id: string;
  project_id: string;
  version_key: string;
  prompt_id: string;
  answer_value: string;
  answer_label: string | null;
  optional_comment?: string | null;
  created_at: string;
  updated_at: string;
  moderation_status?: string | null;
};

/** All registered voice answers for the signed-in user (newest first). */
export async function fetchAllUserVoiceResponses(
  supabase: SupabaseClient,
  userId: string,
): Promise<UserVoiceHistoryRow[]> {
  const { data, error } = await supabase
    .from("project_voice_responses")
    .select(
      "id, project_id, version_key, prompt_id, answer_value, answer_label, optional_comment, created_at, updated_at, moderation_status",
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    const fallback = await supabase
      .from("project_voice_responses")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (fallback.error) {
      return [];
    }
    return ((fallback.data ?? []) as VoiceDbRow[]).map(mapRow);
  }

  return ((data ?? []) as VoiceDbRow[])
    .filter(
      (row) =>
        !row.moderation_status || row.moderation_status === "visible",
    )
    .map(mapRow);
}

function mapRow(row: VoiceDbRow): UserVoiceHistoryRow {
  return {
    id: row.id,
    projectId: row.project_id,
    versionKey: row.version_key,
    promptId: row.prompt_id,
    answerValue: row.answer_value,
    answerLabel: row.answer_label,
    optionalComment: row.optional_comment ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    moderationStatus: row.moderation_status ?? null,
  };
}
