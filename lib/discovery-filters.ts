import type { Game } from "@/lib/mock-games";
import { matchesPlayEnvironmentFilter } from "@/lib/play-environment";

export const GENRE_FILTER_OPTIONS = [
  "RPG",
  "アクション",
  "パズル",
  "アドベンチャー",
  "ローグライク",
  "ホラー",
  "ストラテジー",
] as const;

export const PLATFORM_FILTER_OPTIONS = [
  "PC",
  "スマホ",
  "ブラウザ",
  "Steam",
  "itch.io",
  "Epic",
  "GitHub",
  "公式サイト",
] as const;

export const PHASE_FILTER_OPTIONS = [
  "企画段階",
  "プロトタイプ",
  "α版",
  "β版",
  "試作版",
] as const;

export type GenreFilter = (typeof GENRE_FILTER_OPTIONS)[number];
export type PlatformFilter = (typeof PLATFORM_FILTER_OPTIONS)[number];
export type PhaseFilter = (typeof PHASE_FILTER_OPTIONS)[number];

export type DiscoveryChipFilters = {
  genres: GenreFilter[];
  platforms: PlatformFilter[];
  phases: PhaseFilter[];
};

export const EMPTY_DISCOVERY_FILTERS: DiscoveryChipFilters = {
  genres: [],
  platforms: [],
  phases: [],
};

export {
  hasEpicLink,
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

  switch (genre) {
    case "RPG":
      return genreField.includes("rpg") || text.includes("rpg");
    case "アクション":
      return genreField.includes("アクション") || text.includes("アクション");
    case "パズル":
      return genreField.includes("パズル") || text.includes("パズル");
    case "アドベンチャー":
      return genreField.includes("アドベンチャー") || text.includes("アドベンチャー");
    case "ローグライク":
      return genreField.includes("ローグライク") || text.includes("ローグライク");
    case "ホラー":
      return genreField.includes("ホラー") || text.includes("ホラー");
    case "ストラテジー":
      return genreField.includes("ストラテジ") || text.includes("ストラテジ");
    default:
      return false;
  }
}

export function matchesPhaseFilter(game: Game, phase: PhaseFilter): boolean {
  const value = `${game.phase} ${game.status}`.toLowerCase();

  switch (phase) {
    case "企画段階":
      return value.includes("企画") || value.includes("初期開発");
    case "プロトタイプ":
      return value.includes("プロトタイプ");
    case "α版":
      return value.includes("α");
    case "β版":
      return value.includes("β");
    case "試作版":
      return value.includes("試作");
    default:
      return false;
  }
}

export function applyDiscoveryChipFilters(
  games: Game[],
  filters: DiscoveryChipFilters,
): Game[] {
  const { genres, platforms, phases } = filters;

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
    return true;
  });
}

export function hasActiveChipFilters(filters: DiscoveryChipFilters): boolean {
  return (
    filters.genres.length > 0 ||
    filters.platforms.length > 0 ||
    filters.phases.length > 0
  );
}
