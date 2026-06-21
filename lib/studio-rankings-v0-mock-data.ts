/** S-20 ホーム用の作品抜粋（開発者ランキングとは別） */
export type StudioRankingSnippet = {
  rank: number;
  id: string;
  title: string;
  image: string;
  meta: string;
  value: string;
};

export const studioRankingSnippets = {
  featured: [
    { rank: 1, id: "r1", title: "星の記憶", image: "/images/landing/hero-bg.png", meta: "by しゃねこ", value: "見届け人 +86" },
    { rank: 2, id: "r2", title: "深淵ノート", image: "/images/landing/game-3.png", meta: "by ミカン", value: "見届け人 +48" },
    { rank: 3, id: "r3", title: "星灯の旅路", image: "/images/landing/game-2.png", meta: "by ソラ", value: "見届け人 +22" },
  ] as StudioRankingSnippet[],
  growth: [
    { rank: 1, id: "g1", title: "霧の駅", image: "/images/landing/game-5.png", meta: "今月", value: "+312%" },
    { rank: 2, id: "g2", title: "光の旅人", image: "/images/landing/game-3.png", meta: "今月", value: "+186%" },
    { rank: 3, id: "g3", title: "紙の迷宮", image: "/images/landing/game-1.png", meta: "今月", value: "+124%" },
  ] as StudioRankingSnippet[],
  witnessGain: [
    { rank: 1, id: "wg1", title: "深淵ノート", image: "/images/landing/game-3.png", meta: "今週", value: "+48" },
    { rank: 2, id: "wg2", title: "星灯の旅路", image: "/images/landing/hero-bg.png", meta: "今週", value: "+22" },
    { rank: 3, id: "wg3", title: "炉心の残光", image: "/images/landing/game-1.png", meta: "今週", value: "+15" },
  ] as StudioRankingSnippet[],
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
