export const PLATFORM_FEEDBACK_CATEGORIES = [
  { code: "bug", label: "不具合・問題" },
  { code: "idea", label: "ご要望・改善アイデア" },
  { code: "service", label: "Forge サービスへのご意見" },
  { code: "other", label: "その他" },
] as const;

export type PlatformFeedbackCategoryCode =
  (typeof PLATFORM_FEEDBACK_CATEGORIES)[number]["code"];

export type PlatformFeedbackViewerMode = "player" | "studio";

export const PLATFORM_FEEDBACK_MESSAGE_MAX = 2000;
export const PLATFORM_FEEDBACK_MESSAGE_MIN = 10;

export function platformFeedbackCategoryLabel(code: PlatformFeedbackCategoryCode): string {
  return (
    PLATFORM_FEEDBACK_CATEGORIES.find((item) => item.code === code)?.label ?? code
  );
}
