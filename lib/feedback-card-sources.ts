export const FEEDBACK_CARD_TARGET_SOURCES = [
  "registered_voice",
  "guest_voice",
  "registered_detailed",
  "guest_detailed",
] as const;

export type FeedbackCardTargetSource = (typeof FEEDBACK_CARD_TARGET_SOURCES)[number];

export type HelpfulMarkSourceType =
  | "voice_response"
  | "project_feedback"
  | "guest_voice_response"
  | "guest_project_feedback";

export function isFeedbackCardTargetSource(
  value: string,
): value is FeedbackCardTargetSource {
  return (FEEDBACK_CARD_TARGET_SOURCES as readonly string[]).includes(value);
}

/** Map public card target_source → developer_feedback_helpful_marks.source_type */
export function helpfulSourceTypeFromCardSource(
  targetSource: FeedbackCardTargetSource,
): HelpfulMarkSourceType {
  switch (targetSource) {
    case "registered_voice":
      return "voice_response";
    case "registered_detailed":
      return "project_feedback";
    case "guest_voice":
      return "guest_voice_response";
    case "guest_detailed":
      return "guest_project_feedback";
  }
}

export function cardSourceFromHelpfulSourceType(
  sourceType: HelpfulMarkSourceType,
): FeedbackCardTargetSource {
  switch (sourceType) {
    case "voice_response":
      return "registered_voice";
    case "project_feedback":
      return "registered_detailed";
    case "guest_voice_response":
      return "guest_voice";
    case "guest_project_feedback":
      return "guest_detailed";
  }
}
