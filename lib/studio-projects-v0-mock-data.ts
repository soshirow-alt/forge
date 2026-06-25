import { projectStudioPath } from "@/lib/project-nurture-links";

export type StudioProjectPhase =
  | "試作ver"
  | "プレイ可能ver"
  | "通しプレイver"
  | "公開準備中"
  | "下書き"
  | "アーカイブ"
  | "正式ver";

export type StudioProjectCard = {
  id: string;
  title: string;
  genres: string;
  phase: StudioProjectPhase;
  image: string;
  witnessCount: number | null;
  voiceCount: number | null;
  firstVoiceCount: number;
  updatedLabel: string;
  version: string | null;
  /** 未読の声・コメントなど（PJ一覧で強調） */
  notificationCount?: number;
};

export const studioPhaseFilterOptions = [
  { id: "all", label: "すべて" },
  { id: "published", label: "公開中" },
  { id: "draft", label: "下書き" },
  { id: "official", label: "正式版" },
] as const;

export type StudioPhaseFilterId = (typeof studioPhaseFilterOptions)[number]["id"];

/** 一覧ピル用 — カードバッジの細かいフェーズはそのまま、絞り込みだけ集約 */
export function matchesStudioPhaseFilter(
  phase: StudioProjectPhase,
  filterId: string,
): boolean {
  if (filterId === "all") {
    return true;
  }
  if (filterId === "draft") {
    return phase === "下書き";
  }
  if (filterId === "official") {
    return phase === "正式ver" || phase === "アーカイブ";
  }
  if (filterId === "published") {
    return phase !== "下書き" && phase !== "正式ver" && phase !== "アーカイブ";
  }
  return true;
}

export const studioSortOptions = [
  { id: "updated-desc", label: "更新日が新しい順" },
  { id: "updated-asc", label: "更新日が古い順" },
  { id: "title-asc", label: "タイトル順" },
] as const;

export type StudioSortId = (typeof studioSortOptions)[number]["id"];

export const studioProjectsAll: StudioProjectCard[] = [
  {
    id: "hoshino-kioku",
    title: "星の記憶",
    genres: "RPG・ファンタジー",
    phase: "通しプレイver",
    image: "/images/landing/hero-bg.png",
    witnessCount: 128,
    voiceCount: 42,
    firstVoiceCount: 42,
    updatedLabel: "2日前",
    version: "v0.3.1",
    notificationCount: 3,
  },
  {
    id: "kioku-no-kakera",
    title: "記憶の欠片たち",
    genres: "アドベンチャー・ミステリー",
    phase: "プレイ可能ver",
    image: "/images/landing/game-2.png",
    witnessCount: 87,
    voiceCount: 31,
    firstVoiceCount: 28,
    updatedLabel: "5日前",
    version: "v0.2.0",
    notificationCount: 1,
  },
  {
    id: "hikari-no-tabibito",
    title: "光の旅人",
    genres: "パズル・アクション",
    phase: "プレイ可能ver",
    image: "/images/landing/game-3.png",
    witnessCount: 56,
    voiceCount: 18,
    firstVoiceCount: 15,
    updatedLabel: "1週間前",
    version: "v0.1.5",
  },
  {
    id: "sorashima-pioneer",
    title: "空島パイオニア",
    genres: "シミュレーション・サンドボックス",
    phase: "試作ver",
    image: "/images/landing/game-4.png",
    witnessCount: 34,
    voiceCount: 12,
    firstVoiceCount: 10,
    updatedLabel: "1週間前",
    version: "v0.0.8",
  },
  {
    id: "roshin-no-zanko",
    title: "炉心の残光",
    genres: "ダークファンタジー・アクション",
    phase: "試作ver",
    image: "/images/landing/game-5.png",
    witnessCount: 23,
    voiceCount: 7,
    firstVoiceCount: 6,
    updatedLabel: "2週間前",
    version: "v0.1.2",
  },
  {
    id: "chiisana-yuusha",
    title: "小さな勇者の冒険",
    genres: "RPG・コメディ",
    phase: "下書き",
    image: "/images/landing/game-1.png",
    witnessCount: null,
    voiceCount: null,
    firstVoiceCount: 0,
    updatedLabel: "2週間前",
    version: null,
  },
  {
    id: "wasurerareta-mori",
    title: "忘れられた森",
    genres: "アドベンチャー・パズル",
    phase: "アーカイブ",
    image: "/images/landing/game-2.png",
    witnessCount: 12,
    voiceCount: 4,
    firstVoiceCount: 4,
    updatedLabel: "1ヶ月前",
    version: "v0.0.6",
  },
  {
    id: "seito-no-tabiji",
    title: "星灯の旅路",
    genres: "アドベンチャー・ナラティブ",
    phase: "公開準備中",
    image: "/images/landing/game-3.png",
    witnessCount: 86,
    voiceCount: 24,
    firstVoiceCount: 24,
    updatedLabel: "昨日",
    version: "v0.4.0",
  },
  {
    id: "shinkai-no-uta",
    title: "深海の詩",
    genres: "ナラティブ・探索",
    phase: "プレイ可能ver",
    image: "/images/landing/hero-bg.png",
    witnessCount: 45,
    voiceCount: 14,
    firstVoiceCount: 11,
    updatedLabel: "3週間前",
    version: "v0.2.3",
  },
  {
    id: "natsu-no-mukougawa",
    title: "夏の向こう側",
    genres: "ビジュアルノベル",
    phase: "正式ver",
    image: "/images/landing/game-4.png",
    witnessCount: 176,
    voiceCount: 62,
    firstVoiceCount: 48,
    updatedLabel: "1ヶ月前",
    version: "v1.0.0",
  },
  {
    id: "kaze-no-eki",
    title: "風の駅",
    genres: "アドベンチャー",
    phase: "試作ver",
    image: "/images/landing/game-5.png",
    witnessCount: 19,
    voiceCount: 5,
    firstVoiceCount: 4,
    updatedLabel: "3週間前",
    version: "v0.0.4",
  },
  {
    id: "yoru-no-tegami",
    title: "夜明けの手紙",
    genres: "ミステリー・短編",
    phase: "試作ver",
    image: "/images/landing/game-1.png",
    witnessCount: 8,
    voiceCount: 2,
    firstVoiceCount: 2,
    updatedLabel: "1ヶ月前",
    version: "v0.0.2",
  },
];

export const STUDIO_PROJECTS_PAGE_SIZE = 8;

export function studioProjectHref(id: string): string {
  if (isStudioMockProjectId(id)) {
    return `/studio/projects/${id}`;
  }
  return projectStudioPath(id);
}

export function isStudioMockProjectId(id: string): boolean {
  return studioProjectsAll.some((project) => project.id === id);
}

export function phaseBadgeClass(phase: StudioProjectPhase): string {
  switch (phase) {
    case "試作ver":
      return "bg-sky-600/90 text-white";
    case "プレイ可能ver":
      return "bg-emerald-600/90 text-white";
    case "通しプレイver":
      return "bg-violet-600/90 text-white";
    case "公開準備中":
      return "bg-orange-500/90 text-white";
    case "下書き":
      return "bg-zinc-600/90 text-zinc-100";
    case "アーカイブ":
      return "bg-zinc-700/90 text-zinc-300";
    case "正式ver":
      return "bg-amber-500/90 text-white";
  }
}

export function formatStat(value: number | null): string {
  return value === null ? "—" : String(value);
}
