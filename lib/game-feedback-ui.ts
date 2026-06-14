export const GAME_VOICE_SECTION_ID = "game-voice-section";

/** @deprecated use GAME_VOICE_SECTION_ID */
export const GAME_FEEDBACK_SECTION_ID = GAME_VOICE_SECTION_ID;

export function scrollToGameVoiceSection() {
  document.getElementById(GAME_VOICE_SECTION_ID)?.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
}

/** @deprecated use scrollToGameVoiceSection */
export function scrollToGameFeedbackSection() {
  scrollToGameVoiceSection();
}
