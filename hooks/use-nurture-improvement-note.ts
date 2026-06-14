"use client";

/**
 * 改善中メモ hook（今周 FB に紐づく）。
 *
 * 依存方向: UI → hook → store → persistence
 *
 * 暫定 localStorage → 将来 DB 化予定
 */

import { useCallback, useEffect, useState } from "react";
import { improvementNoteStore } from "@/lib/nurture-improvement-note-store";

export function useNurtureImprovementNote(
  projectId: string,
  feedbackId: string | undefined,
) {
  const [note, setNote] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!feedbackId) {
      setNote("");
      setReady(true);
      return;
    }

    setNote(improvementNoteStore.getNote(projectId, feedbackId));
    setReady(true);
  }, [projectId, feedbackId]);

  const updateNote = useCallback(
    (value: string) => {
      setNote(value);

      if (!feedbackId) {
        return;
      }

      improvementNoteStore.saveNote(projectId, feedbackId, value);
    },
    [projectId, feedbackId],
  );

  return { note, updateNote, ready };
}
