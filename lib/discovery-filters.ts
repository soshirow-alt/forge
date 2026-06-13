import type { Game } from "@/lib/mock-games";
import { DEVELOPMENT_PHASE_OPTIONS } from "@/lib/development-phases";
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
  "プロトタイプ",
  "開発中",
  "テスト版",
  "公開準備",
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
  recruitingOnly: boolean;
};

export const EMPTY_DISCOVERY_FILTERS: DiscoveryChipFilters = {
  genres: [],
  platforms: [],
  phases: [],
  playTimes: [],
  recruitingOnly: false,
};

export {
  hasGitHubLink,
  hasItchLink,
  hasOfficialSite,
  hasSteamLink,
  isBrowserPlayable,
} from "@/lib/play-environment";

function gameSearchText(game: Game): string {
  return [game.genre, ...(game.tags ?? [])].join(" ").toLowerCase();
}

export function matchesPlatformFilter(game: Game, platform: PlatformFilter): boolean {
  return matchesPlayEnvironmentFilter(game, platform);
}

export function matchesGenreFilter(game: Game, genre: GenreFilter): boolean {
  const text = gameSearchText(game);
  const genreField = game.genre.toLowerCase();

  return genreField.includes(genre.toLowerCase()) || text.includes(genre.toLowerCase());
}

export function matchesPhaseFilter(game: Game, phase: PhaseFilter): boolean {
  const value = `${game.phase} ${game.status}`.toLowerCase();

  switch (phase) {
    case "プロトタイプ":
      return (
        value.includes("プロトタイプ") ||
        value.includes("試作") ||
        value.includes("企画")
      );
    case "開発中":
      return (
        value.includes("開発中") ||
        value.includes("初期開発") ||
        value.includes("α") ||
        value.includes("試作版")
      );
    case "テスト版":
      return value.includes("テスト") || value.includes("β");
    case "公開準備":
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
  const { genres, platforms, phases, playTimes, recruitingOnly } = filters;

  return games.filter((game) => {
    if (recruitingOnly && !game.lookingForTesters) {
      return false;
    }
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
    filters.playTimes.length > 0 ||
    filters.recruitingOnly
  );
}
