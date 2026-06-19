export type StudioRankingEntry = {
  rank: number;
  id: string;
  title: string;
  image: string;
  meta: string;
  value: string;
};

export const studioRankingTabs = [
  { id: "witness", label: "見届け人数" },
  { id: "voices", label: "声の数" },
  { id: "growth", label: "成長作品" },
  { id: "released", label: "正式版到達" },
] as const;

export type StudioRankingTabId = (typeof studioRankingTabs)[number]["id"];

export const studioRankingByWitness: StudioRankingEntry[] = [
  { rank: 1, id: "r1", title: "星の記憶", image: "/images/landing/hero-bg.png", meta: "RPG・ファンタジー", value: "見届け人 428" },
  { rank: 2, id: "r2", title: "深淵ノート", image: "/images/landing/game-3.png", meta: "ホラー・探索", value: "見届け人 312" },
  { rank: 3, id: "r3", title: "星灯の旅路", image: "/images/landing/game-2.png", meta: "アドベンチャー", value: "見届け人 286" },
  { rank: 4, id: "r4", title: "炉心の残光", image: "/images/landing/game-1.png", meta: "RPG", value: "見届け人 198" },
  { rank: 5, id: "r5", title: "夏の向こう側", image: "/images/landing/game-4.png", meta: "正式版", value: "見届け人 176" },
];

export const studioRankingByVoices: StudioRankingEntry[] = [
  { rank: 1, id: "v1", title: "深淵ノート", image: "/images/landing/game-3.png", meta: "今月", value: "声 89件" },
  { rank: 2, id: "v2", title: "星の記憶", image: "/images/landing/hero-bg.png", meta: "今月", value: "声 72件" },
  { rank: 3, id: "v3", title: "星灯の旅路", image: "/images/landing/game-2.png", meta: "今月", value: "声 54件" },
];

export const studioRankingByGrowth: StudioRankingEntry[] = [
  { rank: 1, id: "g1", title: "霧の駅", image: "/images/landing/game-5.png", meta: "今週", value: "見届け人 +48" },
  { rank: 2, id: "g2", title: "星灯の旅路", image: "/images/landing/game-2.png", meta: "今週", value: "見届け人 +22" },
  { rank: 3, id: "g3", title: "紙の迷宮", image: "/images/landing/game-1.png", meta: "今週", value: "見届け人 +18" },
];

export const studioRankingByReleased: StudioRankingEntry[] = [
  { rank: 1, id: "rel1", title: "空の彼方へ", image: "/images/landing/game-4.png", meta: "by ハルカ", value: "今週正式版" },
  { rank: 2, id: "rel2", title: "静かな灯台", image: "/images/landing/game-5.png", meta: "by ミナト", value: "今週正式版" },
  { rank: 3, id: "rel3", title: "夏の向こう側", image: "/images/landing/game-2.png", meta: "by ソラ", value: "先週正式版" },
];

export const studioRankingSnippets = {
  featured: studioRankingByWitness.slice(0, 3),
  growth: studioRankingByGrowth.slice(0, 3),
  witnessGain: [
    { rank: 1, id: "wg1", title: "深淵ノート", image: "/images/landing/game-3.png", meta: "今週", value: "+48" },
    { rank: 2, id: "wg2", title: "星灯の旅路", image: "/images/landing/hero-bg.png", meta: "今週", value: "+22" },
    { rank: 3, id: "wg3", title: "炉心の残光", image: "/images/landing/game-1.png", meta: "今週", value: "+15" },
  ] as StudioRankingEntry[],
};

export function getStudioRankingList(tab: StudioRankingTabId): StudioRankingEntry[] {
  switch (tab) {
    case "witness":
      return studioRankingByWitness;
    case "voices":
      return studioRankingByVoices;
    case "growth":
      return studioRankingByGrowth;
    case "released":
      return studioRankingByReleased;
  }
}
