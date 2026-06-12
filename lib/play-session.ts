const PLAYED_GAMES_KEY = "forge-played-games";

export function getPlayedGameIds(): string[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const stored = localStorage.getItem(PLAYED_GAMES_KEY);
    if (!stored) {
      return [];
    }

    return JSON.parse(stored) as string[];
  } catch {
    return [];
  }
}

export function markGameAsPlayed(gameId: string): void {
  if (typeof window === "undefined") {
    return;
  }

  const ids = new Set(getPlayedGameIds());
  ids.add(gameId);
  localStorage.setItem(PLAYED_GAMES_KEY, JSON.stringify([...ids]));
}

export function hasUserPlayedGame(gameId: string): boolean {
  return getPlayedGameIds().includes(gameId);
}
