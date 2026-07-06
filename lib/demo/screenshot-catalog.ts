import type { HomeGameCard } from "@/lib/home-v0-mock-data";
import type { GameDevlogEntry } from "@/lib/game-devlog-v0-mock-data";
import type {
  StudioHomeConnectionMetrics,
  StudioHomeGranularity,
  StudioHomeHighlights,
} from "@/lib/studio-home-metrics";
import { SCREENSHOT_FLAGSHIP_GAME_ID } from "@/lib/demo/screenshot-routes";

export { SCREENSHOT_FLAGSHIP_GAME_ID };

export const screenshotFlagship = {
  id: SCREENSHOT_FLAGSHIP_GAME_ID,
  title: "星灯の旅路",
  developerName: "Sora Games",
  developerId: "sora-games",
  genre: "アドベンチャー",
  thumbnail: "/images/landing/game-1.png",
  version: "v0.4.0",
  updatedLabel: "3時間前更新",
  lastUpdatedLabel: "3日前",
  feedbackCount: 48,
  watchCount: 32,
  lead: "失われた星の記憶を探す、夜の森の旅。ランタンの光を頼りに、静かな物語を辿る。",
} as const;

export const screenshotDevlogEntries: GameDevlogEntry[] = [
  {
    id: "ss-devlog-1",
    version: "v0.4.0",
    publishedAt: "3日前",
    relativeLabel: "3日前",
    title: "チュートリアル短縮と序盤イベント調整",
    excerpt:
      "プレイヤーのフィードバックを反映し、チュートリアルを約30%短くしました。序盤の森マップに目印を追加し、最初の「旅の実感」が出るまでの導線を見直しています。",
    highlights: [
      "チュートリアルテキストを整理",
      "序盤の森マップに目印を追加",
      "プレイヤーの声を反映した導線改善",
    ],
    kind: "version",
    isLatest: true,
  },
  {
    id: "ss-devlog-2",
    version: "v0.3.2",
    publishedAt: "1週間前",
    relativeLabel: "1週間前",
    title: "ランタン演出とBGMの改善",
    excerpt:
      "「夜の森の雰囲気がもっと欲しい」という声を受け、ランタンの光量とBGMの切り替えを見直しました。探索の没入感が上がるよう調整しています。",
    highlights: [
      "ランタンの光量と範囲を調整",
      "エリアごとのBGMフェードを改善",
      "プレイヤーFBを反映した雰囲気作り",
    ],
    kind: "version",
  },
  {
    id: "ss-devlog-3",
    version: "v0.3.0",
    publishedAt: "2週間前",
    relativeLabel: "2週間前",
    title: "プレイヤーの声を受けた戦闘テンポ調整",
    excerpt:
      "戦闘前後のフェードと待ち時間を調整。複数のフィードバックで指摘されたテンポ問題を改善し、探索のリズムが途切れにくくなりました。",
    highlights: [
      "イベント間の待機を短縮",
      "戦闘後の戻り時間を調整",
      "「テンポが良くなった」という声が増加",
    ],
    kind: "version",
  },
];

function homeCard(
  id: string,
  title: string,
  image: string,
  genre: string,
  updatedLabel: string,
  feedbackCount: number,
  watchCount: number,
  version = "v0.3.2",
): HomeGameCard {
  return {
    id,
    title,
    version,
    description: "",
    image,
    genre,
    updatedLabel,
    feedbackCount,
    watchCount,
  };
}

export const screenshotHeroSlides: HomeGameCard[] = [
  {
    id: screenshotFlagship.id,
    title: screenshotFlagship.title,
    version: screenshotFlagship.version,
    description: screenshotFlagship.lead,
    image: screenshotFlagship.thumbnail,
    genre: screenshotFlagship.genre,
    updatedLabel: "昨日更新",
    feedbackCount: screenshotFlagship.feedbackCount,
    watchCount: screenshotFlagship.watchCount,
  },
  homeCard(
    "ss-roshin",
    "炉心の残光",
    "/images/landing/game-2.png",
    "ナラティブRPG",
    "3日前更新",
    36,
    24,
    "v0.3.2",
  ),
  homeCard(
    "ss-sorashima",
    "空島パイオニア",
    "/images/landing/game-3.png",
    "サバイバルクラフト",
    "1週間前更新",
    29,
    22,
    "v0.2.1",
  ),
];

export const screenshotRecentlyUpdated: HomeGameCard[] = [
  homeCard(
    screenshotFlagship.id,
    screenshotFlagship.title,
    screenshotFlagship.thumbnail,
    screenshotFlagship.genre,
    "3時間前更新",
    24,
    15,
    screenshotFlagship.version,
  ),
  homeCard(
    "ss-shinen",
    "深淵ノート",
    "/images/landing/game-5.png",
    "ホラー",
    "8時間前更新",
    31,
    19,
    "v0.5.1",
  ),
  homeCard(
    "ss-ember",
    "余燼の王国",
    "/demo-thumbnails/emberfall.svg",
    "アクションRPG",
    "1日前更新",
    28,
    18,
    "v0.2.0",
  ),
  homeCard(
    "ss-neon",
    "ネオンドリフト",
    "/demo-thumbnails/neon-drift.svg",
    "レース",
    "2日前更新",
    22,
    14,
    "v0.1.8",
  ),
  homeCard(
    "ss-natsu",
    "夏の向こう側",
    "/images/landing/game-4.png",
    "日常アドベンチャー",
    "3日前更新",
    15,
    8,
    "v0.2.4",
  ),
];

