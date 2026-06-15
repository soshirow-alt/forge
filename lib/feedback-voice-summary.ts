import type { ProjectFeedbackEntry } from "@/lib/supabase/user-engagement";
import { resolvePlayableVersion } from "@/lib/playable-version";

export type DeepFeedbackSummary = {
  title: string;
  lines: string[];
};

function truncateLine(text: string, maxLength = 52): string {
  const trimmed = text.trim();
  if (trimmed.length <= maxLength) {
    return trimmed;
  }

  return `${trimmed.slice(0, maxLength)}…`;
}

function feedbackVersionKey(versionKey: string | undefined): string {
  return resolvePlayableVersion(versionKey);
}

function sortNewestFirst(entries: ProjectFeedbackEntry[]): ProjectFeedbackEntry[] {
  return [...entries].sort(
    (a, b) =>
      new Date(b.item.createdAt).getTime() -
      new Date(a.item.createdAt).getTime(),
  );
}

/** 詳しい感想（project_feedback）向けサマリ — studio 副セクション用 */
export function buildDeepFeedbackSummary(
  entries: ProjectFeedbackEntry[],
  currentPlayableVersion: string,
): DeepFeedbackSummary {
  const currentVersion = resolvePlayableVersion(currentPlayableVersion);
  const sorted = sortNewestFirst(entries);
  const currentVersionEntries = sorted.filter(
    (entry) => feedbackVersionKey(entry.item.versionKey) === currentVersion,
  );

  if (currentVersionEntries.length === 0) {
    return {
      title: "詳しい感想（任意）",
      lines: ["この版向けの詳しい感想はまだありません。"],
    };
  }

  const lines: string[] = [`詳しい感想 ${currentVersionEntries.length}件`];

  const latestGood = currentVersionEntries.find((entry) =>
    entry.item.goodPoints?.trim(),
  );
  if (latestGood?.item.goodPoints?.trim()) {
    lines.push(`良かった点: ${truncateLine(latestGood.item.goodPoints)}`);
  }

  const latestConcern = currentVersionEntries.find((entry) =>
    entry.item.concerns?.trim(),
  );
  if (latestConcern?.item.concerns?.trim()) {
    lines.push(
      `気になった点: ${truncateLine(latestConcern.item.concerns)}`,
    );
  }

  const latestBug = currentVersionEntries.find((entry) =>
    entry.item.bugs?.trim(),
  );
  if (latestBug?.item.bugs?.trim()) {
    lines.push(`バグ: ${truncateLine(latestBug.item.bugs)}`);
  }

  const latestOther = currentVersionEntries.find((entry) =>
    entry.item.otherNotes?.trim(),
  );
  if (latestOther?.item.otherNotes?.trim()) {
    lines.push(`その他: ${truncateLine(latestOther.item.otherNotes)}`);
  }

  return {
    title: "詳しい感想（任意）",
    lines,
  };
}

/** @deprecated buildDeepFeedbackSummary を使用 */
export function buildFeedbackVoiceSummary(
  entries: ProjectFeedbackEntry[],
  currentPlayableVersion: string,
): DeepFeedbackSummary {
  return buildDeepFeedbackSummary(entries, currentPlayableVersion);
}

export type FeedbackVoiceSummary = DeepFeedbackSummary;
