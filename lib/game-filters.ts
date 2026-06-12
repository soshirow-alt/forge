import type { Game } from "@/lib/mock-games";

export type SortOption = "newest" | "support" | "updated" | "testers";

export type DiscoveryTab = "new" | "testers" | "trending";

export function getGamesForDiscoveryTab(
  tab: DiscoveryTab,
  newGames: Game[],
  testerGames: Game[],
  allGames: Game[],
): Game[] {
  switch (tab) {
    case "testers":
      return testerGames;
    case "trending":
      return allGames;
    case "new":
    default:
      return newGames;
  }
}

export function getDefaultSortForTab(tab: DiscoveryTab): SortOption {
  switch (tab) {
    case "trending":
      return "support";
    case "testers":
      return "updated";
    case "new":
    default:
      return "newest";
  }
}

function getNewestTimestamp(game: Game): number {
  if (game.id.startsWith("user-")) {
    const timestamp = Number(game.id.replace("user-", ""));
    if (!Number.isNaN(timestamp)) {
      return timestamp;
    }
  }

  return new Date(game.lastUpdated).getTime();
}

export function matchesSearch(game: Game, query: string): boolean {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) {
    return true;
  }

  return (
    game.title.toLowerCase().includes(trimmed) ||
    game.creator.toLowerCase().includes(trimmed) ||
    game.genre.toLowerCase().includes(trimmed)
  );
}

export function filterGames(games: Game[], query: string): Game[] {
  return games.filter((game) => matchesSearch(game, query));
}

export function sortGames(
  games: Game[],
  sort: SortOption,
  getSupportCount: (id: string, defaultCount?: number) => number,
  isSubmittedGame: (id: string) => boolean,
): Game[] {
  const sorted = [...games];

  switch (sort) {
    case "support":
      return sorted.sort((a, b) => {
        const defaultA = isSubmittedGame(a.id) ? 0 : 124;
        const defaultB = isSubmittedGame(b.id) ? 0 : 124;
        return (
          getSupportCount(b.id, defaultB) - getSupportCount(a.id, defaultA)
        );
      });
    case "updated":
      return sorted.sort(
        (a, b) =>
          new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime(),
      );
    case "testers":
      return sorted.sort(
        (a, b) => Number(b.lookingForTesters) - Number(a.lookingForTesters),
      );
    case "newest":
    default:
      return sorted.sort(
        (a, b) => getNewestTimestamp(b) - getNewestTimestamp(a),
      );
  }
}
