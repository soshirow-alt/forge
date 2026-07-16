/** Max length for player free-text FB body (short_text + optional_comment). */
export const FEEDBACK_FREE_TEXT_MAX = 1000;

/** Max length for one-hop replies under a public FB card. */
export const FEEDBACK_REPLY_MAX = 200;

export function clampFeedbackFreeText(value: string): string {
  return value.slice(0, FEEDBACK_FREE_TEXT_MAX);
}

export function isFeedbackFreeTextOverLimit(value: string): boolean {
  return value.length > FEEDBACK_FREE_TEXT_MAX;
}
