import type { VersionPrompt } from "@/lib/version-prompt-types";

export type PlayerVoiceFlowState =
  | "not_played"
  | "played_pending"
  | "voice_complete";

type DerivePlayerVoiceFlowStateInput = {
  isLoggedIn: boolean;
  played: boolean;
  voiceComplete: boolean;
};

export function derivePlayerVoiceFlowState({
  isLoggedIn,
  played,
  voiceComplete,
}: DerivePlayerVoiceFlowStateInput): PlayerVoiceFlowState {
  if (!isLoggedIn || !played) {
    return "not_played";
  }

  if (voiceComplete) {
    return "voice_complete";
  }

  return "played_pending";
}

export function getFirstPromptPreview(prompts: VersionPrompt[]): string | null {
  const text = prompts[0]?.promptText?.trim();
  return text || null;
}
