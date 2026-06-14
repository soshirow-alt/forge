/**
 * 改善メモ — ドメイン store
 *
 * 依存方向: UI → hook → store → persistence
 *
 * 正式仕様: DB 保存を検討（成長ループ履歴）
 * P1-2.7: persistence は localStorage 暫定
 *
 * 暫定 localStorage → 将来 DB 化予定
 *
 * @see docs/p1-2-7-feedback-read-state.md
 */

import { improvementNoteLocalPersistence } from "@/lib/nurture-persistence/improvement-note-local";

export type ImprovementNoteStore = {
  getNote: (projectId: string, feedbackId: string) => string;
  saveNote: (projectId: string, feedbackId: string, note: string) => void;
};

export const improvementNoteStore: ImprovementNoteStore = {
  getNote: (projectId, feedbackId) =>
    improvementNoteLocalPersistence.getNote(projectId, feedbackId),

  saveNote: (projectId, feedbackId, note) =>
    improvementNoteLocalPersistence.saveNote(projectId, feedbackId, note),
};
