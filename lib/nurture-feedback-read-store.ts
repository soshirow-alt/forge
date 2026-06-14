/**
 * FB 読了状態 — ドメイン store
 *
 * 依存方向: UI → hook → store → persistence
 *
 * 正式仕様: DB 保存（Supabase migration 後）
 * P1-2.7: persistence は localStorage 暫定 — 正式仕様ではない
 *
 * 暫定 localStorage → 将来 DB 化予定
 *
 * @see docs/p1-2-7-feedback-read-state.md
 */

import { feedbackReadLocalPersistence } from "@/lib/nurture-persistence/feedback-read-local";

export type FeedbackReadStore = {
  getIsRead: (projectId: string, feedbackId: string) => boolean;
  markRead: (projectId: string, feedbackId: string) => void;
};

/**
 * 読了状態 store。DB 化時は persistence 差し替えのみ。
 */
export const feedbackReadStore: FeedbackReadStore = {
  getIsRead: (projectId, feedbackId) =>
    feedbackReadLocalPersistence.getIsRead(projectId, feedbackId),

  markRead: (projectId, feedbackId) =>
    feedbackReadLocalPersistence.markRead(projectId, feedbackId),
};
