import type { SupabaseClient } from "@supabase/supabase-js";
import type { GuestDetailedFeedbackInput } from "@/lib/guest-feedback/types";
import type { ReplayIntent } from "@/lib/game-feedback-storage";
import type { ProjectFeedbackEntry } from "@/lib/supabase/user-engagement";

type UpsertGuestVoiceInput = {
  projectId: string;
  versionKey: string;
  promptId: string;
  submitterKey: string;
  answerValue: string;
  answerLabel: string | null;
  optionalComment: string | null;
};

export async function upsertGuestVoiceResponse(
  supabase: SupabaseClient,
  input: UpsertGuestVoiceInput,
) {
  const payload = {
    project_id: input.projectId,
    version_key: input.versionKey,
    prompt_id: input.promptId,
    submitter_key: input.submitterKey,
    answer_value: input.answerValue,
    answer_label: input.answerLabel,
    optional_comment: input.optionalComment,
  };

  const { data: existing, error: existingError } = await supabase
    .from("project_guest_voice_responses")
    .select("id")
    .eq("submitter_key", input.submitterKey)
    .eq("prompt_id", input.promptId)
    .maybeSingle();

  if (existingError) {
    throw existingError;
  }

  const write = existing?.id
    ? supabase
        .from("project_guest_voice_responses")
        .update(payload)
        .eq("id", existing.id)
        .select("id, prompt_id, created_at, updated_at")
        .single()
    : supabase
        .from("project_guest_voice_responses")
        .insert(payload)
        .select("id, prompt_id, created_at, updated_at")
        .single();

  const { data, error } = await write;

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

  // Prefer explicit select→update/insert over PostgREST upsert.
  // Staging may only have a UNIQUE INDEX (not a table CONSTRAINT), which
  // makes `onConflict: "submitter_key,project_id,version_key"` fail.
  const { data: existing, error: existingError } = await supabase
    .from("project_guest_feedback")
    .select("id")
    .eq("submitter_key", submitterKey)
    .eq("project_id", projectId)
    .eq("version_key", input.versionKey)
    .maybeSingle();

  if (existingError) {
    throw existingError;
  }

  const write = existing?.id
    ? supabase
        .from("project_guest_feedback")
        .update(payload)
        .eq("id", existing.id)
        .select("id, version_key, created_at, updated_at")
        .single()
    : supabase
        .from("project_guest_feedback")
        .insert(payload)
        .select("id, version_key, created_at, updated_at")
        .single();

  const { data, error } = await write;

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

type GuestFeedbackRow = {
  id: string;
  project_id: string;
  version_key: string;
  good_points: string | null;
  concerns: string | null;
  bugs: string | null;
  other_notes: string | null;
  focus_response: string | null;
  would_replay: ReplayIntent | null;
  created_at: string;
  updated_at: string;
};

function guestFeedbackRowToEntry(row: GuestFeedbackRow): ProjectFeedbackEntry {
  return {
    projectId: row.project_id,
    isGuest: true,
    item: {
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
    },
  };
}

export async function fetchGuestFeedbackForProjects(
  supabase: SupabaseClient,
  projectIds: string[],
): Promise<ProjectFeedbackEntry[]> {
  if (projectIds.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from("project_guest_feedback")
    .select(
      "id, project_id, version_key, good_points, concerns, bugs, other_notes, focus_response, would_replay, created_at, updated_at",
    )
    .in("project_id", projectIds)
    .order("created_at", { ascending: false });

  if (error) {
    if (isGuestFeedbackTableMissingError(error)) {
      return [];
    }
    throw error;
  }

  return ((data ?? []) as GuestFeedbackRow[]).map(guestFeedbackRowToEntry);
}
