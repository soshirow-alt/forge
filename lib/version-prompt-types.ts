export type VersionPromptResponseKind =
  | "yes_no"
  | "scale_3"
  | "choice"
  | "short_text"
  | "replay_intent";

export type VersionPromptSource = "developer" | "platform_default";

export type VersionPromptOption = {
  id: string;
  label: string;
};

export type VersionPrompt = {
  id: string;
  projectId: string;
  versionKey: string;
  promptText: string;
  responseKind: VersionPromptResponseKind;
  options?: VersionPromptOption[];
  sortOrder: number;
  source: VersionPromptSource;
  createdAt: string;
  archivedAt?: string;
};

export type VoiceResponse = {
  id: string;
  userId: string;
  projectId: string;
  versionKey: string;
  promptId: string;
  answerValue: string;
  answerLabel?: string;
  createdAt: string;
  updatedAt: string;
};

export type VoiceAnswerDraft = {
  promptId: string;
  answerValue: string;
  answerLabel?: string;
};

export const MAX_PROMPTS_PER_VERSION = 10;

export const DEFAULT_REPLAY_PROMPT_TEXT = "もう一度遊びたい？";

export const REPLAY_INTENT_OPTIONS: VersionPromptOption[] = [
  { id: "yes", label: "もう一度遊びたい" },
  { id: "maybe", label: "更新次第また遊びたい" },
  { id: "no", label: "今はもう遊ばない" },
];

export const YES_NO_OPTIONS: VersionPromptOption[] = [
  { id: "yes", label: "はい" },
  { id: "no", label: "いいえ" },
];
