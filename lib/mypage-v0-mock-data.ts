export const witnessingGames = [
  {
    title: "星灯の旅路",
    change: "チュートリアルの導線を改善し、序盤の難易度を調整しました。",
    updatedAt: "2024/05/12",
    image: "/images/landing/game-1.png",
    hasUpdate: true,
  },
  {
    title: "空島パイオニア",
    change: "建築パーツを追加し、クラフト素材のバランスを調整しました。",
    updatedAt: "2024/05/08",
    image: "/images/landing/game-3.png",
    hasUpdate: true,
  },
  {
    title: "炉心の残光",
    change: "ボス戦のバランスを調整し、一部のバグを修正しました。",
    updatedAt: "2024/04/28",
    image: "/images/landing/game-2.png",
    hasUpdate: true,
  },
  {
    title: "喫茶ケットシー",
    change: "現在、更新はありません。次回のアップデートをお待ちください。",
    updatedAt: "2024/04/15",
    image: "/images/landing/game-4.png",
    hasUpdate: false,
  },
] as const;

export const savedGames = [
  {
    title: "森の中の小さな工房",
    developer: "GreenSmith",
    tags: ["シミュレーション", "癒し系"],
    image: "/images/landing/game-5.png",
  },
  {
    title: "星のかけらを探して",
    developer: "Luna Labs",
    tags: ["SF", "探索"],
    image: "/images/landing/game-1.png",
  },
  {
    title: "地下迷宮の冒険者",
    developer: "Studio Aurora",
    tags: ["RPG", "ダンジョン", "ローグライク"],
    image: "/images/landing/game-2.png",
  },
  {
    title: "空賊と風の旅団",
    developer: "Sky Pirate Studio",
    tags: ["アクション", "空戦", "協力プレイ"],
    image: "/images/landing/game-3.png",
  },
  {
    title: "アルカディアの遺跡",
    developer: "Pixel Knights",
    tags: ["アクション", "探索", "ピクセルアート"],
    image: "/images/landing/game-4.png",
  },
] as const;

export const witnessingQuickFilters = [
  { label: "更新があった作品", count: 4 },
  { label: "まもなく更新されそう", count: 2 },
  { label: "更新がない作品", count: 2 },
  { label: "あなたの声が反映された作品", count: 3 },
] as const;

export const genreFilters = [
  "すべて",
  "アドベンチャー",
  "RPG",
  "サバイバル",
  "シミュレーション",
  "クラフト",
  "探索",
  "経営",
  "ストーリー",
] as const;

export const playHistoryFilterTabs = [
  { id: "all", label: "すべて", count: 30 },
  { id: "witnessing", label: "見届け中", count: 5 },
  { id: "supported", label: "応援中の作者の作品", count: 8 },
  { id: "play-only", label: "プレイのみ", count: 17 },
] as const;

export type PlayHistoryGameTag = {
  label: string;
  variant: "witnessing" | "play-only" | "supported";
};

export type PlayHistoryGame = {
  title: string;
  version: string;
  description: string;
  image: string;
  tags: PlayHistoryGameTag[];
  firstPlay: string;
  playCount: number;
  totalPlayTime: string;
  lastPlay: string;
  hasUpdate: boolean;
  updateVersion?: string;
  memo?: string;
  cleared?: boolean;
  feedbackSent: boolean;
};

export const PLAY_HISTORY_TOTAL = 30;

