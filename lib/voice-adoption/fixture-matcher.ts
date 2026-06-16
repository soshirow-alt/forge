import { ADOPTION_THRESHOLD } from "@/lib/voice-adoption/constants";
import { filterAdoptableMatcherMatches } from "@/lib/voice-adoption/adoption-match-eval";
import { FIXTURE_PAIR_EXPECTATIONS } from "@/lib/voice-adoption/fixture-data";
import type {
  MatcherCandidate,
  MatcherDevlogInput,
  MatcherMatchResult,
  MatcherOutput,
} from "@/lib/voice-adoption/types";

function normalizeText(value: string): string {
  return value.trim().toLowerCase();
}

function buildPlayerQuote(candidate: MatcherCandidate): string {
  const label = candidate.answerLabel?.trim();
  if (label) {
    return label.length > 40 ? `${label.slice(0, 39)}…` : label;
  }

  return candidate.answerValue.slice(0, 40);
}

function resolvePairUpdateSummary(
  voiceResponseId: string,
  related: boolean,
): string {
  const expectation = FIXTURE_PAIR_EXPECTATIONS.find(
    (entry) => entry.id === voiceResponseId,
  );

  if (expectation?.updateSummary) {
    return expectation.updateSummary;
  }

  return related ? "変更を反映" : "";
}

function scoreCandidate(
  devlog: MatcherDevlogInput,
  candidate: MatcherCandidate,
): {
  related: boolean;
  confidence: number;
  playerQuote: string;
  matchType: "direct" | "indirect" | "none";
} {
  const playerQuote = buildPlayerQuote(candidate);
  const haystack = normalizeText(`${devlog.title}\n${devlog.content}`);
  const needle = normalizeText(playerQuote);

  const expectation = FIXTURE_PAIR_EXPECTATIONS.find(
    (entry) => entry.id === candidate.voiceResponseId,
  );

  if (expectation) {
    if (expectation.category === "grey") {
      return {
        related: false,
        confidence: 0.78,
        playerQuote: expectation.playerQuote,
        matchType: "none",
      };
    }

    if (expectation.shouldAdopt) {
      return {
        related: true,
        confidence: 0.91,
        playerQuote: expectation.playerQuote,
        matchType: "direct",
      };
    }

    return {
      related: false,
      confidence: 0.15,
      playerQuote: expectation.playerQuote,
      matchType: "none",
    };
  }

  const keywordHit =
    needle.length > 0 &&
    haystack.includes(needle.slice(0, Math.min(needle.length, 6)));

  if (keywordHit) {
    return {
      related: true,
      confidence: 0.88,
      playerQuote,
      matchType: "direct",
    };
  }

  return {
    related: false,
    confidence: 0.2,
    playerQuote,
    matchType: "none",
  };
}

/** Deterministic matcher for staging / fixture — no OpenAI */
export function runFixtureMatcher(
  devlog: MatcherDevlogInput,
  candidates: MatcherCandidate[],
): MatcherOutput {
  const matches: MatcherMatchResult[] = candidates.map((candidate) => {
    const scored = scoreCandidate(devlog, candidate);
    return {
      voiceResponseId: candidate.voiceResponseId,
      related: scored.related,
      confidence: scored.confidence,
      playerQuote: scored.playerQuote,
      updateSummary: resolvePairUpdateSummary(
        candidate.voiceResponseId,
        scored.related,
      ),
      matchType: scored.matchType,
    };
  });

  return { matches };
}

export function filterAdoptableMatches(output: MatcherOutput): MatcherMatchResult[] {
  return filterAdoptableMatcherMatches(output.matches);
}

export type PrecisionReport = {
  precision: number;
  recall: number;
  adoptedCount: number;
  expectedAdoptCount: number;
  falsePositives: string[];
  falseNegatives: string[];
  rows: {
    voiceResponseId: string;
    label: string;
    expected: boolean;
    adopted: boolean;
    confidence: number;
    correct: boolean;
  }[];
};

export function evaluateFixturePrecision(output: MatcherOutput): PrecisionReport {
  const adoptable = filterAdoptableMatches(output);
  const adoptedIds = new Set(adoptable.map((match) => match.voiceResponseId));

  const falsePositives: string[] = [];
  const falseNegatives: string[] = [];

  const rows = FIXTURE_PAIR_EXPECTATIONS.map((expectation) => {
    const adopted = adoptedIds.has(expectation.id);
    const match = output.matches.find((entry) => entry.voiceResponseId === expectation.id);
    const confidence = match?.confidence ?? 0;
    const correct = adopted === expectation.shouldAdopt;

    if (adopted && !expectation.shouldAdopt) {
      falsePositives.push(expectation.label);
    }

    if (!adopted && expectation.shouldAdopt) {
      falseNegatives.push(expectation.label);
    }

    return {
      voiceResponseId: expectation.id,
      label: expectation.label,
      expected: expectation.shouldAdopt,
      adopted,
      confidence,
      correct,
    };
  });

  const expectedAdoptCount = FIXTURE_PAIR_EXPECTATIONS.filter(
    (entry) => entry.shouldAdopt,
  ).length;

  const precision =
    adoptable.length === 0 ? 1 : (adoptable.length - falsePositives.length) / adoptable.length;

  const recall =
    expectedAdoptCount === 0
      ? 1
      : (expectedAdoptCount - falseNegatives.length) / expectedAdoptCount;

  return {
    precision,
    recall,
    adoptedCount: adoptable.length,
    expectedAdoptCount,
    falsePositives,
    falseNegatives,
    rows,
  };
}
