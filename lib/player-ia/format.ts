export const PLAYER_IA_DISPLAY_TIME_ZONE = "Asia/Tokyo";

export type FormatPlayerIaRelativeTimeOptions = {
  /** Epoch ms used as "now". Required for SSR/client hydration parity. */
  nowMs?: number;
  /** IANA time zone for calendar fallback dates. */
  timeZone?: string;
};

export function formatPlayerIaRelativeTime(
  iso: string,
  options?: FormatPlayerIaRelativeTimeOptions,
): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  const nowMs = options?.nowMs ?? Date.now();
  const timeZone = options?.timeZone ?? PLAYER_IA_DISPLAY_TIME_ZONE;
  const diffMs = nowMs - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60_000);
  if (diffMinutes < 1) return "たった今";
  if (diffMinutes < 60) return `${diffMinutes}分前`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}時間前`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays}日前`;
  return date.toLocaleDateString("ja-JP", {
    month: "short",
    day: "numeric",
    timeZone,
  });
}

export function formatPlayerIaUpdateKind(kind: string): string {
  if (kind === "devlog") return "開発ログ";
  if (kind === "release") return "リリース";
  return "更新";
}

export function formatPlayerIaWindowLabel(days: number): string {
  if (days === 30) return "直近30日";
  if (days === 90) return "直近90日";
  return `直近${days}日`;
}

export function formatPlayerIaVersionLabel(version: string | null | undefined): string | null {
  const raw = (version ?? "").trim();
  if (!raw) return null;
  return raw.toLowerCase().startsWith("ver") ? raw : `ver ${raw}`;
}

/**
 * Preview / Player IA Home display only.
 * Strips a leading `[IA Seed]` marker (and following spaces).
 * No-op when the trimmed text does not start with that marker (preserves
 * non-seed whitespace and mid-string occurrences).
 */
export function stripPlayerIaSeedDisplayPrefix(text: string): string {
  const trimmed = text.trim();
  if (!/^\[IA Seed\]\s*/i.test(trimmed)) {
    return text;
  }
  return trimmed.replace(/^\[IA Seed\]\s*/i, "").trim();
}

const PLAYER_IA_SEED_PROJECT_ID_RE =
  /^eeeeeeee-eeee-4eee-8eee-[0-9a-f]{12}$/i;

export function isPlayerIaSeedProjectId(projectId: string): boolean {
  return PLAYER_IA_SEED_PROJECT_ID_RE.test(projectId.trim());
}

/** Apply seed display cleanup only for known forge-ia seed project UUIDs. */
export function displayPlayerIaHomeSeedText(
  projectId: string,
  text: string,
): string {
  if (!isPlayerIaSeedProjectId(projectId)) {
    return text;
  }
  return stripPlayerIaSeedDisplayPrefix(text);
}

export function truncatePlayerIaText(text: string, maxLen: number): string {
  const collapsed = text.replace(/\s+/g, " ").trim();
  if (collapsed.length <= maxLen) return collapsed;
  return `${collapsed.slice(0, Math.max(0, maxLen - 1)).trimEnd()}…`;
}
