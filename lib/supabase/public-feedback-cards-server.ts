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
  const { data, error } = await supabase.rpc("get_public_feedback_cards", {
    p_project_id: projectId,
    p_version_key: resolvePlayableVersion(versionKey),
    p_include_guest: true,
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
  const versionSets = await Promise.all([
    supabase
      .from("project_voice_responses")
      .select("version_key")
      .eq("project_id", projectId)
      .eq("moderation_status", "visible"),
    supabase
      .from("project_guest_voice_responses")
      .select("version_key")
      .eq("project_id", projectId)
      .eq("moderation_status", "visible")
      .eq("include_in_public_aggregate", true),
    supabase
      .from("project_feedback")
      .select("version_key")
      .eq("project_id", projectId)
      .eq("moderation_status", "visible"),
    supabase
      .from("project_guest_feedback")
      .select("version_key")
      .eq("project_id", projectId)
      .eq("moderation_status", "visible")
      .eq("include_in_public_aggregate", true),
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

export async function fetchPublicFeedbackCardsEnriched(
  supabase: SupabaseClient,
  projectId: string,
  options?: {
    versionKey?: string | "all";
    limit?: number;
  },
): Promise<PublicFeedbackCard[]> {
  const limit = Math.min(Math.max(options?.limit ?? 50, 1), 100);
  const versionParam = options?.versionKey ?? resolvePlayableVersion(undefined);

  const versionKeys =
    versionParam === "all"
      ? await listPublicFeedbackVersionKeys(supabase, projectId)
      : [resolvePlayableVersion(versionParam)];

  if (versionKeys.length === 0) {
    return [];
  }

  const cards: PublicFeedbackCard[] = [];

  for (const versionKey of versionKeys) {
    const rows = await fetchRpcCards(supabase, projectId, versionKey, limit);
    for (const row of rows) {
      const card = rowToCard(row, versionKey);
      if (!card) {
        continue;
      }
      cards.push(await enrichCard(supabase, projectId, versionKey, card));
    }
  }

  return cards.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}
