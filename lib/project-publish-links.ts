/**
 * 公開先（遊ぶ・入手する）と関連リンク（読む・見る）の正本。
 * DB は JSONB（publish_destinations / related_links）＋レガシー URL 列の二重書き込み。
 */

import type { DistributionType } from "@/lib/play-environment";

/** Absolute http(s) URL. Duplicated lightly to avoid import cycles with game-play-destinations. */
export function normalizePublishLinkUrl(
  url: string | null | undefined,
): string | null {
  const trimmed = url?.trim();
  if (!trimmed) {
    return null;
  }
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed)) {
    return null;
  }
  if (trimmed.startsWith("//")) {
    return `https:${trimmed}`;
  }
  return `https://${trimmed.replace(/^\/+/, "")}`;
}

export const PUBLISH_DESTINATION_KINDS = [
  "steam",
  "itch",
  "unity_play",
  "plicy",
  "booth",
  "google_drive",
  "github_releases",
  "app_store",
  "google_play",
  "self_site",
  "other",
] as const;

export type PublishDestinationKind = (typeof PUBLISH_DESTINATION_KINDS)[number];

export const PUBLISH_DESTINATION_KIND_LABELS: Record<PublishDestinationKind, string> = {
  steam: "Steam",
  itch: "itch.io",
  unity_play: "Unity Play",
  plicy: "PLiCy",
  booth: "BOOTH",
  google_drive: "Google Drive",
  github_releases: "GitHub Releases",
  app_store: "App Store",
  google_play: "Google Play",
  self_site: "自サイト",
  other: "その他",
};

/** 自サイト・その他だけ利用方法を選ぶ */
export const PUBLISH_USAGE_METHODS = [
  "browser",
  "download",
  "store",
  "other",
] as const;

export type PublishUsageMethod = (typeof PUBLISH_USAGE_METHODS)[number];

export const PUBLISH_USAGE_METHOD_LABELS: Record<PublishUsageMethod, string> = {
  browser: "ブラウザで遊ぶ",
  download: "ダウンロードする",
  store: "ストアで入手する",
  other: "その他",
};

export const RELATED_LINK_KINDS = [
  "note_blog",
  "pv_video",
  "official_site",
  "other",
] as const;

export type RelatedLinkKind = (typeof RELATED_LINK_KINDS)[number];

export const RELATED_LINK_KIND_LABELS: Record<RelatedLinkKind, string> = {
  note_blog: "note・ブログ・制作記録",
  pv_video: "PV・動画",
  official_site: "公式サイト",
  other: "その他",
};

export type PublishDestination = {
  id: string;
  kind: PublishDestinationKind;
  url: string;
  /** 自サイト・その他のみ。それ以外は null */
  usageMethod: PublishUsageMethod | null;
  isPrimary: boolean;
};

export type RelatedLink = {
  id: string;
  kind: RelatedLinkKind;
  url: string;
  label: string | null;
};

export type LegacyProjectLinkFields = {
  playUrl?: string | null;
  steamUrl?: string | null;
  itchUrl?: string | null;
  githubUrl?: string | null;
  discordUrl?: string | null;
  officialUrl?: string | null;
  xUrl?: string | null;
  youtubeUrl?: string | null;
  tags?: string[] | null;
};

export type SyncedLegacyLinkFields = {
  playUrl: string;
  steamUrl?: string;
  itchUrl?: string;
  githubUrl?: string;
  discordUrl?: string;
  officialUrl?: string;
  xUrl?: string;
  youtubeUrl?: string;
};

