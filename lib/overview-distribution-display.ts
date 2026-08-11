/**
 * Overview 「公開・配布」/ 関連リンク の表示正本。
 * 既存の kind / usage / URL / category_attributes / 配布タグだけを使う。
 * ホスト名は出さない。動詞 CTA も出さない。
 */

import type { Game } from "@/lib/mock-games";
import {
  DIST_BROWSER_TAG,
  DIST_DOWNLOAD_TAG,
  DIST_EXTERNAL_TAG,
  type DistributionType,
} from "@/lib/play-environment";
import {
  PUBLISH_DESTINATION_KIND_LABELS,
  RELATED_LINK_KIND_LABELS,
  normalizePublishLinkUrl,
  type PublishDestinationKind,
  type PublishUsageMethod,
  type RelatedLinkDisplay,
  type RelatedLinkKind,
} from "@/lib/project-publish-links";
import { decodeCategoryAttributesToPrototypeFields } from "@/lib/studio-non-game-attributes";

export const OVERVIEW_PUBLICATION_TITLE = "公開・配布";

export const GENERIC_DIRECT_DOWNLOAD = "直接ダウンロード";
export const GENERIC_BROWSER = "ブラウザ版";
export const GENERIC_EXTERNAL_STORE = "外部ストア";
/** Owner decision A: other external URL, platform unknown — not a guessed site name. */
export const GENERIC_EXTERNAL_PAGE = "外部ページ";
export const RELATED_LINK_UNLABELED = "関連ページ";

const HIDDEN_KIND_LABELS = new Set(["その他", "other"]);
const PROTOTYPE_KNOWN_PLATFORM_LABELS = new Set([
  "YouTube",
  "SoundCloud",
  "Bandcamp",
  "BOOTH",
  "Spotify",
  "Apple Music",
  "Google Drive",
  "GitHub Releases",
  "GitHubリポジトリ",
  "npm",
  "PyPI",
  "Unity Asset Store",
  "App Store",
  "Google Play",
]);
const PROTOTYPE_BROWSER_KIND_LABELS = new Set(["ブラウザ版", "Webサービス"]);
const PROTOTYPE_STORE_KIND_LABELS = new Set([
  "拡張機能ストア",
  "ブラウザ拡張機能ストア",
]);

const KNOWN_FORMAL_PLATFORM_KINDS = new Set<PublishDestinationKind>([
  "steam",
  "itch",
  "unity_play",
  "plicy",
  "booth",
  "google_drive",
  "github_releases",
  "app_store",
  "google_play",
]);

export type OverviewDistributionResolveInput = {
  url: string;
  formalKind?: PublishDestinationKind | null;
  usageMethod?: PublishUsageMethod | null;
  prototypeKindLabel?: string | null;
  distributionType?: DistributionType | null;
};

function urlKey(url: string): string {
  return url.trim().replace(/\/+$/, "").toLowerCase();
}

export function isTechnicalDistributionHost(url: string): boolean {
  const normalized = normalizePublishLinkUrl(url) ?? url.trim();
  let hostname = "";
  try {
    hostname = new URL(normalized).hostname.toLowerCase();
  } catch {
    hostname = normalized.toLowerCase();
  }
  if (!hostname) return false;
  if (hostname.endsWith(".supabase.co") || hostname === "supabase.co") return true;
  if (hostname === "storage.googleapis.com" || hostname.endsWith(".storage.googleapis.com")) {
    return true;
  }
  if (hostname.includes("cloudflarestorage.com") || hostname.endsWith(".r2.dev")) {
    return true;
  }
  if (hostname.includes("amazonaws.com") || hostname.startsWith("s3.")) return true;
  if (hostname.includes("blob.vercel-storage.com")) return true;
  if (hostname.includes("storage.unity.com")) return true;
  return /(?:^|\.)(?:cdn|storage|object)\./i.test(hostname);
}

function hostnameOf(url: string): string | null {
  const normalized = normalizePublishLinkUrl(url) ?? url.trim();
  if (!normalized) return null;
  try {
    return new URL(normalized).hostname.toLowerCase();
  } catch {
    return null;
  }
}

