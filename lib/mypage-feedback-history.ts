import {
  getFeedbackSummaryText,
  type GameFeedbackItem,
} from "@/lib/game-feedback-storage";
import type { UserVoiceHistoryRow } from "@/lib/supabase/user-voice-history-db";

export type FeedbackHistoryKind = "deep" | "voice";

export type FeedbackHistoryEntry = {
  /** Stable unique id — no duplicate renders */
  id: string;
  kind: FeedbackHistoryKind;
  projectId: string;
  createdAt: string;
  versionKey: string | null;
  kindLabel: string;
  summary: string;
  /** True only when an active voice_adoption row exists for this user+project */
  reflected: boolean;
  sourceIds: string[];
};

function truncate(text: string, max = 160): string {
  const trimmed = text.trim().replace(/\s+/g, " ");
  if (trimmed.length <= max) {
    return trimmed;
  }
  return `${trimmed.slice(0, max - 1)}…`;
}

function voiceGroupKey(row: UserVoiceHistoryRow): string {
  return `${row.projectId}::${row.versionKey}`;
}

/**
 * Build FB history rows:
 * - deep: one project_feedback row = one entry
 * - voice: one (project, version) answer set = one entry (same submit batch)
 */
export function buildFeedbackHistoryEntries(input: {
  deepFeedback: Array<GameFeedbackItem & { projectId: string }>;
  voiceRows: UserVoiceHistoryRow[];
  /** projectIds with an active adoption for this user */
  reflectedProjectIds: Set<string>;
}): FeedbackHistoryEntry[] {
  const entries: FeedbackHistoryEntry[] = [];
  const seen = new Set<string>();

  for (const item of input.deepFeedback) {
    const id = `deep:${item.id}`;
    if (seen.has(id)) {
      continue;
    }
    seen.add(id);
    entries.push({
      id,
      kind: "deep",
      projectId: item.projectId,
      createdAt: item.createdAt,
      versionKey: item.versionKey ?? null,
      kindLabel: "詳しい感想",
      summary: truncate(getFeedbackSummaryText(item)),
      reflected: input.reflectedProjectIds.has(item.projectId),
      sourceIds: [item.id],
    });
  }

  const voiceGroups = new Map<string, UserVoiceHistoryRow[]>();
  for (const row of input.voiceRows) {
    const key = voiceGroupKey(row);
    const list = voiceGroups.get(key) ?? [];
    list.push(row);
    voiceGroups.set(key, list);
  }

  for (const [, rows] of voiceGroups) {
    const sorted = [...rows].sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
    const first = sorted[0]!;
    const id = `voice:${first.projectId}:${first.versionKey}`;
    if (seen.has(id)) {
      continue;
    }
    seen.add(id);

    const parts: string[] = [];
    for (const row of sorted) {
      const answer = (row.answerLabel || row.answerValue || "").trim();
      if (answer) {
        parts.push(answer);
      }
      const comment = row.optionalComment?.trim();
      if (comment) {
        parts.push(comment);
      }
    }

    entries.push({
      id,
      kind: "voice",
      projectId: first.projectId,
      createdAt: first.createdAt,
      versionKey: first.versionKey || null,
      kindLabel: "選択回答",
      summary: truncate(parts.join(" · ") || "フィードバックを送信しました"),
      reflected: input.reflectedProjectIds.has(first.projectId),
      sourceIds: sorted.map((row) => row.id),
    });
  }

  entries.sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  return entries;
}
