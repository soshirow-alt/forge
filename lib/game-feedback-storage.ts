export type ReplayIntent = "yes" | "maybe" | "no";

export type GameFeedbackItem = {
  id: string;
  createdAt: string;
  goodPoints?: string;
  concerns?: string;
  bugs?: string;
  focusResponse?: string;
  wouldReplay?: ReplayIntent;
  /** @deprecated legacy single-field feedback */
  text?: string;
  funRating?: number;
  controlsRating?: number;
  replayRating?: number;
  selectedOptions?: string[];
};

export type FeedbackByGame = Record<string, GameFeedbackItem[]>;

const FEEDBACK_STORAGE_KEY = "forge-game-feedback";

export function loadStoredFeedback(): FeedbackByGame {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const stored = localStorage.getItem(FEEDBACK_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored) as FeedbackByGame;
    }

    const legacyStored = localStorage.getItem("forge-game-comments");
    if (!legacyStored) {
      return {};
    }

    const legacy = JSON.parse(legacyStored) as Record<
      string,
      { id: string; text: string; createdAt: string }[]
    >;

    const migrated: FeedbackByGame = {};
    for (const [gameId, items] of Object.entries(legacy)) {
      migrated[gameId] = items.map((item) => ({
        id: item.id,
        text: item.text,
        createdAt: item.createdAt,
        funRating: 3,
        controlsRating: 3,
        replayRating: 3,
        selectedOptions: [],
      }));
    }

    return migrated;
  } catch {
    return {};
  }
}

export function saveStoredFeedback(feedbackByGame: FeedbackByGame): void {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(FEEDBACK_STORAGE_KEY, JSON.stringify(feedbackByGame));
}

export function hasUserSubmittedFeedback(gameId: string): boolean {
  const items = loadStoredFeedback()[gameId] ?? [];
  return items.length > 0;
}

export function feedbackHasContent(
  item: Pick<
    GameFeedbackItem,
    | "goodPoints"
    | "concerns"
    | "bugs"
    | "focusResponse"
    | "wouldReplay"
    | "text"
  >,
): boolean {
  return Boolean(
    item.goodPoints?.trim() ||
      item.concerns?.trim() ||
      item.bugs?.trim() ||
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
