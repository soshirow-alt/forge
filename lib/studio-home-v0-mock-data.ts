export type {
  StudioProjectCard,
  StudioProjectPhase,
} from "@/lib/studio-projects-v0-mock-data";
export {
  phaseBadgeClass,
  studioProjectHref,
  studioProjectsAll as studioProjects,
} from "@/lib/studio-projects-v0-mock-data";

export type StudioActivityItem = {
  id: string;
  type: "voice" | "witness" | "devlog" | "first-voice" | "play";
  title: string;
  description: string;
  timeLabel: string;
  badge: number;
};

export type StudioWeeklyStat = {
  id: string;
  label: string;
  value: string;
  delta: string;
};

export type ForgeCommunityItem = {
  id: string;
  title: string;
  image: string;
  meta: string;
  subMeta?: string;
};

export type DevHintCard = {
  id: string;
  title: string;
  tips: string[];
};

export const studioActivities: StudioActivityItem[] = [
  {
    id: "act-1",
    type: "voice",
    title: "新しいフィードバックが届きました",
    description: "「星の記憶」に 3件の新しいフィードバックが届いています",
    timeLabel: "2時間前",
    badge: 3,
  },
  {
    id: "act-2",
    type: "witness",
    title: "見届け人が増えました",
    description: "「星灯の旅路」の見届け人が 5人増えました",
    timeLabel: "5時間前",
    badge: 5,
  },
  {
    id: "act-3",
    type: "play",
    title: "最新verがプレイされました",
    description: "「星灯の旅路」v0.4.0 が 12回プレイされました",
    timeLabel: "昨日",
    badge: 12,
  },
  {
    id: "act-4",
    type: "devlog",
    title: "Devlog に反応がありました",
    description: "「炉心の残光」の更新報告に 12件の反応",
    timeLabel: "昨日",
    badge: 12,
  },
  {
    id: "act-5",
    type: "first-voice",
    title: "初回フィードバックが届きました",
    description: "「星の記憶」に初回フィードバックが 1件届きました",
    timeLabel: "2日前",
    badge: 1,
  },
];

export const studioWeeklyStats: StudioWeeklyStat[] = [
  { id: "new-voices", label: "新しいフィードバック", value: "7", delta: "先週比 +3" },
  { id: "witness-growth", label: "見届け人増", value: "18", delta: "先週比 +6" },
  { id: "devlog-reactions", label: "Devlog反応", value: "24", delta: "先週比 +8" },
  { id: "play-count", label: "プレイ数", value: "156", delta: "先週比 +22" },
  { id: "first-voices", label: "初回FB数", value: "9", delta: "先週比 +2" },
];

export const nurtureCycleProgress = 72;

export const releasedThisWeek: ForgeCommunityItem[] = [
  {
    id: "rel-1",
    title: "空の彼方へ",
    image: "/images/landing/game-4.png",
    meta: "by ハルカ",
    subMeta: "昨日",
  },
  {
    id: "rel-2",
    title: "静かな灯台",
    image: "/images/landing/game-5.png",
    meta: "by ミナト",
    subMeta: "3日前",
  },
  {
    id: "rel-3",
    title: "記憶の庭",
    image: "/images/landing/game-1.png",
    meta: "by ユキ",
    subMeta: "5日前",
  },
];

export const trendingWorks: ForgeCommunityItem[] = [
  {
    id: "tr-1",
    title: "深淵ノート",
    image: "/images/landing/game-3.png",
    meta: "見届け人 +48",
  },
  {
    id: "tr-2",
    title: "夏の向こう側",
    image: "/images/landing/game-2.png",
    meta: "見届け人 +31",
  },
  {
    id: "tr-3",
    title: "星灯の旅路",
    image: "/images/landing/hero-bg.png",
    meta: "見届け人 +22",
  },
];

export const newlyPostedWorks: ForgeCommunityItem[] = [
  {
    id: "new-1",
    title: "霧の駅",
    image: "/images/landing/game-4.png",
    meta: "by ソラ",
    subMeta: "2時間前",
  },
  {
    id: "new-2",
    title: "紙の迷宮",
    image: "/images/landing/game-5.png",
    meta: "by アオイ",
    subMeta: "6時間前",
  },
  {
    id: "new-3",
    title: "夜明けの手紙",
    image: "/images/landing/game-1.png",
    meta: "by レン",
    subMeta: "1日前",
  },
];

export const devHintCards: DevHintCard[] = [
  {
    id: "hint-1",
    title: "見届け人が増えやすい作品の共通点",
    tips: [
      "サムネとタイトルで世界観が一瞬で伝わる",
      "verごとに「いま聞きたいこと」がはっきり書いてある",
      "Devlog で更新の理由を丁寧に伝えている",
    ],
  },
  {
    id: "hint-2",
    title: "初回フィードバックが集まりやすい Devlog の書き方",
    tips: [
      "今回のverで試したいことを端的に示す",
      "プレイヤーへの問いをverの意図とセットで書く",
      "どういう意図の変更か明確にする",
    ],
  },
];
