import type { Game } from "@/lib/mock-games";

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
  "ブラウザで遊べる",
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

function collectUrls(game: Game): string[] {
  return [
    game.playUrl,
    game.steamUrl,
    game.itchUrl,
    game.githubUrl,
    game.discordUrl,
    game.officialUrl,
  ].filter((url): url is string => Boolean(url?.trim()));
}

function urlMatches(game: Game, matcher: (url: string) => boolean): boolean {
  return collectUrls(game).some((url) => matcher(url.toLowerCase()));
}

export function isBrowserPlayable(game: Game): boolean {
  const check = (url: string) => {
    const lower = url.toLowerCase();
    return (
      lower.includes("github.io") ||
      lower.includes("vercel.app") ||
      lower.includes("netlify.app") ||
      lower.endsWith(".html")
    );
  };

  if (game.playUrl && check(game.playUrl)) {
    return true;
  }

  return Boolean(game.githubUrl && check(game.githubUrl));
}

export function hasSteamLink(game: Game): boolean {
  return Boolean(game.steamUrl) || urlMatches(game, (url) => url.includes("steampowered.com"));
}

export function hasItchLink(game: Game): boolean {
  return Boolean(game.itchUrl) || urlMatches(game, (url) => url.includes("itch.io"));
}

export function hasEpicLink(game: Game): boolean {
  return urlMatches(
    game,
    (url) => url.includes("epicgames.com") || url.includes("store.epicgames.com"),
  );
}

export function hasGitHubLink(game: Game): boolean {
  return Boolean(game.githubUrl) || urlMatches(game, (url) => url.includes("github.com"));
}

export function hasOfficialSite(game: Game): boolean {
  return Boolean(game.officialUrl?.trim());
}

export function matchesPlatformFilter(game: Game, platform: PlatformFilter): boolean {
  switch (platform) {
    case "ブラウザで遊べる":
      return isBrowserPlayable(game);
    case "Steam":
      return hasSteamLink(game);
    case "itch.io":
      return hasItchLink(game);
    case "Epic":
      return hasEpicLink(game);
    case "GitHub":
      return hasGitHubLink(game);
    case "公式サイト":
      return hasOfficialSite(game);
    default:
      return false;
  }
}

function gameSearchText(game: Game): string {
  return [game.genre, ...(game.tags ?? [])].join(" ").toLowerCase();
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
