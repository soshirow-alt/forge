import type { Game } from "@/lib/mock-games";
import { games as builtInGames } from "@/lib/mock-games";
import { getProjectStatusLabel } from "@/lib/project-activity";

export type DemoActivityEventType =
  | "launch"
  | "tester_open"
  | "update"
  | "feedback_applied";

export type DemoActivityEvent = {
  id: string;
  date: string;
  type: DemoActivityEventType;
  label: string;
};

export type DemoActivityData = {
  supportCount: number;
  testerAppliedCount: number;
  testerSlots: number;
  lastUpdatedAt: string;
  devlogCount: number;
  feedbackAppliedCount: number;
  recentActivityLabel: string;
  recentEvents: DemoActivityEvent[];
};

const DEMO_ACTIVITY: Record<string, DemoActivityData> = {
  emberfall: {
    supportCount: 47,
    testerAppliedCount: 0,
    testerSlots: 0,
    lastUpdatedAt: "2026-06-10",
    devlogCount: 3,
    feedbackAppliedCount: 3,
    recentActivityLabel: "2日前更新",
    recentEvents: [
      {
        id: "emberfall-ev-1",
        date: "2026-06-10",
        type: "update",
        label: "戦闘バランスを調整",
      },
      {
        id: "emberfall-ev-2",
        date: "2026-06-08",
        type: "feedback_applied",
        label: "UI改善を反映",
      },
      {
        id: "emberfall-ev-3",
        date: "2026-05-28",
        type: "launch",
        label: "初公開",
      },
    ],
  },
  "neon-drift": {
    supportCount: 28,
    testerAppliedCount: 0,
    testerSlots: 0,
    lastUpdatedAt: "2026-06-01",
    devlogCount: 2,
    feedbackAppliedCount: 2,
    recentActivityLabel: "11日前更新",
    recentEvents: [
      {
        id: "neon-ev-1",
        date: "2026-06-01",
        type: "update",
        label: "ドリフト判定を改善",
      },
      {
        id: "neon-ev-2",
        date: "2026-05-24",
        type: "feedback_applied",
        label: "キーコンフィグを追加",
      },
      {
        id: "neon-ev-3",
        date: "2026-05-20",
        type: "launch",
        label: "初公開",
      },
    ],
  },
  "hollow-signal": {
    supportCount: 19,
    testerAppliedCount: 0,
    testerSlots: 0,
    lastUpdatedAt: "2026-05-15",
    devlogCount: 2,
    feedbackAppliedCount: 1,
    recentActivityLabel: "初公開から18日",
    recentEvents: [
      {
        id: "hollow-ev-1",
        date: "2026-05-15",
        type: "update",
        label: "音声演出を追加",
      },
      {
        id: "hollow-ev-2",
        date: "2026-05-01",
        type: "launch",
        label: "初公開",
      },
    ],
  },
  "starbound-tactics": {
    supportCount: 89,
    testerAppliedCount: 0,
    testerSlots: 0,
    lastUpdatedAt: "2026-05-20",
    devlogCount: 2,
    feedbackAppliedCount: 2,
    recentActivityLabel: "13日前更新",
    recentEvents: [
      {
        id: "starbound-ev-1",
        date: "2026-05-20",
        type: "update",
        label: "艦隊AIを調整",
      },
      {
        id: "starbound-ev-2",
        date: "2026-05-10",
        type: "launch",
        label: "初公開",
      },
    ],
  },
  "iron-covenant": {
    supportCount: 31,
    testerAppliedCount: 0,
    testerSlots: 0,
    lastUpdatedAt: "2026-05-10",
    devlogCount: 2,
    feedbackAppliedCount: 1,
    recentActivityLabel: "初公開から23日",
    recentEvents: [
      {
        id: "iron-ev-1",
        date: "2026-05-10",
        type: "update",
        label: "武器リコイルを調整",
      },
      {
        id: "iron-ev-2",
        date: "2026-04-28",
        type: "launch",
        label: "初公開",
      },
    ],
  },
  "verdant-echo": {
    supportCount: 22,
    testerAppliedCount: 0,
    testerSlots: 0,
    lastUpdatedAt: "2026-06-03",
    devlogCount: 2,
    feedbackAppliedCount: 1,
    recentActivityLabel: "9日前更新",
    recentEvents: [
      {
        id: "verdant-ev-1",
        date: "2026-06-03",
        type: "update",
        label: "森の謎イベントを追加",
      },
      {
        id: "verdant-ev-2",
        date: "2026-05-12",
        type: "launch",
        label: "初公開",
      },
    ],
  },
  "rift-runner": {
    supportCount: 124,
    testerAppliedCount: 7,
    testerSlots: 10,
    lastUpdatedAt: "2026-06-08",
    devlogCount: 3,
    feedbackAppliedCount: 3,
    recentActivityLabel: "4日前更新",
    recentEvents: [
      {
        id: "rift-ev-1",
        date: "2026-06-08",
        type: "update",
        label: "新ステージ「虚無層」を追加",
      },
      {
        id: "rift-ev-2",
        date: "2026-06-04",
        type: "feedback_applied",
        label: "操作説明を改善",
      },
      {
        id: "rift-ev-3",
        date: "2026-05-18",
        type: "tester_open",
        label: "テストプレイ受付開始",
      },
      {
        id: "rift-ev-4",
        date: "2026-05-18",
        type: "launch",
        label: "初公開",
      },
    ],
  },
  "crimson-vault": {
    supportCount: 67,
    testerAppliedCount: 6,
    testerSlots: 10,
    lastUpdatedAt: "2026-06-05",
    devlogCount: 2,
    feedbackAppliedCount: 2,
    recentActivityLabel: "7日前更新",
    recentEvents: [
      {
        id: "crimson-ev-1",
        date: "2026-06-05",
        type: "update",
        label: "ステルス判定を調整",
      },
      {
        id: "crimson-ev-2",
        date: "2026-05-28",
        type: "feedback_applied",
        label: "ステルスUIを改善",
      },
      {
        id: "crimson-ev-3",
        date: "2026-05-22",
        type: "tester_open",
        label: "テストプレイ受付開始",
      },
      {
        id: "crimson-ev-4",
        date: "2026-05-22",
        type: "launch",
        label: "初公開",
      },
    ],
  },
  "skyforge-arena": {
    supportCount: 95,
    testerAppliedCount: 8,
    testerSlots: 10,
    lastUpdatedAt: "2026-06-07",
    devlogCount: 2,
    feedbackAppliedCount: 2,
    recentActivityLabel: "5日前更新",
    recentEvents: [
      {
        id: "skyforge-ev-1",
        date: "2026-06-07",
        type: "update",
        label: "新ファイターを追加",
      },
      {
        id: "skyforge-ev-2",
        date: "2026-06-01",
        type: "feedback_applied",
        label: "空中パリィの硬直を短縮",
      },
      {
        id: "skyforge-ev-3",
        date: "2026-05-15",
        type: "tester_open",
        label: "テストプレイ受付開始",
      },
      {
        id: "skyforge-ev-4",
        date: "2026-05-15",
        type: "launch",
        label: "初公開",
      },
    ],
  },
  "dust-and-daggers": {
    supportCount: 41,
    testerAppliedCount: 4,
    testerSlots: 10,
    lastUpdatedAt: "2026-06-02",
    devlogCount: 2,
    feedbackAppliedCount: 1,
    recentActivityLabel: "10日前更新",
    recentEvents: [
      {
        id: "dust-ev-1",
        date: "2026-06-02",
        type: "update",
        label: "砂漠マップの視認性を改善",
      },
      {
        id: "dust-ev-2",
        date: "2026-05-08",
        type: "tester_open",
        label: "テストプレイ受付開始",
      },
      {
        id: "dust-ev-3",
        date: "2026-05-08",
        type: "launch",
        label: "初公開",
      },
    ],
  },
  "pulse-circuit": {
    supportCount: 38,
    testerAppliedCount: 5,
    testerSlots: 10,
    lastUpdatedAt: "2026-06-09",
    devlogCount: 2,
    feedbackAppliedCount: 2,
    recentActivityLabel: "3日前更新",
    recentEvents: [
      {
        id: "pulse-ev-1",
        date: "2026-06-09",
        type: "update",
        label: "ヒントUIを追加",
      },
      {
        id: "pulse-ev-2",
        date: "2026-06-03",
        type: "feedback_applied",
        label: "初心者向けガイドを反映",
      },
      {
        id: "pulse-ev-3",
        date: "2026-05-14",
        type: "tester_open",
        label: "テストプレイ受付開始",
      },
      {
        id: "pulse-ev-4",
        date: "2026-05-14",
        type: "launch",
        label: "初公開",
      },
    ],
  },
  "wolfpack-siege": {
    supportCount: 156,
    testerAppliedCount: 9,
    testerSlots: 10,
    lastUpdatedAt: "2026-06-06",
    devlogCount: 2,
    feedbackAppliedCount: 2,
    recentActivityLabel: "6日前更新",
    recentEvents: [
      {
        id: "wolf-ev-1",
        date: "2026-06-06",
        type: "update",
        label: "協力プレイの同期を改善",
      },
      {
        id: "wolf-ev-2",
        date: "2026-05-30",
        type: "feedback_applied",
        label: "難易度を調整",
      },
      {
        id: "wolf-ev-3",
        date: "2026-05-19",
        type: "tester_open",
        label: "テストプレイ受付開始",
      },
      {
        id: "wolf-ev-4",
        date: "2026-05-19",
        type: "launch",
        label: "初公開",
      },
    ],
  },
  aetherborn: {
    supportCount: 203,
    testerAppliedCount: 0,
    testerSlots: 0,
    lastUpdatedAt: "2026-05-30",
    devlogCount: 2,
    feedbackAppliedCount: 2,
    recentActivityLabel: "13日前更新",
    recentEvents: [
      {
        id: "aetherborn-ev-1",
        date: "2026-05-30",
        type: "update",
        label: "ギルドクエストを追加",
      },
      {
        id: "aetherborn-ev-2",
        date: "2026-05-12",
        type: "feedback_applied",
        label: "序盤の成長曲線を調整",
      },
      {
        id: "aetherborn-ev-3",
        date: "2026-05-05",
        type: "launch",
        label: "初公開",
      },
    ],
  },
  "blade-of-ash": {
    supportCount: 44,
    testerAppliedCount: 0,
    testerSlots: 0,
    lastUpdatedAt: "2026-05-26",
    devlogCount: 2,
    feedbackAppliedCount: 1,
    recentActivityLabel: "17日前更新",
    recentEvents: [
      {
        id: "blade-ev-1",
        date: "2026-05-26",
        type: "update",
        label: "剣戟アニメーションを調整",
      },
      {
        id: "blade-ev-2",
        date: "2026-05-11",
        type: "launch",
        label: "初公開",
      },
    ],
  },
  "quantum-relay": {
    supportCount: 52,
    testerAppliedCount: 0,
    testerSlots: 0,
    lastUpdatedAt: "2026-06-04",
    devlogCount: 2,
    feedbackAppliedCount: 1,
    recentActivityLabel: "8日前更新",
    recentEvents: [
      {
        id: "quantum-ev-1",
        date: "2026-06-04",
        type: "update",
        label: "ポータル演出を改善",
      },
      {
        id: "quantum-ev-2",
        date: "2026-05-09",
        type: "launch",
        label: "初公開",
      },
    ],
  },
  grimhold: {
    supportCount: 37,
    testerAppliedCount: 0,
    testerSlots: 0,
    lastUpdatedAt: "2026-05-22",
    devlogCount: 2,
    feedbackAppliedCount: 1,
    recentActivityLabel: "21日前更新",
    recentEvents: [
      {
        id: "grimhold-ev-1",
        date: "2026-05-22",
        type: "update",
        label: "ダンジョン照明を調整",
      },
      {
        id: "grimhold-ev-2",
        date: "2026-05-06",
        type: "launch",
        label: "初公開",
      },
    ],
  },
  "lumen-quest": {
    supportCount: 61,
    testerAppliedCount: 0,
    testerSlots: 0,
    lastUpdatedAt: "2026-05-20",
    devlogCount: 2,
    feedbackAppliedCount: 1,
    recentActivityLabel: "23日前更新",
    recentEvents: [
      {
        id: "lumen-ev-1",
        date: "2026-05-20",
        type: "update",
        label: "洞窟探索UIを改善",
      },
      {
        id: "lumen-ev-2",
        date: "2026-05-04",
        type: "launch",
        label: "初公開",
      },
    ],
  },
  "titans-edge": {
    supportCount: 112,
    testerAppliedCount: 0,
    testerSlots: 0,
    lastUpdatedAt: "2026-06-01",
    devlogCount: 2,
    feedbackAppliedCount: 2,
    recentActivityLabel: "11日前更新",
    recentEvents: [
      {
        id: "titans-ev-1",
        date: "2026-06-01",
        type: "update",
        label: "MOBAレーンを調整",
      },
      {
        id: "titans-ev-2",
        date: "2026-05-24",
        type: "feedback_applied",
        label: "移動速度をバランス調整",
      },
      {
        id: "titans-ev-3",
        date: "2026-05-16",
        type: "launch",
        label: "初公開",
      },
    ],
  },
};

