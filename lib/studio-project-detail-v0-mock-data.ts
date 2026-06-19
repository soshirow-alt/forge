import type { StudioProjectCard } from "@/lib/studio-home-v0-mock-data";
import { studioProjects } from "@/lib/studio-home-v0-mock-data";

export type StudioProjectDetail = StudioProjectCard & {
  description: string;
  voiceCount: number;
  genresList: string[];
  externalUrl?: string;
  publishState: "公開中" | "非公開" | "下書き";
};

export type StudioFirstVoice = {
  id: string;
  playerName: string;
  date: string;
  answer: string;
  status: "unread" | "read" | "candidate";
};

export type StudioDeepFeedback = {
  id: string;
  playerName: string;
  date: string;
  good?: string;
  concern?: string;
  bug?: string;
  freeform?: string;
  status: "unread" | "read" | "candidate";
};

export type StudioAggregatedSection = {
  id: string;
  title: string;
  count: number;
  percent: number;
  summary: string;
  interpretation: string;
};

export type StudioDevlogItem = {
  id: string;
  title: string;
  date: string;
  excerpt: string;
  status: "公開" | "下書き";
};

export type StudioVersionItem = {
  id: string;
  version: string;
  publishedAt: string;
  status: "公開中" | "アーカイブ";
  isCurrent?: boolean;
};

export type StudioReleaseState = {
  phase: "開発中" | "正式版";
  releasedAt?: string;
  history: { id: string; label: string; date: string }[];
};

const details: Record<string, StudioProjectDetail> = {
  "hoshino-kioku": {
    ...studioProjects[0],
    voiceCount: 42,
    description: "星の記憶を辿る短編アドベンチャー。夜の森で失われた物語に触れる。",
    genresList: ["RPG", "ファンタジー"],
    externalUrl: "https://example.com/hoshino",
    publishState: "公開中",
  },
  "seito-no-tabiji": {
    ...studioProjects[1],
    voiceCount: 24,
    description: "夜の森を旅する短編アドベンチャー。ランタンの光を頼りに記憶を辿る。",
    genresList: ["アドベンチャー", "ナラティブ"],
    publishState: "公開中",
  },
  "roshin-no-zanko": {
    ...studioProjects[2],
    voiceCount: 18,
    description: "廃坑都市を舞台に、灯りと記憶をめぐるナラティブ RPG。",
    genresList: ["RPG", "探索"],
    publishState: "公開中",
  },
};

export function getStudioProjectDetail(id: string): StudioProjectDetail | null {
  return details[id] ?? details["hoshino-kioku"];
}

export const studioFirstVoices: StudioFirstVoice[] = [
  { id: "fv1", playerName: "ゆき", date: "2025/06/14", answer: "序盤の雰囲気がとても好きでした。", status: "unread" },
  { id: "fv2", playerName: "ハル", date: "2025/06/13", answer: "もう少しチュートリアルがあると嬉しい。", status: "candidate" },
  { id: "fv3", playerName: "レン", date: "2025/06/12", answer: "音楽が世界観に合っていて没入できた。", status: "read" },
];

export const studioDeepFeedbacks: StudioDeepFeedback[] = [
  {
    id: "df1",
    playerName: "アオイ",
    date: "2025/06/10",
    good: "探索のテンポが良い",
    concern: "マップが少し分かりにくい",
    freeform: "次の版でもう少し灯りの演出が欲しい",
    status: "unread",
  },
  {
    id: "df2",
    playerName: "ミナト",
    date: "2025/06/08",
    good: "ストーリーの引きが強い",
    bug: "特定の分岐で進行不能になった",
    status: "candidate",
  },
];

export const studioAggregatedSections: StudioAggregatedSection[] = [
  {
    id: "good",
    title: "良かった点",
    count: 28,
    percent: 62,
    summary: "世界観と音楽への評価が多い",
    interpretation: "雰囲気づくりは概ね成功。序盤の没入感を維持する方向が有効。",
  },
  {
    id: "improve",
    title: "改善要望",
    count: 12,
    percent: 27,
    summary: "チュートリアルとマップの分かりやすさ",
    interpretation: "約3割が導線の不明瞭さを感じている。次版で目印追加を検討。",
  },
  {
    id: "negative",
    title: "不満点",
    count: 3,
    percent: 7,
    summary: "テンポが遅いという声が少数",
    interpretation: "全体の少数意見。優先度は中程度。",
  },
  {
    id: "bug",
    title: "バグ傾向",
    count: 2,
    percent: 4,
    summary: "分岐進行の不具合報告",
    interpretation: "再現性を確認し、次のパッチ候補に。",
  },
];

export const studioDevlogItems: StudioDevlogItem[] = [
  {
    id: "sd1",
    title: "序盤チュートリアルを短縮",
    date: "2025/06/12",
    excerpt: "プレイヤーの声を反映し、最初の15分の導線を整理しました。",
    status: "公開",
  },
  {
    id: "sd2",
    title: "森マップに目印を追加（下書き）",
    date: "2025/06/15",
    excerpt: "道に迷いやすいという声への対応案をまとめています。",
    status: "下書き",
  },
];

export const studioVersionItems: StudioVersionItem[] = [
  { id: "ver1", version: "v0.3.1", publishedAt: "2025/06/01", status: "公開中", isCurrent: true },
  { id: "ver2", version: "v0.3.0", publishedAt: "2025/05/10", status: "アーカイブ" },
  { id: "ver3", version: "v0.2.0", publishedAt: "2025/04/02", status: "アーカイブ" },
];

export const studioVersionQuestions = [
  "もう一度遊びたい？",
  "難しかった？",
  "面白かった？",
  "世界観は伝わった？",
];

export const studioReleaseState: StudioReleaseState = {
  phase: "開発中",
  history: [
    { id: "rh1", label: "v0.3.1 公開", date: "2025/06/01" },
    { id: "rh2", label: "v0.3.0 公開", date: "2025/05/10" },
  ],
};

export const studioProjectTabs = [
  { id: "overview", label: "概要" },
  { id: "voices-raw", label: "声を見る" },
  { id: "voices-agg", label: "みんなの声" },
  { id: "devlog", label: "Devlog" },
  { id: "versions", label: "バージョン" },
  { id: "release", label: "正式版" },
] as const;

export type StudioProjectTabId = (typeof studioProjectTabs)[number]["id"];

export function parseStudioProjectTab(param: string | null): StudioProjectTabId {
  const ids = studioProjectTabs.map((t) => t.id);
  if (param && ids.includes(param as StudioProjectTabId)) {
    return param as StudioProjectTabId;
  }
  return "overview";
}
