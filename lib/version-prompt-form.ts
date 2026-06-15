import {
  MAX_PROMPTS_PER_VERSION,
  REPLAY_INTENT_OPTIONS,
  YES_NO_OPTIONS,
  type VersionPrompt,
  type VersionPromptOption,
  type VersionPromptResponseKind,
} from "@/lib/version-prompt-types";

export type DeveloperPromptDraft = {
  clientId: string;
  id?: string;
  promptText: string;
  responseKind: VersionPromptResponseKind;
  /** choice 用: 2 | 3 | 4 */
  choiceCount?: number;
  /** choice 用: 長さ = choiceCount */
  choiceOptions?: string[];
  /** @deprecated 読み込み互換のみ */
  choiceLabels?: string;
};

export type DeveloperPromptInput = {
  id?: string;
  promptText: string;
  responseKind: VersionPromptResponseKind;
  options?: VersionPromptOption[];
};

export type PromptDraftValidation = {
  blocking: boolean;
  message: string | null;
};

export const MIN_CHOICE_COUNT = 2;
export const MAX_CHOICE_COUNT = 4;
export const DEFAULT_CHOICE_COUNT = 3;
export const MAX_CHOICE_LABEL_LENGTH = 40;
export const CHOICE_COUNT_OPTIONS = [2, 3, 4] as const;

export const DEVELOPER_RESPONSE_KIND_OPTIONS: {
  value: VersionPromptResponseKind;
  label: string;
  hint: string;
}[] = [
  {
    value: "yes_no",
    label: "はい / いいえ",
    hint: "シンプルな可否確認",
  },
  {
    value: "scale_3",
    label: "3段階（低・普通・高）",
    hint: "難易度や満足度など",
  },
  {
    value: "replay_intent",
    label: "もう一度遊びたい？",
    hint: "継続プレイ意向（3択固定）",
  },
  {
    value: "short_text",
    label: "自由記述（短文）",
    hint: "プレイヤーが短く自由に答えられます",
  },
  {
    value: "choice",
    label: "カスタム選択肢",
    hint: "2〜4個の選択肢を設定",
  },
];

export const SCALE_3_OPTIONS: VersionPromptOption[] = [
  { id: "low", label: "低い" },
  { id: "mid", label: "普通" },
  { id: "high", label: "高い" },
];

