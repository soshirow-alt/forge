"use client";

/**
 * 今周 FB の読了状態 hook。
 *
 * 依存方向: UI → hook → store → persistence
 * UI コンポーネントは localStorage / store を直接参照しない。
 *
 * 暫定 localStorage → 将来 DB 化予定
 *
 * @see docs/p1-2-7-feedback-read-state.md
 */

import { useCallback, useEffect, useState } from "react";
import { feedbackReadStore } from "@/lib/nurture-feedback-read-store";

export function useNurtureFeedbackRead(
  projectId: string,
  feedbackId: string | undefined,
) {
  const [isRead, setIsRead] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!feedbackId) {
      setIsRead(false);
      setReady(true);
      return;
    }

    setIsRead(feedbackReadStore.getIsRead(projectId, feedbackId));
    setReady(true);
  }, [projectId, feedbackId]);

  const markRead = useCallback(() => {
    if (!feedbackId) {
      return;
    }

    feedbackReadStore.markRead(projectId, feedbackId);
    setIsRead(true);
  }, [projectId, feedbackId]);

  return { isRead, markRead, ready };
}
