import type { SupabaseClient } from "@supabase/supabase-js";
import {
  comparePlayableVersions,
  resolvePlayableVersion,
} from "@/lib/playable-version";
import { shouldIncludeGuestInPublicFeedbackCards } from "@/lib/public-feedback-include-guest";
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
  reply_count?: number | string;
  viewer_has_empathy?: boolean;
  viewer_can_empathy?: boolean;
  developer_marked_helpful?: boolean;
  viewer_is_project_owner?: boolean;
  viewer_can_reply?: boolean;
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

type CardWithTarget = {
  card: PublicFeedbackCard;
  targetSource: string;
  targetId: string;
};

function rowToCard(row: PublicFeedbackCardRow, versionKey: string): CardWithTarget | null {
  if (!isPublicFeedbackCardKind(row.card_kind)) {
    return null;
  }
  if (!isPublicFeedbackAuthorKind(row.author_kind)) {
    return null;
  }

  return {
    card: {
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
      replyCount: Number(row.reply_count) || 0,
      viewerHasEmpathy: Boolean(row.viewer_has_empathy),
      viewerCanEmpathy: row.viewer_can_empathy !== false,
      developerMarkedHelpful: Boolean(row.developer_marked_helpful),
      viewerIsProjectOwner: Boolean(row.viewer_is_project_owner),
      viewerCanReply: Boolean(row.viewer_can_reply),
    },
    targetSource: row.target_source,
    targetId: row.target_id,
  };
}

async function fetchRpcCards(
  /** Must carry the viewer session so auth.uid() populates viewer_* flags. */
  viewerSupabase: SupabaseClient,
  projectId: string,
  versionKey: string,
  limit: number,
): Promise<PublicFeedbackCardRow[]> {
  // Public 「みんなのFB」は登録ユーザーの永続データのみ。ゲスト行は IA Preview のみ。
  const includeGuest = shouldIncludeGuestInPublicFeedbackCards();
  const { data, error } = await viewerSupabase.rpc("get_public_feedback_cards", {
    p_project_id: projectId,
    p_version_key: resolvePlayableVersion(versionKey),
    p_include_guest: includeGuest,
    p_limit: limit,
    p_offset: 0,
  });

  if (error) {
    return [];
  }

  return (data ?? []) as PublicFeedbackCardRow[];
}

