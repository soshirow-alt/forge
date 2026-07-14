export type HomeGameCard = {
  id: string;
  title: string;
  version: string;
  description: string;
  image: string;
  genre?: string;
  updatedLabel: string;
  feedbackCount: number;
  watchCount: number;
  /** Distinct registered players; null = hide / unavailable */
  playPlayerCount?: number | null;
};

export const heroSlides: HomeGameCard[] = [
  {
    id: "hero-1",
    title: "星灯の旅路",
    version: "v0.4.0",
    description: "夜の森を旅する短編アドベンチャー。ランタンの光を頼りに、失われた記憶を辿る物語。",
    image: "/images/landing/hero-bg.png",
    updatedLabel: "昨日更新",
    feedbackCount: 24,
    watchCount: 15,
  },
  {
    id: "hero-2",
    title: "炉心の残光",
    version: "v0.3.2",
    description: "心の奥に残る、静かな物語。廃坑都市を舞台に、灯りと記憶をめぐるナラティブRPG。",
    image: "/images/landing/game-2.png",
    updatedLabel: "3日前更新",
    feedbackCount: 18,
    watchCount: 11,
  },
  {
    id: "hero-3",
    title: "空島パイオニア",
    version: "v0.2.1",
    description: "空に浮かぶ島々をめぐるクラフトサバイバル。風と雲を利用して新たな土地を開拓しよう。",
    image: "/images/landing/game-3.png",
    updatedLabel: "1週間前更新",
    feedbackCount: 31,
    watchCount: 22,
  },
];

export const recentlyUpdatedGames: HomeGameCard[] = [
  {
    id: "ru-1",
    title: "星灯の旅路",
    version: "v0.4.0",
    description: "",
    image: "/images/landing/game-1.png",
    updatedLabel: "3時間前更新",
    feedbackCount: 24,
    watchCount: 15,
  },
  {
    id: "ru-2",
    title: "深淵ノート",
    version: "v0.5.1",
    description: "",
    image: "/images/landing/game-5.png",
    updatedLabel: "8時間前更新",
    feedbackCount: 31,
    watchCount: 19,
  },
  {
    id: "ru-3",
    title: "夏の向こう側",
    version: "v0.2.4",
    description: "",
    image: "/images/landing/game-4.png",
    updatedLabel: "1日前更新",
    feedbackCount: 15,
    watchCount: 8,
  },
  {
    id: "ru-4",
    title: "森の中の小さな工房",
    version: "v0.1.5",
    description: "",
    image: "/images/landing/game-5.png",
    updatedLabel: "2日前更新",
    feedbackCount: 12,
    watchCount: 6,
  },
  {
    id: "ru-5",
    title: "アルカディアの遺跡",
    version: "v0.3.0",
    description: "",
    image: "/images/landing/game-4.png",
    updatedLabel: "3日前更新",
    feedbackCount: 20,
    watchCount: 10,
  },
];

export const popularGames: HomeGameCard[] = [
  {
    id: "pop-1",
    title: "星灯の旅路",
    version: "v0.4.0",
    description: "",
    image: "/images/landing/game-1.png",
    updatedLabel: "今週",
    feedbackCount: 48,
    watchCount: 32,
  },
  {
    id: "pop-2",
    title: "炉心の残光",
    version: "v0.3.2",
    description: "",
    image: "/images/landing/game-2.png",
    updatedLabel: "今週",
    feedbackCount: 36,
    watchCount: 24,
  },
  {
    id: "pop-3",
    title: "空島パイオニア",
    version: "v0.2.1",
    description: "",
    image: "/images/landing/game-3.png",
    updatedLabel: "今週",
    feedbackCount: 29,
    watchCount: 18,
  },
  {
    id: "pop-4",
    title: "深淵ノート",
    version: "v0.5.1",
    description: "",
    image: "/images/landing/game-5.png",
    updatedLabel: "今週",
    feedbackCount: 27,
    watchCount: 16,
  },
  {
    id: "pop-5",
    title: "喫茶ケットシー",
    version: "v0.1.0",
    description: "",
    image: "/images/landing/game-4.png",
    updatedLabel: "今週",
    feedbackCount: 22,
    watchCount: 14,
  },
];

export const newGames: HomeGameCard[] = [
  {
    id: "new-1",
    title: "浮遊ノート",
    version: "v0.1.0",
    description: "",
    image: "/images/landing/game-3.png",
    updatedLabel: "1日前",
    feedbackCount: 5,
    watchCount: 3,
  },
  {
    id: "new-2",
    title: "地下迷宮の冒険者",
    version: "v0.1.2",
    description: "",
    image: "/images/landing/game-2.png",
    updatedLabel: "2日前",
    feedbackCount: 8,
    watchCount: 4,
  },
  {
    id: "new-3",
    title: "星のかけらを探して",
    version: "v0.1.0",
    description: "",
    image: "/images/landing/game-1.png",
    updatedLabel: "3日前",
    feedbackCount: 6,
    watchCount: 2,
  },
  {
    id: "new-4",
    title: "潮風の町工房",
    version: "v0.1.0",
    description: "",
    image: "/images/landing/game-4.png",
    updatedLabel: "4日前",
    feedbackCount: 4,
    watchCount: 2,
  },
  {
    id: "new-5",
    title: "空賊と風の旅団",
    version: "v0.1.0",
    description: "",
    image: "/images/landing/game-3.png",
    updatedLabel: "5日前",
    feedbackCount: 7,
    watchCount: 3,
  },
];

export const homeGenrePills = [
  "RPG",
  "アクション",
  "アドベンチャー",
  "シミュレーション",
  "パズル",
  "ストラテジー",
  "ホラー",
  "その他",
] as const;
