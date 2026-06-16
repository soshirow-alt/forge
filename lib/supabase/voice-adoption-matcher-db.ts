import type { SupabaseClient } from "@supabase/supabase-js";
import {
  ADOPTION_PROMPT_VERSION,
  MATCHER_TRIGGER_VERSION,
} from "@/lib/voice-adoption/constants";
import type {
  MatcherCandidate,
  MatcherDevlogInput,
  MatcherMatchResult,
} from "@/lib/voice-adoption/types";

type DevlogRow = {
  id: string;
  project_id: string;
  title: string;
  content: string;
  published_version: string | null;
  published_at: string | null;
  content_hash: string | null;
  created_at: string;
};

type VoiceCandidateRow = {
  id: string;
  user_id: string;
  project_id: string;
  version_key: string;
  answer_value: string;
  answer_label: string | null;
  created_at: string;
  prompt_text: string;
};

export function mapDevlogRow(row: DevlogRow): MatcherDevlogInput | null {
  if (!row.published_version) {
    return null;
  }

  return {
    id: row.id,
    projectId: row.project_id,
    title: row.title,
    content: row.content,
    publishedVersion: row.published_version,
    publishedAt: row.published_at,
    createdAt: row.created_at,
  };
}

export type MatcherDevlogContext = {
  devlog: MatcherDevlogInput;
  contentHash: string | null;
};

export async function fetchDevlogForMatcher(
  supabase: SupabaseClient,
  devlogId: string,
): Promise<MatcherDevlogContext | null> {
  const { data, error } = await supabase
    .from("project_devlogs")
    .select(
      "id, project_id, title, content, published_version, published_at, content_hash, created_at",
    )
    .eq("id", devlogId)
    .maybeSingle();

  if (error || !data) {
    throw error ?? new Error("Devlog not found");
  }

  const row = data as DevlogRow;
  const devlog = mapDevlogRow(row);
  if (!devlog) {
    return null;
  }

  return { devlog, contentHash: row.content_hash };
}

export async function fetchVoiceCandidatesForMatcher(
  supabase: SupabaseClient,
  projectId: string,
): Promise<MatcherCandidate[]> {
  const { data, error } = await supabase
    .from("project_voice_responses")
    .select(
      `
      id,
      user_id,
      project_id,
      version_key,
      answer_value,
      answer_label,
      created_at,
      project_version_prompts ( prompt_text )
    `,
    )
    .eq("project_id", projectId);

  if (error) {
    throw error;
  }

  return ((data ?? []) as Array<
    VoiceCandidateRow & {
      project_version_prompts: { prompt_text: string } | { prompt_text: string }[];
    }
  >).map((row) => {
    const promptJoin = row.project_version_prompts;
    const promptText = Array.isArray(promptJoin)
      ? promptJoin[0]?.prompt_text
      : promptJoin.prompt_text;

    return {
      voiceResponseId: row.id,
      userId: row.user_id,
      projectId: row.project_id,
      versionKey: row.version_key,
      promptText: promptText ?? "",
      answerValue: row.answer_value,
      answerLabel: row.answer_label,
      createdAt: row.created_at,
    };
  });
}

export async function findExistingMatcherRun(
  supabase: SupabaseClient,
  devlogId: string,
  triggerType: "devlog_published" = "devlog_published",
): Promise<{ id: string; status: string } | null> {
  const { data, error } = await supabase
    .from("voice_adoption_matcher_runs")
    .select("id, status")
    .eq("devlog_id", devlogId)
    .eq("trigger_type", triggerType)
    .eq("trigger_version", MATCHER_TRIGGER_VERSION)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data as { id: string; status: string } | null;
}

export async function createMatcherRun(
  supabase: SupabaseClient,
  input: {
    devlogId: string;
    projectId: string;
    devlogContentHash: string | null;
    candidateCount: number;
    model: string;
  },
): Promise<string> {
  const { data, error } = await supabase
    .from("voice_adoption_matcher_runs")
    .insert({
      devlog_id: input.devlogId,
      project_id: input.projectId,
      trigger_type: "devlog_published",
      trigger_version: MATCHER_TRIGGER_VERSION,
      status: "running",
      candidate_count: input.candidateCount,
      evaluated_count: 0,
      adopted_count: 0,
      skipped_below_threshold: 0,
      devlog_content_hash: input.devlogContentHash,
      model: input.model,
      prompt_version: ADOPTION_PROMPT_VERSION,
      started_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error) {
    throw error;
  }

  return (data as { id: string }).id;
}

export async function completeMatcherRun(
  supabase: SupabaseClient,
  runId: string,
  input: {
    status: "completed" | "failed" | "skipped";
    evaluatedCount: number;
    adoptedCount: number;
    skippedBelowThreshold: number;
    errorMessage?: string | null;
  },
): Promise<void> {
  const { error } = await supabase
    .from("voice_adoption_matcher_runs")
    .update({
      status: input.status,
      evaluated_count: input.evaluatedCount,
      adopted_count: input.adoptedCount,
      skipped_below_threshold: input.skippedBelowThreshold,
      error_message: input.errorMessage ?? null,
      completed_at: new Date().toISOString(),
    })
    .eq("id", runId);

  if (error) {
    throw error;
  }
}

export async function insertAdoptionFromMatch(
  supabase: SupabaseClient,
  input: {
    projectId: string;
    userId: string;
    voiceResponseId: string;
    devlogId: string;
    voiceVersionKey: string;
    publishedVersion: string;
    playerQuote: string;
    updateSummary: string;
    promptText: string | null;
    confidence: number;
    model: string;
    matcherRunId: string;
  },
): Promise<void> {
  const { error } = await supabase.from("voice_adoptions").insert({
    project_id: input.projectId,
    user_id: input.userId,
    voice_response_id: input.voiceResponseId,
    devlog_id: input.devlogId,
    voice_version_key: input.voiceVersionKey,
    published_version: input.publishedVersion,
    player_quote: input.playerQuote,
    update_summary: input.updateSummary,
    prompt_text: input.promptText,
    confidence: input.confidence,
    model: input.model,
    model_version: input.model,
    matcher_run_id: input.matcherRunId,
    status: "active",
  });

  if (error) {
    throw error;
  }
}

export async function verifyProjectOwner(
  supabase: SupabaseClient,
  projectId: string,
  userId: string,
): Promise<boolean> {
  const { data, error } = await supabase
    .from("projects")
    .select("owner_id")
    .eq("id", projectId)
    .maybeSingle();

  if (error || !data) {
    return false;
  }

  return (data as { owner_id: string }).owner_id === userId;
}

export type MatcherRunSummary = {
  runId: string;
  status: "completed" | "failed" | "skipped";
  candidateCount: number;
  adoptedCount: number;
  skippedBelowThreshold: number;
  mode: "fixture" | "live";
  matches: MatcherMatchResult[];
};
