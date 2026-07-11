export type HomeDiscoveryTimeKind = "published" | "updated" | "engaged";

function formatRelativeUnit(
  value: string | null | undefined,
  kind: HomeDiscoveryTimeKind,
): string {
  if (!value) {
    return kind === "published"
      ? "公開日不明"
      : kind === "updated"
        ? "更新日不明"
        : "反応日不明";
  }

  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) {
    return value;
  }

  const diffMs = Date.now() - parsed;
  const minutes = Math.floor(diffMs / 60_000);

  if (kind === "published") {
    if (minutes < 60) return "今日公開";
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return "今日公開";
    const days = Math.floor(hours / 24);
    if (days === 1) return "1日前公開";
    if (days < 7) return `${days}日前公開`;
    const weeks = Math.floor(days / 7);
    if (weeks < 5) return `${weeks}週間前公開`;
    return `${new Date(parsed).toLocaleDateString("ja-JP", {
      month: "short",
      day: "numeric",
    })}公開`;
  }

  if (kind === "updated") {
    if (minutes < 1) return "たった今更新";
    if (minutes < 60) return `${minutes}分前更新`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}時間前更新`;
    const days = Math.floor(hours / 24);
    if (days === 1) return "1日前更新";
    if (days < 7) return `${days}日前更新`;
    const weeks = Math.floor(days / 7);
    if (weeks < 5) return `${weeks}週間前更新`;
    return `${new Date(parsed).toLocaleDateString("ja-JP", {
      month: "short",
      day: "numeric",
    })}更新`;
  }

  // engaged
  if (minutes < 60) return "今日反応あり";
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return "今日反応あり";
  const days = Math.floor(hours / 24);
  if (days === 1) return "1日前に反応";
  if (days < 7) return `${days}日前に反応`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}週間前に反応`;
  return `${new Date(parsed).toLocaleDateString("ja-JP", {
    month: "short",
    day: "numeric",
  })}に反応`;
}

export function formatHomeDiscoveryTimeLabel(
  value: string | null | undefined,
  kind: HomeDiscoveryTimeKind,
): string {
  return formatRelativeUnit(value, kind);
}

export function timeKindForSection(
  section: "newest" | "updated" | "trending",
): HomeDiscoveryTimeKind {
  switch (section) {
    case "newest":
      return "published";
    case "updated":
      return "updated";
    case "trending":
      return "engaged";
  }
}
