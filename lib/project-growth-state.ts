import { sortDevlogsNewestFirst, type DevlogEntry } from "@/lib/devlogs";
import type { Game } from "@/lib/mock-games";
import { resolvePlayableVersion } from "@/lib/playable-version";
import type { ProjectFeedbackEntry } from "@/lib/supabase/user-engagement";

export type NurtureStepId = "read" | "improving" | "devlog" | "publish" | "wait";

export type NurtureStepVisualState = "done" | "now" | "next" | "upcoming";

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
  latestFeedbackId?: string;
  earlySteps: GrowthStepChip[];
  pastCycles: PastCycleSummary[];
  playableVersion: string;
  lastUpdatedLabel: string;
  devlogCount: number;
  latestDevlogTitle?: string;
  pendingFeedbackCount: number;
  totalFeedbackCount: number;
  needsAttention: boolean;
  cyclePrevious?: string;
  cycleCurrent?: string;
};

export const NURTURE_STEPS: { id: NurtureStepId; label: string; shortLabel: string }[] = [
  { id: "read", label: "FBを読む", shortLabel: "読む" },
  { id: "improving", label: "改善中", shortLabel: "改善中" },
  { id: "devlog", label: "開発ログを書く", shortLabel: "devlog" },
  { id: "publish", label: "新版公開する", shortLabel: "公開" },
  { id: "wait", label: "反応を待つ", shortLabel: "待つ" },
];

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

function feedbackForProject(
  projectId: string,
  entries: ProjectFeedbackEntry[],
): ProjectFeedbackEntry[] {
  return entries
    .filter((entry) => entry.projectId === projectId)
    .sort(
      (a, b) =>
        new Date(b.item.createdAt).getTime() -
        new Date(a.item.createdAt).getTime(),
    );
}

function devlogsForProject(
  projectId: string,
  getDevlogsByProject: (projectId: string) => DevlogEntry[],
): DevlogEntry[] {
  return sortDevlogsNewestFirst(getDevlogsByProject(projectId));
}

function isFeedbackPendingDevlog(
  latestFeedback: ProjectFeedbackEntry | undefined,
  latestDevlog: DevlogEntry | undefined,
): boolean {
  if (!latestFeedback) {
    return false;
  }

  if (!latestDevlog) {
    return true;
  }

  return (
    new Date(latestFeedback.item.createdAt).getTime() >
    new Date(latestDevlog.date).getTime()
  );
}

function countPublishedDevlogs(devlogs: DevlogEntry[]): number {
  return devlogs.filter((entry) => entry.publishedVersion).length;
}

function buildEarlySteps(hasFeedback: boolean): GrowthStepChip[] {
  return [
    { id: "submit", label: "投稿", done: true, active: false },
    { id: "discover", label: "発見", done: true, active: false },
    {
      id: "play",
      label: "プレイ",
      done: hasFeedback,
      active: !hasFeedback,
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

export function buildNurtureDisplayContext(
  snapshot: ProjectGrowthSnapshot,
  feedbackRead: boolean,
  gameId: string,
): NurtureDisplayContext {
  switch (snapshot.dataPhase) {
    case "no_feedback":
      return {
        nowStepId: "wait",
        nextStepId: "wait",
        heroTitle: "反応を待つ",
        heroSubline: "プレイヤーの声を待っています",
        primaryCta: {
          label: "作品ページを確認する",
          href: `/games/${gameId}`,
        },
        primaryOpensReadPanel: false,
        loopActive: false,
        newFeedbackArrived: false,
      };

    case "feedback_pending":
      if (!feedbackRead) {
        return {
          nowStepId: null,
          nextStepId: "read",
          heroTitle: "FBを読む",
          heroSubline: snapshot.loopActive
            ? `${snapshot.cycleNumber} 周目 · また声が届きました`
            : "プレイヤーの声を読みましょう",
          primaryCta: {
            label: "FBを読む",
            href: `#project-${gameId}-detail`,
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
        heroSubline: "改善が終わったら記録しましょう",
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
        heroTitle: "反応を待つ",
        heroSubline: "プレイヤーの再プレイと新しい声を待っています",
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
  feedbackEntries: ProjectFeedbackEntry[],
  getDevlogsByProject: (projectId: string) => DevlogEntry[],
): ProjectGrowthSnapshot {
  const projectFeedback = feedbackForProject(game.id, feedbackEntries);
  const devlogs = devlogsForProject(game.id, getDevlogsByProject);
  const latestFeedback = projectFeedback[0];
  const latestDevlog = devlogs[0];
  const previousDevlog = devlogs[1];
  const playableVersion = resolvePlayableVersion(game.playableVersion);
  const lastUpdatedLabel = game.lastUpdated || game.createdAt || "—";
  const pendingFeedbackCount = isFeedbackPendingDevlog(latestFeedback, latestDevlog)
    ? 1
    : 0;
  const publishedCount = countPublishedDevlogs(devlogs);
  const pastCycles = buildPastCycles(devlogs, publishedCount);

  if (projectFeedback.length === 0) {
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
      totalFeedbackCount: 0,
      needsAttention: false,
    };
  }

  if (isFeedbackPendingDevlog(latestFeedback, latestDevlog)) {
    const cycleNumber = Math.max(1, publishedCount + 1);

    return {
      dataPhase: "feedback_pending",
      cycleNumber,
      loopActive: publishedCount >= 1,
      latestFeedbackId: latestFeedback.item.id,
      earlySteps: buildEarlySteps(true),
      pastCycles,
      playableVersion,
      lastUpdatedLabel,
      devlogCount: devlogs.length,
      latestDevlogTitle: latestDevlog?.title,
      pendingFeedbackCount,
      totalFeedbackCount: projectFeedback.length,
      needsAttention: true,
      cyclePrevious: previousDevlog?.title,
      cycleCurrent: latestDevlog?.title ?? "（FB 受領後）",
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
      totalFeedbackCount: projectFeedback.length,
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
    totalFeedbackCount: projectFeedback.length,
    needsAttention: false,
    cyclePrevious: previousDevlog?.title,
    cycleCurrent: latestDevlog?.title,
  };
}

export function sortProjectsForGrowthHub(
  games: Game[],
  feedbackEntries: ProjectFeedbackEntry[],
  getDevlogsByProject: (projectId: string) => DevlogEntry[],
): Game[] {
  return [...games].sort((a, b) => {
    const aSnapshot = buildProjectGrowthSnapshot(
      a,
      feedbackEntries,
      getDevlogsByProject,
    );
    const bSnapshot = buildProjectGrowthSnapshot(
      b,
      feedbackEntries,
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
