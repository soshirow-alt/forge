import type { DevlogEntry } from "@/lib/devlogs";
import { sortDevlogsNewestFirst } from "@/lib/devlogs";
import type { Game } from "@/lib/mock-games";

export type CommunityImpactItem = {
  id: string;
  label: string;
  date?: string;
};

export type ProjectHistoryEntry = {
  id: string;
  date: string;
  title: string;
  content?: string;
  kind: "development" | "community";
};

type GameActivitySeed = Pick<Game, "id" | "lastUpdated" | "createdAt">;

const PLACEHOLDER_DEVLOGS: Record<string, DevlogEntry[]> = {
  emberfall: [
    {
      id: "placeholder-emberfall-1",
      projectId: "emberfall",
      title: "戦闘バランスを調整",
      content: "ボス戦と通常敵のダメージ倍率を見直しました。",
      date: "2026-06-10",
    },
    {
      id: "placeholder-emberfall-2",
      projectId: "emberfall",
      title: "新エリア「灰の回廊」を追加",
      content: "城下の新探索ゾーンとサブクエストを実装。",
      date: "2026-06-02",
    },
    {
      id: "placeholder-emberfall-3",
      projectId: "emberfall",
      title: "初公開",
      content: "試作版デモをForgeで公開しました。",
      date: "2026-05-28",
    },
  ],
  "neon-drift": [
    {
      id: "placeholder-neon-drift-1",
      projectId: "neon-drift",
      title: "ドリフト判定を改善",
      content: "カーブ進入時のスコア加算を調整。",
      date: "2026-06-01",
    },
    {
      id: "placeholder-neon-drift-2",
      projectId: "neon-drift",
      title: "初公開",
      content: "プロトタイプ版を公開。",
      date: "2026-05-20",
    },
  ],
  "hollow-signal": [
    {
      id: "placeholder-hollow-signal-1",
      projectId: "hollow-signal",
      title: "音声演出を追加",
      content: "放送局シーンの環境音を強化。",
      date: "2026-05-15",
    },
    {
      id: "placeholder-hollow-signal-2",
      projectId: "hollow-signal",
      title: "初公開",
      content: "ブラウザ版プロトタイプ公開。",
      date: "2026-05-01",
    },
  ],
  "starbound-tactics": [
    {
      id: "placeholder-starbound-1",
      projectId: "starbound-tactics",
      title: "艦隊AIを調整",
      content: "ターン開始時の索敵優先度を変更。",
      date: "2026-05-20",
    },
    {
      id: "placeholder-starbound-2",
      projectId: "starbound-tactics",
      title: "初公開",
      content: "Steamストアページを公開。",
      date: "2026-05-10",
    },
  ],
  "iron-covenant": [
    {
      id: "placeholder-iron-1",
      projectId: "iron-covenant",
      title: "武器リコイルを調整",
      content: "スクワッド戦での射撃感を改善。",
      date: "2026-05-10",
    },
    {
      id: "placeholder-iron-2",
      projectId: "iron-covenant",
      title: "初公開",
      content: "α版ビルドを公開。",
      date: "2026-04-28",
    },
  ],
  "verdant-echo": [
    {
      id: "placeholder-verdant-1",
      projectId: "verdant-echo",
      title: "森の謎イベントを追加",
      content: "精霊との出会いシーンを実装。",
      date: "2026-05-25",
    },
    {
      id: "placeholder-verdant-2",
      projectId: "verdant-echo",
      title: "初公開",
      content: "企画デモを公開。",
      date: "2026-05-12",
    },
  ],
  "rift-runner": [
    {
      id: "placeholder-rift-1",
      projectId: "rift-runner",
      title: "新ステージ「虚無層」を追加",
      content: "後半エリアの難易度曲線を調整。",
      date: "2026-06-07",
    },
    {
      id: "placeholder-rift-2",
      projectId: "rift-runner",
      title: "操作チュートリアルを改善",
      content: "次元切り替えの説明を追加。",
      date: "2026-05-30",
    },
    {
      id: "placeholder-rift-3",
      projectId: "rift-runner",
      title: "初公開",
      content: "α版テストを開始。",
      date: "2026-05-18",
    },
  ],
  "crimson-vault": [
    {
      id: "placeholder-crimson-1",
      projectId: "crimson-vault",
      title: "ステルス判定を調整",
      content: "警報範囲の視覚的フィードバックを改善。",
      date: "2026-06-05",
    },
    {
      id: "placeholder-crimson-2",
      projectId: "crimson-vault",
      title: "初公開",
      content: "金庫侵入デモ公開。",
      date: "2026-05-22",
    },
  ],
  "skyforge-arena": [
    {
      id: "placeholder-skyforge-1",
      projectId: "skyforge-arena",
      title: "新ファイターを追加",
      content: "近接特化キャラの必殺技を実装。",
      date: "2026-06-03",
    },
    {
      id: "placeholder-skyforge-2",
      projectId: "skyforge-arena",
      title: "初公開",
      content: "対戦デモ版を公開。",
      date: "2026-05-15",
    },
  ],
  "dust-and-daggers": [
    {
      id: "placeholder-dust-1",
      projectId: "dust-and-daggers",
      title: "砂漠マップの視認性を改善",
      content: "砂嵐エフェクトの透明度を調整。",
      date: "2026-06-01",
    },
    {
      id: "placeholder-dust-2",
      projectId: "dust-and-daggers",
      title: "初公開",
      content: "プロトタイプ公開。",
      date: "2026-05-08",
    },
  ],
  "pulse-circuit": [
    {
      id: "placeholder-pulse-1",
      projectId: "pulse-circuit",
      title: "回路パズルのヒントUIを追加",
      content: "初心者向けガイドを実装。",
      date: "2026-05-28",
    },
    {
      id: "placeholder-pulse-2",
      projectId: "pulse-circuit",
      title: "初公開",
      content: "デモ版を公開。",
      date: "2026-05-14",
    },
  ],
  "wolfpack-siege": [
    {
      id: "placeholder-wolf-1",
      projectId: "wolfpack-siege",
      title: "協力プレイの同期を改善",
      content: "城壁防衛時の入力遅延を低減。",
      date: "2026-06-04",
    },
    {
      id: "placeholder-wolf-2",
      projectId: "wolfpack-siege",
      title: "初公開",
      content: "テストプレイ版公開。",
      date: "2026-05-19",
    },
  ],
  aetherborn: [
    {
      id: "placeholder-aetherborn-1",
      projectId: "aetherborn",
      title: "ギルドクエストを追加",
      content: "序盤の成長曲線を調整。",
      date: "2026-05-28",
    },
    {
      id: "placeholder-aetherborn-2",
      projectId: "aetherborn",
      title: "初公開",
      content: "β版を公開。",
      date: "2026-05-05",
    },
  ],
  "blade-of-ash": [
    {
      id: "placeholder-blade-1",
      projectId: "blade-of-ash",
      title: "剣戟アニメーションを調整",
      content: "居合いの硬直時間を短縮。",
      date: "2026-05-26",
    },
    {
      id: "placeholder-blade-2",
      projectId: "blade-of-ash",
      title: "初公開",
      content: "戦闘デモ公開。",
      date: "2026-05-11",
    },
  ],
  "quantum-relay": [
    {
      id: "placeholder-quantum-1",
      projectId: "quantum-relay",
      title: "ポータル演出を改善",
      content: "転送時のカメラワークを調整。",
      date: "2026-05-24",
    },
    {
      id: "placeholder-quantum-2",
      projectId: "quantum-relay",
      title: "初公開",
      content: "協力パズルデモ公開。",
      date: "2026-05-09",
    },
  ],
  grimhold: [
    {
      id: "placeholder-grimhold-1",
      projectId: "grimhold",
      title: "ダンジョン照明を調整",
      content: "松明の明るさと影のコントラストを改善。",
      date: "2026-05-22",
    },
    {
      id: "placeholder-grimhold-2",
      projectId: "grimhold",
      title: "初公開",
      content: "サバイバルデモ公開。",
      date: "2026-05-06",
    },
  ],
  "lumen-quest": [
    {
      id: "placeholder-lumen-1",
      projectId: "lumen-quest",
      title: "洞窟探索UIを改善",
      content: "ランタン残量の表示を追加。",
      date: "2026-05-20",
    },
    {
      id: "placeholder-lumen-2",
      projectId: "lumen-quest",
      title: "初公開",
      content: "探索デモ公開。",
      date: "2026-05-04",
    },
  ],
  "titans-edge": [
    {
      id: "placeholder-titans-1",
      projectId: "titans-edge",
      title: "MOBAレーン調整",
      content: "巨獣背中の移動速度をバランス調整。",
      date: "2026-06-01",
    },
    {
      id: "placeholder-titans-2",
      projectId: "titans-edge",
      title: "初公開",
      content: "β版クローズドテスト開始。",
      date: "2026-05-16",
    },
  ],
};

