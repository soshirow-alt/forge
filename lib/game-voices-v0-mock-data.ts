export type VoiceEntryKind = "free" | "choice";

export type CommunityVoiceEntry = {
  id: string;
  kind: VoiceEntryKind;
  kindLabel: string;
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

export const voiceStatsCards: VoiceStatsCard[] = [
  { id: "total", label: "届いた声", value: "41", delta: "前月比 +24%" },
  { id: "empathy", label: "共感された回数", value: "132", delta: "前月比 +18%" },
  { id: "answers", label: "質問への回答", value: "18", delta: "開発者の質問に回答" },
  { id: "free", label: "自由記述", value: "23", delta: "改善のヒントが集まっています" },
];

export const voiceSubTabs = [
  { id: "received", label: "届いた声" },
  { id: "by-question", label: "質問別の集計" },
  { id: "free-text", label: "自由記述の集約" },
] as const;

export type VoiceSubTabId = (typeof voiceSubTabs)[number]["id"];

export const voiceFilters = [
  { id: "all", label: "すべて", count: 41 },
  { id: "free", label: "自由記述", count: 23 },
  { id: "choice", label: "質問への回答", count: 18 },
] as const;

export const communityVoices: CommunityVoiceEntry[] = [
  {
    id: "v1",
    kind: "free",
    kindLabel: "自由記述",
    postedAt: "2025/05/17 21:34",
    avatar: "/images/landing/game-2.png",
    body: "夜の森の雰囲気がとても好きです。BGM とランタンの光の演出が世界観に入り込めました。序盤のチュートリアルはもう少し短くても良いかも。",
    tags: ["世界観・ビジュアル", "ストーリー"],
    empathyCount: 24,
    empathized: false,
  },
  {
    id: "v2",
    kind: "choice",
    kindLabel: "質問への回答",
    postedAt: "2025/05/17 18:02",
    avatar: "/images/landing/game-3.png",
    body: "チュートリアルの長さ：やや長い。操作説明は分かりやすいですが、最初の「旅の実感」が出るまで少し時間がかかりました。",
    tags: ["チュートリアル"],
    empathyCount: 12,
    empathized: true,
  },
  {
    id: "v3",
    kind: "free",
    kindLabel: "自由記述",
    postedAt: "2025/05/16 14:20",
    avatar: "/images/landing/game-4.png",
    body: "戦闘（遭遇イベント）のテンポがちょうどよく、緊張感と探索のバランスが良い。ボス前の演出も好印象でした。",
    tags: ["戦闘・バランス"],
    empathyCount: 31,
    empathized: false,
  },
  {
    id: "v4",
    kind: "choice",
    kindLabel: "質問への回答",
    postedAt: "2025/05/15 09:48",
    avatar: "/images/landing/game-5.png",
    body: "バトル難易度：ちょうどよい。失敗してもやり直しやすく、ストーリーの没入を妨げませんでした。",
    tags: ["戦闘・バランス", "ストーリー"],
    empathyCount: 18,
    empathized: false,
  },
  {
    id: "v5",
    kind: "free",
    kindLabel: "自由記述",
    postedAt: "2025/05/14 22:11",
    avatar: "/images/landing/game-1.png",
    body: "キャラクターとの会話シーンが印象的。選択肢の結果が後の展開に繋がっている感じがして、もう一度プレイしたくなりました。",
    tags: ["ストーリー"],
    empathyCount: 42,
    empathized: true,
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
    text: "戦闘テンポ・爽快感への好意的な声",
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
];

export const VOICES_LIST_TOTAL = 41;