async function resolveChoiceAnswerLabels(
  supabase: SupabaseClient,
  targets: CardWithTarget[],
): Promise<Map<string, string>> {
  const targetIds = [
    ...new Set(
      targets
        .filter(
          (item) =>
            item.card.cardKind === "voice_supplement" &&
            item.targetSource === "registered_voice",
        )
        .map((item) => item.targetId),
    ),
  ];
  if (targetIds.length === 0) {
    return new Map();
  }

  const { data: voiceRows } = await supabase
    .from("project_voice_responses")
    .select("id, answer_label, answer_value, prompt_id")
    .in("id", targetIds);
  const promptIds = [
    ...new Set((voiceRows ?? []).map((row) => String(row.prompt_id)).filter(Boolean)),
  ];
  const promptById = new Map<string, PromptMeta>();
  if (promptIds.length > 0) {
    const { data: promptRows } = await supabase
      .from("project_version_prompts")
      .select("id, response_kind, options")
      .in("id", promptIds);
    for (const row of promptRows ?? []) {
      promptById.set(String(row.id), row as PromptMeta);
    }
  }

  const labels = new Map<string, string>();
  for (const row of voiceRows ?? []) {
    const prompt = promptById.get(String(row.prompt_id));
    const answerValue = String(row.answer_value ?? "");
    const label = prompt?.response_kind
      ? resolvePublicAggregateBucketLabel(
          prompt.response_kind,
          answerValue,
          prompt.options ?? undefined,
        )
      : row.answer_label?.trim() || answerValue;
    if (label) {
      labels.set(String(row.id), label);
    }
  }
  return labels;
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

export async function listProjectFeedbackVersionKeys(
  supabase: SupabaseClient,
  projectId: string,
  currentVersion: string,
): Promise<string[]> {
  const sources = await Promise.all([
    supabase
      .from("project_version_prompts")
      .select("version_key")
      .eq("project_id", projectId),
    supabase
      .from("project_voice_responses")
      .select("version_key")
      .eq("project_id", projectId),
    supabase
      .from("project_feedback")
      .select("version_key")
      .eq("project_id", projectId),
    supabase
      .from("project_devlogs")
      .select("published_version")
      .eq("project_id", projectId),
  ]);

  const versions = new Set<string>([resolvePlayableVersion(currentVersion)]);
  for (const result of sources.slice(0, 3)) {
    for (const row of result.data ?? []) {
      if ("version_key" in row && row.version_key) {
        versions.add(resolvePlayableVersion(String(row.version_key)));
      }
    }
  }
  for (const row of sources[3].data ?? []) {
    if ("published_version" in row && row.published_version) {
      versions.add(resolvePlayableVersion(String(row.published_version)));
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

export async function countPublicFeedbackParticipantsByVersion(
  supabase: SupabaseClient,
  projectId: string,
  versionKeys: string[],
): Promise<{ all: number; byVersion: Record<string, number> }> {
  const [voiceResult, feedbackResult] = await Promise.all([
    supabase
      .from("project_voice_responses")
      .select("user_id, version_key")
      .eq("project_id", projectId)
      .eq("moderation_status", "visible")
      .in("version_key", versionKeys),
    supabase
      .from("project_feedback")
      .select("user_id, version_key")
      .eq("project_id", projectId)
      .eq("moderation_status", "visible")
      .in("version_key", versionKeys),
  ]);

  const allParticipants = new Set<string>();
  const participantsByVersion = new Map(
    versionKeys.map((versionKey) => [versionKey, new Set<string>()]),
  );
  for (const row of [...(voiceResult.data ?? []), ...(feedbackResult.data ?? [])]) {
    if (!row.user_id || !row.version_key) {
      continue;
    }
    const userId = String(row.user_id);
    const versionKey = resolvePlayableVersion(String(row.version_key));
    allParticipants.add(userId);
    participantsByVersion.get(versionKey)?.add(userId);
  }

  return {
    all: allParticipants.size,
    byVersion: Object.fromEntries(
      versionKeys.map((versionKey) => [
        versionKey,
        participantsByVersion.get(versionKey)?.size ?? 0,
      ]),
    ),
  };
}

export async function fetchPublicFeedbackCardsEnriched(
  /**
   * Viewer-scoped client (cookie/session). Used for get_public_feedback_cards
   * so viewer_can_empathy / viewer_has_empathy / viewer_can_reply reflect auth.uid().
   * Do not pass service_role here — auth.uid() is null and empathy toggles stay disabled.
   */
  viewerSupabase: SupabaseClient,
  projectId: string,
  options?: {
    versionKey?: string | "all";
    limit?: number;
    /**
     * Privileged client for enrichment that needs resolve_feedback_card_id
     * (EXECUTE is service_role-only after 071). Defaults to viewerSupabase.
     */
    enrichSupabase?: SupabaseClient;
  },
): Promise<{ cards: PublicFeedbackCard[]; participantCount: number }> {
  const limit = Math.min(Math.max(options?.limit ?? 50, 1), 100);
  const versionParam = options?.versionKey ?? resolvePlayableVersion(undefined);
  const enrichSupabase = options?.enrichSupabase ?? viewerSupabase;

  const versionKeys =
    versionParam === "all"
      ? await listPublicFeedbackVersionKeys(enrichSupabase, projectId)
      : [resolvePlayableVersion(versionParam)];

  if (versionKeys.length === 0) {
    return { cards: [], participantCount: 0 };
  }

  const rowsByVersion = await Promise.all(
    versionKeys.map(async (versionKey) => ({
      versionKey,
      rows: await fetchRpcCards(viewerSupabase, projectId, versionKey, limit),
    })),
  );
  const includeGuest = shouldIncludeGuestInPublicFeedbackCards();
  const targets = rowsByVersion.flatMap(({ versionKey, rows }) =>
    rows
      .map((row) => rowToCard(row, versionKey))
      .filter((item): item is CardWithTarget => item !== null)
      .filter((item) => includeGuest || item.card.authorKind !== "guest"),
  );
  const choiceLabels = await resolveChoiceAnswerLabels(enrichSupabase, targets);
  const cards = targets.map(({ card, targetSource, targetId }) =>
    card.cardKind === "voice_supplement" && targetSource === "registered_voice"
      ? { ...card, choiceAnswerLabel: choiceLabels.get(targetId) ?? null }
      : card,
  );

  const sorted = cards.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
  const participantCount = await countPublicFeedbackParticipants(
    enrichSupabase,
    projectId,
    versionKeys,
  );

  return { cards: sorted, participantCount };
}