const PLACEHOLDER_COMMUNITY_IMPACT: Record<string, CommunityImpactItem[]> = {
  emberfall: [
    { id: "impact-emberfall-1", label: "UI改善", date: "2026-06-08" },
    { id: "impact-emberfall-2", label: "難易度調整", date: "2026-06-05" },
    { id: "impact-emberfall-3", label: "チュートリアル追加", date: "2026-05-30" },
  ],
  "neon-drift": [
    { id: "impact-neon-1", label: "キーコンフィグ追加", date: "2026-05-28" },
    { id: "impact-neon-2", label: "カメラ視点の改善", date: "2026-05-24" },
  ],
  "rift-runner": [
    { id: "impact-rift-1", label: "操作説明の改善", date: "2026-06-04" },
    { id: "impact-rift-2", label: "難易度調整", date: "2026-05-25" },
    { id: "impact-rift-3", label: "UI改善", date: "2026-05-20" },
  ],
  "crimson-vault": [
    { id: "impact-crimson-1", label: "ステルスUI改善", date: "2026-06-01" },
    { id: "impact-crimson-2", label: "チュートリアル追加", date: "2026-05-18" },
  ],
  "wolfpack-siege": [
    { id: "impact-wolf-1", label: "協力プレイの同期改善", date: "2026-05-30" },
    { id: "impact-wolf-2", label: "難易度調整", date: "2026-05-22" },
  ],
  "pulse-circuit": [
    { id: "impact-pulse-1", label: "ヒントUI追加", date: "2026-05-20" },
    { id: "impact-pulse-2", label: "UI改善", date: "2026-05-16" },
  ],
};

