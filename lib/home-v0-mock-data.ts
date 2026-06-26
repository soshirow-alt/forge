export type HomeGameCard = {
  id: string;
  title: string;
  version: string;
  description: string;
  image: string;
  genre?: string;
  updatedLabel: string;
  voiceCount: number;
  witnessCount: number;
};

export const heroSlides: HomeGameCard[] = [
  {
    id: "hero-1",
    title: "星灯の旅路",
    version: "v0.4.0",
    description: "夜の森を旅する短編アドベンチャー。ランタンの光を頼りに、失われた記憶を辿る物語。",
    image: "/images/landing/hero-bg.png",
    updatedLabel: "昨日更新",
    voiceCount: 24,
    witnessCount: 15,
  },
  {
    id: "hero-2",
    title: "炉心の残光",
    version: "v0.3.2",
    description: "心の奥に残る、静かな物語。廃坑都市を舞台に、灯りと記憶をめぐるナラティブRPG。",
    image: "/images/landing/game-2.png",
    updatedLabel: "3日前更新",
    voiceCount: 18,
    witnessCount: 11,
  },
  {
    id: "hero-3",
    title: "空島パイオニア",
    version: "v0.2.1",
    description: "空に浮かぶ島々をめぐるクラフトサバイバル。風と雲を利用して新たな土地を開拓しよう。",
    image: "/images/landing/game-3.png",
    updatedLabel: "1週間前更新",
    voiceCount: 31,
    witnessCount: 22,
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
    voiceCount: 24,
    witnessCount: 15,
  },
  {
    id: "ru-2",
    title: "深淵ノート",
    version: "v0.5.1",
    description: "",
    image: "/images/landing/game-5.png",
    updatedLabel: "8時間前更新",
    voiceCount: 31,
    witnessCount: 19,
  },
  {
    id: "ru-3",
    title: "夏の向こう側",
    version: "v0.2.4",
    description: "",
    image: "/images/landing/game-4.png",
    updatedLabel: "1日前更新",
    voiceCount: 15,
    witnessCount: 8,
  },
  {
    id: "ru-4",
    title: "森の中の小さな工房",
    version: "v0.1.5",
    description: "",
    image: "/images/landing/game-5.png",
    updatedLabel: "2日前更新",
    voiceCount: 12,
    witnessCount: 6,
  },
  {
    id: "ru-5",
    title: "アルカディアの遺跡",
    version: "v0.3.0",
    description: "",
    image: "/images/landing/game-4.png",
    updatedLabel: "3日前更新",
    voiceCount: 20,
    witnessCount: 10,
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
    voiceCount: 48,
    witnessCount: 32,
  },
  {
    id: "pop-2",
    title: "炉心の残光",
    version: "v0.3.2",
    description: "",
    image: "/images/landing/game-2.png",
    updatedLabel: "今週",
    voiceCount: 36,
    witnessCount: 24,
  },
  {
    id: "pop-3",
    title: "空島パイオニア",
    version: "v0.2.1",
    description: "",
    image: "/images/landing/game-3.png",
    updatedLabel: "今週",
    voiceCount: 29,
    witnessCount: 18,
  },
  {
    id: "pop-4",
    title: "深淵ノート",
    version: "v0.5.1",
    description: "",
    image: "/images/landing/game-5.png",
    updatedLabel: "今週",
    voiceCount: 27,
    witnessCount: 16,
  },
  {
    id: "pop-5",
    title: "喫茶ケットシー",
    version: "v0.1.0",
    description: "",
    image: "/images/landing/game-4.png",
    updatedLabel: "今週",
    voiceCount: 22,
    witnessCount: 14,
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
    voiceCount: 5,
    witnessCount: 3,
  },
  {
    id: "new-2",
    title: "地下迷宮の冒険者",
    version: "v0.1.2",
    description: "",
    image: "/images/landing/game-2.png",
    updatedLabel: "2日前",
    voiceCount: 8,
    witnessCount: 4,
  },
  {
    id: "new-3",
    title: "星のかけらを探して",
    version: "v0.1.0",
    description: "",
    image: "/images/landing/game-1.png",
    updatedLabel: "3日前",
    voiceCount: 6,
    witnessCount: 2,
  },
  {
    id: "new-4",
    title: "潮風の町工房",
    version: "v0.1.0",
    description: "",
    image: "/images/landing/game-4.png",
    updatedLabel: "4日前",
    voiceCount: 4,
    witnessCount: 2,
  },
  {
    id: "new-5",
    title: "空賊と風の旅団",
    version: "v0.1.0",
    description: "",
    image: "/images/landing/game-3.png",
    updatedLabel: "5日前",
    voiceCount: 7,
    witnessCount: 3,
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