function newClientId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `draft-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function clampChoiceCount(count: number): number {
  return Math.min(MAX_CHOICE_COUNT, Math.max(MIN_CHOICE_COUNT, count));
}

function emptyChoiceOptions(count: number = DEFAULT_CHOICE_COUNT): string[] {
  return Array.from({ length: clampChoiceCount(count) }, () => "");
}

export function createEmptyPromptDraft(): DeveloperPromptDraft {
  return {
    clientId: newClientId(),
    promptText: "",
    responseKind: "yes_no",
  };
}

export function createDefaultChoiceDraftPatch(): Pick<
  DeveloperPromptDraft,
  "choiceCount" | "choiceOptions"
> {
  return {
    choiceCount: DEFAULT_CHOICE_COUNT,
    choiceOptions: emptyChoiceOptions(DEFAULT_CHOICE_COUNT),
  };
}

export function draftFromVersionPrompt(prompt: VersionPrompt): DeveloperPromptDraft {
  if (prompt.responseKind === "choice" && prompt.options?.length) {
    const labels = prompt.options.map((option) => option.label);
    const choiceCount = clampChoiceCount(labels.length);
    const choiceOptions = [...labels.slice(0, choiceCount)];
    while (choiceOptions.length < choiceCount) {
      choiceOptions.push("");
    }

    return {
      clientId: prompt.id,
      id: prompt.id,
      promptText: prompt.promptText,
      responseKind: prompt.responseKind,
      choiceCount,
      choiceOptions,
    };
  }

  const choiceLabels =
    prompt.responseKind === "choice" && prompt.options?.length
      ? prompt.options.map((option) => option.label).join("\n")
      : undefined;

  return {
    clientId: prompt.id,
    id: prompt.id,
    promptText: prompt.promptText,
    responseKind: prompt.responseKind,
    choiceLabels,
  };
}

function slugifyOptionId(label: string, index: number): string {
  const base = label
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^\w\u3040-\u30ff\u4e00-\u9faf-]/g, "");
  return base || `option_${index + 1}`;
}

export function parseChoiceLabels(raw: string | undefined): VersionPromptOption[] {
  if (!raw?.trim()) {
    return [];
  }

  const labels = raw
    .split(/[\n,、]/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, MAX_CHOICE_COUNT);

  return buildChoiceOptionsFromLabels(labels);
}

export function buildChoiceOptionsFromLabels(
  labels: string[],
): VersionPromptOption[] {
  const seen = new Set<string>();
  return labels
    .map((label) => label.trim())
    .filter(Boolean)
    .slice(0, MAX_CHOICE_COUNT)
    .map((label, index) => {
      let id = slugifyOptionId(label, index);
      while (seen.has(id)) {
        id = `${id}_${index + 1}`;
      }
      seen.add(id);
      return { id, label };
    });
}

function getChoiceLabelsForDraft(draft: DeveloperPromptDraft): string[] {
  if (draft.choiceOptions?.length) {
    return draft.choiceOptions
      .map((label) => label.trim())
      .filter(Boolean)
      .slice(0, MAX_CHOICE_COUNT);
  }

  if (draft.choiceLabels?.trim()) {
    return parseChoiceLabels(draft.choiceLabels).map((option) => option.label);
  }

  return [];
}

export function resolveOptionsForDraft(
  draft: DeveloperPromptDraft,
): VersionPromptOption[] | undefined {
  switch (draft.responseKind) {
    case "yes_no":
      return YES_NO_OPTIONS;
    case "scale_3":
      return SCALE_3_OPTIONS;
    case "replay_intent":
      return REPLAY_INTENT_OPTIONS;
    case "short_text":
      return undefined;
    case "choice":
      return buildChoiceOptionsFromLabels(getChoiceLabelsForDraft(draft));
    default:
      return undefined;
  }
}

export function validatePromptDrafts(
  drafts: DeveloperPromptDraft[],
): PromptDraftValidation {
  for (let index = 0; index < drafts.length; index += 1) {
    const draft = drafts[index]!;
    const questionNum = index + 1;
    const promptText = draft.promptText.trim();

    if (!promptText || draft.responseKind !== "choice") {
      continue;
    }

    const options = draft.choiceOptions ?? emptyChoiceOptions(draft.choiceCount);

    for (let optionIndex = 0; optionIndex < options.length; optionIndex += 1) {
      const label = options[optionIndex] ?? "";
      if (label.length > MAX_CHOICE_LABEL_LENGTH) {
        return {
          blocking: true,
          message: `問い${questionNum}: 選択肢${optionIndex + 1}は${MAX_CHOICE_LABEL_LENGTH}文字以内にしてください`,
        };
      }
    }

    const validCount = getChoiceLabelsForDraft(draft).length;
    if (validCount < MIN_CHOICE_COUNT) {
      return {
        blocking: true,
        message: `問い${questionNum}: 選択肢は2個以上入力してください`,
      };
    }
  }

  return { blocking: false, message: null };
}

export function sanitizePromptDrafts(
  drafts: DeveloperPromptDraft[],
): DeveloperPromptInput[] {
  const trimmed = drafts
    .map((draft) => ({
      ...draft,
      promptText: draft.promptText.trim(),
    }))
    .filter((draft) => draft.promptText.length > 0)
    .slice(0, MAX_PROMPTS_PER_VERSION);

  const results: DeveloperPromptInput[] = [];

  for (const draft of trimmed) {
    const options = resolveOptionsForDraft(draft);
    if (draft.responseKind === "choice" && (!options || options.length < MIN_CHOICE_COUNT)) {
      continue;
    }

    results.push({
      id: draft.id,
      promptText: draft.promptText,
      responseKind: draft.responseKind,
      options: options ?? undefined,
    });
  }

  return results;
}
