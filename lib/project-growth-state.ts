import { sortDevlogsNewestFirst, type DevlogEntry } from "@/lib/devlogs";
import type { Game } from "@/lib/mock-games";
import { resolvePlayableVersion } from "@/lib/playable-version";
import { projectStudioFeedbackHref } from "@/lib/project-nurture-links";
import {
  resolveVoiceSignalForGame,
  type ProjectVoiceNurtureSignal,
} from "@/lib/project-voice-nurture";
import type { ProjectFeedbackEntry } from "@/lib/supabase/user-engagement";

export type NurtureStepId = "read" | "improving" | "devlog" | "publish" | "wait";

export type NurtureStepVisualState = "done" | "now" | "next" | "upcoming";

export type ProgressRailVisual = "done" | "current" | "upcoming";

export const NURTURE_STEP_WHY: Record<NurtureStepId, string> = {
  read: "回答を見る",
  improving: "直す",
  devlog: "記録する",
  publish: "届ける",
  wait: "育つ",
};

export const NURTURE_STEPS: {
  id: NurtureStepId;
  label: string;
  railLabel: string;
  shortLabel: string;
  whyLabel: string;
}[] = [
  {
    id: "read",
    label: "回答を見る",
    railLabel: "回答",
    shortLabel: "回答",
    whyLabel: NURTURE_STEP_WHY.read,
  },
  {
    id: "improving",
    label: "改善する",
    railLabel: "改善",
    shortLabel: "改善",
    whyLabel: NURTURE_STEP_WHY.improving,
  },
  {
    id: "devlog",
    label: "開発ログを書く",
    railLabel: "ログ",
    shortLabel: "ログ",
    whyLabel: NURTURE_STEP_WHY.devlog,
  },
  {
    id: "publish",
    label: "新版公開する",
    railLabel: "公開",
    shortLabel: "公開",
    whyLabel: NURTURE_STEP_WHY.publish,
  },
  {
    id: "wait",
    label: "反応を待つ",
    railLabel: "待つ",
    shortLabel: "待つ",
    whyLabel: NURTURE_STEP_WHY.wait,
  },
];

export type NurtureDataPhase =
  | "no_feedback"
  | "feedback_pending"
  | "devlog_unpublished"
  | "published_waiting";

export type GrowthStepChip = {
  id: string;
  label: string;
  done: boolean;
  active: boolean;
};

export type GrowthPrimaryCta = {
  label: string;
  href: string;
};

export type PastCycleSummary = {
  cycleNumber: number;
  devlogTitle?: string;
  publishedVersion?: string;
  feedbackDate?: string;
};

export type ProjectGrowthSnapshot = {
  dataPhase: NurtureDataPhase;
  cycleNumber: number;
  loopActive: boolean;
  earlySteps: GrowthStepChip[];
  pastCycles: PastCycleSummary[];
  playableVersion: string;
  lastUpdatedLabel: string;
  devlogCount: number;
  latestDevlogTitle?: string;
  /** 現行版の project_voice_responses 件数 */
  pendingFeedbackCount: number;
  totalVoiceResponseCount: number;
  needsAttention: boolean;
  cyclePrevious?: string;
  cycleCurrent?: string;
};

export type NurtureDisplayContext = {
  nowStepId: NurtureStepId | null;
  nextStepId: NurtureStepId;
  heroTitle: string;
  heroSubline?: string;
  primaryCta: GrowthPrimaryCta | null;
  primaryOpensReadPanel: boolean;
  loopActive: boolean;
  newFeedbackArrived: boolean;
};

function devlogsForProject(
  projectId: string,
  getDevlogsByProject: (projectId: string) => DevlogEntry[],
): DevlogEntry[] {
  return sortDevlogsNewestFirst(getDevlogsByProject(projectId));
}

function isVoicePendingDevlog(
  latestResponseAt: string | null,
  latestDevlog: DevlogEntry | undefined,
): boolean {
  if (!latestResponseAt) {
    return false;
  }

  if (!latestDevlog) {
    return true;
  }

  return (
    new Date(latestResponseAt).getTime() > new Date(latestDevlog.date).getTime()
  );
}

function countPublishedDevlogs(devlogs: DevlogEntry[]): number {
  return devlogs.filter((entry) => entry.publishedVersion).length;
}

function buildEarlySteps(hasVoiceResponses: boolean): GrowthStepChip[] {
  return [
    { id: "submit", label: "投稿", done: true, active: false },
    { id: "discover", label: "発見", done: true, active: false },
    {
      id: "play",
      label: "プレイ",
      done: hasVoiceResponses,
      active: !hasVoiceResponses,
    },
  ];
}

function buildPastCycles(
  devlogs: DevlogEntry[],
  publishedCount: number,
): PastCycleSummary[] {
  if (publishedCount === 0) {
    return [];
  }

  const publishedDevlogs = devlogs.filter((entry) => entry.publishedVersion);
  const past: PastCycleSummary[] = [];

  for (let cycleNumber = 1; cycleNumber <= publishedCount; cycleNumber++) {
    const devlog = publishedDevlogs[publishedCount - cycleNumber];

    past.push({
      cycleNumber,
      devlogTitle: devlog?.title,
      publishedVersion: devlog?.publishedVersion,
    });
  }

  return past.reverse();
}

