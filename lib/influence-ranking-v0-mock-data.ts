import { profileAvatarPresets } from "@/lib/profile-avatar-presets";

export type InfluenceRankingEntry = {
  rank: number;
  name: string;
  handle: string;
  avatar: string;
  score: number;
  title: string;
  titleColor: string;
};

export type InfluenceLastMonthEntry = {
  rank: number;
  name: string;
  score: number;
};

export type InfluenceRankingMonth = {
  id: string;
  label: string;
  top3: InfluenceRankingEntry[];
  list: InfluenceRankingEntry[];
  lastMonthTop3: InfluenceLastMonthEntry[];
};

/** ランキングに載せる最大人数（1〜50位） */
export const RANKING_MAX = 50;

/** 4位〜10位を初回表示（1〜3位は top3 カード）。11位以降はもっと見る */
export const RANKING_LIST_INITIAL = 7;

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

function buildCandidates(monthSeed: number, activeCount: number): RawCandidate[] {
  return PLAYER_NAMES.map((name, index) => {
    const handle = `player${index + 1}`;
    const base = Math.max(0, 2400 - index * 38 - monthSeed * 90);
    const jitter = (index * 17 + monthSeed * 31) % 40;
    const score =
      index < activeCount ? Math.max(1, base - jitter) : 0;
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
      };
    });
}

function buildMonth(
  id: string,
  label: string,
  monthSeed: number,
  activeCount: number,
  lastMonthTop3: InfluenceLastMonthEntry[],
): InfluenceRankingMonth {
  const ranked = toRankedEntries(buildCandidates(monthSeed, activeCount));
  return {
    id,
    label,
    top3: ranked.slice(0, 3),
    list: ranked.slice(3),
    lastMonthTop3,
  };
}

export const influenceRankingMonths: InfluenceRankingMonth[] = [
  buildMonth("2025-05", "2025年5月", 0, 38, [
    { rank: 1, name: "しゃねこ", score: 2301 },
    { rank: 2, name: "みかん", score: 1890 },
    { rank: 3, name: "クロノス", score: 1654 },
  ]),
  buildMonth("2025-04", "2025年4月", 1, 32, [
    { rank: 1, name: "みかん", score: 2102 },
    { rank: 2, name: "クロノス", score: 1920 },
    { rank: 3, name: "しゃねこ", score: 1855 },
  ]),
  buildMonth("2025-03", "2025年3月", 2, 24, [
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
  const found = influenceRankingMonths.find((month) => month.id === param);
  return found?.id ?? influenceRankingMonths[0].id;
}

export function getInfluenceRankingMonth(id: string): InfluenceRankingMonth {
  return influenceRankingMonths.find((month) => month.id === id) ?? influenceRankingMonths[0];
}

/** スコア > 0 の人数（最大50）。UI の「もっと見る」判定用 */
export function getRankedPlayerCount(month: InfluenceRankingMonth): number {
  return month.top3.length + month.list.length;
}
