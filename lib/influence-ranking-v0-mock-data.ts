import { profileAvatarPresets } from "@/lib/profile-avatar-presets";
import { parseInfluenceRankingMonthId } from "@/lib/influence-ranking-month-catalog";
import { shouldHideV0MockContent } from "@/lib/production-mode";
import { RANKING_LIST_INITIAL, RANKING_MAX } from "@/lib/ranking-v0-shared";

export { RANKING_LIST_INITIAL, RANKING_MAX };

export type InfluenceRankingMetrics = {
  devEvalCount: number;
  improvementLinkedCount: number;
  verificationContributionCount: number;
  continuedWitnessCount: number;
  lowVoiceContributionCount: number;
};

export type InfluenceRankingEntry = {
  rank: number;
  name: string;
  handle: string;
  avatar: string;
  score: number;
  title: string;
  titleColor: string;
  metrics: InfluenceRankingMetrics;
};

export type InfluenceLastMonthEntry = {
  rank: number;
  name: string;
  score: number;
};

export type InfluenceRankingMonth = {
  id: string;
  label: string;
  period: string;
  top3: InfluenceRankingEntry[];
  list: InfluenceRankingEntry[];
  lastMonthTop3: InfluenceLastMonthEntry[];
};

const TITLES: { title: string; titleColor: string }[] = [
  { title: "未来を動かした人", titleColor: "text-amber-300" },
  { title: "鋭い観察者", titleColor: "text-zinc-300" },
  { title: "新人育て屋", titleColor: "text-orange-300" },
  { title: "バランス調整役", titleColor: "text-violet-300" },
  { title: "誠実な助言者", titleColor: "text-emerald-300" },
  { title: "継続の見届け人", titleColor: "text-sky-300" },
];

const PLAYER_NAMES = [
  "しゃねこ", "みかん", "クロノス", "ゆき", "たろう", "はる", "レン", "ソラ", "ミオ", "ケン",
  "アオイ", "ヒナ", "リク", "ノア", "サキ", "カイト", "ルナ", "テツ", "マコ", "ユウ",
  "ナツ", "コウ", "リナ", "シン", "エマ", "ハルト", "モモ", "ゲン", "サラ", "ダイ",
  "フウ", "アキ", "ミク", "レオ", "ヒロ", "サト", "メイ", "タク", "ユイ", "ソウ",
  "リン", "カノ", "トモ", "ナオ", "ジン", "ミサ", "レイ", "コト", "アヤ", "ケイ",
  "ゼロ", "ルイ", "ノゾ", "ハルカ", "イツキ", "スズ", "マナ", "ユズ", "コハ", "アオ",
];

type RawCandidate = {
  name: string;
  handle: string;
  avatar: string;
  score: number;
};

function avatarForIndex(index: number): string {
  return profileAvatarPresets[index % profileAvatarPresets.length].src;
}

function buildMetrics(score: number, index: number): InfluenceRankingMetrics {
  const tier = Math.max(1, Math.round(score / 180));
  const mod = (index * 7 + 3) % 5;
  return {
    devEvalCount: Math.max(1, Math.round(tier * 0.35) + mod),
    improvementLinkedCount: Math.max(0, Math.round(tier * 0.22) + (mod % 3)),
    verificationContributionCount: Math.max(0, Math.round(tier * 0.18) + (mod % 2)),
    continuedWitnessCount: Math.max(1, Math.round(tier * 0.1) + (index % 3)),
    lowVoiceContributionCount: Math.max(0, Math.round(tier * 0.08) + (index % 2)),
  };
}

function buildCandidates(monthSeed: number, activeCount: number): RawCandidate[] {
  return PLAYER_NAMES.map((name, index) => {
    const handle = index === 0 ? "shaneco" : `player${index + 1}`;
    const base = Math.max(0, 2400 - index * 38 - monthSeed * 90);
    const jitter = (index * 17 + monthSeed * 31) % 40;
    const score = index < activeCount ? Math.max(1, base - jitter) : 0;
    return {
      name,
      handle,
      avatar: avatarForIndex(index),
      score,
    };
  });
}

function toRankedEntries(candidates: RawCandidate[]): InfluenceRankingEntry[] {
  return candidates
    .filter((candidate) => candidate.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, RANKING_MAX)
    .map((candidate, index) => {
      const title = TITLES[index % TITLES.length];
      return {
        rank: index + 1,
        name: candidate.name,
        handle: candidate.handle,
        avatar: candidate.avatar,
        score: candidate.score,
        title: title.title,
        titleColor: title.titleColor,
        metrics: buildMetrics(candidate.score, index),
      };
    });
}

function buildMonth(
  id: string,
  label: string,
  period: string,
  monthSeed: number,
  activeCount: number,
  lastMonthTop3: InfluenceLastMonthEntry[],
): InfluenceRankingMonth {
  const ranked = toRankedEntries(buildCandidates(monthSeed, activeCount));
  return {
    id,
    label,
    period,
    top3: ranked.slice(0, 3),
    list: ranked.slice(3),
    lastMonthTop3,
  };
}

export const influenceRankingMonths: InfluenceRankingMonth[] = [
  buildMonth("2025-05", "2025年5月", "集計期間: 2025/05/01 – 2025/05/31", 0, 42, [
    { rank: 1, name: "しゃねこ", score: 2301 },
    { rank: 2, name: "みかん", score: 1890 },
    { rank: 3, name: "クロノス", score: 1654 },
  ]),
  buildMonth("2025-04", "2025年4月", "集計期間: 2025/04/01 – 2025/04/30", 1, 36, [
    { rank: 1, name: "みかん", score: 2102 },
    { rank: 2, name: "クロノス", score: 1920 },
    { rank: 3, name: "しゃねこ", score: 1855 },
  ]),
  buildMonth("2025-03", "2025年3月", "集計期間: 2025/03/01 – 2025/03/31", 2, 28, [
    { rank: 1, name: "クロノス", score: 1988 },
    { rank: 2, name: "ゆき", score: 1622 },
    { rank: 3, name: "たろう", score: 1540 },
  ]),
];

/** @deprecated use influenceRankingMonths */
export const influenceRankingMonth = influenceRankingMonths[0].label;
/** @deprecated use influenceRankingMonths */
export const influenceTop3 = influenceRankingMonths[0].top3;
/** @deprecated use influenceRankingMonths */
export const influenceRankingList = influenceRankingMonths[0].list;
/** @deprecated use influenceRankingMonths */
export const lastMonthTop3 = influenceRankingMonths[0].lastMonthTop3;

export function parseRankingMonthId(param: string | null): string {
  if (shouldHideV0MockContent()) {
    return parseInfluenceRankingMonthId(param);
  }

  const found = influenceRankingMonths.find((month) => month.id === param);
  return found?.id ?? influenceRankingMonths[0].id;
}

export function getInfluenceRankingMonth(id: string): InfluenceRankingMonth {
  return influenceRankingMonths.find((month) => month.id === id) ?? influenceRankingMonths[0];
}

export function getRankedPlayerCount(month: InfluenceRankingMonth): number {
  return month.top3.length + month.list.length;
}

export const influenceRankingMetricWeights = [
  { id: "dev-eval", label: "開発者が「役立った」と評価したFB", weight: "35%" },
  { id: "improvement", label: "改善・変更に繋がったFB", weight: "25%" },
  { id: "verification", label: "確認依頼・変化チェックへの貢献", weight: "20%" },
  { id: "continued", label: "継続して見届けた貢献", weight: "10%" },
  { id: "low-voice", label: "フィードバックが少ない作品への貢献", weight: "10%" },
] as const;