const DEFAULT_COMMUNITY_IMPACT: CommunityImpactItem[] = [
  { id: "impact-default-1", label: "UI改善" },
  { id: "impact-default-2", label: "難易度調整" },
  { id: "impact-default-3", label: "バグ修正" },
];

function shiftDate(isoDate: string, days: number): string {
  const date = new Date(isoDate);
  date.setDate(date.getDate() - days);
  return date.toISOString().split("T")[0]!;
}

function buildGenericPlaceholderDevlogs(game: GameActivitySeed): DevlogEntry[] {
  const latest = game.lastUpdated;
  return sortDevlogsNewestFirst([
    {
      id: `placeholder-${game.id}-latest`,
      projectId: game.id,
      title: "最新アップデート",
      content: "プレイフィードバックを反映した更新を行いました。",
      date: latest,
    },
    {
      id: `placeholder-${game.id}-mid`,
      projectId: game.id,
      title: "コンテンツを追加",
      content: "新要素と調整を実施しました。",
      date: shiftDate(latest, 7),
    },
    {
      id: `placeholder-${game.id}-launch`,
      projectId: game.id,
      title: "初公開",
      content: "Forgeで作品を公開しました。",
      date: game.createdAt?.split("T")[0] ?? shiftDate(latest, 14),
    },
  ]);
}

export function getDevelopmentLogEntries(
  game: GameActivitySeed,
  realDevlogs: DevlogEntry[],
): DevlogEntry[] {
  if (realDevlogs.length > 0) {
    return sortDevlogsNewestFirst(realDevlogs);
  }

  return (
    PLACEHOLDER_DEVLOGS[game.id] ?? buildGenericPlaceholderDevlogs(game)
  );
}

export function getCommunityImpactItems(projectId: string): CommunityImpactItem[] {
  return PLACEHOLDER_COMMUNITY_IMPACT[projectId] ?? DEFAULT_COMMUNITY_IMPACT;
}

function resolveCommunityImpactDate(
  item: CommunityImpactItem,
  game: GameActivitySeed,
  index: number,
): string {
  if (item.date) {
    return item.date;
  }

  return shiftDate(game.lastUpdated, 2 + index * 4);
}

export function getUnifiedProjectHistory(
  game: GameActivitySeed,
  realDevlogs: DevlogEntry[],
): { entries: ProjectHistoryEntry[]; usingPlaceholderDevlogs: boolean } {
  const usingPlaceholderDevlogs = realDevlogs.length === 0;
  const devlogs = getDevelopmentLogEntries(game, realDevlogs);

  const developmentEntries: ProjectHistoryEntry[] = devlogs.map((entry) => ({
    id: entry.id,
    date: entry.date,
    title: entry.title,
    content: entry.content,
    kind: "development",
  }));

  const communityEntries: ProjectHistoryEntry[] = getCommunityImpactItems(
    game.id,
  ).map((item, index) => ({
    id: item.id,
    date: resolveCommunityImpactDate(item, game, index),
    title: item.label,
    kind: "community",
  }));

  const entries = [...developmentEntries, ...communityEntries].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  return { entries, usingPlaceholderDevlogs };
}

export function getProjectLaunchDate(game: GameActivitySeed): Date {
  const placeholder = PLACEHOLDER_DEVLOGS[game.id];
  const launchEntry = placeholder?.find((entry) => entry.title === "初公開");
  if (launchEntry) {
    return new Date(launchEntry.date);
  }
  if (game.createdAt) {
    return new Date(game.createdAt);
  }
  return new Date(game.lastUpdated);
}

export function getProjectStatusLabel(game: GameActivitySeed): string | null {
  const now = new Date();
  const updated = new Date(game.lastUpdated);
  const diffMs = now.getTime() - updated.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) {
    return "今日更新";
  }
  if (diffDays === 1) {
    return "昨日更新";
  }
  if (diffDays <= 14) {
    return `${diffDays}日前更新`;
  }

  const launch = getProjectLaunchDate(game);
  const daysSinceLaunch = Math.floor(
    (now.getTime() - launch.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (daysSinceLaunch >= 0 && daysSinceLaunch <= 90) {
    return `初公開から${daysSinceLaunch}日`;
  }

  return null;
}

export function formatActivityDate(date: string): string {
  return new Date(date).toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}
