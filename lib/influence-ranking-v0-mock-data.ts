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

const avatars = [
  "/images/landing/game-1.png",
  "/images/landing/game-2.png",
  "/images/landing/game-3.png",
  "/images/landing/game-4.png",
  "/images/landing/game-5.png",
];

const mayTop3: InfluenceRankingEntry[] = [
  {
    rank: 1,
    name: "しゃねこ",
    handle: "shaneco",
    avatar: avatars[3],
    score: 2301,
    title: "未来を動かした人",
    titleColor: "text-amber-300",
  },
  {
    rank: 2,
    name: "みかん",
    handle: "mikan_game",
    avatar: avatars[4],
    score: 1987,
    title: "鋭い観察者",
    titleColor: "text-zinc-300",
  },
  {
    rank: 3,
    name: "クロノス",
    handle: "chronos",
    avatar: avatars[1],
    score: 1764,
    title: "新人育て屋",
    titleColor: "text-orange-300",
  },
];

const mayList: InfluenceRankingEntry[] = [
  { rank: 4, name: "ゆき", handle: "yuki_fb", avatar: avatars[2], score: 1231, title: "バランス調整役", titleColor: "text-violet-300" },
  { rank: 5, name: "たろう", handle: "taro_play", avatar: avatars[0], score: 1189, title: "誠実な助言者", titleColor: "text-emerald-300" },
  { rank: 6, name: "はる", handle: "haru_w", avatar: avatars[3], score: 1056, title: "継続の見届け人", titleColor: "text-sky-300" },
  { rank: 7, name: "レン", handle: "ren_voice", avatar: avatars[4], score: 998, title: "バランス調整役", titleColor: "text-violet-300" },
  { rank: 8, name: "ソラ", handle: "sora_p", avatar: avatars[1], score: 876, title: "誠実な助言者", titleColor: "text-emerald-300" },
  { rank: 9, name: "ミオ", handle: "mio_game", avatar: avatars[2], score: 812, title: "継続の見届け人", titleColor: "text-sky-300" },
  { rank: 10, name: "ケン", handle: "ken_devfan", avatar: avatars[0], score: 754, title: "新人育て屋", titleColor: "text-orange-300" },
  { rank: 11, name: "アオイ", handle: "aoi_voice", avatar: avatars[3], score: 701, title: "誠実な助言者", titleColor: "text-emerald-300" },
  { rank: 12, name: "ヒナ", handle: "hina_play", avatar: avatars[4], score: 688, title: "継続の見届け人", titleColor: "text-sky-300" },
  { rank: 13, name: "リク", handle: "riku_fb", avatar: avatars[1], score: 642, title: "鋭い観察者", titleColor: "text-zinc-300" },
  { rank: 14, name: "ノア", handle: "noah_w", avatar: avatars[2], score: 615, title: "バランス調整役", titleColor: "text-violet-300" },
  { rank: 15, name: "サキ", handle: "saki_dev", avatar: avatars[0], score: 590, title: "新人育て屋", titleColor: "text-orange-300" },
];

export const influenceRankingMonths: InfluenceRankingMonth[] = [
  {
    id: "2025-05",
    label: "2025年5月",
    top3: mayTop3,
    list: mayList,
    lastMonthTop3: [
      { rank: 1, name: "しゃねこ", score: 2301 },
      { rank: 2, name: "みかん", score: 1890 },
      { rank: 3, name: "クロノス", score: 1654 },
    ],
  },
  {
    id: "2025-04",
    label: "2025年4月",
    top3: [
      { rank: 1, name: "みかん", handle: "mikan_game", avatar: avatars[4], score: 2102, title: "未来を動かした人", titleColor: "text-amber-300" },
      { rank: 2, name: "クロノス", handle: "chronos", avatar: avatars[1], score: 1920, title: "鋭い観察者", titleColor: "text-zinc-300" },
      { rank: 3, name: "しゃねこ", handle: "shaneco", avatar: avatars[3], score: 1855, title: "誠実な助言者", titleColor: "text-emerald-300" },
    ],
    list: mayList.map((entry, index) => ({
      ...entry,
      rank: index + 4,
      score: Math.max(400, entry.score - 120 - index * 8),
    })),
    lastMonthTop3: [
      { rank: 1, name: "クロノス", score: 1988 },
      { rank: 2, name: "しゃねこ", score: 1760 },
      { rank: 3, name: "ゆき", score: 1622 },
    ],
  },
  {
    id: "2025-03",
    label: "2025年3月",
    top3: [
      { rank: 1, name: "クロノス", handle: "chronos", avatar: avatars[1], score: 1988, title: "未来を動かした人", titleColor: "text-amber-300" },
      { rank: 2, name: "ゆき", handle: "yuki_fb", avatar: avatars[2], score: 1622, title: "鋭い観察者", titleColor: "text-zinc-300" },
      { rank: 3, name: "たろう", handle: "taro_play", avatar: avatars[0], score: 1540, title: "継続の見届け人", titleColor: "text-sky-300" },
    ],
    list: mayList.map((entry, index) => ({
      ...entry,
      rank: index + 4,
      score: Math.max(350, entry.score - 280 - index * 10),
    })),
    lastMonthTop3: [
      { rank: 1, name: "ゆき", score: 1710 },
      { rank: 2, name: "たろう", score: 1588 },
      { rank: 3, name: "はる", score: 1420 },
    ],
  },
];

/** @deprecated use influenceRankingMonths */
export const influenceRankingMonth = influenceRankingMonths[0].label;
/** @deprecated use influenceRankingMonths */
export const influenceTop3 = influenceRankingMonths[0].top3;
/** @deprecated use influenceRankingMonths */
export const influenceRankingList = influenceRankingMonths[0].list;
/** @deprecated use influenceRankingMonths */
export const lastMonthTop3 = influenceRankingMonths[0].lastMonthTop3;

export const RANKING_LIST_INITIAL = 4;

export function parseRankingMonthId(param: string | null): string {
  const found = influenceRankingMonths.find((month) => month.id === param);
  return found?.id ?? influenceRankingMonths[0].id;
}

export function getInfluenceRankingMonth(id: string): InfluenceRankingMonth {
  return influenceRankingMonths.find((month) => month.id === id) ?? influenceRankingMonths[0];
}
