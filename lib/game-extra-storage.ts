import type { Game } from "@/lib/mock-games";

export type GameExtraFields = {
  estimatedPlayTime?: string;
  focusNotes?: string;
};

const STORAGE_KEY = "forge-game-extras";

export function loadGameExtras(): Record<string, GameExtraFields> {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? (JSON.parse(stored) as Record<string, GameExtraFields>) : {};
  } catch {
    return {};
  }
}

export function saveGameExtra(gameId: string, extra: GameExtraFields): void {
  if (typeof window === "undefined") {
    return;
  }

  const current = loadGameExtras();
  current[gameId] = { ...current[gameId], ...extra };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
}

export function mergeGameWithExtras(game: Game): Game {
  if (typeof window === "undefined") {
    return game;
  }

  const extra = loadGameExtras()[game.id];
  if (!extra) {
    return game;
  }

  return {
    ...game,
    estimatedPlayTime: game.estimatedPlayTime ?? extra.estimatedPlayTime,
    focusNotes: extra.focusNotes ?? game.focusNotes,
  };
}
