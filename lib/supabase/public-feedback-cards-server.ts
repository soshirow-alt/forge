import type { SupabaseClient } from "@supabase/supabase-js";
import {
  comparePlayableVersions,
  resolvePlayableVersion,
} from "@/lib/playable-version";
import type { PublicFeedbackCard } from "@/lib/public-feedback-cards";
import {
  resolvePublicAggregateBucketLabel,
  type PublicVoiceAggregateRow,
} from "@/lib/voice-aggregates";
import type { VersionPromptResponseKind } from "@/lib/version-prompt-types";

type PublicFeedbackCardRow = {
  card_id: string;
  card_kind: string;
  created_at: string;
  author_kind: string;
  author_display_name: string | null;
  author_avatar_url: string | null;
  author_x_username?: string | null;
  prompt_text: string | null;
  body_text: string | null;
  good_points: string | null;
  concerns: string | null;
  bugs: string | null;
  other_notes: string | null;
  empathy_count: number | string;
};

type ResolvedCardTarget = {
  target_source: string;
  target_id: string;
};

type PromptMeta = {
  response_kind: VersionPromptResponseKind;
  options: PublicVoiceAggregateRow["options"];
};

function isPublicFeedbackCardKind(value: string): value is PublicFeedbackCard["cardKind"] {
  return value === "voice_supplement" || value === "short_text" || value === "detailed";
}

function isPublicFeedbackAuthorKind(
  value: string,
): value is PublicFeedbackCard["authorKind"] {
  return value === "guest" || value === "registered";
}

function rowToCard(row: PublicFeedbackCardRow, versionKey: string): PublicFeedbackCard | null {
  if (!isPublicFeedbackCardKind(row.card_kind)) {
    return null;
  }
  if (!isPublicFeedbackAuthorKind(row.author_kind)) {
    return null;
  }

  return {
    cardId: row.card_id,
    cardKind: row.card_kind,
    versionKey,
    createdAt: row.created_at,
    authorKind: row.author_kind,
    authorDisplayName: row.author_display_name,
    authorAvatarUrl: row.author_avatar_url,
    authorXUsername: row.author_x_username?.trim() || null,
    promptText: row.prompt_text,
    bodyText: row.body_text,
    goodPoints: row.good_points,
    concerns: row.concerns,
    bugs: row.bugs,
    otherNotes: row.other_notes,
    empathyCount: Number(row.empathy_count) || 0,
  };
}

async function fetchRpcCards(
  supabase: SupabaseClient,
  projectId: string,
  versionKey: string,
  limit: number,
): Promise<PublicFeedbackCardRow[]> {
  // Public 「みんなのFB」は登録ユーザーの永続データのみ。ゲスト行は表示・件数に含めない。
  const { data, error } = await supabase.rpc("get_public_feedback_cards", {
    p_project_id: projectId,
    p_version_key: resolvePlayableVersion(versionKey),
    p_include_guest: false,
    p_limit: limit,
    p_offset: 0,
  });

  if (error) {
    return [];
  }

  return (data ?? []) as PublicFeedbackCardRow[];
}

async function resolveChoiceAnswerLabel(
  supabase: SupabaseClient,
  projectId: string,
  versionKey: string,
  cardId: string,
): Promise<string | null> {
  const { data: resolved, error } = await supabase.rpc("resolve_feedback_card_id", {
    p_card_id: cardId,
    p_project_id: projectId,
    p_version_key: resolvePlayableVersion(versionKey),
  });

  if (error || !resolved?.length) {
    return null;
  }

  const target = resolved[0] as ResolvedCardTarget;
  if (target.target_source !== "registered_voice" && target.target_source !== "guest_voice") {
    return null;
  }

  const table =
    target.target_source === "registered_voice"
      ? "project_voice_responses"
      : "project_guest_voice_responses";

  const { data: voiceRow } = await supabase
    .from(table)
    .select("answer_label, answer_value, prompt_id")
    .eq("id", target.target_id)
    .maybeSingle();

  if (!voiceRow) {
    return null;
  }

  const { data: promptRow } = await supabase
    .from("project_version_prompts")
    .select("response_kind, options")
    .eq("id", voiceRow.prompt_id)
    .maybeSingle();

  const promptMeta = promptRow as PromptMeta | null;
  if (promptMeta?.response_kind) {
    return resolvePublicAggregateBucketLabel(
      promptMeta.response_kind,
      String(voiceRow.answer_value),
      promptMeta.options ?? undefined,
    );
  }

  const trimmedLabel = voiceRow.answer_label?.trim();
  return trimmedLabel || String(voiceRow.answer_value);
}