function pathnameOf(url: string): string {
  const normalized = normalizePublishLinkUrl(url) ?? url.trim();
  try {
    return new URL(normalized).pathname;
  } catch {
    return "";
  }
}

function hostMatches(hostname: string, roots: readonly string[]): boolean {
  return roots.some(
    (root) => hostname === root || hostname.endsWith(`.${root}`),
  );
}

export function inferKnownPlatformLabel(url: string): string | null {
  const hostname = hostnameOf(url);
  if (!hostname) return null;

  if (hostMatches(hostname, ["steampowered.com", "steamcommunity.com"])) {
    return "Steam";
  }
  if (hostMatches(hostname, ["itch.io"])) return "itch.io";
  if (hostMatches(hostname, ["play.unity.com"])) return "Unity Play";
  if (hostMatches(hostname, ["plicy.net"])) return "PLiCy";
  if (hostMatches(hostname, ["booth.pm"])) return "BOOTH";
  if (hostMatches(hostname, ["drive.google.com", "docs.google.com"])) {
    return "Google Drive";
  }
  if (hostMatches(hostname, ["github.com"])) {
    return pathnameOf(url).includes("/releases") ? "GitHub Releases" : "GitHub";
  }
  if (hostMatches(hostname, ["apps.apple.com", "itunes.apple.com"])) {
    return "App Store";
  }
  if (hostMatches(hostname, ["play.google.com"])) return "Google Play";
  if (hostMatches(hostname, ["youtube.com", "youtu.be"])) return "YouTube";
  if (hostMatches(hostname, ["soundcloud.com"])) return "SoundCloud";
  if (hostMatches(hostname, ["bandcamp.com"])) return "Bandcamp";
  if (hostMatches(hostname, ["spotify.com"])) return "Spotify";
  if (hostMatches(hostname, ["music.apple.com"])) return "Apple Music";
  if (hostMatches(hostname, ["npmjs.com"])) return "npm";
  if (hostMatches(hostname, ["pypi.org"])) return "PyPI";
  if (hostMatches(hostname, ["assetstore.unity.com"])) return "Unity Asset Store";
  if (hostMatches(hostname, ["discord.gg", "discord.com"])) return "Discord";
  if (hostMatches(hostname, ["x.com", "twitter.com"])) return "X";
  if (hostMatches(hostname, ["note.com"])) return "note";
  return null;
}

export function genericLabelFromUsage(
  usage: PublishUsageMethod | null | undefined,
): string | null {
  if (usage === "download") return GENERIC_DIRECT_DOWNLOAD;
  if (usage === "browser") return GENERIC_BROWSER;
  if (usage === "store") return GENERIC_EXTERNAL_STORE;
  return null;
}

export function genericLabelFromDistribution(
  distribution: DistributionType | null | undefined,
): string | null {
  if (distribution === "download") return GENERIC_DIRECT_DOWNLOAD;
  if (distribution === "browser") return GENERIC_BROWSER;
  if (distribution === "external") return GENERIC_EXTERNAL_STORE;
  return null;
}

function usableSavedKindLabel(label: string | null | undefined): string | null {
  const trimmed = label?.trim() ?? "";
  if (!trimmed) return null;
  if (HIDDEN_KIND_LABELS.has(trimmed)) return null;
  if (PROTOTYPE_BROWSER_KIND_LABELS.has(trimmed)) return null;
  if (PROTOTYPE_STORE_KIND_LABELS.has(trimmed)) return null;
  if (trimmed === "自サイト" || trimmed === "Discord等の追加・招待先") return null;
  if (!PROTOTYPE_KNOWN_PLATFORM_LABELS.has(trimmed)) return null;
  if (isTechnicalDistributionHost(trimmed)) return null;
  if (/ダウンロードする|で遊ぶ|で入手する|で開く|で見る/.test(trimmed)) {
    return null;
  }
  return trimmed;
}

/** 明示の配布タグだけ。playUrl からの推定 default `external` は使わない。 */
export function explicitDistributionFromTags(
  tags: string[] | null | undefined,
): DistributionType {
  const list = tags ?? [];
  if (list.includes(DIST_BROWSER_TAG)) return "browser";
  if (list.includes(DIST_DOWNLOAD_TAG)) return "download";
  if (list.includes(DIST_EXTERNAL_TAG)) return "external";
  return "";
}

