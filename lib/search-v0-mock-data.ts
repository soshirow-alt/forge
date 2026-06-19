export const SEARCH_RESULTS_TOTAL = 1248;

export const searchGenreFilters = [
  "すべてのジャンル",
  "RPG",
  "アクション",
  "アドベンチャー",
  "シミュレーション",
  "パズル",
  "ストラテジー",
  "ホラー",
  "ファンタジー",
] as const;

export const searchPlatformFilters = [
  "すべて",
  "PC",
  "ブラウザ",
  "スマホ",
  "コンソール",
] as const;

export type SearchWorkResult = {
  id: string;
  title: string;
  description: string;
  image: string;
  tags: string[];
  developer: string;
  verified: boolean;
  updatedAgo: string;
  witnessCount: number;
  voiceCount: number;
  platforms: string[];
};

export const searchWorkResults: SearchWorkResult[] = [
  {
    id: "w1",
    title: "星灯の旅路（仮）",
    description:
      "夜の森を旅する短編アドベンチャー。ランタンの光を頼りに、失われた記憶を辿る物語。",
    image: "/images/landing/game-1.png",
    tags: ["RPG", "Open World", "Fantasy", "探索"],
    developer: "Sora Games",
    verified: true,
    updatedAgo: "3日前",
    witnessCount: 1248,
    voiceCount: 312,
    platforms: ["Steam", "PC"],
  },
  {
    id: "w2",
    title: "炉心の残光",
    description:
      "心の奥に残る、静かな物語。廃坑都市を舞台に、灯りと記憶をめぐるナラティブRPG。",
    image: "/images/landing/game-2.png",
    tags: ["RPG", "ストーリー", "Fantasy", "インディー"],
    developer: "LunaWorks",
    verified: true,
    updatedAgo: "5日前",
    witnessCount: 892,
    voiceCount: 198,
    platforms: ["PC", "Switch"],
  },
  {
    id: "w3",
    title: "空島パイオニア",
    description:
      "空に浮かぶ島々をめぐるクラフトサバイバル。風と雲を利用して新たな土地を開拓しよう。",
    image: "/images/landing/game-3.png",
    tags: ["サバイバル", "クラフト", "Fantasy", "協力プレイ"],
    developer: "Sky Pirate Studio",
    verified: false,
    updatedAgo: "1週間前",
    witnessCount: 654,
    voiceCount: 124,
    platforms: ["ブラウザ", "PC"],
  },
  {
    id: "w4",
    title: "深淵ノート",
    description:
      "失われた記憶を辿るダンジョン探索RPG。毎回変わる迷宮と、古い日記の謎を解き明かす。",
    image: "/images/landing/game-5.png",
    tags: ["RPG", "ダンジョン", "Fantasy", "ローグライク"],
    developer: "Studio Aurora",
    verified: true,
    updatedAgo: "2日前",
    witnessCount: 2104,
    voiceCount: 567,
    platforms: ["Steam", "PC"],
  },
  {
    id: "w5",
    title: "夏の向こう側",
    description:
      "あの夏の記憶を、もう一度。ノスタルジア溢れる小さな町を舞台にしたアドベンチャー。",
    image: "/images/landing/game-4.png",
    tags: ["アドベンチャー", "Fantasy", "癒し系", "ストーリー"],
    developer: "GreenSmith",
    verified: false,
    updatedAgo: "4日前",
    witnessCount: 421,
    voiceCount: 89,
    platforms: ["PC", "Switch"],
  },
  {
    id: "w6",
    title: "森の中の小さな工房",
    description:
      "森の奥で始まる工房経営シミュレーション。素材を集め、注文に応え、工房を育てよう。",
    image: "/images/landing/game-5.png",
    tags: ["シミュレーション", "Fantasy", "クラフト", "経営"],
    developer: "GreenSmith",
    verified: true,
    updatedAgo: "6日前",
    witnessCount: 738,
    voiceCount: 156,
    platforms: ["ブラウザ", "PC"],
  },
  {
    id: "w7",
    title: "アルカディアの遺跡",
    description:
      "古代文明の遺跡を探索するアクションアドベンチャー。謎と戦闘が交錯するファンタジー世界。",
    image: "/images/landing/game-4.png",
    tags: ["アクション", "探索", "Fantasy", "ピクセルアート"],
    developer: "Pixel Knights",
    verified: true,
    updatedAgo: "1日前",
    witnessCount: 1567,
    voiceCount: 402,
    platforms: ["Steam", "PC", "Switch"],
  },
  {
    id: "w8",
    title: "喫茶ケットシー",
    description:
      "猫とコーヒーと、ゆったり営業する癒し系シミュレーション。ファンタジー風の街角が舞台。",
    image: "/images/landing/game-2.png",
    tags: ["シミュレーション", "Fantasy", "癒し系", "経営"],
    developer: "Catnip Lab",
    verified: false,
    updatedAgo: "2週間前",
    witnessCount: 312,
    voiceCount: 67,
    platforms: ["ブラウザ", "スマホ"],
  },
];

export function filterSearchResults(
  results: SearchWorkResult[],
  query: string,
  genres: string[],
): SearchWorkResult[] {
  const normalizedQuery = query.trim().toLowerCase();

  return results.filter((work) => {
    const matchesQuery =
      !normalizedQuery ||
      work.title.toLowerCase().includes(normalizedQuery) ||
      work.description.toLowerCase().includes(normalizedQuery) ||
      work.tags.some((tag) => tag.toLowerCase().includes(normalizedQuery)) ||
      work.developer.toLowerCase().includes(normalizedQuery);

    const matchesGenre =
      genres.length === 0 ||
      genres.some((genre) =>
        work.tags.some((tag) => tag.toLowerCase().includes(genre.toLowerCase())),
      );

    return matchesQuery && matchesGenre;
  });
}
