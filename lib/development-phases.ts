export const DEVELOPMENT_PHASE_OPTIONS = [
  {
    value: "試作版",
    hint: "操作感や面白さの確認向け。章やステージの一部だけ遊べる段階",
    playerDescription: "一部だけ遊べます",
  },
  {
    value: "プレイ可能版",
    hint: "コアは遊べるが、通しではない。主要部分の体験ができる段階",
    playerDescription: "主要部分は遊べますが、通しではありません",
  },
  {
    value: "通しプレイ版",
    hint: "最後までクリア可能。バランス・バグ・UX のテスト向け",
    playerDescription: "最後まで遊べます。調整・バグ修正中です",
  },
  {
    value: "公開準備中",
    hint: "ほぼ完成。最終調整と仕上げのテスト向け",
    playerDescription: "ほぼ完成verに近い体験ができます",
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

export function displayPhase(phase: string): string {
  return normalizePhase(phase);
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
    value.includes("公開間近")
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
