/**
 * 改善メモ — localStorage persistence（暫定）
 *
 * 依存: store のみが参照。UI / hook から直接 import しない。
 * 将来: Supabase persistence に差し替え。
 *
 * 暫定 localStorage → 将来 DB 化予定
 */

import { projectImprovementNoteKey } from "@/lib/nurture-persistence/local-storage-keys";

export type ImprovementNotePersistence = {
  getNote: (projectId: string, feedbackId: string) => string;
  saveNote: (projectId: string, feedbackId: string, note: string) => void;
};

export const improvementNoteLocalPersistence: ImprovementNotePersistence = {
  getNote(projectId, feedbackId) {
    if (typeof window === "undefined") {
      return "";
    }

    try {
      return (
        localStorage.getItem(projectImprovementNoteKey(projectId, feedbackId)) ??
        ""
      );
    } catch {
      return "";
    }
  },

  saveNote(projectId, feedbackId, note) {
    if (typeof window === "undefined") {
      return;
    }

    try {
      localStorage.setItem(
        projectImprovementNoteKey(projectId, feedbackId),
        note,
      );
    } catch {
      // ignore quota errors
    }
  },
};