const BUILT_IN_GAME_IDS = new Set(builtInGames.map((game) => game.id));

export function isBuiltInMockGame(gameId: string): boolean {
  return BUILT_IN_GAME_IDS.has(gameId);
}

export function getBuiltInDemoActivity(gameId: string): DemoActivityData | null {
  return DEMO_ACTIVITY[gameId] ?? null;
}

export function getDefaultSupportCount(
  gameId: string,
  isSubmitted: boolean,
): number {
  if (isSubmitted) {
    return 0;
  }

  return getBuiltInDemoActivity(gameId)?.supportCount ?? 0;
}

export function getDefaultApplicantCount(
  gameId: string,
  isSubmitted: boolean,
): number {
  if (isSubmitted) {
    return 0;
  }

  return getBuiltInDemoActivity(gameId)?.testerAppliedCount ?? 0;
}

export type GameActivitySnapshot = {
  supportCount: number;
  testerAppliedCount: number;
  testerSlots: number;
  lastUpdatedAt: string;
  devlogCount: number;
  feedbackAppliedCount: number;
  recentActivityLabel: string | null;
  recentEvents: DemoActivityEvent[];
  hasBuiltInDemoData: boolean;
};

export function getGameActivitySnapshot(
  game: Pick<Game, "id" | "lastUpdated" | "lookingForTesters" | "testerSlots">,
  options: {
    isSubmitted: boolean;
    supportCount: number;
    applicantCount: number;
  },
): GameActivitySnapshot | null {
  const demo = getBuiltInDemoActivity(game.id);

  if (demo) {
    const updateLabel =
      getProjectStatusLabel({
        id: game.id,
        lastUpdated: demo.lastUpdatedAt,
        createdAt: demo.lastUpdatedAt,
      }) ?? demo.recentActivityLabel;

    return {
      supportCount: options.supportCount,
      testerAppliedCount: options.applicantCount,
      testerSlots: demo.testerSlots || game.testerSlots || 0,
      lastUpdatedAt: demo.lastUpdatedAt,
      devlogCount: demo.devlogCount,
      feedbackAppliedCount: demo.feedbackAppliedCount,
      recentActivityLabel: updateLabel,
      recentEvents: demo.recentEvents,
      hasBuiltInDemoData: true,
    };
  }

  if (options.isSubmitted) {
    const hasSignals =
      options.supportCount > 0 ||
      (game.lookingForTesters && options.applicantCount > 0);

    if (!hasSignals) {
      return null;
    }

    const updateLabel = getProjectStatusLabel({
      id: game.id,
      lastUpdated: game.lastUpdated,
      createdAt: game.lastUpdated,
    });

    return {
      supportCount: options.supportCount,
      testerAppliedCount: options.applicantCount,
      testerSlots: game.testerSlots ?? 0,
      lastUpdatedAt: game.lastUpdated,
      devlogCount: 0,
      feedbackAppliedCount: 0,
      recentActivityLabel: updateLabel,
      recentEvents: [],
      hasBuiltInDemoData: false,
    };
  }

  return null;
}

export function getActivityEventTypeLabel(type: DemoActivityEventType): string {
  switch (type) {
    case "launch":
      return "初公開";
    case "tester_open":
      return "テストプレイ受付開始";
    case "update":
      return "アップデート";
    case "feedback_applied":
      return "プレイヤー提案を反映";
  }
}
