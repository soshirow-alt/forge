import { resolveGameDetailId } from "@/lib/game-detail-v0-mock-data";

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
  /** この ver でプレイヤーに聞きたいこと（開発ログ投稿時に設定） */
  developerWorry?: string;
  wantedVoices?: string[];
};

export type DevlogFilterId = "all" | "version" | "note";

const seikatDevlogs: GameDevlogEntry[] = [
  {
    id: "d1",
    version: "v0.4.0",
    publishedAt: "2025/05/18",
    relativeLabel: "3日前",
    title: "チュートリアル短縮と序盤イベント調整",
    excerpt:
      "プレイヤーのフィードバックを反映し、チュートリアルを約30%短くしました。最初のランタン取得までの導線も見直しています。",
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

const roshinDevlogs: GameDevlogEntry[] = [
  {
    id: "r1",
    version: "v0.3.2",
    publishedAt: "2025/05/14",
    relativeLabel: "5日前",
    title: "廃坑エリアの照明調整",
    excerpt: "灯りの届く範囲と影の演出を見直し、探索の緊張感を強めました。",
    highlights: ["ライト半径の調整", "環境音の追加"],
    kind: "version",
    isLatest: true,
  },
  {
    id: "r2",
    version: "v0.3.0",
    publishedAt: "2025/04/28",
    relativeLabel: "3週間前",
    title: "第1章ボスイベント実装",
    excerpt: "記憶の守人との遭遇イベントを追加しました。",
    highlights: ["新イベント1種", "BGM 差し替え"],
    kind: "version",
  },
  {
    id: "r3",
    version: "—",
    publishedAt: "2025/05/01",
    relativeLabel: "2週間前",
    title: "開発メモ：エンディングのトーン",
    excerpt: "静かな余韻を残す結末を目指しています。",
    highlights: [],
    kind: "note",
  },
];

export function getDevlogFilterTabs(entries: GameDevlogEntry[]) {
  const versionCount = entries.filter((e) => e.kind === "version").length;
  const noteCount = entries.filter((e) => e.kind === "note").length;
  return [
    { id: "all" as const, label: "すべて", count: entries.length },
    { id: "version" as const, label: "verの更新", count: versionCount },
    { id: "note" as const, label: "開発メモ", count: noteCount },
  ];
}

export function getDevlogStatsForGame(entries: GameDevlogEntry[]) {
  const latest = entries.find((e) => e.isLatest) ?? entries[0];
  return {
    totalPosts: entries.length,
    currentVersion: latest?.version !== "—" ? latest.version : "v0.4.0",
    lastUpdated: latest?.publishedAt ?? "2025/05/18",
  };
}

export function getDevlogsForGame(gameId: string): GameDevlogEntry[] {
  const resolved = resolveGameDetailId(gameId);
  if (resolved === "roshin-no-zanko") {
    return roshinDevlogs;
  }
  // preview — 星灯の旅路を正本に、他作品 URL でも必ず表示
  return seikatDevlogs;
}

export function filterDevlogs(
  entries: GameDevlogEntry[],
  filter: DevlogFilterId,
): GameDevlogEntry[] {
  if (filter === "all") return entries;
  if (filter === "version") return entries.filter((e) => e.kind === "version");
  return entries.filter((e) => e.kind === "note");
}
