import { developerSearchResults } from "@/lib/developer-search-v0-mock-data";
import { gameDetailHref } from "@/lib/game-detail-v0-mock-data";

const previewGameIds = [
  "seikat-no-tabiji",
  "roshin-no-zanko",
  "sorashima-pioneer",
  "natsu-no-mukougawa",
  "arcadia-iseki",
  "kissaten-catsea",
] as const;

export function developerDevlogHref(log: DeveloperDevlogPreview): string {
  return `${gameDetailHref(log.gameId)}?tab=devlog`;
}

export type DeveloperGameCard = {
  id: string;
  title: string;
  tags: string[];
  status: "in-dev" | "completed";
  witnessCount: number;
  lastUpdated: string;
  image: string;
  description: string;
};

export type DeveloperDevlogPreview = {
  id: string;
  gameTitle: string;
  gameId: string;
  date: string;
  title: string;
  excerpt: string;
  commentCount: number;
};

export type DeveloperProfileV0 = {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  bio: string;
  location: string;
  website?: string;
  isNew: boolean;
  verified: boolean;
  followers: number;
  following: boolean;
  stats: {
    inDevelopment: number;
    completed: number;
    followers: number;
    totalPlays: number;
  };
  inDevGames: DeveloperGameCard[];
  completedGames: DeveloperGameCard[];
  recentDevlogs: DeveloperDevlogPreview[];
  badges: { id: string; label: string; emoji: string }[];
};

const soraProfile: DeveloperProfileV0 = {
  id: "sora-games",
  name: "Sora Games",
  handle: "soragames",
  avatar: "/images/landing/game-2.png",
  bio: "Making games alone. 静かな物語と、光と影の世界観を大切にしています。",
  location: "日本",
  website: "https://example.com",
  isNew: true,
  verified: true,
  followers: 2341,
  following: true,
  stats: { inDevelopment: 2, completed: 1, followers: 2341, totalPlays: 12341 },
  inDevGames: [
    {
      id: "seikat-no-tabiji",
      title: "星灯の旅路",
      tags: ["RPG", "Adventure", "Fantasy"],
      status: "in-dev",
      witnessCount: 1248,
      lastUpdated: "2025/05/18",
      image: "/images/landing/game-1.png",
      description: "夜の森を旅する短編アドベンチャー。",
    },
    {
      id: "natsu-no-mukougawa",
      title: "夏の向こう側",
      tags: ["アドベンチャー", "癒し系"],
      status: "in-dev",
      witnessCount: 421,
      lastUpdated: "2025/04/20",
      image: "/images/landing/game-4.png",
      description: "あの夏の記憶を、もう一度辿る物語。",
    },
  ],
  completedGames: [
    {
      id: "seikat-no-tabiji",
      title: "星灯の旅路 完成ver",
      tags: ["RPG", "完成品"],
      status: "completed",
      witnessCount: 892,
      lastUpdated: "2024/12/01",
      image: "/images/landing/game-1.png",
      description: "正式リリースver。",
    },
  ],
  recentDevlogs: [
    {
      id: "dl1",
      gameTitle: "星灯の旅路",
      gameId: "seikat-no-tabiji",
      date: "2025/05/18",
      title: "v0.4.0 — チュートリアル短縮",
      excerpt: "序盤の説明を半分に。プレイ開始までの時間を短くしました。",
      commentCount: 42,
    },
    {
      id: "dl2",
      gameTitle: "星灯の旅路",
      gameId: "seikat-no-tabiji",
      date: "2025/05/10",
      title: "v0.3.2 — テンポ改善",
      excerpt: "移動速度とイベント間隔を調整しました。",
      commentCount: 31,
    },
    {
      id: "dl3",
      gameTitle: "夏の向こう側",
      gameId: "natsu-no-mukougawa",
      date: "2025/04/28",
      title: "プロトタイプ公開",
      excerpt: "第1章のみ公開。フィードバックを募集しています。",
      commentCount: 12,
    },
  ],
  badges: [
    { id: "b1", label: "新規開発者", emoji: "🌱" },
    { id: "b2", label: "継続更新", emoji: "🔄" },
    { id: "b3", label: "フィードバックを受け取る", emoji: "💬" },
  ],
};

const profiles: Record<string, DeveloperProfileV0> = {
  "sora-games": soraProfile,
};

export function getDeveloperProfileV0(id: string): DeveloperProfileV0 {
  if (profiles[id]) {
    return profiles[id];
  }
  const fromSearch = developerSearchResults.find((d) => d.id === id);
  if (fromSearch) {
    return {
      ...soraProfile,
      id: fromSearch.id,
      name: fromSearch.name,
      handle: fromSearch.handle,
      avatar: fromSearch.avatar,
      bio: fromSearch.bio,
      isNew: fromSearch.isNew,
      verified: fromSearch.verified,
      followers: fromSearch.followers,
      following: fromSearch.following,
      stats: {
        inDevelopment: fromSearch.inDevelopment,
        completed: fromSearch.completed,
        followers: fromSearch.followers,
        totalPlays: 4200,
      },
      inDevGames: fromSearch.gameThumbs.map((thumb, index) => {
        const gameId = previewGameIds[index % previewGameIds.length]!;
        return {
          id: gameId,
          title: `${fromSearch.name} 作品 ${index + 1}`,
          tags: ["開発中"],
          status: "in-dev" as const,
          witnessCount: 300 + index * 100,
          lastUpdated: "2025/05/01",
          image: thumb,
          description: "開発中の作品です。",
        };
      }),
      completedGames:
        fromSearch.completed > 0
          ? [
              {
                id: previewGameIds[(fromSearch.id.length + 1) % previewGameIds.length]!,
                title: `${fromSearch.name} 完成作品`,
                tags: ["完成品"],
                status: "completed" as const,
                witnessCount: 520,
                lastUpdated: "2024/11/01",
                image: fromSearch.gameThumbs[0] ?? "/images/landing/game-1.png",
                description: "正式verとして公開中の作品です。",
              },
            ]
          : [],
      recentDevlogs: [
        {
          id: `${fromSearch.id}-dl1`,
          gameTitle: "星灯の旅路",
          gameId: "seikat-no-tabiji",
          date: "2025/05/12",
          title: "最新ビルドを公開",
          excerpt: "フィードバックを反映した更新verです。",
          commentCount: 8,
        },
        {
          id: `${fromSearch.id}-dl2`,
          gameTitle: "炉心の残光",
          gameId: "roshin-no-zanko",
          date: "2025/04/20",
          title: "UI を調整",
          excerpt: "マップ画面の視認性を改善しました。",
          commentCount: 5,
        },
      ],
    };
  }
  return soraProfile;
}
