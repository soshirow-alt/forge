import type { Game } from "@/lib/mock-games";
import { resolveProjectGenres } from "@/lib/project-genres";
import {
  DEVELOPMENT_PHASE_OPTIONS,
  type DevelopmentPhase,
} from "@/lib/development-phases";
import { PLAY_TIME_OPTIONS } from "@/lib/play-time-options";
import { matchesPlayEnvironmentFilter } from "@/lib/play-environment";

export const GENRE_FILTER_OPTIONS = [
  "アクション",
  "RPG",
  "ADV",
  "パズル",
  "ホラー",
  "シューティング",
  "ノベル",
  "シミュレーション",
] as const;

export const PLATFORM_FILTER_OPTIONS = [
  "PC",
  "スマホ",
  "ブラウザ",
  "Steam",
  "itch.io",
  "GitHub",
  "公式サイト",
] as const;

export const PHASE_FILTER_OPTIONS = DEVELOPMENT_PHASE_OPTIONS.map(
  (option) => option.value,
) as [
  DevelopmentPhase,
  DevelopmentPhase,
  DevelopmentPhase,
  DevelopmentPhase,
];

export const PLAY_TIME_FILTER_OPTIONS = PLAY_TIME_OPTIONS;

export type GenreFilter = (typeof GENRE_FILTER_OPTIONS)[number];
export type PlatformFilter = (typeof PLATFORM_FILTER_OPTIONS)[number];
export type PhaseFilter = (typeof PHASE_FILTER_OPTIONS)[number];
export type PlayTimeFilter = (typeof PLAY_TIME_FILTER_OPTIONS)[number];

export type DiscoveryChipFilters = {
  genres: GenreFilter[];
  platforms: PlatformFilter[];
  phases: PhaseFilter[];
  playTimes: PlayTimeFilter[];
};

export const EMPTY_DISCOVERY_FILTERS: DiscoveryChipFilters = {
  genres: [],
  platforms: [],
  phases: [],
  playTimes: [],
};

export {
  hasGitHubLink,
  hasItchLink,
  hasOfficialSite,
  hasSteamLink,
  isBrowserPlayable,
} from "@/lib/play-environment";

function gameSearchText(game: Game): string {
  return [...resolveProjectGenres(game), ...(game.tags ?? [])].join(" ").toLowerCase();
}

export function matchesPlatformFilter(game: Game, platform: PlatformFilter): boolean {
  return matchesPlayEnvironmentFilter(game, platform);
}

export function matchesGenreFilter(game: Game, genre: GenreFilter): boolean {
  const text = gameSearchText(game);
  const genres = resolveProjectGenres(game);

  return (
    genres.some((item) => item.toLowerCase().includes(genre.toLowerCase())) ||
    text.includes(genre.toLowerCase())
  );
}

/** Legacy phase strings in mock/DB still match until data is fully migrated. */
export function matchesPhaseFilter(game: Game, phase: PhaseFilter): boolean {
  const value = `${game.phase} ${game.status}`.toLowerCase();

  switch (phase) {
    case "試作版":
      return (
        value.includes("試作") ||
        value.includes("プロトタイプ") ||
        value.includes("企画") ||
        value.includes("初期開発")
      );
    case "プレイ可能版":
      return (
        value.includes("プレイ可能") ||
        value.includes("開発中") ||
        value.includes("α") ||
        value.includes("alpha") ||
        value.includes("early access")
      );
    case "通しプレイ版":
      return (
        value.includes("通し") ||
        value.includes("テストver") ||
        value.includes("β") ||
        value.includes("beta")
      );
    case "公開準備中":
      return value.includes("公開準備") || value.includes("公開間近");
    default:
      return false;
  }
}

export function matchesPlayTimeFilter(game: Game, playTime: PlayTimeFilter): boolean {
  return game.estimatedPlayTime === playTime;
}

export function applyDiscoveryChipFilters(
  games: Game[],
  filters: DiscoveryChipFilters,
): Game[] {
  const { genres, platforms, phases, playTimes } = filters;

  return games.filter((game) => {
    if (genres.length > 0 && !genres.some((genre) => matchesGenreFilter(game, genre))) {
      return false;
    }
    if (
      platforms.length > 0 &&
      !platforms.some((platform) => matchesPlatformFilter(game, platform))
    ) {
      return false;
    }
    if (phases.length > 0 && !phases.some((phase) => matchesPhaseFilter(game, phase))) {
      return false;
    }
    if (
      playTimes.length > 0 &&
      !playTimes.some((playTime) => matchesPlayTimeFilter(game, playTime))
    ) {
      return false;
    }
    return true;
  });
}

export function hasActiveChipFilters(filters: DiscoveryChipFilters): boolean {
  return (
    filters.genres.length > 0 ||
    filters.platforms.length > 0 ||
    filters.phases.length > 0 ||
    filters.playTimes.length > 0
  );
}
