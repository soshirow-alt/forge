/**
 * Voice 読了状態 — ドメイン store
 *
 * キー: projectId + playableVersion（voice 版単位）
 * 暫定 localStorage → 将来 DB 化予定
 */

import { voiceReadLocalPersistence } from "@/lib/nurture-persistence/voice-read-local";

export type VoiceReadStore = {
  getIsRead: (projectId: string, versionKey: string) => boolean;
  markRead: (projectId: string, versionKey: string) => void;
};

export const voiceReadStore: VoiceReadStore = {
  getIsRead: (projectId, versionKey) =>
    voiceReadLocalPersistence.getIsRead(projectId, versionKey),

  markRead: (projectId, versionKey) =>
    voiceReadLocalPersistence.markRead(projectId, versionKey),
};
