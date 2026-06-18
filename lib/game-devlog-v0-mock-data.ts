export type DevlogEntryKind = "version" | "note";

export type GameDevlogEntry = {
  id: string;
  version: string;
  publishedAt: string;
  relativeLabel: string;
  title: string;
  excerpt: string;
  highlights: string[];
  kind: DevlogEntryKind;
  isLatest?: boolean;
};

export const devlogStats = {
  totalPosts: 8,
  currentVersion: "v0.4.0",
  lastUpdated: "2025/05/18",
  witnessingCount: 1248,
};

export const devlogFilterTabs = [
  { id: "all", label: "すべて", count: 8 },
  { id: "version", label: "版の更新", count: 5 },
  { id: "note", label: "開発メモ", count: 3 },
] as const;

export type DevlogFilterId = (typeof devlogFilterTabs)[number]["id"];

const seikatDevlogs: GameDevlogEntry[] = [
  {
    id: "d1",
    version: "v0.4.0",
    publishedAt: "2025/05/18",
    relativeLabel: "3日前",
    title: "チュートリアル短縮と序盤イベント調整",
    excerpt:
      "プレイヤーの声を反映し、チュートリアルを約30%短くしました。最初のランタン取得までの導線も見直しています。",
    highlights: [
      "チュートリアルテキストを整理",
      "序盤の森マップに目印を追加",
      "v0.4.0 としてプレイ可能",
    ],
    kind: "version",
    isLatest: true,
  },
  {
    id: "d2",
    version: "v0.3.2",
    publishedAt: "2025/05/10",
    relativeLabel: "1週間前",
    title: "遭遇イベントのテンポ改善",
    excerpt:
      "戦闘前後のフェードと待ち時間を調整。探索のリズムが途切れにくくなりました。",
    highlights: ["イベント間の待機を短縮", "BGM 切り替えをスムーズに"],
    kind: "version",
  },
  {
    id: "d3",
    version: "v0.3.0",
    publishedAt: "2025/04/28",
    relativeLabel: "3週間前",
    title: "第2章マップと新NPCを追加",
    excerpt: "星の記憶を辿る中編パートを実装。新たな選択肢が物語に影響します。",
    highlights: ["中編エリア「記憶の回廊」", "NPC「灯守」登場", "セーブポイント追加"],
    kind: "version",
  },
  {
    id: "d4",
    version: "v0.2.1",
    publishedAt: "2025/04/12",
    relativeLabel: "1ヶ月前",
    title: "UI とインベントリ操作の改善",
    excerpt: "ランタン燃料の表示を分かりやすくし、キーボード操作のヒントを追加しました。",
    highlights: ["燃料ゲージの視認性向上", "ショートカット一覧を追加"],
    kind: "version",
  },
  {
    id: "d5",
    version: "v0.2.0",
    publishedAt: "2025/03/25",
    relativeLabel: "約2ヶ月前",
    title: "プロトタイプ公開 — 第1章のみ",
    excerpt: "夜の森を旅する第1章を公開。フィードバックをお待ちしています。",
    highlights: ["第1章「失われた灯」", "初回プレイ約20分", "フィードバック受付開始"],
    kind: "version",
  },
  {
    id: "d6",
    version: "—",
    publishedAt: "2025/05/15",
    relativeLabel: "5日前",
    title: "開発メモ：最終章の方向性",
    excerpt:
      "エンディング分岐は2路線で進める予定です。どちらも「旅の余韻」を大切にしたいと考えています。",
    highlights: [],
    kind: "note",
  },
  {
    id: "d7",
    version: "—",
    publishedAt: "2025/04/20",
    relativeLabel: "4週間前",
    title: "開発メモ：サウンド周り",
    excerpt: "環境音とBGMのレイヤー構成を試行中。夜の森らしい静けさを優先しています。",
    highlights: [],
    kind: "note",
  },
  {
    id: "d8",
    version: "—",
    publishedAt: "2025/03/10",
    relativeLabel: "約2ヶ月前",
    title: "開発メモ：プロジェクト開始",
    excerpt: "短編アドベンチャーとして企画。ランタンと記憶をテーマに制作を開始しました。",
    highlights: [],
    kind: "note",
  },
];

const genericDevlogs: GameDevlogEntry[] = [
  {
    id: "g1",
    version: "v0.3.2",
    publishedAt: "2025/05/12",
    relativeLabel: "1週間前",
    title: "バグ修正とバランス調整",
    excerpt: "コミュニティからの報告を反映した小規模アップデートです。",
    highlights: ["既知バグ2件を修正"],
    kind: "version",
    isLatest: true,
  },
  {
    id: "g2",
    version: "v0.3.0",
    publishedAt: "2025/04/30",
    relativeLabel: "3週間前",
    title: "新コンテンツ追加",
    excerpt: "探索エリアを拡張しました。",
    highlights: ["新マップ1面"],
    kind: "version",
  },
];

export function getDevlogsForGame(gameId: string): GameDevlogEntry[] {
  if (gameId === "seikat-no-tabiji" || gameId.startsWith("hero-") || gameId === "w1") {
    return seikatDevlogs;
  }
  return genericDevlogs;
}

export function filterDevlogs(
  entries: GameDevlogEntry[],
  filter: DevlogFilterId,
): GameDevlogEntry[] {
  if (filter === "all") return entries;
  if (filter === "version") return entries.filter((e) => e.kind === "version");
  return entries.filter((e) => e.kind === "note");
}
