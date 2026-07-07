export type ProjectReleaseStatus =
  | "in_development"
  | "released"
  | "release_reopened";

export type ProjectReleaseEventType = "released" | "release_reopened";

export type ProjectReleaseEventSource = "studio" | "onboarding";

export type ProjectReleaseEvent = {
  id: string;
  projectId: string;
  eventType: ProjectReleaseEventType;
  actorUserId: string;
  note: string | null;
  source: ProjectReleaseEventSource;
  createdAt: string;
};

export const RELEASE_STATUS_LABELS: Record<ProjectReleaseStatus, string> = {
  in_development: "開発中",
  released: "正式ver",
  release_reopened: "正式ver再調整中",
};

export const RELEASE_EVENT_LABELS: Record<ProjectReleaseEventType, string> = {
  released: "Released — 正式verとして宣言",
  release_reopened: "Release Reopened — 正式verを再調整",
};

export function releaseStatusAfterEvent(
  eventType: ProjectReleaseEventType,
): ProjectReleaseStatus {
  return eventType === "released" ? "released" : "release_reopened";
}

export function deriveReleaseStatusFromEvents(
  events: ProjectReleaseEvent[],
  fallback: ProjectReleaseStatus = "in_development",
): ProjectReleaseStatus {
  if (events.length === 0) {
    return fallback;
  }

  const sorted = [...events].sort(
    (left, right) =>
      new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime(),
  );

  return releaseStatusAfterEvent(sorted[sorted.length - 1]!.eventType);
}

export function getFirstReleasedEvent(
  events: ProjectReleaseEvent[],
): ProjectReleaseEvent | null {
  const released = events
    .filter((event) => event.eventType === "released")
    .sort(
      (left, right) =>
        new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime(),
    );

  return released[0] ?? null;
}

export function hasEverReachedOfficialRelease(events: ProjectReleaseEvent[]): boolean {
  return events.some((event) => event.eventType === "released");
}

export type ReleaseDeclarationValidation =
  | { ok: true }
  | { ok: false; reason: string };

export function validateReleasedDeclaration(input: {
  devlogCount: number;
  playableVersion: string | undefined | null;
  currentStatus: ProjectReleaseStatus;
}): ReleaseDeclarationValidation {
  if (!input.playableVersion?.trim()) {
    return { ok: false, reason: "プレイ可能verが設定されていません。" };
  }

  if (input.devlogCount < 1) {
    return {
      ok: false,
      reason: "開発ログが 1 件以上必要です（育成の記録を残してから宣言してください）。",
    };
  }

  if (input.currentStatus === "released") {
    return { ok: false, reason: "すでに正式verとして宣言済みです。" };
  }

  return { ok: true };
}

export function validateReleaseReopenedDeclaration(input: {
  currentStatus: ProjectReleaseStatus;
}): ReleaseDeclarationValidation {
  if (input.currentStatus !== "released") {
    return {
      ok: false,
      reason: "正式verとして宣言されている作品のみ、再調整を開始できます。",
    };
  }

  return { ok: true };
}

export function formatReleaseTimelineLabel(event: ProjectReleaseEvent): string {
  if (event.eventType === "released") {
    return "正式verに到達 — 開発者が Released を宣言";
  }

  return "正式verを再調整 — Release Reopened";
}

/** 見届け人判定用 — 初回 Released より前にプレイしていたか */
export function wasActiveBeforeFirstRelease(input: {
  firstPlayedAt: string | null;
  firstReleasedAt: string | null;
}): boolean {
  if (!input.firstPlayedAt || !input.firstReleasedAt) {
    return false;
  }

  return (
    new Date(input.firstPlayedAt).getTime() <=
    new Date(input.firstReleasedAt).getTime()
  );
}
