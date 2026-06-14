export type ReplayIntent = "yes" | "maybe" | "no";

export type GameFeedbackItem = {
  id: string;
  createdAt: string;
  goodPoints?: string;
  concerns?: string;
  bugs?: string;
  otherNotes?: string;
  focusResponse?: string;
  wouldReplay?: ReplayIntent;
  versionKey?: string;
  updatedAt?: string;
  /** @deprecated legacy single-field feedback */
  text?: string;
  funRating?: number;
  controlsRating?: number;
  replayRating?: number;
  selectedOptions?: string[];
};

export function feedbackHasContent(
  item: Pick<
    GameFeedbackItem,
    | "goodPoints"
    | "concerns"
    | "bugs"
    | "otherNotes"
    | "focusResponse"
    | "wouldReplay"
    | "text"
  >,
): boolean {
  return Boolean(
    item.goodPoints?.trim() ||
      item.concerns?.trim() ||
      item.bugs?.trim() ||
      item.otherNotes?.trim() ||
      item.focusResponse?.trim() ||
      item.wouldReplay ||
      item.text?.trim(),
  );
}

export function getFeedbackSummaryText(item: GameFeedbackItem): string {
  if (item.text?.trim()) {
    return item.text.trim();
  }

  const parts = [
    item.goodPoints?.trim() ? `良かった点: ${item.goodPoints.trim()}` : "",
    item.concerns?.trim() ? `気になった点: ${item.concerns.trim()}` : "",
    item.bugs?.trim() ? `バグ: ${item.bugs.trim()}` : "",
    item.otherNotes?.trim() ? `その他: ${item.otherNotes.trim()}` : "",
  ].filter(Boolean);

  return parts.join(" / ") || "フィードバックを送信しました";
}

export function replayIntentLabel(intent: ReplayIntent): string {
  switch (intent) {
    case "yes":
      return "もう一度遊びたい";
    case "maybe":
      return "更新次第また遊びたい";
    case "no":
      return "今はもう遊ばない";
  }
}