export function getNurtureStepVisualState(
  stepId: NurtureStepId,
  display: NurtureDisplayContext,
): NurtureStepVisualState {
  if (
    display.loopActive &&
    display.nextStepId === "read" &&
    stepId === "wait"
  ) {
    return "done";
  }

  if (stepId === display.nextStepId) {
    return "next";
  }

  if (display.nowStepId && stepId === display.nowStepId) {
    return "now";
  }

  const order = NURTURE_STEPS.map((step) => step.id);
  const stepIndex = order.indexOf(stepId);
  const nextIndex = order.indexOf(display.nextStepId);
  const nowIndex = display.nowStepId ? order.indexOf(display.nowStepId) : -1;

  if (nowIndex >= 0 && stepIndex < nowIndex) {
    return "done";
  }

  if (stepIndex < nextIndex) {
    return "done";
  }

  return "upcoming";
}

/** P1-2.7.1: Rail は 5 段常時。Hero と役割分担する進捗位置。 */
export function getProgressRailStepIds(): NurtureStepId[] {
  return NURTURE_STEPS.map((step) => step.id);
}

/** Rail 上の ● は Hero の行動ではなく、サイクル上の進捗位置（now → next）。 */
export function getProgressRailPositionId(
  display: NurtureDisplayContext,
): NurtureStepId {
  return display.nowStepId ?? display.nextStepId;
}

/** Rail 用 — 色・バッジなし。進捗 1 点のみやや明るく。 */
export function getProgressRailVisual(
  stepId: NurtureStepId,
  display: NurtureDisplayContext,
): ProgressRailVisual {
  const visibleStepIds = getProgressRailStepIds();
  const progressStepId = getProgressRailPositionId(display);
  const stepIndex = visibleStepIds.indexOf(stepId);
  const progressIndex = visibleStepIds.indexOf(progressStepId);

  if (stepIndex === -1 || progressIndex === -1) {
    return "upcoming";
  }

  if (stepId === progressStepId) {
    return "current";
  }

  if (stepIndex < progressIndex) {
    return "done";
  }

  return "upcoming";
}

export function buildNurtureDisplayContext(
  snapshot: ProjectGrowthSnapshot,
  voiceRead: boolean,
  gameId: string,
): NurtureDisplayContext {
  switch (snapshot.dataPhase) {
    case "no_feedback":
      return {
        nowStepId: "wait",
        nextStepId: "wait",
        heroTitle: "回答を待つ",
        heroSubline: "プレイヤーの初声を待っています",
        primaryCta: {
          label: "作品ページを確認する",
          href: `/games/${gameId}`,
        },
        primaryOpensReadPanel: false,
        loopActive: false,
        newFeedbackArrived: false,
      };

    case "feedback_pending":
      if (!voiceRead) {
        return {
          nowStepId: null,
          nextStepId: "read",
          heroTitle: "回答を見る",
          heroSubline: snapshot.loopActive
            ? `${snapshot.cycleNumber} 周目 · また回答が届きました`
            : "届いた回答が、次の改善につながります",
          primaryCta: {
            label: "回答を見る",
            href: projectStudioFeedbackHref(gameId),
          },
          primaryOpensReadPanel: true,
          loopActive: snapshot.loopActive,
          newFeedbackArrived: snapshot.loopActive,
        };
      }

      return {
        nowStepId: "improving",
        nextStepId: "devlog",
        heroTitle: "開発ログを書く",
        heroSubline: "改善が終わったら、記録して届けましょう",
        primaryCta: {
          label: "開発ログを書く",
          href: `/projects/${gameId}/devlog/new`,
        },
        primaryOpensReadPanel: false,
        loopActive: snapshot.loopActive,
        newFeedbackArrived: false,
      };

    case "devlog_unpublished":
      return {
        nowStepId: null,
        nextStepId: "publish",
        heroTitle: "新版公開する",
        heroSubline: "記録した改善を、プレイヤーに届けましょう",
        primaryCta: {
          label: "新版を公開する",
          href: `/projects/${gameId}/devlog/new`,
        },
        primaryOpensReadPanel: false,
        loopActive: false,
        newFeedbackArrived: false,
      };

    case "published_waiting":
      return {
        nowStepId: "wait",
        nextStepId: "wait",
        heroTitle: "回答を待つ",
        heroSubline: "新しい回答が届いたら、またサイクルが回ります",
        primaryCta: {
          label: "作品ページを確認する",
          href: `/games/${gameId}`,
        },
        primaryOpensReadPanel: false,
        loopActive: false,
        newFeedbackArrived: false,
      };
  }
}

