export const PLAY_ACCESS_TYPES = [
  "unspecified",
  "free",
  "demo_available",
  "paid",
  "other",
] as const;

export type PlayAccessType = (typeof PLAY_ACCESS_TYPES)[number];

/** Values selectable on new submit forms (not unspecified). */
export const SUBMIT_PLAY_ACCESS_OPTIONS = [
  {
    value: "free" as const,
    label: "無料で遊べる",
    hint: "無料で遊べる作品です。",
  },
  {
    value: "demo_available" as const,
    label: "体験版あり",
    hint: "無料体験版やデモから遊べます。",
  },
  {
    value: "paid" as const,
    label: "購入が必要",
    hint: "購入や有料版が必要な作品です。",
  },
  {
    value: "other" as const,
    label: "その他・外部条件あり",
    hint: "上記以外の料金・公開形態です。",
  },
] as const;

export type SubmitPlayAccessType = (typeof SUBMIT_PLAY_ACCESS_OPTIONS)[number]["value"];

export const PLAY_ACCESS_BADGE_LABELS: Record<
  Exclude<PlayAccessType, "unspecified">,
  string
> = {
  free: "無料",
  demo_available: "体験版あり",
  paid: "有料",
  other: "その他",
};

export const PLAY_ACCESS_CTA_LABELS: Record<
  Exclude<PlayAccessType, "unspecified">,
  string
> = {
  free: "無料で遊ぶ",
  demo_available: "体験版を遊ぶ",
  paid: "購入ページを見る",
  other: "外部ページを開く",
};

export const PLAY_ACCESS_FILTER_OPTIONS = [
  "free",
  "demo_available",
  "paid",
  "other",
] as const;

export type PlayAccessFilter = (typeof PLAY_ACCESS_FILTER_OPTIONS)[number];

export function isPlayAccessType(value: string | null | undefined): value is PlayAccessType {
  return PLAY_ACCESS_TYPES.includes(value as PlayAccessType);
}

export function isSpecifiedPlayAccessType(
  value: string | null | undefined,
): value is Exclude<PlayAccessType, "unspecified"> {
  return (
    value === "free" ||
    value === "demo_available" ||
    value === "paid" ||
    value === "other"
  );
}

export function normalizePlayAccessType(value: string | null | undefined): PlayAccessType {
  if (isPlayAccessType(value)) {
    return value;
  }
  return "unspecified";
}

export function getPlayAccessBadgeLabel(
  playAccessType: string | null | undefined,
): string | null {
  if (!isSpecifiedPlayAccessType(playAccessType)) {
    return null;
  }
  return PLAY_ACCESS_BADGE_LABELS[playAccessType];
}

export function getPlayAccessCtaLabel(
  playAccessType: string | null | undefined,
  fallback = "プレイする",
): string {
  if (!isSpecifiedPlayAccessType(playAccessType)) {
    return fallback;
  }
  return PLAY_ACCESS_CTA_LABELS[playAccessType];
}
