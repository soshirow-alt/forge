import type { Game } from "@/lib/mock-games";

export type PlayDestination = {
  label: string;
  url: string;
  actionLabel: string;
};

export type PublicationDisplay = {
  /** 公開プラットフォーム名（Steam / itch.io など）。情報表示専用。 */
  labels: string[];
};

/**
 * 外部 URL を絶対 http(s) に正規化する。
 * scheme なし（例: example.com/path）を相対パス扱いすると Forge 内 404 になるため、https:// を付与する。
 */
export function normalizeExternalUrl(
  url: string | null | undefined,
): string | null {
  const trimmed = url?.trim();
  if (!trimmed) {
    return null;
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  // javascript: / data: 等は開かない
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed)) {
    return null;
  }

  if (trimmed.startsWith("//")) {
    return `https:${trimmed}`;
  }

  // "/path" だけだと同一オリジン相対になり Forge 404 になる。ホスト付きとみなして https を付与。
  return `https://${trimmed.replace(/^\/+/, "")}`;
}

function destinationKey(url: string): string {
  return url.trim().replace(/\/+$/, "").toLowerCase();
}

function labelFromUrl(
  url: string,
  fieldHint?: "official",
): Pick<PlayDestination, "label" | "actionLabel"> {
  if (fieldHint === "official") {
    return { label: "公式サイト", actionLabel: "公式サイトで開く" };
  }

  const lower = url.toLowerCase();

  if (lower.includes("steampowered.com") || lower.includes("steamcommunity.com")) {
    return { label: "Steam", actionLabel: "Steamで開く" };
  }
  if (lower.includes("itch.io")) {
    return { label: "itch.io", actionLabel: "itch.ioで遊ぶ" };
  }
  if (lower.includes(".zip") || lower.includes("drive.google.com")) {
    return { label: "ダウンロード", actionLabel: "ダウンロードする" };
  }
  if (
    lower.includes("github.io") ||
    lower.includes("vercel.app") ||
    lower.includes("netlify.app") ||
    lower.endsWith(".html")
  ) {
    return { label: "ブラウザ", actionLabel: "ブラウザで起動" };
  }

  return { label: "外部サイト", actionLabel: "外部サイトで開く" };
}

function appendDestination(
  destinations: PlayDestination[],
  seen: Set<string>,
  url: string | undefined,
  fieldHint?: "official",
) {
  const normalized = normalizeExternalUrl(url);
  if (!normalized) {
    return;
  }

  const key = destinationKey(normalized);
  if (seen.has(key)) {
    return;
  }

  seen.add(key);
  const { label, actionLabel } = labelFromUrl(normalized, fieldHint);
  destinations.push({ label, url: normalized, actionLabel });
}

/**
 * 「プレイする」から遷移できる公開先。
 * playUrl を優先し、Steam / itch.io / 公式サイトなど重複 URL は除外する。
 */
export function resolvePlayDestinations(
  game: Game | null | undefined,
): PlayDestination[] {
  if (!game) {
    return [];
  }

  const destinations: PlayDestination[] = [];
  const seen = new Set<string>();

  appendDestination(destinations, seen, game.playUrl);
  appendDestination(destinations, seen, game.steamUrl);
  appendDestination(destinations, seen, game.itchUrl);
  appendDestination(destinations, seen, game.officialUrl, "official");

  return destinations;
}

/** Studio / projects.play_url に保存された主プレイ URL（CTA の第一候補）。 */
export function resolvePrimaryPlayUrl(
  game: Game | null | undefined,
): string | null {
  const playUrl = normalizeExternalUrl(game?.playUrl);
  if (playUrl) {
    return playUrl;
  }

  return resolvePlayDestinations(game)[0]?.url ?? null;
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
  "この作品はまだプレイURLが設定されていません";

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
