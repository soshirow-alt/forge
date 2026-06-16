import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  VoiceAdoptionRow,
  VoiceAdoptionSuppressionReason,
} from "@/lib/voice-adoption/types";

type VoiceAdoptionDbRow = {
  id: string;
  project_id: string;
  user_id: string;
  voice_response_id: string;
  devlog_id: string;
  voice_version_key: string;
  published_version: string;
  player_quote: string;
  update_summary: string;
  prompt_text: string | null;
  confidence: number;
  model: string;
  model_version: string | null;
  matcher_run_id: string;
  status: "active" | "suppressed";
  suppression_reason: VoiceAdoptionSuppressionReason | null;
  created_at: string;
  updated_at: string;
};

function mapRow(row: VoiceAdoptionDbRow): VoiceAdoptionRow {
  return {
    id: row.id,
    projectId: row.project_id,
    userId: row.user_id,
    voiceResponseId: row.voice_response_id,
    devlogId: row.devlog_id,
    voiceVersionKey: row.voice_version_key,
    publishedVersion: row.published_version,
    playerQuote: row.player_quote,
    updateSummary: row.update_summary,
    promptText: row.prompt_text,
    confidence: Number(row.confidence),
    model: row.model,
    modelVersion: row.model_version,
    matcherRunId: row.matcher_run_id,
    status: row.status,
    suppressionReason: row.suppression_reason,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function fetchActiveAdoptionsForUser(
  supabase: SupabaseClient,
  userId: string,
  projectId?: string,
): Promise<VoiceAdoptionRow[]> {
  let query = supabase
    .from("voice_adoptions")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (projectId) {
    query = query.eq("project_id", projectId);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return ((data ?? []) as VoiceAdoptionDbRow[]).map(mapRow);
}

export async function fetchActiveAdoptionForUserById(
  supabase: SupabaseClient,
  userId: string,
  adoptionId: string,
): Promise<VoiceAdoptionRow | null> {
  const { data, error } = await supabase
    .from("voice_adoptions")
    .select("*")
    .eq("id", adoptionId)
    .eq("user_id", userId)
    .eq("status", "active")
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  return mapRow(data as VoiceAdoptionDbRow);
}

export async function countActiveAdoptionsForDevlog(
  supabase: SupabaseClient,
  devlogId: string,
): Promise<number> {
  const { count, error } = await supabase
    .from("voice_adoptions")
    .select("*", { count: "exact", head: true })
    .eq("devlog_id", devlogId)
    .eq("status", "active");

  if (error) {
    throw error;
  }

  return count ?? 0;
}

export async function insertAdoptionDispute(
  supabase: SupabaseClient,
  userId: string,
  adoptionId: string,
): Promise<void> {
  const { error } = await supabase.from("voice_adoption_disputes").insert({
    adoption_id: adoptionId,
    user_id: userId,
  });

  if (error) {
    throw error;
  }
}

export function isVoiceAdoptionsTableMissingError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  const message = "message" in error ? String(error.message) : "";
  return (
    message.includes("voice_adoptions") &&
    (message.includes("does not exist") || message.includes("Could not find"))
  );
}
