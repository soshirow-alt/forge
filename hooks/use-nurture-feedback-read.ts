"use client";

/**
 * 現行版 voice の読了状態 hook。
 *
 * キー: projectId + playableVersion
 * 暫定 localStorage → 将来 DB 化予定
 */

import { useCallback, useEffect, useState } from "react";
import { voiceReadStore } from "@/lib/nurture-voice-read-store";

export function useNurtureVoiceRead(
  projectId: string,
  versionKey: string | undefined,
) {
  const [isRead, setIsRead] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!versionKey) {
      setIsRead(false);
      setReady(true);
      return;
    }

    setIsRead(voiceReadStore.getIsRead(projectId, versionKey));
    setReady(true);
  }, [projectId, versionKey]);

  const markRead = useCallback(() => {
    if (!versionKey) {
      return;
    }

    voiceReadStore.markRead(projectId, versionKey);
    setIsRead(true);
  }, [projectId, versionKey]);

  return { isRead, markRead, ready };
}

/** @deprecated useNurtureVoiceRead を使用 */
export function useNurtureFeedbackRead(
  projectId: string,
  versionKey: string | undefined,
) {
  return useNurtureVoiceRead(projectId, versionKey);
}
