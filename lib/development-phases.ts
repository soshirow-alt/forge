export const DEVELOPMENT_PHASE_OPTIONS = [
  {
    value: "試作版",
    label: "試作版",
    hint: "操作感や面白さを試している段階。一部だけ遊べる場合があります。",
    playerDescription:
      "操作感や面白さを試している段階。一部だけ遊べる場合があります。",
  },
  {
    value: "プレイ可能版",
    label: "α版",
    hint: "主要な体験は遊べるが、未実装・未調整の要素が残っている段階。",
    playerDescription:
      "主要な体験は遊べるが、未実装・未調整の要素が残っている段階。",
  },
  {
    value: "通しプレイ版",
    label: "β版",
    hint: "最後まで遊べる状態。バランス・バグ・UXの確認中。",
    playerDescription: "最後まで遊べる状態。バランス・バグ・UXの確認中。",
  },
  {
    value: "公開準備中",
    label: "公開準備中",
    hint: "正式版に近い状態。大きな問題がなければ、正式版として公開する予定の段階。",
    playerDescription:
      "正式版に近い状態。大きな問題がなければ、正式版として公開する予定の段階。",
  },
] as const;

export type DevelopmentPhase =
  (typeof DEVELOPMENT_PHASE_OPTIONS)[number]["value"];

const PLAYER_DESCRIPTION_BY_PHASE: Record<DevelopmentPhase, string> =
  Object.fromEntries(
    DEVELOPMENT_PHASE_OPTIONS.map((option) => [
      option.value,
      option.playerDescription,
    ]),
  ) as Record<DevelopmentPhase, string>;

const LABEL_BY_PHASE: Record<DevelopmentPhase, string> = Object.fromEntries(
  DEVELOPMENT_PHASE_OPTIONS.map((option) => [option.value, option.label]),
) as Record<DevelopmentPhase, string>;

export function displayPhase(phase: string): string {
  const normalized = normalizePhase(phase);
  if (isCanonicalPhase(normalized)) {
    return LABEL_BY_PHASE[normalized];
  }
  return normalized;
}

export function normalizePhase(phase: string): DevelopmentPhase | string {
  const legacyVerToCanonical: Record<string, DevelopmentPhase> = {
    試作ver: "試作版",
    プレイ可能ver: "プレイ可能版",
    通しプレイver: "通しプレイ版",
  };

  if (phase in legacyVerToCanonical) {
    return legacyVerToCanonical[phase]!;
  }

  if (isCanonicalPhase(phase)) {
    return phase;
  }

  const value = phase.toLowerCase();

  if (
    value.includes("公開準備") ||
    value.includes("公開間近") ||
    value.includes("正式版候補")
  ) {
    return "公開準備中";
  }
  if (
    value.includes("通し") ||
    value.includes("テストver") ||
    value.includes("β") ||
    value.includes("beta")
  ) {
    return "通しプレイ版";
  }
  if (
    value.includes("プレイ可能") ||
    value.includes("開発中") ||
    value.includes("α") ||
    value.includes("alpha") ||
    value.includes("early access")
  ) {
    return "プレイ可能版";
  }
  if (
    value.includes("試作") ||
    value.includes("プロトタイプ") ||
    value.includes("企画") ||
    value.includes("初期開発")
  ) {
    return "試作版";
  }

  return phase;
}

export function isCanonicalPhase(phase: string): phase is DevelopmentPhase {
  return DEVELOPMENT_PHASE_OPTIONS.some((option) => option.value === phase);
}

export function getPhasePlayerDescription(phase: string): string {
  const normalized = normalizePhase(phase);
  if (isCanonicalPhase(normalized)) {
    return PLAYER_DESCRIPTION_BY_PHASE[normalized];
  }
  return "";
}

export function getPhaseHint(phase: string): string {
  const normalized = normalizePhase(phase);
  const option = DEVELOPMENT_PHASE_OPTIONS.find(
    (entry) => entry.value === normalized,
  );
  return option?.hint ?? "";
}