export const screenshotPopular: HomeGameCard[] = [
  homeCard(
    screenshotFlagship.id,
    screenshotFlagship.title,
    screenshotFlagship.thumbnail,
    screenshotFlagship.genre,
    "今週",
    48,
    32,
    screenshotFlagship.version,
  ),
  homeCard(
    "ss-roshin",
    "炉心の残光",
    "/images/landing/game-2.png",
    "ナラティブRPG",
    "今週",
    36,
    24,
  ),
  homeCard(
    "ss-hollow",
    "虚ろな信号",
    "/demo-thumbnails/hollow-signal.svg",
    "サバイバルホラー",
    "今週",
    27,
    16,
    "v0.4.1",
  ),
  homeCard(
    "ss-mori",
    "森の中の小さな工房",
    "/images/landing/game-5.png",
    "シミュレーション",
    "今週",
    20,
    12,
    "v0.1.5",
  ),
];

export const screenshotNewGames: HomeGameCard[] = screenshotRecentlyUpdated.slice(0, 4);

export type ScreenshotPlayHistoryEntry = {
  title: string;
  version: string;
  description: string;
  image: string;
  genre: string;
  tags: string[];
  lastPlay: string;
  playCount: number;
  timeline: string[];
};

export const screenshotPlayHistory: ScreenshotPlayHistoryEntry[] = [
  {
    title: screenshotFlagship.title,
    version: screenshotFlagship.version,
    description: "夜の森を旅する短編アドベンチャー",
    image: screenshotFlagship.thumbnail,
    genre: screenshotFlagship.genre,
    tags: ["見届け中", "応援中の作者"],
    lastPlay: "昨日",
    playCount: 4,
    timeline: [
      "v0.4.0 をプレイ — チュートリアル短縮を確認（3日前の更新）",
      "v0.3.2 をプレイ — 序盤イベントのテンポ改善",
      "初声を届けた — 「世界観がとても良かった」",
      "v0.1.0 をプレイ — はじめての旅",
    ],
  },
  {
    title: "炉心の残光",
    version: "v0.3.2",
    description: "心の奥に残る、静かな物語",
    image: "/images/landing/game-2.png",
    genre: "ナラティブRPG",
    tags: ["見届け中"],
    lastPlay: "3日前",
    playCount: 2,
    timeline: [
      "v0.3.2 をプレイ",
      "フィードバックを届けた",
      "v0.2.0 をプレイ",
    ],
  },
  {
    title: "深淵ノート",
    version: "v0.5.1",
    description: "地下書庫を探索するホラーアドベンチャー",
    image: "/images/landing/game-5.png",
    genre: "ホラー",
    tags: ["見届け中", "正式ver到達"],
    lastPlay: "1週間前",
    playCount: 5,
    timeline: [
      "正式ver到達を見届けた",
      "v0.5.1 をプレイ — 新エリア追加",
      "v0.4.0 をプレイ",
    ],
  },
];

/** Studio ホーム `/studio` 用 fixture — 代表作「星灯の旅路」を軸にした接続指標 */
export const screenshotStudioHomeHighlights: StudioHomeHighlights = {
  unreadVoiceProjectCount: 2,
  hasRecentCommunityReply: true,
};

function screenshotStudioPeriodKeys(granularity: StudioHomeGranularity): string[] {
  if (granularity === "month") {
    return ["2026-02", "2026-03", "2026-04", "2026-05", "2026-06", "2026-07"];
  }
  if (granularity === "week") {
    return ["2026-05-26", "2026-06-02", "2026-06-09", "2026-06-16", "2026-06-23", "2026-06-30"];
  }
  return ["2026-06-28", "2026-06-29", "2026-06-30", "2026-07-01", "2026-07-02", "2026-07-03"];
}

export function getScreenshotStudioHomeMetrics(
  granularity: StudioHomeGranularity,
): StudioHomeConnectionMetrics {
  const months = screenshotStudioPeriodKeys(granularity);

  const playOnce = [14, 19, 24, 30, 35, 41];
  const playTwice = [7, 10, 13, 16, 19, 22];
  const playThrice = [4, 6, 8, 10, 12, 15];
  const playDepth = playOnce.map((once, index) => {
    const twice = playTwice[index]!;
    const thricePlus = playThrice[index]!;
    return { once, twice, thricePlus, total: once + twice + thricePlus };
  });

  const voiceFunnel = [
    { played: 32, voiced: 16, deep: 5 },
    { played: 48, voiced: 26, deep: 9 },
    { played: 64, voiced: 36, deep: 13 },
    { played: 82, voiced: 48, deep: 18 },
    { played: 102, voiced: 62, deep: 22 },
    {
      played: 124,
      voiced: Math.max(screenshotFlagship.feedbackCount, 72),
      deep: 26,
    },
  ];

  const witnessCommunity = [
    { watching: 9, communityMembers: 4 },
    { watching: 14, communityMembers: 7 },
    { watching: 19, communityMembers: 10 },
    { watching: 24, communityMembers: 13 },
    { watching: 28, communityMembers: 16 },
    {
      watching: screenshotFlagship.watchCount,
      communityMembers: 18,
    },
  ];

  return { months, playDepth, voiceFunnel, witnessCommunity };
}
