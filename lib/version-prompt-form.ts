import {
  DEFAULT_REPLAY_PROMPT_TEXT,
  MAX_PROMPTS_PER_VERSION,
  REPLAY_INTENT_OPTIONS,
  YES_NO_OPTIONS,
  type VersionPrompt,
  type VersionPromptOption,
  type VersionPromptResponseKind,
} from "@/lib/version-prompt-types";

export type QuestionTemplateId = "replay" | "tutorial" | "difficulty" | "custom";

export type DeveloperPromptDraft = {
  clientId: string;
  id?: string;
  templateId?: QuestionTemplateId;
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

/** 回答形式（テンプレートと分離。replay_intent はテンプレート経由のみ） */
export const DEVELOPER_RESPONSE_FORMAT_OPTIONS: {
  value: Exclude<VersionPromptResponseKind, "replay_intent">;
  label: string;
  hint: string;
}[] = [
  {
    value: "yes_no",
    label: "はい / いいえ",
    hint: "シンプルな可否確認。プレイヤーは任意でひと言コメントも添えられます",
  },
  {
    value: "scale_3",
    label: "3段階",
    hint: "低・普通・高。プレイヤーは任意でひと言コメントも添えられます",
  },
  {
    value: "choice",
    label: "選択式",
    hint: "2〜4個の選択肢。プレイヤーは任意でひと言コメントも添えられます",
  },
  {
    value: "short_text",
    label: "自由記述",
    hint: "1000文字以内で自由に答えられます",
  },
];

/** Preset templates only（「デフォルト問い」系・カスタム選択肢なし） */
export const DEVELOPER_PRESET_QUESTION_TEMPLATES: {
  id: Exclude<QuestionTemplateId, "custom">;
  label: string;
  promptText: string;
  responseKind: VersionPromptResponseKind;
  formatLabel: string;
}[] = [
  {
    id: "replay",
    label: "もう一度遊びたい？",
    promptText: DEFAULT_REPLAY_PROMPT_TEXT,
    responseKind: "replay_intent",
    formatLabel: "3択（もう一度 / 更新次第 / 今は遊ばない）",
  },
  {
    id: "tutorial",
    label: "チュートリアルは分かりやすかった？",
    promptText: "チュートリアルは分かりやすかった？",
    responseKind: "yes_no",
    formatLabel: "はい / いいえ",
  },
  {
    id: "difficulty",
    label: "難易度はどうだった？",
    promptText: "難易度はどうだった？",
    responseKind: "scale_3",
    formatLabel: "3段階（低・普通・高）",
  },
];

/** @deprecated Prefer DEVELOPER_PRESET_QUESTION_TEMPLATES; custom is not a selectable template in UI */
export const DEVELOPER_QUESTION_TEMPLATES: {
  id: QuestionTemplateId;
  label: string;
  promptText: string;
  responseKind: VersionPromptResponseKind;
  formatLabel: string;
}[] = [
  ...DEVELOPER_PRESET_QUESTION_TEMPLATES,
  {
    id: "custom",
    label: "カスタム",
    promptText: "",
    responseKind: "yes_no",
    formatLabel: "下で質問文と回答形式を設定",
  },
];

/** @deprecated use DEVELOPER_RESPONSE_FORMAT_OPTIONS */
export const DEVELOPER_RESPONSE_KIND_OPTIONS: {
  value: VersionPromptResponseKind;
  label: string;
  hint: string;
}[] = [
  ...DEVELOPER_RESPONSE_FORMAT_OPTIONS,
  {
    value: "replay_intent",
    label: "もう一度遊びたい？（テンプレート）",
    hint: "質問テンプレートから選んでください",
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
    templateId: "custom",
    promptText: "",
    responseKind: "yes_no",
  };
}

export function inferTemplateFromDraft(
  draft: DeveloperPromptDraft,
): QuestionTemplateId {
  if (draft.templateId) {
    return draft.templateId;
  }

  const replay = DEVELOPER_QUESTION_TEMPLATES.find((t) => t.id === "replay")!;
  const tutorial = DEVELOPER_QUESTION_TEMPLATES.find((t) => t.id === "tutorial")!;
  const difficulty = DEVELOPER_QUESTION_TEMPLATES.find(
    (t) => t.id === "difficulty",
  )!;

  if (
    draft.promptText.trim() === replay.promptText &&
    draft.responseKind === "replay_intent"
  ) {
    return "replay";
  }

  if (
    draft.promptText.trim() === tutorial.promptText &&
    draft.responseKind === "yes_no"
  ) {
    return "tutorial";
  }

  if (
    draft.promptText.trim() === difficulty.promptText &&
    draft.responseKind === "scale_3"
  ) {
    return "difficulty";
  }

  return "custom";
}

export function applyQuestionTemplate(
  templateId: QuestionTemplateId,
): Pick<DeveloperPromptDraft, "templateId" | "promptText" | "responseKind"> {
  const template =
    DEVELOPER_QUESTION_TEMPLATES.find((entry) => entry.id === templateId) ??
    DEVELOPER_QUESTION_TEMPLATES.find((entry) => entry.id === "custom")!;

  return {
    templateId: template.id,
    promptText: template.promptText,
    responseKind: template.responseKind,
  };
}

/** 「デフォルト問いを使う」用 — 3プリセットのいずれかで下書きを開始 */
export function createPresetPromptDraft(
  templateId: Exclude<QuestionTemplateId, "custom"> = "replay",
): DeveloperPromptDraft {
  return {
    clientId: newClientId(),
    ...applyQuestionTemplate(templateId),
  };
}

/**
 * 保存済み問いからエディタのモードを復元する。
 * - 未保存（空）→ none（デフォルト問い）
 * - すべてプリセット一致 → none
 * - 1件でも自由入力 → custom
 */
export function resolvePromptEditorMode(
  drafts: DeveloperPromptDraft[],
): "none" | "custom" {
  if (drafts.length === 0) {
    return "none";
  }
  const active = drafts.filter((draft) => draft.promptText.trim().length > 0);
  if (active.length === 0) {
    return "none";
  }
  return active.every((draft) => inferTemplateFromDraft(draft) !== "custom")
    ? "none"
    : "custom";
}

export const OPTIONAL_FREE_TEXT_FORMAT_LABEL = "自由記述（任意）";

/** プレイヤーが構造化回答に添えられる任意コメント（集計は answer_value、開発者表示は answer_label） */
export function supportsOptionalFreeTextComment(
  responseKind: VersionPromptResponseKind,
): boolean {
  return responseKind !== "short_text";
}

export function buildVoiceAnswerLabel(
  primaryLabel: string,
  optionalComment?: string,
): string {
  const comment = optionalComment?.trim();
  if (!comment) {
    return primaryLabel;
  }
  return `${primaryLabel} — ${comment}`;
}

export function getFormatDisplayLinesForDraft(
  draft: DeveloperPromptDraft,
): string[] {
  const templateId = inferTemplateFromDraft(draft);
  if (templateId !== "custom") {
    const base =
      DEVELOPER_QUESTION_TEMPLATES.find((entry) => entry.id === templateId)
        ?.formatLabel ?? "";
    if (supportsOptionalFreeTextComment(draft.responseKind)) {
      return [base, OPTIONAL_FREE_TEXT_FORMAT_LABEL];
    }
    return [base];
  }

  const customLabel =
    DEVELOPER_RESPONSE_FORMAT_OPTIONS.find(
      (option) => option.value === draft.responseKind,
    )?.label ?? draft.responseKind;

  if (supportsOptionalFreeTextComment(draft.responseKind)) {
    return [customLabel, OPTIONAL_FREE_TEXT_FORMAT_LABEL];
  }

  return [customLabel];
}

export function getFormatLabelForDraft(draft: DeveloperPromptDraft): string {
  return getFormatDisplayLinesForDraft(draft).join(" · ");
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
      templateId: inferTemplateFromDraft({
        clientId: prompt.id,
        promptText: prompt.promptText,
        responseKind: prompt.responseKind,
      }),
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
    templateId: inferTemplateFromDraft({
      clientId: prompt.id,
      promptText: prompt.promptText,
      responseKind: prompt.responseKind,
    }),
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
  const filledCount = drafts.filter((draft) => draft.promptText.trim()).length;
  if (filledCount > MAX_PROMPTS_PER_VERSION) {
    return {
      blocking: true,
      message: `問いは最大${MAX_PROMPTS_PER_VERSION}問までです。余分な問いを削除してから保存してください`,
    };
  }

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
  // 超過分はここでは切らない（validatePromptDrafts でブロック）。既存超過データの誤削除を防ぐ。
  const trimmed = drafts
    .map((draft) => ({
      ...draft,
      promptText: draft.promptText.trim(),
    }))
    .filter((draft) => draft.promptText.length > 0);

  if (trimmed.length > MAX_PROMPTS_PER_VERSION) {
    throw new Error(
      `問いは最大${MAX_PROMPTS_PER_VERSION}問までです。余分な問いを削除してから保存してください`,
    );
  }

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