export function buildProjectGrowthSnapshot(
  game: Game,
  voiceSignal: ProjectVoiceNurtureSignal,
  getDevlogsByProject: (projectId: string) => DevlogEntry[],
): ProjectGrowthSnapshot {
  const devlogs = devlogsForProject(game.id, getDevlogsByProject);
  const latestDevlog = devlogs[0];
  const previousDevlog = devlogs[1];
  const playableVersion = resolvePlayableVersion(game.playableVersion);
  const lastUpdatedLabel = game.lastUpdated || game.createdAt || "—";
  const hasVoice = voiceSignal.responseCount > 0;
  const pendingFeedbackCount = isVoicePendingDevlog(
    voiceSignal.latestResponseAt,
    latestDevlog,
  )
    ? 1
    : 0;
  const publishedCount = countPublishedDevlogs(devlogs);
  const pastCycles = buildPastCycles(devlogs, publishedCount);

  if (!hasVoice) {
    return {
      dataPhase: "no_feedback",
      cycleNumber: 0,
      loopActive: false,
      earlySteps: buildEarlySteps(false),
      pastCycles: [],
      playableVersion,
      lastUpdatedLabel,
      devlogCount: devlogs.length,
      latestDevlogTitle: latestDevlog?.title,
      pendingFeedbackCount: 0,
      totalVoiceResponseCount: 0,
      needsAttention: false,
    };
  }

  if (isVoicePendingDevlog(voiceSignal.latestResponseAt, latestDevlog)) {
    const cycleNumber = Math.max(1, publishedCount + 1);

    return {
      dataPhase: "feedback_pending",
      cycleNumber,
      loopActive: publishedCount >= 1,
      earlySteps: buildEarlySteps(true),
      pastCycles,
      playableVersion,
      lastUpdatedLabel,
      devlogCount: devlogs.length,
      latestDevlogTitle: latestDevlog?.title,
      pendingFeedbackCount,
      totalVoiceResponseCount: voiceSignal.responseCount,
      needsAttention: true,
      cyclePrevious: previousDevlog?.title,
      cycleCurrent: latestDevlog?.title ?? "（回答受領後）",
    };
  }

  if (latestDevlog && !latestDevlog.publishedVersion) {
    const cycleNumber = Math.max(1, publishedCount + 1);

    return {
      dataPhase: "devlog_unpublished",
      cycleNumber,
      loopActive: false,
      earlySteps: buildEarlySteps(true),
      pastCycles,
      playableVersion,
      lastUpdatedLabel,
      devlogCount: devlogs.length,
      latestDevlogTitle: latestDevlog.title,
      pendingFeedbackCount: 0,
      totalVoiceResponseCount: voiceSignal.responseCount,
      needsAttention: true,
      cyclePrevious: previousDevlog?.title,
      cycleCurrent: latestDevlog.title,
    };
  }

  const cycleNumber = Math.max(1, publishedCount);

  return {
    dataPhase: "published_waiting",
    cycleNumber,
    loopActive: false,
    earlySteps: buildEarlySteps(true),
    pastCycles,
    playableVersion,
    lastUpdatedLabel,
    devlogCount: devlogs.length,
    latestDevlogTitle: latestDevlog?.title,
    pendingFeedbackCount: 0,
    totalVoiceResponseCount: voiceSignal.responseCount,
    needsAttention: false,
    cyclePrevious: previousDevlog?.title,
    cycleCurrent: latestDevlog?.title,
  };
}

export function sortProjectsForGrowthHub(
  games: Game[],
  voiceSignals: ProjectVoiceNurtureSignal[],
  getDevlogsByProject: (projectId: string) => DevlogEntry[],
): Game[] {
  return [...games].sort((a, b) => {
    const aSnapshot = buildProjectGrowthSnapshot(
      a,
      resolveVoiceSignalForGame(a, voiceSignals),
      getDevlogsByProject,
    );
    const bSnapshot = buildProjectGrowthSnapshot(
      b,
      resolveVoiceSignalForGame(b, voiceSignals),
      getDevlogsByProject,
    );

    if (aSnapshot.needsAttention !== bSnapshot.needsAttention) {
      return aSnapshot.needsAttention ? -1 : 1;
    }

    return (
      new Date(b.lastUpdated || b.createdAt || 0).getTime() -
      new Date(a.lastUpdated || a.createdAt || 0).getTime()
    );
  });
}

export function groupFeedbackByProject(
  entries: ProjectFeedbackEntry[],
): Map<string, ProjectFeedbackEntry[]> {
  const map = new Map<string, ProjectFeedbackEntry[]>();

  for (const entry of entries) {
    const list = map.get(entry.projectId) ?? [];
    list.push(entry);
    map.set(entry.projectId, list);
  }

  for (const [projectId, list] of map) {
    map.set(
      projectId,
      list.sort(
        (a, b) =>
          new Date(b.item.createdAt).getTime() -
          new Date(a.item.createdAt).getTime(),
      ),
    );
  }

  return map;
}

export function filterDeepFeedbackForVersion(
  entries: ProjectFeedbackEntry[],
  playableVersion: string,
): ProjectFeedbackEntry[] {
  const version = resolvePlayableVersion(playableVersion);

  return entries.filter(
    (entry) => resolvePlayableVersion(entry.item.versionKey) === version,
  );
}
