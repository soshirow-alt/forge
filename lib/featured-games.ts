import type { Game } from "@/lib/mock-games";
import { getDefaultSupportCount } from "@/lib/demo-activity";

export type FeaturedGameMeta = {
  game: Game;
  score: number;
  showTrending: boolean;
  showTester: boolean;
  showUpdate: boolean;
};

function getTimestamp(game: Game): number {
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

function scoreGame(
  game: Game,
  getSupportCount: (id: string, defaultCount?: number) => number,
  isSubmittedGame: (id: string) => boolean,
  hasDevlogs: (id: string) => boolean,
): number {
  const defaultSupport = getDefaultSupportCount(
    game.id,
    isSubmittedGame(game.id),
  );
  const support = getSupportCount(game.id, defaultSupport);
  const ageDays = Math.max(
    0,
    (Date.now() - getTimestamp(game)) / (1000 * 60 * 60 * 24),
  );
  const recencyScore = Math.max(0, 28 - ageDays) * 2.5;
  const updateScore =
    (Date.now() - new Date(game.lastUpdated).getTime()) /
      (1000 * 60 * 60 * 24) <
    14
      ? 12
      : 0;

  let score = support * 1.4 + recencyScore + updateScore;
  if (game.lookingForTesters) {
    score += 45;
  }
  if (hasDevlogs(game.id)) {
    score += 18;
  }

  return score;
}

export function pickFeaturedGames(
  games: Game[],
  getSupportCount: (id: string, defaultCount?: number) => number,
  isSubmittedGame: (id: string) => boolean,
  hasDevlogs: (id: string) => boolean,
  limit = 3,
): FeaturedGameMeta[] {
  const unique = new Map<string, Game>();
  for (const game of games) {
    unique.set(game.id, game);
  }

  const scored = [...unique.values()]
    .map((game) => ({
      game,
      score: scoreGame(game, getSupportCount, isSubmittedGame, hasDevlogs),
    }))
    .sort((a, b) => b.score - a.score);

  const topScore = scored[0]?.score ?? 0;
  const supportValues = scored.map((item) =>
    getSupportCount(
      item.game.id,
      getDefaultSupportCount(item.game.id, isSubmittedGame(item.game.id)),
    ),
  );
  const maxSupport = Math.max(...supportValues, 0);

  const featured =
    scored.length > 0
      ? scored.slice(0, limit)
      : [];

  if (featured.length < limit) {
    const fallback = [...unique.values()]
      .sort((a, b) => getTimestamp(b) - getTimestamp(a))
      .filter((game) => !featured.some((item) => item.game.id === game.id))
      .slice(0, limit - featured.length)
      .map((game) => ({ game, score: 0 }));

    featured.push(...fallback);
  }

  return featured.map((item, index) => {
    const support = getSupportCount(
      item.game.id,
      getDefaultSupportCount(item.game.id, isSubmittedGame(item.game.id)),
    );

    return {
      ...item,
      showTrending:
        index === 0 ||
        item.score >= topScore * 0.85 ||
        support >= Math.max(maxSupport * 0.7, 30),
      showTester: item.game.lookingForTesters,
      showUpdate: hasDevlogs(item.game.id),
    };
  });
}
