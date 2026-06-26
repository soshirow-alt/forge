import { FORGE_GENRE_OPTIONS } from "@/lib/forge-genre-options";

export type DeveloperSearchResult = {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  bio: string;
  verified: boolean;
  isNew: boolean;
  inDevelopment: number;
  completed: number;
  followers: number;
  genres: string[];
  gameThumbs: string[];
  following: boolean;
};

export const DEVELOPER_SEARCH_TOTAL = 128;

export const developerGenreFilters = [...FORGE_GENRE_OPTIONS] as const;

export const developerSearchResults: DeveloperSearchResult[] = [
  {
    id: "sora-games",
    name: "Sora Games",
    handle: "soragames",
    avatar: "/images/landing/game-2.png",
    bio: "静かな物語と、光と影の世界観を大切にするインディースタジオ。",
    verified: true,
    isNew: true,
    inDevelopment: 2,
    completed: 1,
    followers: 2341,
    genres: ["ファンタジー", "アドベンチャー", "ノベル"],
    gameThumbs: ["/images/landing/game-1.png", "/images/landing/game-4.png"],
    following: true,
  },
  {
    id: "lunaworks",
    name: "LunaWorks",
    handle: "lunaworks",
    avatar: "/images/landing/game-3.png",
    bio: "廃墟と光をテーマに、静かな世界観を描く開発チーム。",
    verified: true,
    isNew: false,
    inDevelopment: 1,
    completed: 0,
    followers: 1820,
    genres: ["ホラー", "探索", "アドベンチャー"],
    gameThumbs: ["/images/landing/game-2.png"],
    following: false,
  },
  {
    id: "sky-pirate",
    name: "Sky Pirate Studio",
    handle: "skypirate",
    avatar: "/images/landing/game-3.png",
    bio: "空とクラフトを組み合わせたサバイバル作品を制作中。",
    verified: false,
    isNew: true,
    inDevelopment: 1,
    completed: 0,
    followers: 892,
    genres: ["サバイバル", "クラフト", "アクション"],
    gameThumbs: ["/images/landing/game-3.png"],
    following: false,
  },
  {
    id: "greensmith",
    name: "GreenSmith",
    handle: "greensmith",
    avatar: "/images/landing/game-5.png",
    bio: "癒し系シミュレーションと、やさしい世界観の作品を届けます。",
    verified: true,
    isNew: false,
    inDevelopment: 2,
    completed: 1,
    followers: 1567,
    genres: ["シミュレーション", "カジュアル", "経営"],
    gameThumbs: ["/images/landing/game-5.png", "/images/landing/game-4.png"],
    following: false,
  },
  {
    id: "pixel-knights",
    name: "Pixel Knights",
    handle: "pixelknights",
    avatar: "/images/landing/game-4.png",
    bio: "ピクセルアートと探索アクションを軸にしたインディーチーム。",
    verified: true,
    isNew: false,
    inDevelopment: 1,
    completed: 2,
    followers: 3204,
    genres: ["アクション", "探索", "ローグライク"],
    gameThumbs: ["/images/landing/game-4.png", "/images/landing/game-1.png", "/images/landing/game-2.png"],
    following: true,
  },
  {
    id: "catnip-lab",
    name: "Catnip Lab",
    handle: "catniplab",
    avatar: "/images/landing/game-2.png",
    bio: "猫とコーヒーと、ゆったりした日常シミュレーション。",
    verified: false,
    isNew: true,
    inDevelopment: 1,
    completed: 0,
    followers: 412,
    genres: ["シミュレーション", "カジュアル"],
    gameThumbs: ["/images/landing/game-2.png"],
    following: false,
  },
];

export function filterDevelopers(query: string, genres: string[] = []): DeveloperSearchResult[] {
  let list = developerSearchResults;

  if (genres.length > 0) {
    list = list.filter((dev) => dev.genres.some((genre) => genres.includes(genre)));
  }

  const q = query.trim().toLowerCase();
  if (!q) {
    return list;
  }

  return list.filter(
    (dev) =>
      dev.name.toLowerCase().includes(q) || dev.handle.toLowerCase().includes(q),
  );
}

export type DeveloperSearchSortId = "recommended" | "followers" | "works";
export type DeveloperSearchSortOrder = "asc" | "desc";

export const developerSearchSortOptions: {
  id: DeveloperSearchSortId;
  label: string;
}[] = [
  { id: "recommended", label: "おすすめ順" },
  { id: "followers", label: "フォロワー数" },
  { id: "works", label: "作品数" },
];

export function sortDevelopers(
  results: DeveloperSearchResult[],
  sort: DeveloperSearchSortId,
  order: DeveloperSearchSortOrder = "desc",
): DeveloperSearchResult[] {
  const copy = [...results];
  const direction = order === "asc" ? 1 : -1;

  if (sort === "followers") {
    return copy.sort((a, b) => (a.followers - b.followers) * direction);
  }
  if (sort === "works") {
    return copy.sort(
      (a, b) =>
        (a.inDevelopment + a.completed - (b.inDevelopment + b.completed)) * direction,
    );
  }
  return copy;
}

export function parseDeveloperSort(param: string | null): DeveloperSearchSortId {
  if (param === "followers" || param === "works") {
    return param;
  }
  return "recommended";
}

export function parseDeveloperSortOrder(param: string | null): DeveloperSearchSortOrder {
  return param === "asc" ? "asc" : "desc";
}

export function developerProfileHref(
  id: string,
  options?: { from?: string },
): string {
  const base = `/creators/${encodeURIComponent(id)}`;
  if (!options?.from) {
    return base;
  }
  return `${base}?from=${encodeURIComponent(options.from)}`;
}
