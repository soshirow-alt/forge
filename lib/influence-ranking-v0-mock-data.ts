export type InfluenceRankingEntry = {
  rank: number;
  name: string;
  handle: string;
  avatar: string;
  score: number;
  title: string;
  titleColor: string;
};

export const influenceRankingMonth = "2025年5月";

export const influenceTop3: InfluenceRankingEntry[] = [
  {
    rank: 1,
    name: "しゃねこ",
    handle: "shaneco",
    avatar: "/images/landing/game-4.png",
    score: 2301,
    title: "未来を動かした人",
    titleColor: "text-amber-300",
  },
  {
    rank: 2,
    name: "みかん",
    handle: "mikan_game",
    avatar: "/images/landing/game-5.png",
    score: 1987,
    title: "鋭い観察者",
    titleColor: "text-zinc-300",
  },
  {
    rank: 3,
    name: "クロノス",
    handle: "chronos",
    avatar: "/images/landing/game-2.png",
    score: 1764,
    title: "新人育て屋",
    titleColor: "text-orange-300",
  },
];

export const influenceRankingList: InfluenceRankingEntry[] = [
  { rank: 4, name: "ゆき", handle: "yuki_fb", avatar: "/images/landing/game-3.png", score: 1231, title: "バランス調整役", titleColor: "text-violet-300" },
  { rank: 5, name: "たろう", handle: "taro_play", avatar: "/images/landing/game-1.png", score: 1189, title: "誠実な助言者", titleColor: "text-emerald-300" },
  { rank: 6, name: "はる", handle: "haru_w", avatar: "/images/landing/game-4.png", score: 1056, title: "継続の見届け人", titleColor: "text-sky-300" },
  { rank: 7, name: "レン", handle: "ren_voice", avatar: "/images/landing/game-5.png", score: 998, title: "バランス調整役", titleColor: "text-violet-300" },
  { rank: 8, name: "ソラ", handle: "sora_p", avatar: "/images/landing/game-2.png", score: 876, title: "誠実な助言者", titleColor: "text-emerald-300" },
  { rank: 9, name: "ミオ", handle: "mio_game", avatar: "/images/landing/game-3.png", score: 812, title: "継続の見届け人", titleColor: "text-sky-300" },
  { rank: 10, name: "ケン", handle: "ken_devfan", avatar: "/images/landing/game-1.png", score: 754, title: "新人育て屋", titleColor: "text-orange-300" },
];

export const lastMonthTop3 = [
  { rank: 1, name: "しゃねこ", score: 2301 },
  { rank: 2, name: "みかん", score: 1890 },
  { rank: 3, name: "クロノス", score: 1654 },
];