function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `link-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function createEmptyPublishDestination(
  partial?: Partial<PublishDestination>,
): PublishDestination {
  return {
    id: newId(),
    kind: "other",
    url: "",
    usageMethod: "other",
    isPrimary: false,
    ...partial,
  };
}

export function createEmptyRelatedLink(partial?: Partial<RelatedLink>): RelatedLink {
  return {
    id: newId(),
    kind: "other",
    url: "",
    label: null,
    ...partial,
  };
}

export function publishKindNeedsUsageMethod(kind: PublishDestinationKind): boolean {
  return kind === "self_site" || kind === "other";
}

export function defaultUsageForKind(
  kind: PublishDestinationKind,
): PublishUsageMethod | null {
  if (publishKindNeedsUsageMethod(kind)) {
    return "other";
  }
  switch (kind) {
    case "steam":
    case "booth":
    case "app_store":
    case "google_play":
      return "store";
    case "google_drive":
    case "github_releases":
      return "download";
    case "itch":
    case "unity_play":
    case "plicy":
      return "browser";
    default:
      return null;
  }
}

function destinationKey(url: string): string {
  return url.trim().replace(/\/+$/, "").toLowerCase();
}

function isPublishDestinationKind(value: unknown): value is PublishDestinationKind {
  return (
    typeof value === "string" &&
    (PUBLISH_DESTINATION_KINDS as readonly string[]).includes(value)
  );
}

function isPublishUsageMethod(value: unknown): value is PublishUsageMethod {
  return (
    typeof value === "string" &&
    (PUBLISH_USAGE_METHODS as readonly string[]).includes(value)
  );
}

function isRelatedLinkKind(value: unknown): value is RelatedLinkKind {
  return (
    typeof value === "string" &&
    (RELATED_LINK_KINDS as readonly string[]).includes(value)
  );
}

export function sanitizePublishDestinations(raw: unknown): PublishDestination[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  const items: PublishDestination[] = [];
  for (const entry of raw) {
    if (!entry || typeof entry !== "object") {
      continue;
    }
    const record = entry as Record<string, unknown>;
    const url = typeof record.url === "string" ? record.url.trim() : "";
    if (!url || !isPublishDestinationKind(record.kind)) {
      continue;
    }
    const kind = record.kind;
    const usageMethod = publishKindNeedsUsageMethod(kind)
      ? isPublishUsageMethod(record.usageMethod)
        ? record.usageMethod
        : "other"
      : null;
    items.push({
      id: typeof record.id === "string" && record.id ? record.id : newId(),
      kind,
      url,
      usageMethod,
      isPrimary: Boolean(record.isPrimary),
    });
  }

  return normalizePrimaryFlag(items);
}

export function sanitizeRelatedLinks(raw: unknown): RelatedLink[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  const items: RelatedLink[] = [];
  for (const entry of raw) {
    if (!entry || typeof entry !== "object") {
      continue;
    }
    const record = entry as Record<string, unknown>;
    const url = typeof record.url === "string" ? record.url.trim() : "";
    if (!url || !isRelatedLinkKind(record.kind)) {
      continue;
    }
    const label =
      typeof record.label === "string" && record.label.trim()
        ? record.label.trim()
        : null;
    items.push({
      id: typeof record.id === "string" && record.id ? record.id : newId(),
      kind: record.kind,
      url,
      label,
    });
  }
  return items;
}

export function normalizePrimaryFlag(
  destinations: PublishDestination[],
): PublishDestination[] {
  if (destinations.length === 0) {
    return destinations;
  }
  const primaryIndex = destinations.findIndex((item) => item.isPrimary);
  return destinations.map((item, index) => ({
    ...item,
    isPrimary: primaryIndex >= 0 ? index === primaryIndex : index === 0,
  }));
}

export function getPrimaryPublishDestination(
  destinations: PublishDestination[],
): PublishDestination | null {
  const normalized = normalizePrimaryFlag(destinations);
  return normalized.find((item) => item.isPrimary) ?? normalized[0] ?? null;
}

function inferKindFromUrl(url: string): PublishDestinationKind {
  const lower = url.toLowerCase();
  if (lower.includes("steampowered.com") || lower.includes("steamcommunity.com")) {
    return "steam";
  }
  if (lower.includes("itch.io")) {
    return "itch";
  }
  if (lower.includes("play.unity.com")) {
    return "unity_play";
  }
  if (lower.includes("plicy.net")) {
    return "plicy";
  }
  if (lower.includes("booth.pm")) {
    return "booth";
  }
  if (lower.includes("drive.google.com") || lower.includes("docs.google.com")) {
    return "google_drive";
  }
  if (lower.includes("github.com") && lower.includes("/releases")) {
    return "github_releases";
  }
  if (lower.includes("apps.apple.com") || lower.includes("itunes.apple.com")) {
    return "app_store";
  }
  if (lower.includes("play.google.com")) {
    return "google_play";
  }
  if (
    lower.includes("github.io") ||
    lower.includes("vercel.app") ||
    lower.includes("netlify.app") ||
    lower.endsWith(".html")
  ) {
    return "self_site";
  }
  return "other";
}

function usageFromDistributionTags(tags: string[] | null | undefined): PublishUsageMethod {
  const list = tags ?? [];
  if (list.some((tag) => tag.includes("ブラウザプレイ") || tag === "配布:ブラウザプレイ")) {
    return "browser";
  }
  if (list.some((tag) => tag.includes("ダウンロード") || tag === "配布:ダウンロード")) {
    return "download";
  }
  if (list.some((tag) => tag.includes("外部リンク") || tag === "配布:外部リンク")) {
    return "store";
  }
  return "other";
}

function distributionFromUsage(usage: PublishUsageMethod | null): DistributionType {
  switch (usage) {
    case "browser":
      return "browser";
    case "download":
      return "download";
    case "store":
    case "other":
      return "external";
    default:
      return "external";
  }
}

export function resolveEffectiveUsage(
  destination: Pick<PublishDestination, "kind" | "usageMethod">,
): PublishUsageMethod {
  if (publishKindNeedsUsageMethod(destination.kind)) {
    return destination.usageMethod ?? "other";
  }
  return defaultUsageForKind(destination.kind) ?? "other";
}

/**
 * JSONB が空のとき、レガシー列から公開先・関連リンクを復元する。
 * 既存作品のリンクが消えないことが最優先。
 */
export function derivePublishLinksFromLegacy(fields: LegacyProjectLinkFields): {
  publishDestinations: PublishDestination[];
  relatedLinks: RelatedLink[];
} {
  const seen = new Set<string>();
  const publishDestinations: PublishDestination[] = [];
  const relatedLinks: RelatedLink[] = [];

  function pushPublish(
    url: string | null | undefined,
    kindHint?: PublishDestinationKind,
    isPrimary = false,
  ) {
    const normalized = normalizePublishLinkUrl(url);
    if (!normalized) {
      return;
    }
    const key = destinationKey(normalized);
    if (seen.has(key)) {
      return;
    }
    seen.add(key);
    const kind = kindHint ?? inferKindFromUrl(normalized);
    const needsUsage = publishKindNeedsUsageMethod(kind);
    publishDestinations.push({
      id: newId(),
      kind,
      url: normalized,
      usageMethod: needsUsage
        ? usageFromDistributionTags(fields.tags)
        : null,
      isPrimary,
    });
  }

  function pushRelated(
    url: string | null | undefined,
    kind: RelatedLinkKind,
    label?: string,
  ) {
    const normalized = normalizePublishLinkUrl(url);
    if (!normalized) {
      return;
    }
    const key = destinationKey(normalized);
    if (seen.has(key)) {
      return;
    }
    seen.add(key);
    relatedLinks.push({
      id: newId(),
      kind,
      url: normalized,
      label: label ?? null,
    });
  }

  const playUrl = fields.playUrl?.trim();
  if (playUrl) {
    let kind: PublishDestinationKind = inferKindFromUrl(playUrl);
    if (fields.steamUrl && destinationKey(fields.steamUrl) === destinationKey(playUrl)) {
      kind = "steam";
    } else if (fields.itchUrl && destinationKey(fields.itchUrl) === destinationKey(playUrl)) {
      kind = "itch";
    }
    pushPublish(playUrl, kind, true);
  }

  pushPublish(fields.steamUrl, "steam");
  pushPublish(fields.itchUrl, "itch");

  // 公式は「遊ぶ場所」ではなく関連リンクへ（play_url と同一なら既に公開先）
  pushRelated(fields.officialUrl, "official_site");
  pushRelated(fields.youtubeUrl, "pv_video");
  pushRelated(fields.discordUrl, "other", "Discord");
  pushRelated(fields.xUrl, "other", "X");

  const github = fields.githubUrl?.trim();
  if (github) {
    if (github.toLowerCase().includes("/releases")) {
      pushPublish(github, "github_releases");
    } else {
      pushRelated(github, "other", "GitHub");
    }
  }

  return {
    publishDestinations: normalizePrimaryFlag(publishDestinations),
    relatedLinks,
  };
}

export function resolveGamePublishLinks(game: {
  publishDestinations?: PublishDestination[] | null;
  relatedLinks?: RelatedLink[] | null;
} & LegacyProjectLinkFields): {
  publishDestinations: PublishDestination[];
  relatedLinks: RelatedLink[];
} {
  const fromJson = sanitizePublishDestinations(game.publishDestinations);
  const relatedFromJson = sanitizeRelatedLinks(game.relatedLinks);
  const derived = derivePublishLinksFromLegacy(game);

  if (fromJson.length > 0) {
    const publishKeys = new Set(
      fromJson.map((item) => destinationKey(item.url)),
    );
    const related =
      relatedFromJson.length > 0
        ? relatedFromJson
        : derived.relatedLinks.filter(
            (item) => !publishKeys.has(destinationKey(item.url)),
          );
    return {
      publishDestinations: fromJson,
      relatedLinks: related,
    };
  }

  if (relatedFromJson.length > 0) {
    return {
      publishDestinations: derived.publishDestinations,
      relatedLinks: relatedFromJson,
    };
  }

  return derived;
}

/** 保存時: 構造化 → レガシー列同期 */
export function syncLegacyFieldsFromPublishLinks(
  destinations: PublishDestination[],
  relatedLinks: RelatedLink[],
): SyncedLegacyLinkFields {
  const normalized = normalizePrimaryFlag(
    destinations.filter((item) => item.url.trim()),
  );
  const primary = getPrimaryPublishDestination(normalized);
  const playUrl = primary?.url.trim() ?? "";

  let steamUrl: string | undefined;
  let itchUrl: string | undefined;
  let githubUrl: string | undefined;
  let officialUrl: string | undefined;
  let youtubeUrl: string | undefined;
  let discordUrl: string | undefined;
  let xUrl: string | undefined;

  for (const item of normalized) {
    if (item.kind === "steam" && !steamUrl) {
      steamUrl = item.url.trim();
    }
    if (item.kind === "itch" && !itchUrl) {
      itchUrl = item.url.trim();
    }
    if (item.kind === "github_releases" && !githubUrl) {
      githubUrl = item.url.trim();
    }
  }

  for (const item of relatedLinks) {
    const url = item.url.trim();
    if (!url) {
      continue;
    }
    if (item.kind === "official_site" && !officialUrl) {
      officialUrl = url;
    }
    if (item.kind === "pv_video" && !youtubeUrl) {
      youtubeUrl = url;
    }
    if (item.kind === "other") {
      const label = (item.label ?? "").toLowerCase();
      if (!discordUrl && (label.includes("discord") || url.includes("discord"))) {
        discordUrl = url;
      } else if (
        !xUrl &&
        (label === "x" || label.includes("twitter") || url.includes("x.com") || url.includes("twitter.com"))
      ) {
        xUrl = url;
      } else if (
        !githubUrl &&
        (label.includes("github") || url.includes("github.com"))
      ) {
        githubUrl = url;
      }
    }
  }

  return {
    playUrl,
    steamUrl,
    itchUrl,
    githubUrl,
    discordUrl,
    officialUrl,
    xUrl,
    youtubeUrl,
  };
}

/** 配布タグ同期用: メイン公開先から distribution を推定 */
export function distributionTypeFromPrimary(
  destinations: PublishDestination[],
): DistributionType {
  const primary = getPrimaryPublishDestination(destinations);
  if (!primary) {
    return "";
  }
  return distributionFromUsage(resolveEffectiveUsage(primary));
}

export type PublishDestinationDisplay = {
  id: string;
  kind: PublishDestinationKind;
  kindLabel: string;
  url: string;
  actionLabel: string;
  isPrimary: boolean;
};

export type RelatedLinkDisplay = {
  id: string;
  kind: RelatedLinkKind;
  kindLabel: string;
  url: string;
  displayLabel: string;
};

/** CTA / 一覧用のアクション文言（サービス名と利用方法の二重表現を避ける） */
export function getPublishDestinationActionLabel(
  destination: Pick<PublishDestination, "kind" | "usageMethod">,
): string {
  switch (destination.kind) {
    case "steam":
      return "Steamで見る";
    case "itch":
      return "itch.ioで遊ぶ";
    case "unity_play":
      return "Unity Playで遊ぶ";
    case "plicy":
      return "PLiCyで遊ぶ";
    case "booth":
      return "BOOTHで入手する";
    case "google_drive":
      return "ダウンロードする";
    case "github_releases":
      return "ダウンロードする";
    case "app_store":
      return "App Storeで入手する";
    case "google_play":
      return "Google Playで入手する";
    case "self_site":
    case "other": {
      const usage = destination.usageMethod ?? "other";
      return PUBLISH_USAGE_METHOD_LABELS[usage];
    }
    default:
      return "公開先を開く";
  }
}

export function toPublishDestinationDisplays(
  destinations: PublishDestination[],
): PublishDestinationDisplay[] {
  return normalizePrimaryFlag(destinations)
    .filter((item) => item.url.trim())
    .map((item) => ({
      id: item.id,
      kind: item.kind,
      kindLabel: PUBLISH_DESTINATION_KIND_LABELS[item.kind],
      url: normalizePublishLinkUrl(item.url) ?? item.url.trim(),
      actionLabel: getPublishDestinationActionLabel(item),
      isPrimary: item.isPrimary,
    }));
}

export function toRelatedLinkDisplays(links: RelatedLink[]): RelatedLinkDisplay[] {
  return links
    .filter((item) => item.url.trim())
    .map((item) => ({
      id: item.id,
      kind: item.kind,
      kindLabel: RELATED_LINK_KIND_LABELS[item.kind],
      url: normalizePublishLinkUrl(item.url) ?? item.url.trim(),
      displayLabel: item.label?.trim() || RELATED_LINK_KIND_LABELS[item.kind],
    }));
}

export function validatePublishDestinations(
  destinations: PublishDestination[],
): string | null {
  const withUrl = destinations.filter((item) => item.url.trim());
  if (withUrl.length === 0) {
    return "メイン公開先のURLを入力してください。";
  }
  const primary = getPrimaryPublishDestination(withUrl);
  if (!primary?.url.trim()) {
    return "メイン公開先のURLを入力してください。";
  }
  if (!primary.kind) {
    return "公開先の種類を選んでください。";
  }
  if (publishKindNeedsUsageMethod(primary.kind) && !primary.usageMethod) {
    return "利用方法を選んでください。";
  }
  for (const item of withUrl) {
    if (publishKindNeedsUsageMethod(item.kind) && !item.usageMethod) {
      return "自サイト・その他の公開先は利用方法を選んでください。";
    }
  }
  return null;
}

export function countConfiguredPublishLinks(
  destinations: PublishDestination[],
  relatedLinks: RelatedLink[],
): { publishCount: number; relatedCount: number } {
  return {
    publishCount: destinations.filter((item) => item.url.trim()).length,
    relatedCount: relatedLinks.filter((item) => item.url.trim()).length,
  };
}

export function publishDestinationsForDb(
  destinations: PublishDestination[],
): PublishDestination[] {
  return normalizePrimaryFlag(
    destinations
      .filter((item) => item.url.trim())
      .map((item) => ({
        ...item,
        url: item.url.trim(),
        usageMethod: publishKindNeedsUsageMethod(item.kind)
          ? item.usageMethod ?? "other"
          : null,
      })),
  );
}

export function relatedLinksForDb(links: RelatedLink[]): RelatedLink[] {
  return links
    .filter((item) => item.url.trim())
    .map((item) => ({
      ...item,
      url: item.url.trim(),
      label: item.label?.trim() || null,
    }));
}
