export function formatPlayerIaRelativeTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  const diffMs = Date.now() - date.getTime();
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
  });
}

export function formatPlayerIaUpdateKind(kind: string): string {
  if (kind === "devlog") return "開発ログ";
  if (kind === "release") return "リリース";
  return "更新";
}
