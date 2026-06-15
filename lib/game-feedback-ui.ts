export const GAME_VOICE_SECTION_ID = "game-voice-section";

export const GAME_DEEP_FEEDBACK_ENTRY_ID = "game-deep-feedback-entry";

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
