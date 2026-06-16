import { wasActiveBeforeFirstRelease } from "@/lib/project-release-state";

/** W2 migration 014 の grant_path と一致させる */
export type WitnessGrantPath = "multi_version" | "voice" | "watch";

export type WitnessPlaySession = {
  versionKey: string;
  playedAt: string;
};

export type WitnessVoiceResponse = {
  createdAt: string;
};

export type WitnessEligibilityInput = {
  userId: string;
  ownerId: string;
  firstReleasedAt: string | null;
  firstPlayedAt: string | null;
  sessionsBeforeRelease: WitnessPlaySession[];
  voicesBeforeRelease: WitnessVoiceResponse[];
  watchCreatedAt: string | null;
};

export type WitnessPathEvaluation = {
  path: WitnessGrantPath;
  label: string;
  met: boolean;
  detail: string;
};

export type WitnessEligibilityResult = {
  eligible: boolean;
  grantPath: WitnessGrantPath | null;
  /** 複数 path 成立時の優先順位付き一覧（監査用） */
  matchedPaths: WitnessGrantPath[];
  paths: WitnessPathEvaluation[];
  rejectionReason: string | null;
};

const PATH_LABELS: Record<WitnessGrantPath, string> = {
  multi_version: "A — 2 バージョン以上プレイ",
  voice: "B — voice 1 件以上",
  watch: "C' — watch + play session 2 回以上",
};

const PATH_PRIORITY: WitnessGrantPath[] = ["multi_version", "voice", "watch"];

export function isOnOrBeforeCutoff(
  timestamp: string,
  cutoffIso: string,
): boolean {
  return new Date(timestamp).getTime() <= new Date(cutoffIso).getTime();
}

export function countDistinctVersions(
  sessions: WitnessPlaySession[],
): number {
  return new Set(sessions.map((session) => session.versionKey)).size;
}

export function evaluateWitnessPaths(input: {
  sessionsBeforeRelease: WitnessPlaySession[];
  voicesBeforeRelease: WitnessVoiceResponse[];
  watchCreatedAt: string | null;
}): WitnessPathEvaluation[] {
  const versionCount = countDistinctVersions(input.sessionsBeforeRelease);
  const sessionCount = input.sessionsBeforeRelease.length;
  const voiceCount = input.voicesBeforeRelease.length;
  const hasWatch = input.watchCreatedAt !== null;

  return [
    {
      path: "multi_version",
      label: PATH_LABELS.multi_version,
      met: versionCount >= 2,
      detail: `distinct version_key = ${versionCount}`,
    },
    {
      path: "voice",
      label: PATH_LABELS.voice,
      met: voiceCount >= 1,
      detail: `voice responses = ${voiceCount}`,
    },
    {
      path: "watch",
      label: PATH_LABELS.watch,
      met: hasWatch && sessionCount >= 2,
      detail: `watch = ${hasWatch ? "yes" : "no"}, sessions = ${sessionCount}`,
    },
  ];
}

export function pickPrimaryGrantPath(
  matchedPaths: WitnessGrantPath[],
): WitnessGrantPath | null {
  for (const path of PATH_PRIORITY) {
    if (matchedPaths.includes(path)) {
      return path;
    }
  }

  return null;
}

export function evaluateWitnessEligibility(
  input: WitnessEligibilityInput,
): WitnessEligibilityResult {
  const paths = evaluateWitnessPaths({
    sessionsBeforeRelease: input.sessionsBeforeRelease,
    voicesBeforeRelease: input.voicesBeforeRelease,
    watchCreatedAt: input.watchCreatedAt,
  });

  if (input.userId === input.ownerId) {
    return {
      eligible: false,
      grantPath: null,
      matchedPaths: [],
      paths,
      rejectionReason: "開発者本人は対象外",
    };
  }

  if (!input.firstReleasedAt) {
    return {
      eligible: false,
      grantPath: null,
      matchedPaths: [],
      paths,
      rejectionReason: "初回 Released イベントなし",
    };
  }

  if (
    !wasActiveBeforeFirstRelease({
      firstPlayedAt: input.firstPlayedAt,
      firstReleasedAt: input.firstReleasedAt,
    })
  ) {
    return {
      eligible: false,
      grantPath: null,
      matchedPaths: [],
      paths,
      rejectionReason: "初回 Released 前のプレイなし",
    };
  }

  const matchedPaths = paths.filter((path) => path.met).map((path) => path.path);

  if (matchedPaths.length === 0) {
    return {
      eligible: false,
      grantPath: null,
      matchedPaths: [],
      paths,
      rejectionReason: "A / B / C' のいずれも未成立（1 回プレイのみ等）",
    };
  }

  return {
    eligible: true,
    grantPath: pickPrimaryGrantPath(matchedPaths),
    matchedPaths,
    paths,
    rejectionReason: null,
  };
}

export function formatWitnessEligibilitySummary(
  result: WitnessEligibilityResult,
): string {
  if (result.eligible && result.grantPath) {
    const others =
      result.matchedPaths.length > 1
        ? ` (+${result.matchedPaths.filter((path) => path !== result.grantPath).join(", ")})`
        : "";
    return `eligible — grant_path=${result.grantPath}${others}`;
  }

  return `ineligible — ${result.rejectionReason ?? "unknown"}`;
}
