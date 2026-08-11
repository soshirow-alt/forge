import { FORGE_GENRE_OPTIONS } from "@/lib/forge-genre-options";

export type DeveloperFeaturedWork = {
  id: string;
  title: string;
  image: string;
  /** Development phase label for list cards (optional). */
  phase?: string;
};

export type DeveloperSearchResult = {
  id: string;
  /** Auth user id when known (public catalog). */
  userId?: string;
  name: string;
  handle: string;
  avatar: string;
  bio: string;
  xAccount?: string;
  website?: string;
  verified: boolean;
  isNew: boolean;
  /** Prefer this over inDevelopment/completed mix. */
  publicGameCount?: number;
  /** @deprecated mixed-axis — UI should not show with「完成」alongside */
  inDevelopment: number;
  /** @deprecated mixed-axis */
  completed: number;
  /** null = still loading (do not flash as 0). */
  followers: number | null;
  /**
   * Display chips (capability / category). Prefer capabilityTags when present.
   * @deprecated for filtering — use activityCategories
   */
  genres: string[];
  /** Formal project categories this creator publishes in. */
  activityCategories?: import("@/lib/project-categories").ProjectCategoryId[];
  /** Capability / skill-like chips for cards. */
  capabilityTags?: string[];
  /** Game genres only (secondary, when creator has games). */
  gameGenres?: string[];
  featuredWorks?: DeveloperFeaturedWork[];
  /** @deprecated use featuredWorks */
  gameThumbs: string[];
  following: boolean;
  /** Newest public work createdAt (ms). Used by 新着順. */
  newestCreatedAt?: number;
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
    newestCreatedAt: 1_720_000_000_000,
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
    newestCreatedAt: 1_710_000_000_000,
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
    newestCreatedAt: 1_718_000_000_000,
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
    newestCreatedAt: 1_700_000_000_000,
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
    newestCreatedAt: 1_705_000_000_000,
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
    newestCreatedAt: 1_722_000_000_000,
  },
];

export function filterDevelopers(
  query: string,
  genres: string[] = [],
  source: DeveloperSearchResult[] = developerSearchResults,
  activityCategories: string[] = [],
): DeveloperSearchResult[] {
  let list = source;

  if (activityCategories.length > 0) {
    list = list.filter((dev) =>
      (dev.activityCategories ?? []).some((id) =>
        activityCategories.includes(id),
      ),
    );
  } else if (genres.length > 0) {
    // Legacy mock path: genre chips
    list = list.filter((dev) =>
      (dev.gameGenres ?? dev.genres).some((genre) => genres.includes(genre)),
    );
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

export type DeveloperSearchSortId = "newest" | "followers" | "works";
export type DeveloperSearchSortOrder = "asc" | "desc";

export const developerSearchSortOptions: {
  id: DeveloperSearchSortId;
  label: string;
}[] = [
  { id: "newest", label: "新着順" },
  { id: "followers", label: "フォロワー数" },
  { id: "works", label: "作品数" },
];

function compareDeveloperId(a: DeveloperSearchResult, b: DeveloperSearchResult): number {
  return a.id.localeCompare(b.id);
}

export function sortDevelopers(
  results: DeveloperSearchResult[],
  sort: DeveloperSearchSortId,
  order: DeveloperSearchSortOrder = "desc",
): DeveloperSearchResult[] {
  const copy = [...results];
  const direction = order === "asc" ? 1 : -1;

  if (sort === "followers") {
    return copy.sort((a, b) => {
      const diff = ((a.followers ?? 0) - (b.followers ?? 0)) * direction;
      return diff !== 0 ? diff : compareDeveloperId(a, b);
    });
  }
  if (sort === "works") {
    return copy.sort((a, b) => {
      const aw = a.publicGameCount ?? a.inDevelopment + a.completed;
      const bw = b.publicGameCount ?? b.inDevelopment + b.completed;
      const diff = (aw - bw) * direction;
      return diff !== 0 ? diff : compareDeveloperId(a, b);
    });
  }
  return copy.sort((a, b) => {
    const at = a.newestCreatedAt ?? 0;
    const bt = b.newestCreatedAt ?? 0;
    if (at !== bt) return (at - bt) * direction;
    return compareDeveloperId(a, b);
  });
}

export function parseDeveloperSort(param: string | null): DeveloperSearchSortId {
  if (param === "followers" || param === "works") {
    return param;
  }
  // Legacy ?sort=recommended had no recommend logic — treat as 新着順.
  return "newest";
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
