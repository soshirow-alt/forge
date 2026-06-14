import type { Game } from "@/lib/mock-games";

/** Sort / recency baseline: createdAt when present, else legacy id or lastUpdated. */
export function getGameCreatedTimestamp(game: Game): number {
  if (game.createdAt) {
    return new Date(game.createdAt).getTime();
  }

  if (game.id.startsWith("user-")) {
    const timestamp = Number(game.id.replace("user-", ""));
    if (!Number.isNaN(timestamp)) {
      return timestamp;
    }
  }

  return new Date(game.lastUpdated).getTime();
}

export function isWithinDays(timestamp: number, days: number): boolean {
  return Date.now() - timestamp <= days * 24 * 60 * 60 * 1000;
}
