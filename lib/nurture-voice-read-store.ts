/**
 * Voice 読了状態 — ドメイン store（Supabase 正本）
 *
 * UI は useNurtureVoiceRead 経由で Supabase を使用。
 * localStorage 実装は後方互換のため残置（未使用）。
 */

export type VoiceReadStore = {
  getIsRead: (projectId: string, versionKey: string) => boolean;
  markRead: (projectId: string, versionKey: string) => void;
};

/** @deprecated Supabase project_voice_reads を useNurtureVoiceRead で使用 */
export const voiceReadStore: VoiceReadStore = {
  getIsRead: () => false,
  markRead: () => {},
};
