import type { ProjectFeedbackEntry } from "@/lib/supabase/user-engagement";
import { resolvePlayableVersion } from "@/lib/playable-version";

export type FeedbackVoiceSummary = {
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

export function buildFeedbackVoiceSummary(
  entries: ProjectFeedbackEntry[],
  currentPlayableVersion: string,
): FeedbackVoiceSummary {
  const currentVersion = resolvePlayableVersion(currentPlayableVersion);
  const sorted = sortNewestFirst(entries);

  if (sorted.length === 0) {
    return {
      title: "届いている声",
      lines: ["まだプレイヤーの声は届いていません。"],
    };
  }

  const currentVersionEntries = sorted.filter(
    (entry) => feedbackVersionKey(entry.item.versionKey) === currentVersion,
  );
  const hasOtherVersionFeedback = sorted.some(
    (entry) => feedbackVersionKey(entry.item.versionKey) !== currentVersion,
  );

  if (currentVersionEntries.length === 0 && hasOtherVersionFeedback) {
    return {
      title: "届いている声",
      lines: [
        `新版 v${currentVersion} 向けの声はまだありません。`,
        "プレイヤーの反応を待ちましょう。",
      ],
    };
  }

  if (currentVersionEntries.length === 0) {
    return {
      title: "届いている声",
      lines: ["まだプレイヤーの声は届いていません。"],
    };
  }

  const lines: string[] = [`回答 ${currentVersionEntries.length}件`];

  const replayAnswers = currentVersionEntries.filter(
    (entry) => entry.item.wouldReplay,
  );
  const replayYesCount = replayAnswers.filter(
    (entry) => entry.item.wouldReplay === "yes",
  ).length;
  if (replayAnswers.length > 0) {
    lines.push(`もう一度遊びたい ${replayYesCount}/${replayAnswers.length}`);
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
  } else {
    lines.push("バグ報告はまだありません");
  }

  const versionCounts = new Map<string, number>();
  for (const entry of sorted) {
    const version = feedbackVersionKey(entry.item.versionKey);
    versionCounts.set(version, (versionCounts.get(version) ?? 0) + 1);
  }
  if (versionCounts.size > 1) {
    const versionLine = [...versionCounts.entries()]
      .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
      .map(([version, count]) => `v${version} ${count}件`)
      .join(" · ");
    lines.push(`版別 ${versionLine}`);
  }

  return {
    title: "この版に届いた声",
    lines,
  };
}
