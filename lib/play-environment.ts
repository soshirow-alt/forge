import type { Game } from "@/lib/mock-games";

export const ENV_PC_TAG = "PC対応";
export const ENV_MOBILE_TAG = "スマホ対応";
export const ENV_BROWSER_TAG = "ブラウザ対応";

export const DIST_EXTERNAL_TAG = "配布:外部リンク";
export const DIST_DOWNLOAD_TAG = "配布:ダウンロード";
export const DIST_BROWSER_TAG = "配布:ブラウザプレイ";

export const TRUST_VERIFIED_TAG = "安全確認";

export const ENVIRONMENT_TAGS = [
  ENV_PC_TAG,
  ENV_MOBILE_TAG,
  ENV_BROWSER_TAG,
] as const;

export const DISTRIBUTION_TAGS = [
  DIST_EXTERNAL_TAG,
  DIST_DOWNLOAD_TAG,
  DIST_BROWSER_TAG,
] as const;

export const PLAY_META_TAGS = [
  ...ENVIRONMENT_TAGS,
  ...DISTRIBUTION_TAGS,
  TRUST_VERIFIED_TAG,
  "テスター募集中",
] as const;

export const PLAY_ENVIRONMENT_FILTER_OPTIONS = [
  "PC",
  "スマホ",
  "ブラウザ",
  "Steam",
  "itch.io",
  "Epic",
  "GitHub",
  "公式サイト",
] as const;

export type PlayEnvironmentFilter =
  (typeof PLAY_ENVIRONMENT_FILTER_OPTIONS)[number];

export type DistributionType = "external" | "download" | "browser" | "";

export type PlayEnvironmentFormState = {
  pc: boolean;
  mobile: boolean;
  browser: boolean;
  distribution: DistributionType;
};

export const EMPTY_PLAY_ENVIRONMENT_FORM: PlayEnvironmentFormState = {
  pc: false,
  mobile: false,
  browser: false,
  distribution: "",
};

function isMetaTag(tag: string): boolean {
  return (
    (PLAY_META_TAGS as readonly string[]).includes(tag) ||
    tag.startsWith("配布:")
  );
}

export function getPublicGameTags(tags?: string[]): string[] {
  return (tags ?? []).filter((tag) => !isMetaTag(tag));
}

function hasTag(game: Game, tag: string): boolean {
  return (game.tags ?? []).includes(tag);
}

function getDistributionFromPlayUrl(playUrl: string): DistributionType {
  const lower = playUrl.toLowerCase();

  if (
    lower.includes("github.io") ||
    lower.includes("vercel.app") ||
    lower.includes("netlify.app") ||
    lower.endsWith(".html")
  ) {
    return "browser";
  }

  if (lower.includes(".zip") || lower.includes("drive.google.com")) {
    return "download";
  }

  return "external";
}

export function getDistributionType(game: Game): DistributionType {
  if (hasTag(game, DIST_BROWSER_TAG)) {
    return "browser";
  }
  if (hasTag(game, DIST_DOWNLOAD_TAG)) {
    return "download";
  }
  if (hasTag(game, DIST_EXTERNAL_TAG)) {
    return "external";
  }

  return game.playUrl ? getDistributionFromPlayUrl(game.playUrl) : "external";
}

export function supportsPc(game: Game): boolean {
  if (hasTag(game, ENV_PC_TAG)) {
    return true;
  }

  if (hasTag(game, ENV_MOBILE_TAG) && !hasTag(game, ENV_PC_TAG)) {
    return false;
  }

  const distribution = getDistributionType(game);
  return (
    hasSteamLink(game) ||
    hasItchLink(game) ||
    hasEpicLink(game) ||
    hasGitHubLink(game) ||
    distribution === "download" ||
    distribution === "external" ||
    supportsBrowser(game)
  );
}

export function supportsMobile(game: Game): boolean {
  return hasTag(game, ENV_MOBILE_TAG);
}

