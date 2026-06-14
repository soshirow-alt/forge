/**
 * localStorage key 命名 — 将来 Supabase テーブル名と対応させる。
 *
 * 暫定 localStorage → 将来 DB 化予定
 *
 * | localStorage key プレフィックス     | 将来テーブル（案）              |
 * |-----------------------------------|--------------------------------|
 * | project_feedback_reads            | project_feedback_reads         |
 * | project_improvement_notes         | project_improvement_notes      |
 */

export const NURTURE_PERSISTENCE_TABLES = {
  project_feedback_reads: "project_feedback_reads",
  project_improvement_notes: "project_improvement_notes",
} as const;

export function projectFeedbackReadKey(
  projectId: string,
  feedbackId: string,
): string {
  return `${NURTURE_PERSISTENCE_TABLES.project_feedback_reads}:${projectId}:${feedbackId}`;
}

export function projectImprovementNoteKey(
  projectId: string,
  feedbackId: string,
): string {
  return `${NURTURE_PERSISTENCE_TABLES.project_improvement_notes}:${projectId}:${feedbackId}`;
}

/** 読了フラグの stored value（DB 化時は read_at タイムスタンプ等に置換） */
export const FEEDBACK_READ_VALUE = "1";
