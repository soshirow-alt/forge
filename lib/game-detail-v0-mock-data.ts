export type GameDetailFeature = {
  title: string;
  description: string;
};

export type GameDetailRelatedGame = {
  id: string;
  title: string;
  genre: string;
  witnessCount: number;
  image: string;
};

export type GameDetailV0 = {
  id: string;
  title: string;
  lead: string;
  tags: string[];
  heroImage: string;
  galleryImages: string[];
  currentVersion: string;
  developer: {
    id: string;
    name: string;
    avatar: string;
    followers: number;
    bio: string;
    following: boolean;
  };
  witnessCount: number;
  voiceCount: number;
  devlogUpdatedAgo: string;
  lastUpdated: string;
  watching: boolean;
  saved: boolean;
  introduction: string;
  features: GameDetailFeature[];
  developerWorry: string;
  wantedVoices: string[];
  relatedTags: string[];
  relatedGames: GameDetailRelatedGame[];
};

const primaryGame: GameDetailV0 = {
  id: "seikat-no-tabiji",
  title: "星灯の旅路",
  lead: "失われた星の記憶を探す、夜の森の旅。ランタンの光を頼りに、静かな物語を辿る。",
  tags: ["RPG", "Adventure", "Fantasy", "Single Play"],
  heroImage: "/images/landing/game-1.png",
  galleryImages: [
    "/images/landing/game-1.png",
    "/images/landing/game-2.png",
    "/images/landing/game-3.png",
    "/images/landing/game-4.png",
  ],
  currentVersion: "v0.3.2",
  developer: {
    id: "sora-games",
    name: "Sora Games",
    avatar: "/images/landing/game-2.png",
    followers: 2341,
    bio: "静かな物語と、光と影の世界観を大切にするインディースタジオ。",
    following: true,
  },
  witnessCount: 1248,
  voiceCount: 312,
  devlogUpdatedAgo: "3日前",
  lastUpdated: "2025/05/18",
  watching: true,
  saved: false,
  introduction:
    "星灯の旅路は、夜の森を旅する短編アドベンチャーです。プレイヤーはランタンの光を頼りに、失われた記憶の断片を集めながら物語を進めます。探索と選択が物語の分岐に影響し、静かな世界観の中で「旅」の余韻を味わえる作品を目指しています。操作はシンプルで、初めての方でも迷わずプレイできます。",
  features: [
    { title: "探索", description: "ランタンの光で照らしながら、森の奥へ進む探索体験" },
    { title: "ストーリー重視", description: "選択と発見が物語の温度を変えるナラティブ設計" },
    { title: "感動ストーリー", description: "失われた記憶と再会をテーマにした emotional arc" },
    { title: "シングルプレイ", description: "一人で没入できる、静かな夜の旅" },
  ],
  developerWorry:
    "チュートリアルが長すぎると感じるプレイヤーがいるかもしれません。序盤の説明量と、最初の「旅の実感」が出るまでの tempo について、率直なフィードバックが欲しいです。",
  wantedVoices: [
    "チュートリアルの長さは適切でしたか？",
    "バトル（遭遇イベント）のテンポはどう感じましたか？",
    "ストーリーへの没入感は十分でしたか？",
  ],
  relatedTags: ["Fantasy", "RPG", "ストーリー重視", "探索", "インディー", "癒し系", "アドベンチャー"],
  relatedGames: [
    {
      id: "roshin-no-zanko",
      title: "炉心の残光",
      genre: "RPG",
      witnessCount: 892,
      image: "/images/landing/game-2.png",
    },
    {
      id: "sorashima-pioneer",
      title: "空島パイオニア",
      genre: "サバイバル",
      witnessCount: 654,
      image: "/images/landing/game-3.png",
    },
    {
      id: "natsu-no-mukougawa",
      title: "夏の向こう側",
      genre: "アドベンチャー",
      witnessCount: 421,
      image: "/images/landing/game-4.png",
    },
  ],
};

