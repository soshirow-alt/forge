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
  /** choice 用。改行またはカンマ区切り */
  choiceLabels?: string;
};

export type DeveloperPromptInput = {
  id?: string;
  promptText: string;
  responseKind: VersionPromptResponseKind;
  options?: VersionPromptOption[];
};

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

export function createEmptyPromptDraft(): DeveloperPromptDraft {
  return {
    clientId: newClientId(),
    promptText: "",
    responseKind: "yes_no",
  };
}

export function draftFromVersionPrompt(prompt: VersionPrompt): DeveloperPromptDraft {
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
    .slice(0, 4);

  const seen = new Set<string>();
  return labels.map((label, index) => {
    let id = slugifyOptionId(label, index);
    while (seen.has(id)) {
      id = `${id}_${index + 1}`;
    }
    seen.add(id);
    return { id, label };
  });
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
      return parseChoiceLabels(draft.choiceLabels);
    default:
      return undefined;
  }
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
    if (draft.responseKind === "choice" && (!options || options.length < 2)) {
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
