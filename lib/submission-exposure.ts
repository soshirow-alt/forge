import type { Game } from "@/lib/mock-games";
import { isGamePublic } from "@/lib/project-visibility";
import { pickFeaturedGames } from "@/lib/featured-games";
import { getGameCreatedTimestamp, isWithinDays } from "@/lib/game-timestamp";

/** Hero spotlight + 初公開 badge window (days). */
export const RECENT_SUBMISSION_DAYS = 7;

/** Spotlight reservation while public real submissions stay below this count. */
export const PUBLIC_REAL_COUNT_BOOST_THRESHOLD = 10;

export function isRecentPublicSubmission(
  game: Game,
  isSubmittedGame: (id: string) => boolean,
): boolean {
  if (!isSubmittedGame(game.id) || !isGamePublic(game)) {
    return false;
  }

  return isWithinDays(
    getGameCreatedTimestamp(game),
    RECENT_SUBMISSION_DAYS,
  );
}

export function showFirstPublishBadge(
  game: Game,
  isSubmittedGame: (id: string) => boolean,
): boolean {
  return isRecentPublicSubmission(game, isSubmittedGame);
}

function pickNewestSpotlightCandidate(
  games: Game[],
  isSubmittedGame: (id: string) => boolean,
): Game | undefined {
  return games
    .filter((game) => isRecentPublicSubmission(game, isSubmittedGame))
    .sort(
      (a, b) =>
        getGameCreatedTimestamp(b) - getGameCreatedTimestamp(a),
    )[0];
}

export function pickHeroShowcaseGames(
  games: Game[],
  getSupportCount: (id: string, defaultCount?: number) => number,
  isSubmittedGame: (id: string) => boolean,
  hasDevlogs: (id: string) => boolean,
  publicRealCount: number,
  options?: {
    limit?: number;
    fallbackMockIds?: readonly string[];
    resolveMockGame?: (id: string) => Game | undefined;
  },
): Game[] {
  const limit = options?.limit ?? 5;
  const mockSlotLimit = limit - 1;
  const boostActive = publicRealCount < PUBLIC_REAL_COUNT_BOOST_THRESHOLD;
  const spotlight =
    boostActive ? pickNewestSpotlightCandidate(games, isSubmittedGame) : undefined;

  if (!spotlight) {
    const featured = pickFeaturedGames(
      games,
      getSupportCount,
      isSubmittedGame,
      hasDevlogs,
      limit,
    ).map((item) => item.game);

    if (featured.length >= 3) {
      return featured.slice(0, limit);
    }

    return fillHeroFallback(featured, options, limit);
  }

  const mockPool = games.filter((game) => !isSubmittedGame(game.id));
  const scoredMocks = pickFeaturedGames(
    mockPool,
    getSupportCount,
    isSubmittedGame,
    hasDevlogs,
    mockSlotLimit,
  ).map((item) => item.game);

  const result: Game[] = [spotlight];

  for (const game of scoredMocks) {
    if (result.length >= limit) {
      break;
    }
    if (!result.some((entry) => entry.id === game.id)) {
      result.push(game);
    }
  }

  if (result.length >= 3) {
    return result.slice(0, limit);
  }

  return fillHeroFallback(result, options, limit);
}

function fillHeroFallback(
  current: Game[],
  options:
    | {
        fallbackMockIds?: readonly string[];
        resolveMockGame?: (id: string) => Game | undefined;
      }
    | undefined,
  limit: number,
): Game[] {
  const result = [...current];
  const fallbackIds = options?.fallbackMockIds ?? [];
  const resolveMock = options?.resolveMockGame;
  if (!resolveMock) {
    return result.slice(0, limit);
  }

  const seen = new Set(result.map((game) => game.id));
  for (const id of fallbackIds) {
    if (result.length >= limit) {
      break;
    }
    const game = resolveMock(id);
    if (game && !seen.has(game.id)) {
      seen.add(game.id);
      result.push(game);
    }
  }

  return result.slice(0, limit);
}
