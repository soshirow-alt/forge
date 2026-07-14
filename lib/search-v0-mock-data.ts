import { FORGE_GENRE_OPTIONS } from "@/lib/forge-genre-options";
import { FORGE_FEATURE_TAG_OPTIONS } from "@/lib/forge-feature-tag-options";

export const SEARCH_RESULTS_TOTAL = 1248;

export const searchGenreFilters = ["すべてのジャンル", ...FORGE_GENRE_OPTIONS] as const;

export const searchFeatureTagFilters = [...FORGE_FEATURE_TAG_OPTIONS] as const;

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
  watchCount: number;
  feedbackCount: number;
  playPlayerCount?: number | null;
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
    watchCount: 1248,
    feedbackCount: 312,
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
    watchCount: 892,
    feedbackCount: 198,
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
    watchCount: 654,
    feedbackCount: 124,
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
    watchCount: 2104,
    feedbackCount: 567,
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
    watchCount: 421,
    feedbackCount: 89,
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
    watchCount: 738,
    feedbackCount: 156,
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
    watchCount: 1567,
    feedbackCount: 402,
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
    watchCount: 312,
    feedbackCount: 67,
    platforms: ["ブラウザ", "スマホ"],
  },
];

/** フィルター表記（日本語）とモックタグ（英語混在）を同一ジャンルとして扱う */
const GENRE_MATCH_ALIASES: Record<string, readonly string[]> = {
  ファンタジー: ["fantasy", "ファンタジー"],
  rpg: ["rpg"],
  アクション: ["アクション", "action"],
  アドベンチャー: ["アドベンチャー", "adventure"],
  シミュレーション: ["シミュレーション", "simulation"],
  パズル: ["パズル", "puzzle"],
  ストラテジー: ["ストラテジー", "strategy"],
  ホラー: ["ホラー", "horror"],
};

function normalizeGenreKey(value: string): string {
  return value.trim().toLowerCase();
}

function tagMatchesGenreFilter(tag: string, genreFilter: string): boolean {
  const tagKey = normalizeGenreKey(tag);
  const filterKey = normalizeGenreKey(genreFilter);

  if (tagKey.includes(filterKey) || filterKey.includes(tagKey)) {
    return true;
  }

  const aliases = GENRE_MATCH_ALIASES[filterKey] ?? GENRE_MATCH_ALIASES[genreFilter];
  if (aliases) {
    return aliases.some((alias) => normalizeGenreKey(alias) === tagKey);
  }

  return false;
}

function tagMatchesFeatureFilter(tag: string, featureFilter: string): boolean {
  const tagKey = normalizeGenreKey(tag);
  const filterKey = normalizeGenreKey(featureFilter);

  if (tagKey.includes(filterKey) || filterKey.includes(tagKey)) {
    return true;
  }

  const aliases = GENRE_MATCH_ALIASES[filterKey] ?? GENRE_MATCH_ALIASES[featureFilter];
  if (aliases) {
    return aliases.some((alias) => normalizeGenreKey(alias) === tagKey);
  }

  return false;
}

export function filterSearchResults(
  results: SearchWorkResult[],
  query: string,
  genres: string[],
  features: string[] = [],
): SearchWorkResult[] {
  const normalizedQuery = query.trim().toLowerCase();

  return results.filter((work) => {
    const matchesQuery =
      !normalizedQuery ||
      work.title.toLowerCase().includes(normalizedQuery) ||
      work.description.toLowerCase().includes(normalizedQuery) ||
      work.tags.some(
        (tag) =>
          tag.toLowerCase().includes(normalizedQuery) ||
          tagMatchesGenreFilter(tag, normalizedQuery) ||
          tagMatchesFeatureFilter(tag, normalizedQuery),
      ) ||
      work.developer.toLowerCase().includes(normalizedQuery);

    const matchesGenre =
      genres.length === 0 ||
      genres.some((genre) => work.tags.some((tag) => tagMatchesGenreFilter(tag, genre)));

    const matchesFeature =
      features.length === 0 ||
      features.some((feature) =>
        work.tags.some((tag) => tagMatchesFeatureFilter(tag, feature)),
      );

    return matchesQuery && matchesGenre && matchesFeature;
  });
}

export type SearchSortId = "recommended" | "watch" | "feedback";

export function sortSearchResults(
  results: SearchWorkResult[],
  sort: SearchSortId,
): SearchWorkResult[] {
  const copy = [...results];
  if (sort === "watch") {
    return copy.sort((a, b) => b.watchCount - a.watchCount);
  }
  if (sort === "feedback") {
    return copy.sort((a, b) => b.feedbackCount - a.feedbackCount);
  }
  return copy;
}

export function paginateSearchResults<T>(items: T[], page: number, pageSize: number) {
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * pageSize;
  return {
    items: items.slice(start, start + pageSize),
    page: safePage,
    totalPages,
    totalItems: items.length,
  };
}
