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

function normalizeUrl(url: string): string {
  return url.trim().replace(/\/+$/, "").toLowerCase();
}

function labelFromUrl(url: string, fieldHint?: "official"): Pick<PlayDestination, "label" | "actionLabel"> {
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
  const trimmed = url?.trim();
  if (!trimmed) {
    return;
  }

  const key = normalizeUrl(trimmed);
  if (seen.has(key)) {
    return;
  }

  seen.add(key);
  const { label, actionLabel } = labelFromUrl(trimmed, fieldHint);
  destinations.push({ label, url: trimmed, actionLabel });
}

/**
 * 「プレイする」から遷移できる公開先。
 * playUrl を優先し、Steam / itch.io / 公式サイトなど重複 URL は除外する。
 */
export function resolvePlayDestinations(game: Game | null | undefined): PlayDestination[] {
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