export function supportsBrowser(game: Game): boolean {
  if (hasTag(game, ENV_BROWSER_TAG)) {
    return true;
  }

  return (
    getDistributionType(game) === "browser" || isBrowserPlayable(game)
  );
}

export function getPlayEnvironmentLabels(game: Game): string[] {
  const labels: string[] = [];

  if (supportsPc(game)) {
    labels.push("PC対応");
  }
  if (supportsMobile(game)) {
    labels.push("スマホ対応");
  }

  switch (getDistributionType(game)) {
    case "browser":
      labels.push("ブラウザでプレイ");
      break;
    case "download":
      labels.push("ダウンロードあり");
      break;
    case "external":
      labels.push("外部サイト");
      break;
    default:
      break;
  }

  return labels;
}

export function matchesPlayEnvironmentFilter(
  game: Game,
  filter: PlayEnvironmentFilter,
): boolean {
  switch (filter) {
    case "PC":
      return supportsPc(game);
    case "スマホ":
      return supportsMobile(game);
    case "ブラウザ":
      return supportsBrowser(game);
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

export type TrustBadgeStatus = "verified" | "unverified" | null;

export function isDownloadLink(url: string): boolean {
  const lower = url.toLowerCase();
  return lower.includes(".zip") || lower.includes("drive.google.com");
}

export function gameHasDownloadDistribution(game: Game): boolean {
  return getDistributionType(game) === "download" || isDownloadLink(game.playUrl);
}

export function gameHasExternalPlay(game: Game): boolean {
  const distribution = getDistributionType(game);
  return (
    distribution === "external" ||
    hasSteamLink(game) ||
    hasItchLink(game) ||
    hasEpicLink(game) ||
    hasOfficialSite(game)
  );
}

export function getTrustBadgeStatus(game: Game): TrustBadgeStatus {
  if (hasTag(game, TRUST_VERIFIED_TAG)) {
    return "verified";
  }

  if (gameHasDownloadDistribution(game) || gameHasExternalPlay(game)) {
    return "unverified";
  }

  return null;
}

export function parsePlayEnvironmentFromTags(
  tags: string[],
): PlayEnvironmentFormState {
  let distribution: DistributionType = "";

  if (tags.includes(DIST_BROWSER_TAG)) {
    distribution = "browser";
  } else if (tags.includes(DIST_DOWNLOAD_TAG)) {
    distribution = "download";
  } else if (tags.includes(DIST_EXTERNAL_TAG)) {
    distribution = "external";
  }

  return {
    pc: tags.includes(ENV_PC_TAG),
    mobile: tags.includes(ENV_MOBILE_TAG),
    browser: tags.includes(ENV_BROWSER_TAG),
    distribution,
  };
}

export function mergePlayEnvironmentIntoTags(
  tags: string[],
  env: PlayEnvironmentFormState,
): string[] {
  const withoutMeta = tags.filter((tag) => !isMetaTag(tag));
  const next = [...withoutMeta];

  if (env.pc) {
    next.push(ENV_PC_TAG);
  }
  if (env.mobile) {
    next.push(ENV_MOBILE_TAG);
  }
  if (env.browser) {
    next.push(ENV_BROWSER_TAG);
  }

  if (env.distribution === "external") {
    next.push(DIST_EXTERNAL_TAG);
  } else if (env.distribution === "download") {
    next.push(DIST_DOWNLOAD_TAG);
  } else if (env.distribution === "browser") {
    next.push(DIST_BROWSER_TAG);
  }

  return next;
}

export const EXTERNAL_LINK_SAFETY_NOTE =
  "外部サイトへ移動します。配布元と内容を確認してから実行してください。";

export const DOWNLOAD_SAFETY_NOTE =
  "ダウンロード前に配布元・ファイル形式を確認してください。";

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
  return (
    Boolean(game.steamUrl) ||
    urlMatches(game, (url) => url.includes("steampowered.com"))
  );
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
