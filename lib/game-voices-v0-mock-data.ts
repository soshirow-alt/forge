export type VoiceEntryKind = "free" | "choice";

export type CommunityVoiceEntry = {
  id: string;
  kind: VoiceEntryKind;
  kindLabel: string;
  version: string;
  postedAt: string;
  avatar: string;
  body: string;
  tags: string[];
  empathyCount: number;
  empathized: boolean;
};

export type VoiceStatsCard = {
  id: string;
  label: string;
  value: string;
  delta: string;
  hint?: string;
};

export type AiSummaryBullet = {
  id: string;
  tone: "positive" | "improve" | "neutral";
  text: string;
};

export type QuestionAggregate = {
  id: string;
  question: string;
  segments: {
    label: string;
    percent: number;
    colorClass: string;
  }[];
};

export type FreeTextTheme = {
  id: string;
  theme: string;
  count: number;
  excerpt: string;
};

export const voiceStatsCards: VoiceStatsCard[] = [
  { id: "total", label: "届いたフィードバック", value: "41", delta: "前月比 +24%" },
  { id: "empathy", label: "共感された回数", value: "132", delta: "前月比 +18%" },
  { id: "answers", label: "質問への回答", value: "18", delta: "開発者の質問に回答" },
  { id: "free", label: "自由記述", value: "23", delta: "改善のヒントが集まっています" },
];

export const voiceSubTabs = [
  { id: "received", label: "届いたフィードバック" },
  { id: "by-question", label: "質問別の集計" },
  { id: "free-text", label: "自由記述の集約" },
] as const;

export const voiceVersionFilters = [
  { id: "all", label: "すべての版" },
  { id: "v0.3.2", label: "v0.3.2（現行）" },
  { id: "v0.3.0", label: "v0.3.0" },
  { id: "v0.2.4", label: "v0.2.4" },
] as const;

export type VoiceVersionFilterId = (typeof voiceVersionFilters)[number]["id"];

export type VoiceSubTabId = (typeof voiceSubTabs)[number]["id"];

export const voiceFilters = [
  { id: "all", label: "すべて", count: 41 },
  { id: "free", label: "自由記述", count: 23 },
  { id: "choice", label: "質問への回答", count: 18 },
] as const;

const avatars = [
  "/images/landing/game-1.png",
  "/images/landing/game-2.png",
  "/images/landing/game-3.png",
  "/images/landing/game-4.png",
  "/images/landing/game-5.png",
];