export function resolveOverviewDistributionLabel(
  input: OverviewDistributionResolveInput,
): string | null {
  const formal = input.formalKind ?? null;
  const proto = input.prototypeKindLabel?.trim() ?? "";

  const fromPrototype = usableSavedKindLabel(input.prototypeKindLabel);
  if (fromPrototype) return fromPrototype;

  if (formal && KNOWN_FORMAL_PLATFORM_KINDS.has(formal)) {
    return PUBLISH_DESTINATION_KIND_LABELS[formal];
  }

  const fromUrl = inferKnownPlatformLabel(input.url);
  if (fromUrl) return fromUrl;

  if (PROTOTYPE_BROWSER_KIND_LABELS.has(proto)) return GENERIC_BROWSER;

  const fromUsage = genericLabelFromUsage(input.usageMethod);
  if (fromUsage) return fromUsage;

  // ゲーム全体の 配布:外部リンク は usage `other` を「外部ストア」に上書きしない。
  if (input.usageMethod !== "other") {
    const fromDistribution = genericLabelFromDistribution(input.distributionType);
    if (fromDistribution) return fromDistribution;
  }

  if (PROTOTYPE_STORE_KIND_LABELS.has(proto)) return GENERIC_EXTERNAL_STORE;

  if (proto === "自サイト" || formal === "self_site") {
    return "自サイト";
  }

  const hasUrl = Boolean((normalizePublishLinkUrl(input.url) ?? input.url).trim());
  return hasUrl ? GENERIC_EXTERNAL_PAGE : null;
}

export function prototypeKindLabelByUrl(game: Game | null | undefined): Map<string, string> {
  const map = new Map<string, string>();
  if (!game?.categoryAttributes) return map;
  const fields = decodeCategoryAttributesToPrototypeFields(game.categoryAttributes);
  for (const item of fields.publishDestinations) {
    const normalized = normalizePublishLinkUrl(item.url);
    const kind = item.kind.trim();
    if (!normalized || !kind) continue;
    map.set(urlKey(normalized), kind);
  }
  return map;
}

export function resolveOverviewDistributionLabelForGame(
  game: Game,
  input: Omit<OverviewDistributionResolveInput, "distributionType" | "prototypeKindLabel"> & {
    prototypeKindLabel?: string | null;
  },
): string | null {
  const protoMap = prototypeKindLabelByUrl(game);
  const key = urlKey(normalizePublishLinkUrl(input.url) ?? input.url);
  return resolveOverviewDistributionLabel({
    ...input,
    prototypeKindLabel: input.prototypeKindLabel ?? protoMap.get(key) ?? null,
    distributionType: explicitDistributionFromTags(game.tags),
  });
}

function isHiddenKindLabel(label: string | null | undefined): boolean {
  const trimmed = label?.trim() ?? "";
  return !trimmed || HIDDEN_KIND_LABELS.has(trimmed);
}

export function resolveRelatedLinkIdentity(link: {
  url: string;
  kind?: RelatedLinkKind | null;
  kindLabel?: string | null;
  displayLabel?: string | null;
  label?: string | null;
}): string {
  const custom = (link.label ?? link.displayLabel)?.trim() ?? "";
  if (custom && !isHiddenKindLabel(custom) && !isTechnicalDistributionHost(custom)) {
    if (custom !== RELATED_LINK_KIND_LABELS.other) {
      return custom;
    }
  }

  const fromUrl = inferKnownPlatformLabel(link.url);
  if (fromUrl) return fromUrl;

  const kindLabel =
    link.kindLabel?.trim() ||
    (link.kind ? RELATED_LINK_KIND_LABELS[link.kind] : "");
  if (kindLabel && !isHiddenKindLabel(kindLabel)) {
    return kindLabel;
  }

  return RELATED_LINK_UNLABELED;
}

export function overviewRelatedLinkIdentity(link: RelatedLinkDisplay): string {
  return resolveRelatedLinkIdentity({
    url: link.url,
    kind: link.kind,
    kindLabel: link.kindLabel,
    displayLabel: link.displayLabel,
  });
}

export function hostnameWouldBeUnsafeAsLabel(url: string): boolean {
  return isTechnicalDistributionHost(url);
}
