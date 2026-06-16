import {
  isVoiceAdoptionFixtureMode,
  isVoiceAdoptionMatcherFixtureMode,
  VOICE_ADOPTION_MAX_CANDIDATES,
} from "@/lib/voice-adoption/constants";
import {
  FIXTURE_CANDIDATES,
  FIXTURE_DEVLOG,
} from "@/lib/voice-adoption/fixture-data";
import {
  filterAdoptableMatches,
  runFixtureMatcher,
} from "@/lib/voice-adoption/fixture-matcher";
import type {
  MatcherCandidate,
  MatcherDevlogInput,
  MatcherOutput,
} from "@/lib/voice-adoption/types";
import { isVoiceVersionAtOrBeforePlayable } from "@/lib/playable-version";

export type MatcherMode = "fixture" | "live";

export function resolveMatcherMode(): MatcherMode {
  if (isVoiceAdoptionMatcherFixtureMode()) {
    return "fixture";
  }

  return "live";
}

export function applyVoiceAdoptionCandidateCap(
  candidates: MatcherCandidate[],
  maxCandidates: number = VOICE_ADOPTION_MAX_CANDIDATES,
): MatcherCandidate[] {
  if (candidates.length <= maxCandidates) {
    return candidates;
  }

  return [...candidates]
    .sort(
      (left, right) =>
        new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
    )
    .slice(0, maxCandidates);
}

export function filterCandidatesForDevlog(
  devlog: MatcherDevlogInput,
  candidates: MatcherCandidate[],
): MatcherCandidate[] {
  const devlogCreated = new Date(devlog.publishedAt ?? devlog.createdAt).getTime();

  const filtered = candidates.filter((candidate) => {
    if (candidate.projectId !== devlog.projectId) {
      return false;
    }

    if (!isVoiceVersionAtOrBeforePlayable(candidate.versionKey, devlog.publishedVersion)) {
      return false;
    }

    return new Date(candidate.createdAt).getTime() < devlogCreated;
  });

  return applyVoiceAdoptionCandidateCap(filtered);
}

export async function runVoiceAdoptionMatcher(
  devlog: MatcherDevlogInput,
  candidates: MatcherCandidate[],
): Promise<MatcherOutput> {
  const filtered = filterCandidatesForDevlog(devlog, candidates);
  const mode = resolveMatcherMode();

  if (mode === "fixture") {
    return runFixtureMatcher(devlog, filtered);
  }

  throw new Error(
    "Live OpenAI matcher is not enabled. Set VOICE_ADOPTION_MATCHER_MODE=fixture for staging.",
  );
}

export function getAdoptableMatches(output: MatcherOutput) {
  return filterAdoptableMatches(output);
}

export function getFixtureMatcherSelfTestInput() {
  return {
    devlog: FIXTURE_DEVLOG,
    candidates: FIXTURE_CANDIDATES,
  };
}

export function isFixtureModeEnabled(): boolean {
  return isVoiceAdoptionFixtureMode();
}
