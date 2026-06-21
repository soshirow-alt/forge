import type { GenreFilter } from "@/components/mypage-filters";
import { matchesGenre } from "@/components/mypage-filters";
import {
  feedbackFilterTabs,
  playHistoryFilterTabs,
  savedFilterTabs,
  witnessingFilterTabs,
  witnessingGames,
  savedGames,
  type FeedbackEntry,
  type PlayHistoryGame,
  type SavedFilterId,
  type WitnessingFilterId,
} from "@/lib/mypage-v0-mock-data";

type WitnessingGame = (typeof witnessingGames)[number];
type SavedGame = (typeof savedGames)[number];

export function filterWitnessingGames(
  games: WitnessingGame[],
  statusId: WitnessingFilterId,
  genre: GenreFilter,
) {
  return games.filter((game) => {
    if (statusId === "has-update" && !game.hasUpdate) return false;
    if (statusId === "no-update" && game.hasUpdate) return false;
    if (statusId === "voice-reflected" && !game.voiceReflected) return false;
    return matchesGenre(genre, game.genre);
  });
}

export function witnessingStatusCounts(games: WitnessingGame[]) {
  return witnessingFilterTabs.map((tab) => ({
    ...tab,
    count: filterWitnessingGames(games, tab.id, "すべて").length,
  }));
}

export function filterSavedGames(games: SavedGame[], statusId: SavedFilterId, genre: GenreFilter) {
  return games.filter((game) => {
    if (statusId === "later" && game.listCategory !== "later") return false;
    if (statusId === "update" && !game.hasUpdate) return false;
    return matchesGenre(genre, game.genre, game.tags);
  });
}

export function savedStatusCounts(games: SavedGame[]) {
  return savedFilterTabs.map((tab) => ({
    ...tab,
    count: filterSavedGames(games, tab.id, "すべて").length,
  }));
}

export function playHistoryMatchesStatus(
  game: PlayHistoryGame,
  statusId: (typeof playHistoryFilterTabs)[number]["id"],
) {
  if (statusId === "all") return true;
  if (statusId === "witnessing") {
    return game.tags.some((tag) => tag.variant === "witnessing");
  }
  if (statusId === "supported") {
    return game.tags.some((tag) => tag.variant === "supported");
  }
  if (statusId === "play-only") {
    return game.tags.some((tag) => tag.variant === "play-only");
  }
  return true;
}

export function filterPlayHistoryGames(
  games: PlayHistoryGame[],
  statusId: (typeof playHistoryFilterTabs)[number]["id"],
  genre: GenreFilter,
  periodId: "all" | "7d" | "30d" | "older",
) {
  return games.filter((game) => {
    if (!playHistoryMatchesStatus(game, statusId)) return false;
    if (periodId !== "all" && game.playPeriod !== periodId) return false;
    return matchesGenre(genre, game.genre);
  });
}

export function playHistoryStatusCounts(games: PlayHistoryGame[]) {
  return playHistoryFilterTabs.map((tab) => ({
    ...tab,
    count: filterPlayHistoryGames(games, tab.id, "すべて", "all").length,
  }));
}

export function filterFeedbackEntries(
  entries: FeedbackEntry[],
  typeId: (typeof import("@/lib/mypage-v0-mock-data").feedbackFilterTabs)[number]["id"],
  reflectionId: "all" | "reflected" | "not-reflected",
  genre: GenreFilter,
) {
  return entries.filter((entry) => {
    if (typeId === "free" && entry.type !== "free") return false;
    if (typeId === "choice" && entry.type !== "choice") return false;
    if (reflectionId === "reflected" && !entry.reflected) return false;
    if (reflectionId === "not-reflected" && entry.reflected) return false;
    return matchesGenre(genre, entry.genre);
  });
}

export function feedbackTypeCounts(entries: FeedbackEntry[]) {
  return feedbackFilterTabs.map((tab) => ({
    ...tab,
    count: filterFeedbackEntries(entries, tab.id, "all", "すべて").length,
  }));
}

export function filterFollowingDevelopers<
  T extends { game: { status: "developing" | "released" } },
>(developers: T[], statusId: "all" | "developing" | "released") {
  if (statusId === "developing") {
    return developers.filter((dev) => dev.game.status === "developing");
  }
  if (statusId === "released") {
    return developers.filter((dev) => dev.game.status === "released");
  }
  return developers;
}

export function followingStatusCounts<
  T extends { game: { status: "developing" | "released" } },
>(developers: T[]) {
  return [
    { id: "all" as const, label: "すべて", count: developers.length },
    {
      id: "developing" as const,
      label: "開発中",
      count: filterFollowingDevelopers(developers, "developing").length,
    },
    {
      id: "released" as const,
      label: "完成品あり",
      count: filterFollowingDevelopers(developers, "released").length,
    },
  ];
}
