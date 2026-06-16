import { NextResponse } from "next/server";
import {
  filterCandidatesForDevlog,
  getAdoptableMatches,
  getFixtureMatcherSelfTestInput,
  runVoiceAdoptionMatcher,
} from "@/lib/voice-adoption/matcher";
import { evaluateFixturePrecision } from "@/lib/voice-adoption/fixture-matcher";

export const runtime = "nodejs";

export async function POST() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "Fixture matcher API is disabled in production." },
      { status: 403 },
    );
  }

  const { devlog, candidates } = getFixtureMatcherSelfTestInput();
  const filtered = filterCandidatesForDevlog(devlog, candidates);
  const output = await runVoiceAdoptionMatcher(devlog, filtered);
  const adoptable = getAdoptableMatches(output);
  const precision = evaluateFixturePrecision(output);

  return NextResponse.json({
    mode: "fixture",
    devlogId: devlog.id,
    projectId: devlog.projectId,
    candidateCount: filtered.length,
    adoptableCount: adoptable.length,
    precision,
    adoptable,
  });
}
