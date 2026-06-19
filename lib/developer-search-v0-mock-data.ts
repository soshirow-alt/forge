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
  gameThumbs: string[];
  following: boolean;
};

export const DEVELOPER_SEARCH_TOTAL = 128;

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
    gameThumbs: ["/images/landing/game-2.png"],
    following: false,
  },
];

export function filterDevelopers(query: string): DeveloperSearchResult[] {
  const q = query.trim().toLowerCase();
  if (!q) {
    return developerSearchResults;
  }
  return developerSearchResults.filter(
    (dev) =>
      dev.name.toLowerCase().includes(q) || dev.handle.toLowerCase().includes(q),
  );
}

export function developerProfileHref(id: string): string {
  return `/creators/${encodeURIComponent(id)}`;
}
