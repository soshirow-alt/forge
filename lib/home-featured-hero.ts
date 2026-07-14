/**
 * Featured hero reason labels — 4 independent slots (066).
 */
export type FeaturedHeroType =
  | "reaction"
  | "rising_plays"
  | "newest"
  | "updated";

export const FEATURED_HERO_TYPE_ORDER: FeaturedHeroType[] = [
  "reaction",
  "rising_plays",
  "newest",
  "updated",
];

export function featuredHeroTypeLabel(type: FeaturedHeroType): string {
  switch (type) {
    case "reaction":
      return "反応が集まっています";
    case "rising_plays":
      return "プレイヤー増加中";
    case "newest":
      return "新着作品";
    case "updated":
      return "最近アップデート";
  }
}

function daysAgoLabel(iso: string | null | undefined, suffix: string): string {
  if (!iso) return suffix;
  const parsed = Date.parse(iso);
  if (Number.isNaN(parsed)) return suffix;
  const days = Math.floor((Date.now() - parsed) / 86_400_000);
  if (days <= 0) return `今日${suffix}`;
  if (days === 1) return `1日前${suffix}`;
  if (days < 7) return `${days}日前${suffix}`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}週間前${suffix}`;
  return new Date(parsed).toLocaleDateString("ja-JP", {
    month: "short",
    day: "numeric",
  });
}

export function featuredHeroReasonDetail(input: {
  featuredType: FeaturedHeroType;
  feedbackUsers7d: number;
  watchers7d: number;
  players7d: number;
  playerDelta7d: number;
  firstPublishedAt: string | null;
  meaningfulUpdateAt: string | null;
  updateKind: string | null;
}): string {
  switch (input.featuredType) {
    case "reaction":
      if (input.feedbackUsers7d > 0) {
        return `今週フィードバック ${input.feedbackUsers7d.toLocaleString()}人`;
      }
      if (input.watchers7d > 0) {
        return `今週フォロー +${input.watchers7d.toLocaleString()}`;
      }
      return "最近反応あり";
    case "rising_plays":
      if (input.playerDelta7d > 0) {
        return `プレイヤー +${input.playerDelta7d.toLocaleString()}人`;
      }
      if (input.players7d > 0) {
        return `今週 ${input.players7d.toLocaleString()}人がプレイ`;
      }
      return "プレイヤー増加中";
    case "newest":
      return daysAgoLabel(input.firstPublishedAt, "に公開");
    case "updated":
      if (input.updateKind === "version") {
        return "新バージョン公開";
      }
      return daysAgoLabel(input.meaningfulUpdateAt, "にアップデート");
  }
}
