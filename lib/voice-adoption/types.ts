export type VoiceAdoptionStatus = "active" | "suppressed";

export type VoiceAdoptionSuppressionReason =
  | "player_dispute"
  | "devlog_retracted"
  | "admin";

export type VoiceAdoptionMatcherRunStatus =
  | "queued"
  | "running"
  | "completed"
  | "failed"
  | "skipped";

export type VoiceAdoptionRow = {
  id: string;
  projectId: string;
  userId: string;
  voiceResponseId: string;
  devlogId: string;
  voiceVersionKey: string;
  publishedVersion: string;
  playerQuote: string;
  updateSummary: string;
  promptText: string | null;
  confidence: number;
  model: string;
  modelVersion: string | null;
  matcherRunId: string;
  status: VoiceAdoptionStatus;
  suppressionReason: VoiceAdoptionSuppressionReason | null;
  createdAt: string;
  updatedAt: string;
};

export type VoiceAdoptionWithProject = VoiceAdoptionRow & {
  projectTitle: string;
};

export type MatcherCandidate = {
  voiceResponseId: string;
  userId: string;
  projectId: string;
  versionKey: string;
  promptText: string;
  answerValue: string;
  answerLabel: string | null;
  createdAt: string;
};

export type MatcherDevlogInput = {
  id: string;
  projectId: string;
  title: string;
  content: string;
  publishedVersion: string;
  publishedAt: string | null;
  createdAt: string;
};

export type MatcherMatchResult = {
  voiceResponseId: string;
  related: boolean;
  confidence: number;
  playerQuote: string;
  /** その回答に対応する変更内容（devlog 全体要約ではない） */
  updateSummary: string;
  matchType?: "direct" | "indirect" | "none";
  reason?: string;
};

export type MatcherOutput = {
  matches: MatcherMatchResult[];
};

export type FixturePairExpectation = {
  id: string;
  label: string;
  playerQuote: string;
  /** 採用時に voice_adoptions.update_summary へ保存するペア固有の変更内容 */
  updateSummary?: string;
  answerKeywords: string[];
  shouldAdopt: boolean;
  category: "related" | "unrelated" | "grey";
};
