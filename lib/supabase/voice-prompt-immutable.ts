import type { SupabaseClient } from "@supabase/supabase-js";
import type { DeveloperPromptInput } from "@/lib/version-prompt-form";
import type {
  VersionPromptOption,
  VersionPromptResponseKind,
} from "@/lib/version-prompt-types";
import type { PublicVoiceAggregateRow } from "@/lib/voice-aggregates";

export type PromptAggregateSource = {
  id: string;
  prompt_text: string;
  response_kind: VersionPromptResponseKind;
  options: VersionPromptOption[] | null;
  sort_order: number;
  source: string;
  archived_at: string | null;
  created_at: string;
};

function optionsEqual(
  a: VersionPromptOption[] | null | undefined,
  b: VersionPromptOption[] | null | undefined,
): boolean {
  return JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
}

export function promptContentChanged(
  existing: PromptAggregateSource,
  incoming: DeveloperPromptInput,
): boolean {
  return (
    existing.prompt_text.trim() !== incoming.promptText.trim() ||
    existing.response_kind !== incoming.responseKind ||
    !optionsEqual(existing.options, incoming.options ?? null)
  );
}

export function isPromptEligibleForAggregates(
  prompt: Pick<PromptAggregateSource, "id" | "archived_at">,
  responseCountByPromptId: Map<string, number>,
): boolean {
  if (!prompt.archived_at) {
    return true;
  }
  return (responseCountByPromptId.get(prompt.id) ?? 0) > 0;
}

export function sortPromptsForAggregates(
  prompts: PromptAggregateSource[],
): PromptAggregateSource[] {
  return [...prompts].sort((a, b) => {
    const aActive = a.archived_at ? 1 : 0;
    const bActive = b.archived_at ? 1 : 0;
    if (aActive !== bActive) {
      return aActive - bActive;
    }
    if (a.sort_order !== b.sort_order) {
      return a.sort_order - b.sort_order;
    }
    return a.created_at.localeCompare(b.created_at);
  });
}

export async function fetchResponseCountsByPromptId(
  supabase: SupabaseClient,
  projectId: string,
  versionKey: string,
  promptIds?: string[],
): Promise<Map<string, number>> {
  let query = supabase
    .from("project_voice_responses")
    .select("prompt_id")
    .eq("project_id", projectId)
    .eq("version_key", versionKey);

  if (promptIds && promptIds.length > 0) {
    query = query.in("prompt_id", promptIds);
  }

  const { data, error } = await query;
  if (error) {
    return new Map();
  }

  const counts = new Map<string, number>();
  for (const row of data ?? []) {
    const promptId = row.prompt_id as string;
    counts.set(promptId, (counts.get(promptId) ?? 0) + 1);
  }
  return counts;
}

export function buildVoiceAggregateRows(
  prompts: PromptAggregateSource[],
  responses: {
    prompt_id: string;
    answer_value: string;
    answer_label: string | null;
  }[],
): PublicVoiceAggregateRow[] {
  const counts = new Map<string, Map<string, { label: string; count: number }>>();

  for (const row of responses) {
    const promptId = row.prompt_id;
    const value = row.answer_value;
    const label = row.answer_label ?? value;
    if (!counts.has(promptId)) {
      counts.set(promptId, new Map());
    }
    const bucket = counts.get(promptId)!;
    const current = bucket.get(value) ?? { label, count: 0 };
    bucket.set(value, { label: current.label, count: current.count + 1 });
  }

  const responseCountByPromptId = new Map<string, number>();
  for (const [promptId, bucket] of counts) {
    let total = 0;
    for (const { count } of bucket.values()) {
      total += count;
    }
    responseCountByPromptId.set(promptId, total);
  }

  const eligible = sortPromptsForAggregates(
    prompts.filter((prompt) =>
      isPromptEligibleForAggregates(prompt, responseCountByPromptId),
    ),
  );

  const rows: PublicVoiceAggregateRow[] = [];

  for (const prompt of eligible) {
    const promptCounts = counts.get(prompt.id);
    if (!promptCounts || promptCounts.size === 0) {
      rows.push({
        prompt_id: prompt.id,
        prompt_text: prompt.prompt_text,
        response_kind: prompt.response_kind,
        options: prompt.options,
        sort_order: prompt.sort_order,
        source: prompt.source,
        answer_value: null,
        answer_label: null,
        response_count: 0,
      });
      continue;
    }

    for (const [answerValue, { label, count }] of promptCounts) {
      rows.push({
        prompt_id: prompt.id,
        prompt_text: prompt.prompt_text,
        response_kind: prompt.response_kind,
        options: prompt.options,
        sort_order: prompt.sort_order,
        source: prompt.source,
        answer_value: answerValue,
        answer_label: label,
        response_count: count,
      });
    }
  }

  return rows;
}
