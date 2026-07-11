import type { Game } from "@/lib/mock-games";
import {
  getPrimaryPublishDestination,
  normalizePublishLinkUrl,
  resolveGamePublishLinks,
  toPublishDestinationDisplays,
  type PublishDestinationDisplay,
} from "@/lib/project-publish-links";

export type PlayDestination = {
  label: string;
  url: string;
  actionLabel: string;
};

export type PublicationDisplay = {
  /** 公開先の種類ラベル（Steam / itch.io など）。情報表示専用。 */
  labels: string[];
};

/**
 * 外部 URL を絶対 http(s) に正規化する。
 * scheme なし（例: example.com/path）を相対パス扱いすると Forge 内 404 になるため、https:// を付与する。
 */
export function normalizeExternalUrl(
  url: string | null | undefined,
): string | null {
  return normalizePublishLinkUrl(url);
}

function toPlayDestination(item: PublishDestinationDisplay): PlayDestination {
  return {
    label: item.kindLabel,
    url: item.url,
    actionLabel: item.actionLabel,
  };
}

/**
 * 「プレイする」から遷移できる公開先。
 * メイン公開先を先頭にし、その他の公開先が続く。
 */
export function resolvePlayDestinations(
  game: Game | null | undefined,
): PlayDestination[] {
  if (!game) {
    return [];
  }

  const { publishDestinations } = resolveGamePublishLinks(game);
  const displays = toPublishDestinationDisplays(publishDestinations);
  const primary = displays.filter((item) => item.isPrimary);
  const secondary = displays.filter((item) => !item.isPrimary);
  return [...primary, ...secondary].map(toPlayDestination);
}

/** Studio / projects.play_url に保存された主プレイ URL（CTA の第一候補）。 */
export function resolvePrimaryPlayUrl(
  game: Game | null | undefined,
): string | null {
  if (!game) {
    return null;
  }

  const { publishDestinations } = resolveGamePublishLinks(game);
  const primary = getPrimaryPublishDestination(publishDestinations);
  if (primary) {
    return normalizeExternalUrl(primary.url);
  }

  return normalizeExternalUrl(game.playUrl) ?? resolvePlayDestinations(game)[0]?.url ?? null;
}

/**
 * 外部プレイ URL を新しいタブで開く。
 * 可能なら `<a target="_blank" rel="noopener noreferrer">` を優先し、
 * プログラムから開く場合も await せず同期で呼ぶこと（popup blocker 回避）。
 */
export function openExternalPlayUrl(url: string): boolean {
  const normalized = normalizeExternalUrl(url);
  if (!normalized || typeof window === "undefined") {
    return false;
  }

  const opened = window.open(normalized, "_blank", "noopener,noreferrer");
  if (opened) {
    return true;
  }

  // popup blocker 時のフォールバック: 一時 <a> クリック
  const anchor = document.createElement("a");
  anchor.href = normalized;
  anchor.target = "_blank";
  anchor.rel = "noopener noreferrer";
  anchor.referrerPolicy = "no-referrer";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  return true;
}

export const PLAY_URL_MISSING_MESSAGE =
  "この作品はまだ公開先が設定されていません";

/** 概要タブ右カラム「公開先」の情報表示用（リンクにはしない）。 */
export function resolvePublicationDisplay(
  game: Game | null | undefined,
): PublicationDisplay | null {
  const destinations = resolvePlayDestinations(game);
  if (destinations.length === 0) {
    return null;
  }

  return {
    labels: destinations.map((destination) => destination.label),
  };
}
