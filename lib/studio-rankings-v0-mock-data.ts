import { RANKING_MAX } from "@/lib/ranking-v0-shared";

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

const EPITHETS = [
  { epithet: "世界を育てる人", epithetColor: "text-amber-300" },
  { epithet: "物語を届ける人", epithetColor: "text-violet-300" },
  { epithet: "挑戦を育てる人", epithetColor: "text-sky-300" },
] as const;

const WORK_SNIPPETS = [
  { title: "空の彼方へ", image: "/images/landing/game-4.png" },
  { title: "静かな灯台", image: "/images/landing/game-5.png" },
  { title: "夜明けの手紙", image: "/images/landing/game-1.png" },
  { title: "紙の迷宮", image: "/images/landing/game-5.png" },
  { title: "風の駅", image: "/images/landing/game-2.png" },
  { title: "霧の駅", image: "/images/landing/game-5.png" },
  { title: "光の旅人", image: "/images/landing/game-3.png" },
  { title: "夏の向こう側", image: "/images/landing/game-4.png" },
] as const;

const EXTRA_DEV_SEEDS = [
  { id: "haruka", name: "ハルカ", handle: "haruka_dev", avatar: "/images/landing/game-3.png" },
  { id: "minato", name: "ミナト", handle: "minato_lab", avatar: "/images/landing/game-4.png" },
  { id: "ren", name: "レン", handle: "ren_voice", avatar: "/images/landing/game-2.png" },
  { id: "aoi", name: "アオイ", handle: "aoi_create", avatar: "/images/landing/hero-bg.png" },
  { id: "yuki", name: "ゆき", handle: "yuki_plays", avatar: "/images/landing/game-3.png" },
  { id: "lunaworks", name: "LunaWorks", handle: "lunaworks", avatar: "/images/landing/game-3.png" },
  { id: "greensmith", name: "GreenSmith", handle: "greensmith", avatar: "/images/landing/game-5.png" },
  { id: "kaito", name: "カイト", handle: "kaito_dev", avatar: "/images/landing/game-1.png" },
  { id: "nagi", name: "ナギ", handle: "nagi_studio", avatar: "/images/landing/game-2.png" },
  { id: "hina", name: "ヒナ", handle: "hina_create", avatar: "/images/landing/game-4.png" },
] as const;

function buildDeveloperRankingList(
  top3LastScore: number,
  monthSeed: number,
  listCount: number,
): StudioDeveloperRankingEntry[] {
  return Array.from({ length: listCount }, (_, index) => {
    const rank = index + 4;
    const seed = EXTRA_DEV_SEEDS[index % EXTRA_DEV_SEEDS.length];
    const epithet = EPITHETS[index % EPITHETS.length];
    const work = WORK_SNIPPETS[index % WORK_SNIPPETS.length];
    const decay = 1 - index * 0.028;
    const score = Math.max(120, Math.round(top3LastScore * 0.94 * decay - monthSeed * 40));
    const mom = Math.max(40, Math.round(score * 0.22));
    return {
      rank,
      id: rank <= 8 ? seed.id : `${seed.id}-${rank}`,
      name: rank > 12 ? `${seed.name}${rank - 12}` : seed.name,
      handle: rank > 12 ? `${seed.handle}_${rank}` : seed.handle,
      avatar: seed.avatar,
      epithet: epithet.epithet,
      epithetColor: epithet.epithetColor,
      score,
      monthOverMonth: mom,
      representativeWork: work,
      witnessGrowth: Math.max(8, Math.round(score * 0.034)),
      workFollowGrowth: Math.max(4, Math.round(score * 0.009)),
      devFollowGrowth: Math.max(2, Math.round(score * 0.004)),
      voiceGrowth: Math.max(6, Math.round(score * 0.017)),
    };
  });
}

function buildFullMonthRanking(
  top3: StudioDeveloperRankingEntry[],
  monthSeed: number,
  activeTotal: number,
): { top3: StudioDeveloperRankingEntry[]; list: StudioDeveloperRankingEntry[] } {
  const capped = Math.min(activeTotal, RANKING_MAX);
  const listCount = Math.max(0, capped - 3);
  const list = buildDeveloperRankingList(top3[2]?.score ?? 5000, monthSeed, listCount);
  return { top3, list };
}

export const studioDeveloperRankingList: StudioDeveloperRankingEntry[] = buildDeveloperRankingList(
  studioDeveloperRankingTop3[2]!.score,
  0,
  5,
);

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

export type StudioRankingMonth = {
  id: string;
  label: string;
  period: string;
  top3: StudioDeveloperRankingEntry[];
  list: StudioDeveloperRankingEntry[];
  lastMonthTop3: { rank: number; name: string; score: number }[];
};

function scaleRanking(
  entries: StudioDeveloperRankingEntry[],
  factor: number,
): StudioDeveloperRankingEntry[] {
  return entries.map((entry) => ({
    ...entry,
    score: Math.round(entry.score * factor),
    monthOverMonth: Math.round(entry.monthOverMonth * factor),
    witnessGrowth: Math.round(entry.witnessGrowth * factor),
    workFollowGrowth: Math.round(entry.workFollowGrowth * factor),
    devFollowGrowth: Math.round(entry.devFollowGrowth * factor),
    voiceGrowth: Math.round(entry.voiceGrowth * factor),
  }));
}

const mayRanking = buildFullMonthRanking(studioDeveloperRankingTop3, 0, 50);

export const studioDeveloperRankingMonths: StudioRankingMonth[] = [
  {
    id: "2025-05",
    label: studioDeveloperRankingMonth,
    period: studioDeveloperRankingPeriod,
    top3: mayRanking.top3,
    list: mayRanking.list,
    lastMonthTop3: studioDeveloperLastMonthTop3,
  },
  {
    id: "2025-04",
    label: "2025年4月",
    period: "集計期間: 2025/04/01 – 2025/04/30",
    ...(() => {
      const scaled = buildFullMonthRanking(scaleRanking(studioDeveloperRankingTop3, 0.88), 1, 40);
      return { top3: scaled.top3, list: scaled.list };
    })(),
    lastMonthTop3: [
      { rank: 1, name: "しゃねこ", score: 4812 },
      { rank: 2, name: "ミカン", score: 4520 },
      { rank: 3, name: "ハルカ", score: 4201 },
    ],
  },
  {
    id: "2025-03",
    label: "2025年3月",
    period: "集計期間: 2025/03/01 – 2025/03/31",
    ...(() => {
      const scaled = buildFullMonthRanking(scaleRanking(studioDeveloperRankingTop3, 0.76), 2, 32);
      return { top3: scaled.top3, list: scaled.list };
    })(),
    lastMonthTop3: [
      { rank: 1, name: "ソラ", score: 3988 },
      { rank: 2, name: "ミナト", score: 3610 },
      { rank: 3, name: "レン", score: 3294 },
    ],
  },
];

export function parseStudioRankingMonthId(param: string | null): string {
  const ids = studioDeveloperRankingMonths.map((month) => month.id);
  if (param && ids.includes(param)) {
    return param;
  }
  return ids[0]!;
}

export function getStudioDeveloperRankingMonth(id: string): StudioRankingMonth {
  return (
    studioDeveloperRankingMonths.find((month) => month.id === id) ??
    studioDeveloperRankingMonths[0]!
  );
}
