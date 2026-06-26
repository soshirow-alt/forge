export type ProfileActivityEntry = {
  id: string;
  label: string;
  relativeTime: string;
};

export type ProfileHighlightBadge = {
  id: string;
  label: string;
  emoji: string;
};

export const profileSelfMock = {
  displayName: "しゃねこ",
  level: 8,
  avatar: "/images/landing/game-4.png",
  bio: "インディーゲームが大好きです。開発中の作品にフィードバックして、一緒に育てるのが楽しみ。RPGとストーリー重視作品が特に好き。",
  joinedAt: "2024/12/10",
  lastLogin: "たった今",
  stats: {
    feedbackCount: 87,
    voicesReceived: 132,
    followingDevelopers: 12,
    witnessingGames: 4,
  },
  favoriteGenres: ["RPG", "アドベンチャー", "ファンタジー", "ストーリー重視"],
  highlightBadges: [
    { id: "w1", label: "見届け人", emoji: "👀" },
    { id: "w2", label: "FBマスター", emoji: "💬" },
    { id: "w3", label: "初期体験者", emoji: "🌱" },
    { id: "w4", label: "再プレイ", emoji: "🔄" },
  ] satisfies ProfileHighlightBadge[],
  recentActivity: [
    { id: "a1", label: "星灯の旅路 にフィードバックを投稿", relativeTime: "2時間前" },
    { id: "a2", label: "炉心の残光 をプレイ", relativeTime: "6時間前" },
    { id: "a3", label: "空島パイオニア にフィードバックした", relativeTime: "1日前" },
    { id: "a4", label: "Sora Games をフォロー", relativeTime: "3日前" },
  ] satisfies ProfileActivityEntry[],
};
