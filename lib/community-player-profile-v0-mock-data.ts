import type {
  ProfileActivityEntry,
  ProfileHighlightBadge,
} from "@/lib/profile-v0-mock-data";

export type PlayerPublicProfile = {
  handle: string;
  displayName: string;
  avatar: string;
  bio: string;
  joinedAt: string;
  lastLogin?: string;
  stats: {
    feedbackCount: number;
    voicesReceived: number;
    followingDevelopers: number;
    witnessingGames: number;
  };
  favoriteGenres: string[];
  highlightBadges: ProfileHighlightBadge[];
  recentActivity: ProfileActivityEntry[];
};

const profiles: Record<string, PlayerPublicProfile> = {
  sora_player: {
    handle: "sora_player",
    displayName: "そら",
    avatar: "/images/landing/game-2.png",
    bio: "ストーリー重視の RPG が好きです。開発中作品のフィードバックが趣味。",
    joinedAt: "2025/06/10",
    lastLogin: "3時間前",
    stats: {
      feedbackCount: 34,
      voicesReceived: 58,
      followingDevelopers: 5,
      witnessingGames: 3,
    },
    favoriteGenres: ["RPG", "アドベンチャー", "ストーリー重視"],
    highlightBadges: [
      { id: "w1", label: "見届け人", emoji: "👀" },
      { id: "w2", label: "FBマスター", emoji: "💬" },
      { id: "w3", label: "初期体験者", emoji: "🌱" },
    ],
    recentActivity: [
      { id: "a1", label: "星灯の旅路 にフィードバックを投稿", relativeTime: "1日前" },
      { id: "a2", label: "しゃねこコミュニティに参加", relativeTime: "2025/06/10" },
    ],
  },
  yuki_plays: {
    handle: "yuki_plays",
    displayName: "ゆき",
    avatar: "/images/landing/game-4.png",
    bio: "週末にインディーをプレイして、気づいたことをコミュニティで共有しています。",
    joinedAt: "2025/06/08",
    lastLogin: "昨日",
    stats: {
      feedbackCount: 21,
      voicesReceived: 29,
      followingDevelopers: 3,
      witnessingGames: 2,
    },
    favoriteGenres: ["シミュレーション", "癒し系", "インディー"],
    highlightBadges: [
      { id: "w1", label: "見届け人", emoji: "👀" },
      { id: "w2", label: "再プレイ", emoji: "🔄" },
    ],
    recentActivity: [
      { id: "a1", label: "炉心の残光 をプレイ", relativeTime: "2日前" },
      { id: "a2", label: "しゃねこコミュニティに参加", relativeTime: "2025/06/08" },
    ],
  },
  umi_game: {
    handle: "umi_game",
    displayName: "うみ",
    avatar: "/images/landing/game-3.png",
    bio: "ピクセルアートと落ち着いた雰囲気の作品が好きです。",
    joinedAt: "2025/06/05",
    lastLogin: "2日前",
    stats: {
      feedbackCount: 15,
      voicesReceived: 22,
      followingDevelopers: 4,
      witnessingGames: 2,
    },
    favoriteGenres: ["ピクセルアート", "アドベンチャー", "雰囲気重視"],
    highlightBadges: [
      { id: "w1", label: "見届け人", emoji: "👀" },
      { id: "w3", label: "初期体験者", emoji: "🌱" },
    ],
    recentActivity: [
      { id: "a1", label: "空島パイオニア にフィードバックを投稿", relativeTime: "4日前" },
    ],
  },
  ren_voice: {
    handle: "ren_voice",
    displayName: "レン",
    avatar: "/images/landing/game-4.png",
    bio: "声優・ナレーション好き。世界観のある作品を見届けるのが楽しみ。",
    joinedAt: "2025/05/20",
    lastLogin: "1週間前",
    stats: {
      feedbackCount: 12,
      voicesReceived: 18,
      followingDevelopers: 2,
      witnessingGames: 1,
    },
    favoriteGenres: ["ナラティブ", "ファンタジー", "音楽"],
    highlightBadges: [{ id: "w1", label: "見届け人", emoji: "👀" }],
    recentActivity: [
      { id: "a1", label: "Sora Games コミュニティに参加", relativeTime: "2025/05/20" },
    ],
  },
  hikari_7: {
    handle: "hikari_7",
    displayName: "星野ひかり",
    avatar: "/images/landing/game-5.png",
    bio: "しゃねこさんのゲームが大好き！コミュニティ参加を楽しみにしています。",
    joinedAt: "2025/06/01",
    lastLogin: "30分前",
    stats: {
      feedbackCount: 8,
      voicesReceived: 11,
      followingDevelopers: 2,
      witnessingGames: 1,
    },
    favoriteGenres: ["RPG", "ファンタジー", "キャラクター重視"],
    highlightBadges: [{ id: "w3", label: "初期体験者", emoji: "🌱" }],
    recentActivity: [
      { id: "a1", label: "しゃねこコミュニティへの参加を申請", relativeTime: "30分前" },
    ],
  },
};

export function getPlayerPublicProfile(handle: string): PlayerPublicProfile | null {
  return profiles[handle] ?? null;
}
