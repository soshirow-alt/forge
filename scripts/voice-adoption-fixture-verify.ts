import {
  filterCandidatesForDevlog,
  getAdoptableMatches,
  getFixtureMatcherSelfTestInput,
  runVoiceAdoptionMatcher,
} from "@/lib/voice-adoption/matcher";
import { evaluateFixturePrecision } from "@/lib/voice-adoption/fixture-matcher";

async function main() {
  process.env.VOICE_ADOPTION_MATCHER_MODE = "fixture";

  const { devlog, candidates } = getFixtureMatcherSelfTestInput();
  const filtered = filterCandidatesForDevlog(devlog, candidates);
  const output = await runVoiceAdoptionMatcher(devlog, filtered);
  const adoptable = getAdoptableMatches(output);
  const report = evaluateFixturePrecision(output);

  console.log("=== Forge voice adoption fixture verify ===");
  console.log(`devlog: ${devlog.title}`);
  console.log(`candidates (filtered): ${filtered.length}`);
  console.log(`adoptable: ${adoptable.length} / expected ${report.expectedAdoptCount}`);
  console.log(`precision: ${(report.precision * 100).toFixed(1)}%`);
  console.log(`recall: ${(report.recall * 100).toFixed(1)}%`);

  if (report.falsePositives.length > 0) {
    console.log("false positives:", report.falsePositives.join(", "));
  }

  if (report.falseNegatives.length > 0) {
    console.log("false negatives:", report.falseNegatives.join(", "));
  }

  console.log("\nrows:");
  for (const row of report.rows) {
    console.log(
      `- ${row.label}: expected=${row.expected} adopted=${row.adopted} confidence=${row.confidence} ${row.correct ? "OK" : "NG"}`,
    );
  }

  const precisionOk = report.precision >= 1;
  const recallOk = report.recall >= 0.6;

  if (!precisionOk || !recallOk) {
    console.error("\nVERIFY FAILED");
    process.exit(1);
  }

  console.log("\nVERIFY PASSED (precision 100%, recall >= 60%)");
}

void main();
