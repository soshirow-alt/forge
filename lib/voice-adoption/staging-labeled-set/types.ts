import type { MatcherCandidate, MatcherDevlogInput } from "@/lib/voice-adoption/types";

export type StagingLabeledCategory = "direct" | "indirect" | "reject";

export type StagingLabeledCase = {
  id: string;
  category: StagingLabeledCategory;
  label: string;
  devlog: MatcherDevlogInput;
  candidate: MatcherCandidate;
  /** 採用すべきか（direct/indirect=true, reject=false） */
  shouldAdopt: boolean;
  /** 採用時の match_type 期待（reject は none） */
  expectedMatchType: "direct" | "indirect" | "none";
  /** Explanation Quality 目視用 — 採用時にプレイヤーが納得する文言の参考 */
  referenceUpdateSummary?: string;
  /** 目視レビュー観点メモ */
  explanationNote?: string;
};