const secondaryGames: Record<string, GameDetailV0> = {
  "roshin-no-zanko": {
    ...primaryGame,
    id: "roshin-no-zanko",
    title: "炉心の残光",
    lead: "廃坑都市を舞台に、灯りと記憶をめぐるナラティブRPG。",
    tags: ["RPG", "Fantasy", "ストーリー", "インディー"],
    heroImage: "/images/landing/game-2.png",
    developer: {
      id: "lunaworks",
      name: "LunaWorks",
      avatar: "/images/landing/game-3.png",
      followers: 1820,
      bio: "廃墟と光をテーマに、静かな世界観を描く開発チーム。",
      following: false,
    },
    witnessCount: 892,
    voiceCount: 186,
    watching: false,
    introduction:
      "炉心の残光は、廃坑都市を舞台にしたナラティブRPGです。プレイヤーは残された灯りを手がかりに、都市の記憶を辿ります。",
    relatedGames: [
      {
        id: "seikat-no-tabiji",
        title: "星灯の旅路",
        genre: "RPG",
        witnessCount: 1248,
        image: "/images/landing/game-1.png",
      },
      {
        id: "sorashima-pioneer",
        title: "空島パイオニア",
        genre: "サバイバル",
        witnessCount: 654,
        image: "/images/landing/game-3.png",
      },
      {
        id: "shinen-note",
        title: "深淵ノート",
        genre: "RPG",
        witnessCount: 1102,
        image: "/images/landing/game-5.png",
      },
    ],
  },
};

/** preview 用 — 発見画面の card id を詳細 id に寄せる */
export const gameDetailIdAliases: Record<string, string> = {
  "hero-1": "seikat-no-tabiji",
  "hero-2": "roshin-no-zanko",
  "hero-3": "sorashima-pioneer",
  "ru-1": "seikat-no-tabiji",
  "ru-2": "shinen-note",
  "ru-3": "natsu-no-mukougawa",
  "ru-4": "mori-no-kobana-kobo",
  "ru-5": "arcadia-iseki",
  w1: "seikat-no-tabiji",
  w2: "roshin-no-zanko",
  w3: "sorashima-pioneer",
  w4: "shinen-note",
  w5: "natsu-no-mukougawa",
  w6: "mori-no-kobana-kobo",
  w7: "arcadia-iseki",
  w8: "kissaten-catsea",
  "seito-no-tabiji": "seikat-no-tabiji",
};

export function resolveGameDetailId(id: string): string {
  return gameDetailIdAliases[id] ?? id;
}

export function getGameDetailV0(id: string): GameDetailV0 {
  const resolved = resolveGameDetailId(id);
  if (resolved === primaryGame.id) {
    return primaryGame;
  }
  return secondaryGames[resolved] ?? { ...primaryGame, id: resolved };
}

export function gameDetailHref(id: string): string {
  return `/games/${encodeURIComponent(resolveGameDetailId(id))}`;
}

const titleToDetailId: Record<string, string> = {
  "星灯の旅路": "seikat-no-tabiji",
  "星灯の旅路（仮）": "seikat-no-tabiji",
  "炉心の残光": "roshin-no-zanko",
  "空島パイオニア": "sorashima-pioneer",
  "深淵ノート": "shinen-note",
  "夏の向こう側": "natsu-no-mukougawa",
  "森の中の小さな工房": "mori-no-kobana-kobo",
  "アルカディアの遺跡": "arcadia-iseki",
  "霧の駅": "seikat-no-tabiji",
  "光の旅人": "sorashima-pioneer",
  "紙の迷宮": "mori-no-kobana-kobo",
  "星の記憶": "seikat-no-tabiji",
  "風の駅": "seikat-no-tabiji",
  "夜明けの手紙": "roshin-no-zanko",
  "静かな灯台": "natsu-no-mukougawa",
};

/** Preview/mock catalog のみ — 本番の Supabase 作品タイトルには使わない */
export function resolveMockGameDetailSlug(title: string): string {
  return titleToDetailId[title] ?? title;
}

export function gameDetailIdFromTitle(title: string): string {
  return resolveMockGameDetailSlug(title);
}
