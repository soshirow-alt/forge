/** S-20 ホーム用ランキング抜粋（作品2列 + 開発者1列） */
export type StudioWorkGrowthSnippet = {
  rank: number;
  id: string;
  title: string;
  image: string;
  creator: string;
  growthRate: string;
};

export type StudioDeveloperGrowthSnippet = {
  rank: number;
  id: string;
  name: string;
  avatar: string;
  handle: string;
  growthRate: string;
};

export const studioHomeGrowthRankings = {
  /** 作品 — 見届け人の伸び率（前週比） */
  witnessGrowthWorks: [
    { rank: 1, id: "wg1", title: "霧の駅", image: "/images/landing/game-5.png", creator: "ハルカ", growthRate: "+312%" },
    { rank: 2, id: "wg2", title: "光の旅人", image: "/images/landing/game-3.png", creator: "ミナト", growthRate: "+186%" },
    { rank: 3, id: "wg3", title: "紙の迷宮", image: "/images/landing/game-1.png", creator: "アオイ", growthRate: "+124%" },
    { rank: 4, id: "wg4", title: "深淵ノート", image: "/images/landing/game-3.png", creator: "ミカン", growthRate: "+98%" },
    { rank: 5, id: "wg5", title: "星灯の旅路", image: "/images/landing/game-2.png", creator: "ソラ", growthRate: "+76%" },
    { rank: 6, id: "wg6", title: "炉心の残光", image: "/images/landing/game-1.png", creator: "レン", growthRate: "+64%" },
    { rank: 7, id: "wg7", title: "星の記憶", image: "/images/landing/hero-bg.png", creator: "しゃねこ", growthRate: "+52%" },
    { rank: 8, id: "wg8", title: "風の駅", image: "/images/landing/game-2.png", creator: "ゆき", growthRate: "+41%" },
    { rank: 9, id: "wg9", title: "夜明けの手紙", image: "/images/landing/game-1.png", creator: "レン", growthRate: "+33%" },
    { rank: 10, id: "wg10", title: "静かな灯台", image: "/images/landing/game-5.png", creator: "ミナト", growthRate: "+28%" },
  ] as StudioWorkGrowthSnippet[],
  /** 作品 — フィードバックの伸び率（前週比） */
  feedbackGrowthWorks: [
    { rank: 1, id: "fg1", title: "深淵ノート", image: "/images/landing/game-3.png", creator: "ミカン", growthRate: "+245%" },
    { rank: 2, id: "fg2", title: "星灯の旅路", image: "/images/landing/game-2.png", creator: "ソラ", growthRate: "+178%" },
    { rank: 3, id: "fg3", title: "星の記憶", image: "/images/landing/hero-bg.png", creator: "しゃねこ", growthRate: "+142%" },
    { rank: 4, id: "fg4", title: "霧の駅", image: "/images/landing/game-5.png", creator: "ハルカ", growthRate: "+118%" },
    { rank: 5, id: "fg5", title: "炉心の残光", image: "/images/landing/game-1.png", creator: "レン", growthRate: "+96%" },
    { rank: 6, id: "fg6", title: "光の旅人", image: "/images/landing/game-3.png", creator: "ミナト", growthRate: "+84%" },
    { rank: 7, id: "fg7", title: "紙の迷宮", image: "/images/landing/game-1.png", creator: "アオイ", growthRate: "+71%" },
    { rank: 8, id: "fg8", title: "夏の向こう側", image: "/images/landing/game-4.png", creator: "しゃねこ", growthRate: "+58%" },
    { rank: 9, id: "fg9", title: "空島パイオニア", image: "/images/landing/game-4.png", creator: "ソラ", growthRate: "+44%" },
    { rank: 10, id: "fg10", title: "風の駅", image: "/images/landing/game-2.png", creator: "ゆき", growthRate: "+36%" },
  ] as StudioWorkGrowthSnippet[],
  /** 開発者 — フォロワーの伸び率（前週比） */
  followerGrowthDevelopers: [
    { rank: 1, id: "mikan", name: "ミカン", avatar: "/images/landing/game-5.png", handle: "mikan_game", growthRate: "+128%" },
    { rank: 2, id: "sora", name: "ソラ", avatar: "/images/landing/game-2.png", handle: "soragames", growthRate: "+96%" },
    { rank: 3, id: "haruka", name: "ハルカ", avatar: "/images/landing/game-3.png", handle: "haruka_dev", growthRate: "+84%" },
    { rank: 4, id: "shaneco", name: "しゃねこ", avatar: "/images/landing/game-1.png", handle: "shaneco", growthRate: "+72%" },
    { rank: 5, id: "lunaworks", name: "LunaWorks", avatar: "/images/landing/game-3.png", handle: "lunaworks", growthRate: "+61%" },
    { rank: 6, id: "minato", name: "ミナト", avatar: "/images/landing/game-4.png", handle: "minato_lab", growthRate: "+48%" },
    { rank: 7, id: "ren", name: "レン", avatar: "/images/landing/game-2.png", handle: "ren_voice", growthRate: "+39%" },
    { rank: 8, id: "aoi", name: "アオイ", avatar: "/images/landing/hero-bg.png", handle: "aoi_create", growthRate: "+31%" },
    { rank: 9, id: "yuki", name: "ゆき", avatar: "/images/landing/game-3.png", handle: "yuki_plays", growthRate: "+24%" },
    { rank: 10, id: "greensmith", name: "GreenSmith", avatar: "/images/landing/game-5.png", handle: "greensmith", growthRate: "+18%" },
  ] as StudioDeveloperGrowthSnippet[],
};

