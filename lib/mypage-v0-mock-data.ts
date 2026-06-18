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
