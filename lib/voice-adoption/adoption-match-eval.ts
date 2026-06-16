import {
  ADOPTION_THRESHOLD,
  INDIRECT_ADOPTION_THRESHOLD,
  isAbstractUpdateSummary,
} from "@/lib/voice-adoption/constants";
import type { MatcherMatchResult } from "@/lib/voice-adoption/types";

export function isAdoptableMatch(match: MatcherMatchResult): boolean {
  if (!match.related) {
    return false;
  }

  const summary = match.updateSummary.trim();
  if (!summary || isAbstractUpdateSummary(summary)) {
    return false;
  }

  if (match.matchType === "indirect") {
    return match.confidence >= INDIRECT_ADOPTION_THRESHOLD;
  }

  if (match.matchType === "direct") {
    return match.confidence >= ADOPTION_THRESHOLD;
  }

  return match.confidence >= ADOPTION_THRESHOLD;
}

export function filterAdoptableMatcherMatches(
  matches: MatcherMatchResult[],
): MatcherMatchResult[] {
  return matches.filter(isAdoptableMatch);
}
