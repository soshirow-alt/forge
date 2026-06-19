import { developerSearchResults } from "@/lib/developer-search-v0-mock-data";
import { gameDetailHref } from "@/lib/game-detail-v0-mock-data";

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
  date: string;
  title: string;
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
      id: "completed-demo",
      title: "星灯の旅路 完成版",
      tags: ["RPG", "完成品"],
      status: "completed",
      witnessCount: 892,
      lastUpdated: "2024/12/01",
      image: "/images/landing/game-1.png",
      description: "正式リリース版。",
    },
  ],
  recentDevlogs: [
    { id: "dl1", gameTitle: "星灯の旅路", date: "2025/05/18", title: "v0.4.0 — チュートリアル短縮", commentCount: 42 },
    { id: "dl2", gameTitle: "星灯の旅路", date: "2025/05/10", title: "v0.3.2 — テンポ改善", commentCount: 31 },
    { id: "dl3", gameTitle: "夏の向こう側", date: "2025/04/28", title: "プロトタイプ公開", commentCount: 12 },
  ],
  badges: [
    { id: "b1", label: "新規開発者", emoji: "🌱" },
    { id: "b2", label: "継続更新", emoji: "🔄" },
    { id: "b3", label: "声を受け取る", emoji: "💬" },
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
      inDevGames: fromSearch.gameThumbs.map((thumb, index) => ({
        id: `dev-${fromSearch.id}-${index}`,
        title: `${fromSearch.name} 作品 ${index + 1}`,
        tags: ["開発中"],
        status: "in-dev" as const,
        witnessCount: 300 + index * 100,
        lastUpdated: "2025/05/01",
        image: thumb,
        description: "開発中の作品です。",
      })),
      completedGames: [],
    };
  }
  return soraProfile;
}
