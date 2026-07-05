import {
  REPLAY_INTENT_OPTIONS,
  YES_NO_OPTIONS,
  isFreeTextResponseKind,
  type VersionPromptOption,
  type VersionPromptResponseKind,
} from "@/lib/version-prompt-types";
import { SCALE_3_OPTIONS } from "@/lib/version-prompt-form";

export type VoiceAggregateBucket = {
  answerValue: string;
  answerLabel: string;
  count: number;
};

export type VoicePromptAggregate = {
  promptId: string;
  promptText: string;
  responseKind: VersionPromptResponseKind;
  options?: VersionPromptOption[];
  sortOrder: number;
  source: string;
  totalResponses: number;
  buckets: VoiceAggregateBucket[];
};

export type PublicVoiceAggregateRow = {
  prompt_id: string;
  prompt_text: string;
  response_kind: VersionPromptResponseKind;
  options: VersionPromptOption[] | null;
  sort_order: number;
  source: string;
  answer_value: string | null;
  answer_label: string | null;
  response_count: number;
};

function defaultOptionsForResponseKind(
  responseKind: VersionPromptResponseKind,
): VersionPromptOption[] {
  switch (responseKind) {
    case "yes_no":
      return YES_NO_OPTIONS;
    case "scale_3":
      return SCALE_3_OPTIONS;
    case "replay_intent":
      return REPLAY_INTENT_OPTIONS;
    default:
      return [];
  }
}

/** Public みんなのFB — option id ベースの短いラベル。answer_label の自由記述は使わない */
export function resolvePublicAggregateBucketLabel(
  responseKind: VersionPromptResponseKind,
  answerValue: string,
  options?: VersionPromptOption[],
): string {
  const optionList =
    options && options.length > 0 ? options : defaultOptionsForResponseKind(responseKind);
  const match = optionList.find((option) => option.id === answerValue);
  return match?.label ?? answerValue;
}

function mergeChoiceBuckets(aggregate: VoicePromptAggregate): VoicePromptAggregate {
  if (isFreeTextResponseKind(aggregate.responseKind) || aggregate.buckets.length === 0) {
    return aggregate;
  }

  const merged = new Map<string, VoiceAggregateBucket>();
  for (const bucket of aggregate.buckets) {
    const existing = merged.get(bucket.answerValue);
    if (existing) {
      existing.count += bucket.count;
      continue;
    }
    merged.set(bucket.answerValue, {
      answerValue: bucket.answerValue,
      answerLabel: resolvePublicAggregateBucketLabel(
        aggregate.responseKind,
        bucket.answerValue,
        aggregate.options,
      ),
      count: bucket.count,
    });
  }

  const buckets = [...merged.values()].sort((a, b) => b.count - a.count);
  return {
    ...aggregate,
    buckets,
    totalResponses: buckets.reduce((sum, bucket) => sum + bucket.count, 0),
  };
}

export function buildVoicePromptAggregates(
  rows: PublicVoiceAggregateRow[],
): VoicePromptAggregate[] {
  const byPrompt = new Map<string, VoicePromptAggregate>();

  for (const row of rows) {
    let aggregate = byPrompt.get(row.prompt_id);
    if (!aggregate) {
      aggregate = {
        promptId: row.prompt_id,
        promptText: row.prompt_text,
        responseKind: row.response_kind,
        options: row.options ?? undefined,
        sortOrder: row.sort_order,
        source: row.source,
        totalResponses: 0,
        buckets: [],
      };
      byPrompt.set(row.prompt_id, aggregate);
    }

    if (row.response_count <= 0) {
      continue;
    }

    if (row.answer_value) {
      aggregate.buckets.push({
        answerValue: row.answer_value,
        answerLabel: resolvePublicAggregateBucketLabel(
          row.response_kind,
          row.answer_value,
          row.options ?? undefined,
        ),
        count: Number(row.response_count),
      });
      continue;
    }

    if (isFreeTextResponseKind(row.response_kind)) {
      aggregate.totalResponses += Number(row.response_count);
    }
  }

  return [...byPrompt.values()]
    .map(mergeChoiceBuckets)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export function bucketPercent(count: number, total: number): number {
  if (total <= 0) {
    return 0;
  }
  return Math.round((count / total) * 100);
}

/** 公開側「みんなのFB」で傾向（割合・棒）を出す最低回答数 */
export const PUBLIC_VOICE_TREND_MIN_RESPONSES = 3;

export function canShowPublicVoiceTrend(totalResponses: number): boolean {
  return totalResponses >= PUBLIC_VOICE_TREND_MIN_RESPONSES;
}

export function topVoiceAggregateBucket(
  aggregate: VoicePromptAggregate,
): VoiceAggregateBucket | null {
  if (aggregate.buckets.length === 0) {
    return null;
  }

  return [...aggregate.buckets].sort((a, b) => b.count - a.count)[0] ?? null;
}
