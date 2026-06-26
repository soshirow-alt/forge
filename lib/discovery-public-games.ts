import type { HomeGameCard } from "@/lib/home-v0-mock-data";
import { getGameCreatedTimestamp } from "@/lib/game-timestamp";
import type { Game } from "@/lib/mock-games";
import { shouldHideV0MockContent } from "@/lib/production-mode";
import { resolvePlayableVersion } from "@/lib/playable-version";
import { isGamePublic } from "@/lib/project-visibility";
import type { SearchWorkResult } from "@/lib/search-v0-mock-data";

export function getPublicSubmittedGames(games: Game[]): Game[] {
  return games.filter(isGamePublic);
}

function formatRelativeUpdateLabel(value: string): string {
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) {
    return value.includes("更新") ? value : `${value}更新`;
  }

  const diffMs = Date.now() - parsed;
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) {
    return "たった今更新";
  }
  if (minutes < 60) {
    return `${minutes}分前更新`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}時間前更新`;
  }

  const days = Math.floor(hours / 24);
  if (days < 7) {
    return `${days}日前更新`;
  }

  const weeks = Math.floor(days / 7);
  if (weeks < 5) {
    return `${weeks}週間前更新`;
  }

  return new Date(parsed).toLocaleDateString("ja-JP", {
    month: "short",
    day: "numeric",
  });
}

export function sortGamesByNewest(games: Game[]): Game[] {
  return [...games].sort(
    (a, b) => getGameCreatedTimestamp(b) - getGameCreatedTimestamp(a),
  );
}

export function sortGamesByUpdated(games: Game[]): Game[] {
  return [...games].sort(
    (a, b) =>
      new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime(),
  );
}

export function gameToHomeCard(
  game: Game,
  witnessCount = 0,
  voiceCount = 0,
): HomeGameCard {
  return {
    id: game.id,
    title: game.title,
    version: resolvePlayableVersion(game.playableVersion),
    description: game.description,
    image: game.thumbnailUrl?.trim() ?? "",
    genre: game.genre,
    updatedLabel: formatRelativeUpdateLabel(game.lastUpdated),
    voiceCount,
    witnessCount,
  };
}

export function gameToSearchResult(
  game: Game,
  witnessCount = 0,
  voiceCount = 0,
): SearchWorkResult {
  const tags =
    game.tags.length > 0 ? game.tags : [game.genre].filter(Boolean);

  return {
    id: game.id,
    title: game.title,
    description: game.description,
    image: game.thumbnailUrl?.trim() ?? "",
    tags,
    developer: game.ownerName || game.creator,
    verified: Boolean(game.ownerId),
    updatedAgo: formatRelativeUpdateLabel(game.lastUpdated).replace(/更新$/, ""),
    witnessCount,
    voiceCount,
    platforms: ["ブラウザ"],
  };
}

export function mergeHomeCards(
  primary: HomeGameCard[],
  secondary: HomeGameCard[],
): HomeGameCard[] {
  if (shouldHideV0MockContent()) {
    return [...primary];
  }

  const seen = new Set(primary.map((game) => game.id));
  const merged = [...primary];
  for (const game of secondary) {
    if (!seen.has(game.id)) {
      seen.add(game.id);
      merged.push(game);
    }
  }
  return merged;
}

export function mergeSearchResults(
  primary: SearchWorkResult[],
  secondary: SearchWorkResult[],
): SearchWorkResult[] {
  if (shouldHideV0MockContent()) {
    return [...primary];
  }

  const seen = new Set(primary.map((game) => game.id));
  const merged = [...primary];
  for (const game of secondary) {
    if (!seen.has(game.id)) {
      seen.add(game.id);
      merged.push(game);
    }
  }
  return merged;
}

export function filterSearchWorks(
  works: SearchWorkResult[],
  query: string,
  genres: string[],
  features: string[],
): SearchWorkResult[] {
  const keyword = query.trim().toLowerCase();

  return works.filter((work) => {
    if (keyword) {
      const haystack = [
        work.title,
        work.description,
        work.developer,
        ...work.tags,
      ]
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(keyword)) {
        return false;
      }
    }

    if (genres.length > 0) {
      const genreMatch = genres.some((genre) => work.tags.includes(genre));
      if (!genreMatch) {
        return false;
      }
    }

    if (features.length > 0) {
      const featureMatch = features.some((feature) => work.tags.includes(feature));
      if (!featureMatch) {
        return false;
      }
    }

    return true;
  });
}

export function sortSearchWorks(
  works: SearchWorkResult[],
  sortId: "recommended" | "witness" | "voices",
): SearchWorkResult[] {
  const sorted = [...works];
  switch (sortId) {
    case "witness":
      return sorted.sort((a, b) => b.witnessCount - a.witnessCount);
    case "voices":
      return sorted.sort((a, b) => b.voiceCount - a.voiceCount);
    case "recommended":
    default:
      return sorted;
  }
}
