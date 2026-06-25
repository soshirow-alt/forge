import type { ProjectFeedbackEntry } from "@/lib/supabase/user-engagement";
import {
  bucketPercent,
  type VoicePromptAggregate,
} from "@/lib/voice-aggregates";

export type TopPriorityCategory = "bug" | "concern" | "voice" | "action";

export type TopPriority = {
  id: string;
  title: string;
  reason: string;
  category: TopPriorityCategory;
};

type ScoredCandidate = TopPriority & { score: number };

const NEGATIVE_SCALE_VALUES = new Set(["hard", "bad", "difficult", "難しい", "いまいち", "むずかしい"]);

function truncate(text: string, max = 48): string {
  const trimmed = text.trim();
  if (trimmed.length <= max) {
    return trimmed;
  }
  return `${trimmed.slice(0, max - 1)}…`;
}

function feedbackForVersion(
  entries: ProjectFeedbackEntry[],
  projectId: string,
  versionKey: string,
) {
  return entries.filter(
    (entry) =>
      entry.projectId === projectId &&
      entry.item.versionKey === versionKey,
  );
}

function bugCandidates(
  entries: ProjectFeedbackEntry[],
  projectId: string,
  versionKey: string,
): ScoredCandidate[] {
  const versionEntries = feedbackForVersion(entries, projectId, versionKey);
  const withBugs = versionEntries.filter((entry) => entry.item.bugs?.trim());

  if (withBugs.length === 0) {
    return [];
  }

  const top = withBugs[0]!;
  return [
    {
      id: "bug-summary",
      title: truncate(top.item.bugs!.trim()),
      reason: `バグ報告 ${withBugs.length}件`,
      category: "bug",
      score: withBugs.length * 10,
    },
  ];
}

function concernCandidates(
  entries: ProjectFeedbackEntry[],
  projectId: string,
  versionKey: string,
): ScoredCandidate[] {
  const versionEntries = feedbackForVersion(entries, projectId, versionKey);
  const withConcerns = versionEntries.filter((entry) => entry.item.concerns?.trim());

  if (withConcerns.length === 0) {
    return [];
  }

  const top = withConcerns[0]!;
  return [
    {
      id: "concern-summary",
      title: truncate(top.item.concerns!.trim()),
      reason: `気になる点 ${withConcerns.length}件`,
      category: "concern",
      score: withConcerns.length * 8,
    },
  ];
}

function voiceNegativeCandidates(aggregates: VoicePromptAggregate[]): ScoredCandidate[] {
  const candidates: ScoredCandidate[] = [];

  for (const aggregate of aggregates) {
    if (aggregate.totalResponses === 0) {
      continue;
    }

    if (aggregate.responseKind === "yes_no") {
      const no = aggregate.buckets.find((bucket) => bucket.answerValue === "no");
      if (no && no.count > 0) {
        const pct = bucketPercent(no.count, aggregate.totalResponses);
        candidates.push({
          id: `voice-no-${aggregate.promptId}`,
          title: truncate(aggregate.promptText),
          reason: `否定的な回答 ${no.count}件（${pct}%）`,
          category: "voice",
          score: no.count * 5 + pct,
        });
      }
      continue;
    }

    if (aggregate.responseKind === "scale_3") {
      const negative = aggregate.buckets.find(
        (bucket) =>
          NEGATIVE_SCALE_VALUES.has(bucket.answerValue) ||
          NEGATIVE_SCALE_VALUES.has(bucket.answerLabel),
      );
      if (negative && negative.count > 0) {
        const pct = bucketPercent(negative.count, aggregate.totalResponses);
        if (pct >= 25) {
          candidates.push({
            id: `voice-scale-${aggregate.promptId}`,
            title: truncate(`${aggregate.promptText} — ${negative.answerLabel}`),
            reason: `「${negative.answerLabel}」${negative.count}件（${pct}%）`,
            category: "voice",
            score: negative.count * 4 + pct,
          });
        }
      }
      continue;
    }

    if (aggregate.responseKind === "choice" || aggregate.responseKind === "replay_intent") {
      const sorted = [...aggregate.buckets].sort((a, b) => b.count - a.count);
      const top = sorted[0];
      const second = sorted[1];
      if (top && second && second.count > 0) {
        const secondPct = bucketPercent(second.count, aggregate.totalResponses);
        if (secondPct >= 30) {
          candidates.push({
            id: `voice-split-${aggregate.promptId}`,
            title: truncate(`${aggregate.promptText} — ${second.answerLabel}`),
            reason: `「${second.answerLabel}」${second.count}件（${secondPct}%）`,
            category: "voice",
            score: second.count * 3 + secondPct,
          });
        }
      }
    }
  }

  return candidates;
}

function unreadCandidate(
  hasUnreadVoice: boolean,
  pendingFeedbackCount: number,
): ScoredCandidate | null {
  if (!hasUnreadVoice && pendingFeedbackCount <= 0) {
    return null;
  }

  const count = Math.max(pendingFeedbackCount, 1);
  return {
    id: "unread-voices",
    title: "新しいFBを確認する",
    reason: hasUnreadVoice
      ? `未読の回答があります`
      : `未処理のフィードバックがあります`,
    category: "action",
    score: 1,
  };
}

/**
 * P0 ルールベース — 開発者向け「次に直すこと」最大3件
 */
export function buildTopPriorities(input: {
  projectId: string;
  playableVersion: string;
  feedbackEntries: ProjectFeedbackEntry[];
  aggregates: VoicePromptAggregate[];
  pendingFeedbackCount: number;
  hasUnreadVoice: boolean;
}): TopPriority[] {
  const queue: ScoredCandidate[] = [
    ...bugCandidates(input.feedbackEntries, input.projectId, input.playableVersion),
    ...concernCandidates(input.feedbackEntries, input.projectId, input.playableVersion),
    ...voiceNegativeCandidates(input.aggregates),
  ];

  queue.sort((a, b) => b.score - a.score);

  const result: TopPriority[] = [];
  const usedCategories = new Set<TopPriorityCategory>();

  for (const candidate of queue) {
    if (result.length >= 3) {
      break;
    }
    if (candidate.category !== "voice" && usedCategories.has(candidate.category)) {
      continue;
    }
    usedCategories.add(candidate.category);
    result.push({
      id: candidate.id,
      title: candidate.title,
      reason: candidate.reason,
      category: candidate.category,
    });
  }

  if (result.length < 3) {
    const unread = unreadCandidate(input.hasUnreadVoice, input.pendingFeedbackCount);
    if (unread && !result.some((item) => item.id === unread.id)) {
      result.push({
        id: unread.id,
        title: unread.title,
        reason: unread.reason,
        category: unread.category,
      });
    }
  }

  return result.slice(0, 3);
}
