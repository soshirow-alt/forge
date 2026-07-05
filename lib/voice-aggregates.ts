import {
  isFreeTextResponseKind,
  type VersionPromptOption,
  type VersionPromptResponseKind,
} from "@/lib/version-prompt-types";

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
        answerLabel: row.answer_label ?? row.answer_value,
        count: Number(row.response_count),
      });
      aggregate.totalResponses += Number(row.response_count);
      continue;
    }

    if (isFreeTextResponseKind(row.response_kind)) {
      aggregate.totalResponses += Number(row.response_count);
    }
  }

  return [...byPrompt.values()].sort((a, b) => a.sortOrder - b.sortOrder);
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
