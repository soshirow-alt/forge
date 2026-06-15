/**
 * Voice 読了 — localStorage persistence（暫定）
 *
 * キー: projectId + playableVersion
 * 将来: Supabase persistence に差し替え。
 */

import {
  FEEDBACK_READ_VALUE,
  projectVoiceReadKey,
} from "@/lib/nurture-persistence/local-storage-keys";

export type VoiceReadPersistence = {
  getIsRead: (projectId: string, versionKey: string) => boolean;
  markRead: (projectId: string, versionKey: string) => void;
};

export const voiceReadLocalPersistence: VoiceReadPersistence = {
  getIsRead(projectId, versionKey) {
    if (typeof window === "undefined") {
      return false;
    }

    try {
      return (
        localStorage.getItem(projectVoiceReadKey(projectId, versionKey)) ===
        FEEDBACK_READ_VALUE
      );
    } catch {
      return false;
    }
  },

  markRead(projectId, versionKey) {
    if (typeof window === "undefined") {
      return;
    }

    try {
      localStorage.setItem(
        projectVoiceReadKey(projectId, versionKey),
        FEEDBACK_READ_VALUE,
      );
    } catch {
      // ignore quota errors
    }
  },
};
