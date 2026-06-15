export const GAME_VOICE_SECTION_ID = "game-voice-section";

export const GAME_DEEP_FEEDBACK_ENTRY_ID = "game-deep-feedback-entry";

/** @deprecated use GAME_VOICE_SECTION_ID */
export const GAME_FEEDBACK_SECTION_ID = GAME_VOICE_SECTION_ID;

export function scrollToGameVoiceSection() {
  document.getElementById(GAME_VOICE_SECTION_ID)?.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
}

export function scrollToGameDeepFeedbackEntry() {
  document.getElementById(GAME_DEEP_FEEDBACK_ENTRY_ID)?.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
}

/** @deprecated use scrollToGameVoiceSection */
export function scrollToGameFeedbackSection() {
  scrollToGameVoiceSection();
}
