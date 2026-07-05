import type { ReplayIntent } from "@/lib/game-feedback-storage";

export type GuestVoiceAnswerInput = {
  promptId: string;
  answerValue: string;
  answerLabel?: string;
};

export type PostGuestVoiceRequest = {
  versionKey: string;
  answers: GuestVoiceAnswerInput[];
};

export type SavedGuestVoiceAnswer = {
  id: string;
  promptId: string;
  createdAt: string;
  updatedAt: string;
};

export type PostGuestVoiceResponseBody = {
  submitterKey: string;
  saved: SavedGuestVoiceAnswer[];
};

export type GuestDetailedFeedbackInput = {
  versionKey: string;
  goodPoints?: string;
  concerns?: string;
  bugs?: string;
  otherNotes?: string;
  focusResponse?: string;
  wouldReplay?: ReplayIntent;
};

export type PostGuestFeedbackResponseBody = {
  submitterKey: string;
  feedback: {
    id: string;
    versionKey: string;
    createdAt: string;
    updatedAt: string;
  };
};

export type BootstrapSubmitterResponseBody = {
  submitterKey: string;
  issued: boolean;
};

export type PublicProjectContext = {
  projectId: string;
  playableVersion: string;
  visibility: string;
};

export type GuestPromptRecord = {
  id: string;
  projectId: string;
  versionKey: string;
  promptText: string;
  responseKind: string;
  options: { id: string; label: string }[] | null;
  archivedAt: string | null;
};