async function enrichCard(
  supabase: SupabaseClient,
  projectId: string,
  versionKey: string,
  card: PublicFeedbackCard,
): Promise<PublicFeedbackCard> {
  if (card.cardKind !== "voice_supplement") {
    return card;
  }

  const choiceAnswerLabel = await resolveChoiceAnswerLabel(
    supabase,
    projectId,
    versionKey,
    card.cardId,
  );

  return {
    ...card,
    choiceAnswerLabel,
  };
}

export async function listPublicFeedbackVersionKeys(
  supabase: SupabaseClient,
  projectId: string,
): Promise<string[]> {
  // Registered sources only — guest tables must not surface empty/non-empty version filters.
  const versionSets = await Promise.all([
    supabase
      .from("project_voice_responses")
      .select("version_key")
      .eq("project_id", projectId)
      .eq("moderation_status", "visible"),
    supabase
      .from("project_feedback")
      .select("version_key")
      .eq("project_id", projectId)
      .eq("moderation_status", "visible"),
  ]);

  const versions = new Set<string>();
  for (const result of versionSets) {
    for (const row of result.data ?? []) {
      if (row.version_key) {
        versions.add(String(row.version_key));
      }
    }
  }

  return [...versions].sort((a, b) => comparePlayableVersions(b, a));
}

/**
 * Distinct registered users who contributed any publicly listable feedback text
 * for the given version scope. One user = one count even with multiple prompts / deep FB.
 */
export async function countPublicFeedbackParticipants(
  supabase: SupabaseClient,
  projectId: string,
  versionKeys: string[],
): Promise<number> {
  if (versionKeys.length === 0) {
    return 0;
  }

  const [voiceResult, feedbackResult] = await Promise.all([
    supabase
      .from("project_voice_responses")
      .select("user_id, answer_value, optional_comment, prompt_id")
      .eq("project_id", projectId)
      .eq("moderation_status", "visible")
      .in("version_key", versionKeys),
    supabase
      .from("project_feedback")
      .select("user_id, good_points, concerns, bugs, other_notes")
      .eq("project_id", projectId)
      .eq("moderation_status", "visible")
      .in("version_key", versionKeys),
  ]);

  const participants = new Set<string>();

  for (const row of feedbackResult.data ?? []) {
    const hasText =
      Boolean(row.good_points?.trim()) ||
      Boolean(row.concerns?.trim()) ||
      Boolean(row.bugs?.trim()) ||
      Boolean(row.other_notes?.trim());
    if (hasText && row.user_id) {
      participants.add(String(row.user_id));
    }
  }

  const promptIds = [
    ...new Set(
      (voiceResult.data ?? [])
        .map((row) => row.prompt_id)
        .filter((id): id is string => Boolean(id)),
    ),
  ];

  const promptKindById = new Map<string, string>();
  if (promptIds.length > 0) {
    const { data: prompts } = await supabase
      .from("project_version_prompts")
      .select("id, response_kind")
      .in("id", promptIds);
    for (const prompt of prompts ?? []) {
      promptKindById.set(String(prompt.id), String(prompt.response_kind));
    }
  }

  for (const row of voiceResult.data ?? []) {
    if (!row.user_id) {
      continue;
    }
    const kind = promptKindById.get(String(row.prompt_id));
    const hasPublicText =
      (kind === "short_text" && Boolean(String(row.answer_value ?? "").trim())) ||
      Boolean(String(row.optional_comment ?? "").trim());
    if (hasPublicText) {
      participants.add(String(row.user_id));
    }
  }

  return participants.size;
}

export async function fetchPublicFeedbackCardsEnriched(
  supabase: SupabaseClient,
  projectId: string,
  options?: {
    versionKey?: string | "all";
    limit?: number;
  },
): Promise<{ cards: PublicFeedbackCard[]; participantCount: number }> {
  const limit = Math.min(Math.max(options?.limit ?? 50, 1), 100);
  const versionParam = options?.versionKey ?? resolvePlayableVersion(undefined);

  const versionKeys =
    versionParam === "all"
      ? await listPublicFeedbackVersionKeys(supabase, projectId)
      : [resolvePlayableVersion(versionParam)];

  if (versionKeys.length === 0) {
    return { cards: [], participantCount: 0 };
  }

  const cards: PublicFeedbackCard[] = [];

  for (const versionKey of versionKeys) {
    const rows = await fetchRpcCards(supabase, projectId, versionKey, limit);
    for (const row of rows) {
      const card = rowToCard(row, versionKey);
      if (!card) {
        continue;
      }
      // Defense in depth: never surface guest cards on the public list.
      if (card.authorKind === "guest") {
        continue;
      }
      cards.push(await enrichCard(supabase, projectId, versionKey, card));
    }
  }

  const sorted = cards.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
  const participantCount = await countPublicFeedbackParticipants(
    supabase,
    projectId,
    versionKeys,
  );

  return { cards: sorted, participantCount };
}