export const communityVoices: CommunityVoiceEntry[] = [
  {
    id: "v1",
    kind: "free",
    kindLabel: "自由記述",
    version: "v0.3.2",
    postedAt: "2025/05/18 10:12",
    avatar: avatars[1],
    body: "夜の森の雰囲気がとても好きです。BGM とランタンの光の演出が世界観に入り込めました。序盤のチュートリアルはもう少し短くても良いかも。",
    tags: ["世界観・ビジュアル", "ストーリー"],
    empathyCount: 24,
    empathized: false,
  },
  {
    id: "v2",
    kind: "choice",
    kindLabel: "質問への回答",
    version: "v0.3.2",
    postedAt: "2025/05/17 21:34",
    avatar: avatars[2],
    body: "チュートリアルの長さ：やや長い。操作説明は分かりやすいですが、最初の「旅の実感」が出るまで少し時間がかかりました。",
    tags: ["チュートリアル"],
    empathyCount: 12,
    empathized: true,
  },
  {
    id: "v3",
    kind: "free",
    kindLabel: "自由記述",
    version: "v0.3.2",
    postedAt: "2025/05/17 18:02",
    avatar: avatars[3],
    body: "戦闘（遭遇イベント）のテンポがちょうどよく、緊張感と探索のバランスが良い。ボス前の演出も好印象でした。",
    tags: ["戦闘・バランス"],
    empathyCount: 31,
    empathized: false,
  },
  {
    id: "v4",
    kind: "choice",
    kindLabel: "質問への回答",
    version: "v0.3.2",
    postedAt: "2025/05/17 14:20",
    avatar: avatars[4],
    body: "バトル難易度：ちょうどよい。失敗してもやり直しやすく、ストーリーの没入を妨げませんでした。",
    tags: ["戦闘・バランス", "ストーリー"],
    empathyCount: 18,
    empathized: false,
  },
  {
    id: "v5",
    kind: "free",
    kindLabel: "自由記述",
    version: "v0.3.0",
    postedAt: "2025/05/16 22:11",
    avatar: avatars[0],
    body: "キャラクターとの会話シーンが印象的。選択肢の結果が後の展開に繋がっている感じがして、もう一度プレイしたくなりました。",
    tags: ["ストーリー"],
    empathyCount: 42,
    empathized: true,
  },
  {
    id: "v6",
    kind: "free",
    kindLabel: "自由記述",
    version: "v0.3.0",
    postedAt: "2025/05/16 09:45",
    avatar: avatars[2],
    body: "ピクセルアートとライティングの組み合わせが美しい。スクリーンショットを撮りたくなる場面が多かったです。",
    tags: ["世界観・ビジュアル"],
    empathyCount: 27,
    empathized: false,
  },
  {
    id: "v7",
    kind: "choice",
    kindLabel: "質問への回答",
    version: "v0.3.2",
    postedAt: "2025/05/15 19:30",
    avatar: avatars[1],
    body: "ストーリーへの没入感：とても高い。途中で一度止めても、また続きが気になって戻ってきました。",
    tags: ["ストーリー"],
    empathyCount: 15,
    empathized: false,
  },
  {
    id: "v8",
    kind: "free",
    kindLabel: "自由記述",
    version: "v0.2.4",
    postedAt: "2025/05/15 11:08",
    avatar: avatars[4],
    body: "マップの迷いやすさは探索ゲーとしてはちょうどよい。ただ、最初の30分だけは目印をもう一つあると助かるかも。",
    tags: ["探索", "チュートリアル"],
    empathyCount: 9,
    empathized: false,
  },
  {
    id: "v9",
    kind: "choice",
    kindLabel: "質問への回答",
    version: "v0.3.2",
    postedAt: "2025/05/14 20:55",
    avatar: avatars[3],
    body: "チュートリアルの長さ：ちょうどよい。説明を飛ばせるオプションがあると、2周目以降はさらに快適そう。",
    tags: ["チュートリアル"],
    empathyCount: 11,
    empathized: false,
  },
  {
    id: "v10",
    kind: "free",
    kindLabel: "自由記述",
    version: "v0.2.4",
    postedAt: "2025/05/14 08:22",
    avatar: avatars[0],
    body: "短編ながら余韻が残る良い作品。開発中とのことなので、最終章の展開が楽しみです。",
    tags: ["ストーリー"],
    empathyCount: 33,
    empathized: true,
  },
  {
    id: "v11",
    kind: "free",
    kindLabel: "自由記述",
    version: "v0.2.4",
    postedAt: "2025/05/13 16:40",
    avatar: avatars[1],
    body: "UI のフォントとアイコンが統一されていて見やすい。インベントリ操作だけ、もう少しショートカットがあると嬉しい。",
    tags: ["UI/UX"],
    empathyCount: 7,
    empathized: false,
  },
  {
    id: "v12",
    kind: "choice",
    kindLabel: "質問への回答",
    version: "v0.2.4",
    postedAt: "2025/05/12 23:18",
    avatar: avatars[2],
    body: "バトルテンポ：やや速い。アクション好きには合うが、じっくり派は調整オプションがあるとうれしい。",
    tags: ["戦闘・バランス"],
    empathyCount: 14,
    empathized: false,
  },
];

export const freeTextThemes: FreeTextTheme[] = [
  {
    id: "ft1",
    theme: "チュートリアル・序盤の tempo",
    count: 8,
    excerpt: "「もう少し短く」「最初の旅の実感が出るまで長い」など、序盤導線への言及が多い。",
  },
  {
    id: "ft2",
    theme: "世界観・ビジュアル・BGM",
    count: 11,
    excerpt: "夜の森、ランタン、ピクセルアートへの高評価。スクリーンショットを撮りたくなる場面。",
  },
  {
    id: "ft3",
    theme: "戦闘・遭遇イベントのテンポ",
    count: 6,
    excerpt: "「ちょうどよい」が中心。一部「やや速い/遅い」意見と難易度調整オプション希望。",
  },
  {
    id: "ft4",
    theme: "ストーリー・キャラクター・選択肢",
    count: 9,
    excerpt: "没入感・余韻・再プレイ意欲。会話シーンと分岐の手応えへの好意的なフィードバック。",
  },
  {
    id: "ft5",
    theme: "探索・マップ・UI",
    count: 5,
    excerpt: "探索の迷いやすさは好評。目印・ショートカット・インベントリ操作の改善提案。",
  },
];