/** S-23 開発者月間ランキング */
export type StudioDeveloperRankingEntry = {
  rank: number;
  id: string;
  name: string;
  handle: string;
  avatar: string;
  epithet: string;
  epithetColor: string;
  score: number;
  monthOverMonth: number;
  representativeWork: {
    title: string;
    image: string;
  };
  witnessGrowth: number;
  workFollowGrowth: number;
  devFollowGrowth: number;
  voiceGrowth: number;
};

export const studioDeveloperRankingMonth = "2025年5月";
export const studioDeveloperRankingPeriod = "集計期間: 2025/05/01 – 2025/05/31";

export const studioDeveloperRankingTop3: StudioDeveloperRankingEntry[] = [
  {
    rank: 1,
    id: "mikan",
    name: "ミカン",
    handle: "mikan_game",
    avatar: "/images/landing/game-5.png",
    epithet: "世界を育てる人",
    epithetColor: "text-amber-300",
    score: 7392,
    monthOverMonth: 2156,
    representativeWork: { title: "深淵ノート", image: "/images/landing/game-3.png" },
    witnessGrowth: 312,
    workFollowGrowth: 89,
    devFollowGrowth: 42,
    voiceGrowth: 156,
  },
  {
    rank: 2,
    id: "sora",
    name: "ソラ",
    handle: "soragames",
    avatar: "/images/landing/game-2.png",
    epithet: "物語を届ける人",
    epithetColor: "text-violet-300",
    score: 6841,
    monthOverMonth: 1893,
    representativeWork: { title: "星灯の旅路", image: "/images/landing/hero-bg.png" },
    witnessGrowth: 286,
    workFollowGrowth: 74,
    devFollowGrowth: 38,
    voiceGrowth: 142,
  },
  {
    rank: 3,
    id: "shaneco",
    name: "しゃねこ",
    handle: "shaneco",
    avatar: "/images/landing/game-1.png",
    epithet: "挑戦を育てる人",
    epithetColor: "text-sky-300",
    score: 6210,
    monthOverMonth: 1642,
    representativeWork: { title: "星の記憶", image: "/images/landing/game-4.png" },
    witnessGrowth: 248,
    workFollowGrowth: 61,
    devFollowGrowth: 29,
    voiceGrowth: 128,
  },
];

export const studioDeveloperRankingList: StudioDeveloperRankingEntry[] = [
  {
    rank: 4,
    id: "haruka",
    name: "ハルカ",
    handle: "haruka_dev",
    avatar: "/images/landing/game-3.png",
    epithet: "世界を育てる人",
    epithetColor: "text-amber-300",
    score: 5824,
    monthOverMonth: 1420,
    representativeWork: { title: "空の彼方へ", image: "/images/landing/game-4.png" },
    witnessGrowth: 198,
    workFollowGrowth: 52,
    devFollowGrowth: 24,
    voiceGrowth: 98,
  },
  {
    rank: 5,
    id: "minato",
    name: "ミナト",
    handle: "minato_lab",
    avatar: "/images/landing/game-4.png",
    epithet: "物語を届ける人",
    epithetColor: "text-violet-300",
    score: 5102,
    monthOverMonth: 1186,
    representativeWork: { title: "静かな灯台", image: "/images/landing/game-5.png" },
    witnessGrowth: 176,
    workFollowGrowth: 44,
    devFollowGrowth: 21,
    voiceGrowth: 86,
  },
  {
    rank: 6,
    id: "ren",
    name: "レン",
    handle: "ren_voice",
    avatar: "/images/landing/game-2.png",
    epithet: "挑戦を育てる人",
    epithetColor: "text-sky-300",
    score: 4688,
    monthOverMonth: 982,
    representativeWork: { title: "夜明けの手紙", image: "/images/landing/game-1.png" },
    witnessGrowth: 142,
    workFollowGrowth: 38,
    devFollowGrowth: 18,
    voiceGrowth: 72,
  },
  {
    rank: 7,
    id: "aoi",
    name: "アオイ",
    handle: "aoi_create",
    avatar: "/images/landing/hero-bg.png",
    epithet: "物語を届ける人",
    epithetColor: "text-violet-300",
    score: 4215,
    monthOverMonth: 864,
    representativeWork: { title: "紙の迷宮", image: "/images/landing/game-5.png" },
    witnessGrowth: 128,
    workFollowGrowth: 31,
    devFollowGrowth: 15,
    voiceGrowth: 64,
  },
  {
    rank: 8,
    id: "yuki",
    name: "ゆき",
    handle: "yuki_plays",
    avatar: "/images/landing/game-3.png",
    epithet: "挑戦を育てる人",
    epithetColor: "text-sky-300",
    score: 3892,
    monthOverMonth: 712,
    representativeWork: { title: "風の駅", image: "/images/landing/game-2.png" },
    witnessGrowth: 112,
    workFollowGrowth: 28,
    devFollowGrowth: 12,
    voiceGrowth: 58,
  },
];

export const studioDeveloperLastMonthTop3 = [
  { rank: 1, name: "ミカン", score: 5236 },
  { rank: 2, name: "ソラ", score: 4948 },
  { rank: 3, name: "しゃねこ", score: 4568 },
];

export const studioDeveloperRankingMetrics = [
  { id: "witness", label: "見届け人の増加", weight: "40%", icon: "users", color: "text-emerald-400" },
  { id: "work-follow", label: "作品フォローの増加", weight: "25%", icon: "heart", color: "text-rose-400" },
  { id: "dev-follow", label: "開発者フォローの増加", weight: "15%", icon: "user-plus", color: "text-violet-400" },
  { id: "voice", label: "FBの増加", weight: "20%", icon: "message", color: "text-sky-400" },
] as const;

export function formatMonthOverMonth(delta: number): string {
  const sign = delta >= 0 ? "+" : "";
  return `${sign}${delta.toLocaleString()}`;
}
