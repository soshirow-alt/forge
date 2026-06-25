export type PlayerPublicProfile = {
  handle: string;
  displayName: string;
  avatar: string;
  bio: string;
  joinedAt: string;
};

const profiles: Record<string, PlayerPublicProfile> = {
  sora_player: {
    handle: "sora_player",
    displayName: "そら",
    avatar: "/images/landing/game-2.png",
    bio: "ストーリー重視の RPG が好きです。開発中作品のフィードバックが趣味。",
    joinedAt: "2024/11/02",
  },
  yuki_plays: {
    handle: "yuki_plays",
    displayName: "ゆき",
    avatar: "/images/landing/game-4.png",
    bio: "週末にインディーをプレイして、気づいたことをコミュニティで共有しています。",
    joinedAt: "2025/01/15",
  },
  umi_game: {
    handle: "umi_game",
    displayName: "うみ",
    avatar: "/images/landing/game-3.png",
    bio: "ピクセルアートと落ち着いた雰囲気の作品が好きです。",
    joinedAt: "2025/02/20",
  },
  ren_voice: {
    handle: "ren_voice",
    displayName: "レン",
    avatar: "/images/landing/game-4.png",
    bio: "声優・ナレーション好き。世界観のある作品を見届けるのが楽しみ。",
    joinedAt: "2025/03/08",
  },
  hikari_7: {
    handle: "hikari_7",
    displayName: "星野ひかり",
    avatar: "/images/landing/game-5.png",
    bio: "しゃねこさんのゲームが大好き！コミュニティ参加を楽しみにしています。",
    joinedAt: "2025/06/01",
  },
};

export function getPlayerPublicProfile(handle: string): PlayerPublicProfile | null {
  return profiles[handle] ?? null;
}