export const aiSummaryBullets: AiSummaryBullet[] = [
  {
    id: "s1",
    tone: "positive",
    text: "世界観・ビジュアルへの高評価が多い",
  },
  {
    id: "s2",
    tone: "improve",
    text: "チュートリアル長さの改善要望が目立つ",
  },
  {
    id: "s3",
    tone: "positive",
    text: "戦闘テンポ・爽快感への好意的なフィードバック",
  },
  {
    id: "s4",
    tone: "neutral",
    text: "難易度は「ちょうどよい」が中心",
  },
];

export const questionAggregates: QuestionAggregate[] = [
  {
    id: "q1",
    question: "チュートリアルの長さ",
    segments: [
      { label: "長すぎ", percent: 12, colorClass: "bg-rose-500" },
      { label: "やや長い", percent: 29, colorClass: "bg-orange-400" },
      { label: "ちょうど", percent: 41, colorClass: "bg-emerald-500" },
      { label: "やや短い", percent: 12, colorClass: "bg-sky-500" },
      { label: "短すぎ", percent: 6, colorClass: "bg-violet-500" },
    ],
  },
  {
    id: "q2",
    question: "バトル（遭遇）のテンポ",
    segments: [
      { label: "遅い", percent: 8, colorClass: "bg-rose-500" },
      { label: "やや遅い", percent: 14, colorClass: "bg-orange-400" },
      { label: "ちょうど", percent: 52, colorClass: "bg-emerald-500" },
      { label: "やや速い", percent: 18, colorClass: "bg-sky-500" },
      { label: "速い", percent: 8, colorClass: "bg-violet-500" },
    ],
  },
  {
    id: "q3",
    question: "ストーリーへの没入感",
    segments: [
      { label: "低い", percent: 3, colorClass: "bg-rose-500" },
      { label: "やや低い", percent: 7, colorClass: "bg-orange-400" },
      { label: "ちょうど", percent: 38, colorClass: "bg-emerald-500" },
      { label: "高い", percent: 35, colorClass: "bg-sky-500" },
      { label: "とても高い", percent: 17, colorClass: "bg-violet-500" },
    ],
  },
];

export const VOICES_LIST_TOTAL = 41;
export const VOICES_PREVIEW_SHOWN = communityVoices.length;

const sessionKey = (gameId: string) => `forge-v0-voices-${gameId}`;

export function readSessionVoices(gameId: string): CommunityVoiceEntry[] {
  if (typeof window === "undefined") {
    return [];
  }
  try {
    const raw = sessionStorage.getItem(sessionKey(gameId));
    if (!raw) {
      return [];
    }
    return JSON.parse(raw) as CommunityVoiceEntry[];
  } catch {
    return [];
  }
}

export function appendSessionVoice(gameId: string, entry: CommunityVoiceEntry) {
  if (typeof window === "undefined") {
    return;
  }
  const existing = readSessionVoices(gameId);
  sessionStorage.setItem(sessionKey(gameId), JSON.stringify([entry, ...existing]));
}

export function createPreviewVoiceEntry(body: string): CommunityVoiceEntry {
  return {
    id: `session-${Date.now()}`,
    kind: "free",
    kindLabel: "自由記述",
    version: "v0.3.2",
    postedAt: new Date().toLocaleString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }),
    avatar: avatars[0],
    body,
    tags: ["あなたのフィードバック"],
    empathyCount: 0,
    empathized: false,
  };
}

/** preview 用 — 全ゲーム共通で mock 12件 + セッション追加分 */
export function getCommunityVoicesForGame(gameId: string): CommunityVoiceEntry[] {
  return [...readSessionVoices(gameId), ...communityVoices];
}
