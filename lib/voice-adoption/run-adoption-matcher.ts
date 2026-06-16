import { filterAdoptableMatcherMatches } from "@/lib/voice-adoption/adoption-match-eval";
import { resolveServerMatcherMode } from "@/lib/voice-adoption/constants";
import { runFixtureMatcher } from "@/lib/voice-adoption/fixture-matcher";
import { filterCandidatesForDevlog } from "@/lib/voice-adoption/matcher";
import {
  getOpenAiMatcherModel,
  runOpenAiAdoptionMatcher,
} from "@/lib/voice-adoption/openai-matcher";
import type { MatcherOutput } from "@/lib/voice-adoption/types";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import {
  completeMatcherRun,
  createMatcherRun,
  fetchDevlogForMatcher,
  fetchVoiceCandidatesForMatcher,
  findExistingMatcherRun,
  insertAdoptionFromMatch,
  type MatcherRunSummary,
} from "@/lib/supabase/voice-adoption-matcher-db";

async function runMatcherEngine(
  mode: "fixture" | "live",
  devlog: Parameters<typeof filterCandidatesForDevlog>[0],
  filteredCandidates: Parameters<typeof runFixtureMatcher>[1],
): Promise<MatcherOutput> {
  if (mode === "fixture") {
    return runFixtureMatcher(devlog, filteredCandidates);
  }

  if (!process.env.OPENAI_API_KEY) {
    throw new Error(
      "Live matcher requires OPENAI_API_KEY. Set VOICE_ADOPTION_MATCHER_MODE=fixture for offline runs.",
    );
  }

  return runOpenAiAdoptionMatcher(devlog, filteredCandidates);
}

export async function runAdoptionMatcherForDevlog(
  devlogId: string,
): Promise<MatcherRunSummary> {
  const supabase = createServiceRoleClient();
  if (!supabase) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured");
  }

  const mode = resolveServerMatcherMode();
  const existing = await findExistingMatcherRun(supabase, devlogId);
  if (existing) {
    return {
      runId: existing.id,
      status: existing.status === "failed" ? "failed" : "skipped",
      candidateCount: 0,
      adoptedCount: 0,
      skippedBelowThreshold: 0,
      mode,
      matches: [],
    };
  }

  const context = await fetchDevlogForMatcher(supabase, devlogId);
  if (!context) {
    return {
      runId: "",
      status: "skipped",
      candidateCount: 0,
      adoptedCount: 0,
      skippedBelowThreshold: 0,
      mode,
      matches: [],
    };
  }

  const { devlog, contentHash } = context;
  const allCandidates = await fetchVoiceCandidatesForMatcher(
    supabase,
    devlog.projectId,
  );
  const filteredCandidates = filterCandidatesForDevlog(devlog, allCandidates);

  const model = mode === "live" ? getOpenAiMatcherModel() : "fixture";

  const runId = await createMatcherRun(supabase, {
    devlogId: devlog.id,
    projectId: devlog.projectId,
    devlogContentHash: contentHash,
    candidateCount: filteredCandidates.length,
    model,
  });

  if (filteredCandidates.length === 0) {
    await completeMatcherRun(supabase, runId, {
      status: "skipped",
      evaluatedCount: 0,
      adoptedCount: 0,
      skippedBelowThreshold: 0,
    });

    return {
      runId,
      status: "skipped",
      candidateCount: 0,
      adoptedCount: 0,
      skippedBelowThreshold: 0,
      mode,
      matches: [],
    };
  }

  try {
    const output = await runMatcherEngine(mode, devlog, filteredCandidates);
    const adoptable = filterAdoptableMatcherMatches(output.matches);
    const candidateById = new Map(
      filteredCandidates.map((candidate) => [candidate.voiceResponseId, candidate]),
    );

    let adoptedCount = 0;

    for (const match of adoptable) {
      const candidate = candidateById.get(match.voiceResponseId);
      if (!candidate) {
        continue;
      }

      try {
        await insertAdoptionFromMatch(supabase, {
          projectId: devlog.projectId,
          userId: candidate.userId,
          voiceResponseId: match.voiceResponseId,
          devlogId: devlog.id,
          voiceVersionKey: candidate.versionKey,
          publishedVersion: devlog.publishedVersion,
          playerQuote: match.playerQuote,
          updateSummary: match.updateSummary,
          promptText: candidate.promptText,
          confidence: match.confidence,
          model,
          matcherRunId: runId,
        });
        adoptedCount += 1;
      } catch (error) {
        const message =
          error && typeof error === "object" && "code" in error
            ? String(error.code)
            : "";
        if (message !== "23505") {
          throw error;
        }
      }
    }

    const skippedBelowThreshold = output.matches.length - adoptable.length;

    await completeMatcherRun(supabase, runId, {
      status: "completed",
      evaluatedCount: output.matches.length,
      adoptedCount,
      skippedBelowThreshold,
    });

    return {
      runId,
      status: "completed",
      candidateCount: filteredCandidates.length,
      adoptedCount,
      skippedBelowThreshold,
      mode,
      matches: output.matches,
    };
  } catch (error) {
    await completeMatcherRun(supabase, runId, {
      status: "failed",
      evaluatedCount: filteredCandidates.length,
      adoptedCount: 0,
      skippedBelowThreshold: 0,
      errorMessage: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

export type { MatcherRunSummary };