export const playHistoryGames: PlayHistoryGame[] = [
  {
    title: "星灯の旅路",
    version: "v0.4.0",
    description: "夜の森を旅する短編アドベンチャー",
    image: "/images/landing/game-1.png",
    tags: [
      { label: "見届け中", variant: "witnessing" },
      { label: "応援中の作者", variant: "supported" },
    ],
    firstPlay: "2025/05/18 (v0.1.0)",
    playCount: 4,
    totalPlayTime: "8時間42分",
    lastPlay: "2025/05/18",
    hasUpdate: true,
    updateVersion: "v0.4.0",
    memo: "序盤のチュートリアルが分かりやすくなった。",
    cleared: true,
    feedbackSent: true,
  },
  {
    title: "炉心の残光",
    version: "v0.3.2",
    description: "心の奥に残る、静かな物語",
    image: "/images/landing/game-2.png",
    tags: [{ label: "見届け中", variant: "witnessing" }],
    firstPlay: "2025/05/10 (v0.2.0)",
    playCount: 2,
    totalPlayTime: "3時間15分",
    lastPlay: "2025/05/14",
    hasUpdate: false,
    feedbackSent: true,
  },
  {
    title: "空島パイオニア",
    version: "v0.2.1",
    description: "空に浮かぶ島々をめぐるクラフトサバイバル",
    image: "/images/landing/game-3.png",
    tags: [{ label: "プレイのみ", variant: "play-only" }],
    firstPlay: "2025/05/05 (v0.2.1)",
    playCount: 1,
    totalPlayTime: "1時間20分",
    lastPlay: "2025/05/05",
    hasUpdate: false,
    feedbackSent: false,
  },
  {
    title: "森の中の小さな工房",
    version: "v0.1.5",
    description: "森の奥で始まる、小さな工房経営シミュレーション",
    image: "/images/landing/game-5.png",
    tags: [{ label: "応援中の作者", variant: "supported" }],
    firstPlay: "2025/04/28 (v0.1.0)",
    playCount: 3,
    totalPlayTime: "5時間08分",
    lastPlay: "2025/05/02",
    hasUpdate: true,
    updateVersion: "v0.1.5",
    feedbackSent: false,
  },
  {
    title: "浮遊ノート",
    version: "v0.3.0",
    description: "空に浮かぶ島々をめぐる、記録型アドベンチャー",
    image: "/images/landing/game-3.png",
    tags: [{ label: "プレイのみ", variant: "play-only" }],
    firstPlay: "2025/05/16 (v0.3.0)",
    playCount: 1,
    totalPlayTime: "45分",
    lastPlay: "2025/05/16",
    hasUpdate: false,
    feedbackSent: false,
  },
  {
    title: "夏の向こう側",
    version: "v0.2.4",
    description: "あの夏の記憶を、もう一度辿るノスタルジアRPG",
    image: "/images/landing/game-4.png",
    tags: [
      { label: "見届け中", variant: "witnessing" },
      { label: "応援中の作者", variant: "supported" },
    ],
    firstPlay: "2025/04/20 (v0.1.2)",
    playCount: 5,
    totalPlayTime: "12時間30分",
    lastPlay: "2025/05/17",
    hasUpdate: true,
    updateVersion: "v0.2.4",
    memo: "エンディング前のイベントが追加された。",
    cleared: true,
    feedbackSent: true,
  },
  {
    title: "深淵ノート",
    version: "v0.5.1",
    description: "失われた記憶を辿る、ダンジョン探索RPG",
    image: "/images/landing/game-5.png",
    tags: [{ label: "プレイのみ", variant: "play-only" }],
    firstPlay: "2025/03/08 (v0.4.0)",
    playCount: 7,
    totalPlayTime: "18時間05分",
    lastPlay: "2025/05/12",
    hasUpdate: false,
    memo: "ボス戦がかなり難しい。",
    feedbackSent: true,
  },
  {
    title: "喫茶ケットシー",
    version: "v0.1.0",
    description: "猫とコーヒーと、ゆったり営業する癒し系シミュレーション",
    image: "/images/landing/game-4.png",
    tags: [{ label: "見届け中", variant: "witnessing" }],
    firstPlay: "2025/05/01 (v0.1.0)",
    playCount: 2,
    totalPlayTime: "2時間10分",
    lastPlay: "2025/05/11",
    hasUpdate: false,
    feedbackSent: false,
  },
  {
    title: "星のかけらを探して",
    version: "v0.2.0",
    description: "小さな星の欠片を集める、SF探索アドベンチャー",
    image: "/images/landing/game-1.png",
    tags: [{ label: "応援中の作者", variant: "supported" }],
    firstPlay: "2025/04/15 (v0.1.5)",
    playCount: 2,
    totalPlayTime: "3時間40分",
    lastPlay: "2025/05/09",
    hasUpdate: true,
    updateVersion: "v0.2.0",
    feedbackSent: true,
  },
  {
    title: "地下迷宮の冒険者",
    version: "v0.3.3",
    description: "毎回変わる迷宮を攻略するローグライトRPG",
    image: "/images/landing/game-2.png",
    tags: [{ label: "プレイのみ", variant: "play-only" }],
    firstPlay: "2025/05/15 (v0.3.3)",
    playCount: 1,
    totalPlayTime: "1時間05分",
    lastPlay: "2025/05/15",
    hasUpdate: false,
    feedbackSent: false,
  },
];

export const playHistorySummary = [
  { label: "見届け中作品", value: "5" },
  { label: "応援中作者", value: "12" },
  { label: "プレイ作品合計", value: "30" },
  { label: "合計プレイ時間", value: "41時間56分" },
  { label: "最多プレイ日", value: "2025/05/18" },
] as const;

export const playHistorySidebarFilters = [
  "見届け中 / プレイのみ",
  "応援中作者の作品",
  "プレイ期間",
] as const;

export const supportedCreators = [
  { name: "GreenSmith", initial: "G" },
  { name: "Luna Labs", initial: "L" },
  { name: "Studio Aurora", initial: "S" },
  { name: "Pixel Knights", initial: "P" },
  { name: "Sky Pirate", initial: "S" },
] as const;
