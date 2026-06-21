import { resolveGameDetailId } from "@/lib/game-detail-v0-mock-data";

export type GameVersionEntry = {
  id: string;
  version: string;
  publishedAt: string;
  relativeLabel: string;
  title: string;
  summary: string;
  changes: string[];
  playCount?: number;
  isLatest?: boolean;
};

const seikatVersions: GameVersionEntry[] = [
  {
    id: "v1",
    version: "v0.4.0",
    publishedAt: "2025/05/18",
    relativeLabel: "3日前",
    title: "チュートリアル短縮と序盤イベント調整",
    summary: "プレイヤーのフィードバックを反映し、序盤の導線を見直した版です。",
    changes: [
      "チュートリアルテキストを約30%短縮",
      "序盤の森マップに目印を追加",
      "ランタン取得イベントの演出を調整",
    ],
    playCount: 842,
    isLatest: true,
  },
  {
    id: "v2",
    version: "v0.3.2",
    publishedAt: "2025/05/10",
    relativeLabel: "1週間前",
    title: "遭遇イベントのテンポ改善",
    summary: "探索のリズムが途切れにくくなるよう調整しました。",
    changes: ["イベント間の待機を短縮", "BGM 切り替えをスムーズに", "既知バグ2件を修正"],
    playCount: 612,
  },
  {
    id: "v3",
    version: "v0.3.0",
    publishedAt: "2025/04/28",
    relativeLabel: "3週間前",
    title: "第2章マップと新NPCを追加",
    summary: "中編パート「記憶の回廊」を追加した大型アップデートです。",
    changes: ["中編エリア「記憶の回廊」", "NPC「灯守」登場", "セーブポイント追加"],
    playCount: 489,
  },
  {
    id: "v4",
    version: "v0.2.1",
    publishedAt: "2025/04/12",
    relativeLabel: "1ヶ月前",
    title: "UI とインベントリ操作の改善",
    summary: "ランタン燃料の表示とキーボード操作を改善しました。",
    changes: ["燃料ゲージの視認性向上", "ショートカット一覧を追加"],
    playCount: 356,
  },
  {
    id: "v5",
    version: "v0.2.0",
    publishedAt: "2025/03/25",
    relativeLabel: "約2ヶ月前",
    title: "プロトタイプ公開 — 第1章のみ",
    summary: "夜の森を旅する第1章を初公開した版です。",
    changes: ["第1章「失われた灯」", "初回プレイ約20分", "フィードバック受付開始"],
    playCount: 1204,
  },
];

const roshinVersions: GameVersionEntry[] = [
  {
    id: "rv1",
    version: "v0.3.2",
    publishedAt: "2025/05/14",
    relativeLabel: "5日前",
    title: "廃坑エリアの照明調整",
    summary: "灯りの届く範囲と影の演出を見直しました。",
    changes: ["ライト半径の調整", "環境音の追加"],
    playCount: 218,
    isLatest: true,
  },
  {
    id: "rv2",
    version: "v0.3.0",
    publishedAt: "2025/04/28",
    relativeLabel: "3週間前",
    title: "第1章ボスイベント実装",
    summary: "記憶の守人との遭遇イベントを追加しました。",
    changes: ["新イベント1種", "BGM 差し替え"],
    playCount: 176,
  },
  {
    id: "rv3",
    version: "v0.2.0",
    publishedAt: "2025/04/05",
    relativeLabel: "約1.5ヶ月前",
    title: "プロトタイプ公開",
    summary: "廃坑探索の序章を公開した初版です。",
    changes: ["序章マップ", "ランタン燃料システム"],
    playCount: 302,
  },
];

export function getVersionsForGame(gameId: string): GameVersionEntry[] {
  const resolved = resolveGameDetailId(gameId);
  if (resolved === "roshin-no-zanko") {
    return roshinVersions;
  }
  return seikatVersions;
}

export function getVersionStatsForGame(entries: GameVersionEntry[]) {
  const latest = entries.find((e) => e.isLatest) ?? entries[0];
  const oldest = entries[entries.length - 1];
  return {
    currentVersion: latest?.version ?? "v0.4.0",
    totalVersions: entries.length,
    firstPublished: oldest?.publishedAt ?? "2025/03/25",
  };
}
