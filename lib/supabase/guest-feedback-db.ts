import type { SupabaseClient } from "@supabase/supabase-js";
import type { GuestDetailedFeedbackInput } from "@/lib/guest-feedback/types";

type UpsertGuestVoiceInput = {
  projectId: string;
  versionKey: string;
  promptId: string;
  submitterKey: string;
  answerValue: string;
  answerLabel: string | null;
};

export async function upsertGuestVoiceResponse(
  supabase: SupabaseClient,
  input: UpsertGuestVoiceInput,
) {
  const { data, error } = await supabase
    .from("project_guest_voice_responses")
    .upsert(
      {
        project_id: input.projectId,
        version_key: input.versionKey,
        prompt_id: input.promptId,
        submitter_key: input.submitterKey,
        answer_value: input.answerValue,
        answer_label: input.answerLabel,
      },
      { onConflict: "submitter_key,prompt_id" },
    )
    .select("id, prompt_id, created_at, updated_at")
    .single();

  if (error) {
    throw error;
  }

  return {
    id: String(data.id),
    promptId: String(data.prompt_id),
    createdAt: String(data.created_at),
    updatedAt: String(data.updated_at),
  };
}

export async function upsertGuestDetailedFeedback(
  supabase: SupabaseClient,
  projectId: string,
  submitterKey: string,
  input: GuestDetailedFeedbackInput,
) {
  const payload = {
    project_id: projectId,
    version_key: input.versionKey,
    submitter_key: submitterKey,
    good_points: input.goodPoints ?? null,
    concerns: input.concerns ?? null,
    bugs: input.bugs ?? null,
    other_notes: input.otherNotes ?? null,
    focus_response: input.focusResponse ?? null,
    would_replay: input.wouldReplay ?? null,
  };

  const { data, error } = await supabase
    .from("project_guest_feedback")
    .upsert(payload, { onConflict: "submitter_key,project_id,version_key" })
    .select("id, version_key, created_at, updated_at")
    .single();

  if (error) {
    throw error;
  }

  return {
    id: String(data.id),
    versionKey: String(data.version_key),
    createdAt: String(data.created_at),
    updatedAt: String(data.updated_at),
  };
}

export function isGuestFeedbackTableMissingError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "42P01"
  );
}
