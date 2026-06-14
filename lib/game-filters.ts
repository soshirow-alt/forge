import type { Game } from "@/lib/mock-games";
import { getDefaultSupportCount } from "@/lib/demo-activity";
import { getGameCreatedTimestamp } from "@/lib/game-timestamp";

export type SortOption = "newest" | "support" | "updated";

export type DiscoveryTab = "new" | "trending";

export function getGamesForDiscoveryTab(
  tab: DiscoveryTab,
  newGames: Game[],
  allGames: Game[],
): Game[] {
  switch (tab) {
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
    case "new":
    default:
      return "newest";
  }
}

function getNewestTimestamp(game: Game): number {
  return getGameCreatedTimestamp(game);
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
        const defaultA = getDefaultSupportCount(a.id, isSubmittedGame(a.id));
        const defaultB = getDefaultSupportCount(b.id, isSubmittedGame(b.id));
        return (
          getSupportCount(b.id, defaultB) - getSupportCount(a.id, defaultA)
        );
      });
    case "updated":
      return sorted.sort(
        (a, b) =>
          new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime(),
      );
    case "newest":
    default:
      return sorted.sort(
        (a, b) => getNewestTimestamp(b) - getNewestTimestamp(a),
      );
  }
}
