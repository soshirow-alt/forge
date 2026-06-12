export type GameFeedbackItem = {
  id: string;
  text: string;
  createdAt: string;
  funRating: number;
  controlsRating: number;
  replayRating: number;
  selectedOptions: string[];
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
