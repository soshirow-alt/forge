/**
 * FB 読了 — localStorage persistence（暫定）
 *
 * 依存: store のみが参照。UI / hook から直接 import しない。
 * 将来: Supabase persistence に差し替え。
 *
 * 暫定 localStorage → 将来 DB 化予定
 */

import {
  FEEDBACK_READ_VALUE,
  projectFeedbackReadKey,
} from "@/lib/nurture-persistence/local-storage-keys";

export type FeedbackReadPersistence = {
  getIsRead: (projectId: string, feedbackId: string) => boolean;
  markRead: (projectId: string, feedbackId: string) => void;
};

export const feedbackReadLocalPersistence: FeedbackReadPersistence = {
  getIsRead(projectId, feedbackId) {
    if (typeof window === "undefined") {
      return false;
    }

    try {
      return (
        localStorage.getItem(projectFeedbackReadKey(projectId, feedbackId)) ===
        FEEDBACK_READ_VALUE
      );
    } catch {
      return false;
    }
  },

  markRead(projectId, feedbackId) {
    if (typeof window === "undefined") {
      return;
    }

    try {
      localStorage.setItem(
        projectFeedbackReadKey(projectId, feedbackId),
        FEEDBACK_READ_VALUE,
      );
    } catch {
      // ignore quota errors
    }
  },
};
