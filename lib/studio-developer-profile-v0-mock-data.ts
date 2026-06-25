import type { ProfileActivityEntry, ProfileHighlightBadge } from "@/lib/profile-v0-mock-data";

export const STUDIO_DEVELOPMENT_GENRE_MAX = 3;

export const studioDeveloperSelfProfile = {
  displayName: "しゃねこ",
  handle: "shaneco",
  level: 5,
  avatar: "/images/landing/game-1.png",
  bio: "短編アドベンチャーと雰囲気作りが好きな個人開発者です。",
  joinedAt: "2024/11/02",
  lastLogin: "たった今",
  favoriteGenres: ["アドベンチャー", "ナラティブ", "ストーリー重視"],
  /** 開発者を探すのジャンル絞り込み用（最大3つ） */
  developmentGenres: ["アドベンチャー", "ナラティブ", "RPG"] as string[],
  stats: {
    projectCount: 3,
    feedbackReceived: 156,
    witnessTotal: 271,
    devlogCount: 12,
  },
  highlightBadges: [
    { id: "m1", label: "初投稿", emoji: "🚀" },
    { id: "m2", label: "FB100", emoji: "💬" },
    { id: "m3", label: "正式ver", emoji: "🏁" },
  ] satisfies ProfileHighlightBadge[],
  recentActivity: [
    { id: "a1", label: "「星の記憶」を投稿", relativeTime: "2025/01/10" },
    { id: "a2", label: "Devlog「序盤改善」を公開", relativeTime: "2025/06/12" },
    { id: "a3", label: "「夏の向こう側」を正式ver公開", relativeTime: "2025/05/20" },
  ] satisfies ProfileActivityEntry[],
  milestones: [
    { id: "ms1", label: "初めての作品投稿", date: "2024/11/02", earned: true },
    { id: "ms2", label: "フィードバック 100件到達", date: "2025/03/18", earned: true },
    { id: "ms3", label: "初の正式ver公開", date: "2025/05/20", earned: true },
    { id: "ms4", label: "見届け人 500人累計", date: "", earned: false, progress: { current: 271, target: 500 } },
  ],
};
