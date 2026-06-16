import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  STAGING_LABELED_CASES,
  STAGING_LABELED_SET_COUNTS,
  validateStagingLabeledSetCounts,
} from "@/lib/voice-adoption/staging-labeled-set";
import {
  buildStagingPrecisionReport,
  evaluateStagingCase,
  formatStagingReportForConsole,
  type StagingCaseResult,
} from "@/lib/voice-adoption/staging-precision-eval";
import { runFixtureMatcher } from "@/lib/voice-adoption/fixture-matcher";
import {
  getOpenAiPromptVersion,
  runOpenAiAdoptionMatcher,
} from "@/lib/voice-adoption/openai-matcher";
import { OPENAI_MATCHER_MODEL } from "@/lib/voice-adoption/constants";

type RunMode = "validate" | "fixture" | "live";

function loadEnvLocal(): void {
  const envPath = resolve(process.cwd(), ".env.local");
  if (!existsSync(envPath)) {
    return;
  }

  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const rawValue = trimmed.slice(separatorIndex + 1).trim();
    const value = rawValue.replace(/^["']|["']$/g, "");

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

function categoryStats(
  rows: StagingCaseResult[],
  category: StagingCaseResult["category"],
) {
  const categoryRows = rows.filter((row) => row.category === category);
  return {
    fp: categoryRows.filter((row) => row.isFalsePositive).length,
    fn: categoryRows.filter((row) => row.isFalseNegative).length,
    fpRows: categoryRows.filter((row) => row.isFalsePositive),
    fnRows: categoryRows.filter((row) => row.isFalseNegative),
  };
}

function printLiveEvaluationReport(rows: StagingCaseResult[]): void {
  const direct = categoryStats(rows, "direct");
  const indirect = categoryStats(rows, "indirect");
  const reject = categoryStats(rows, "reject");

  console.log("\n=== Live evaluation report (owner format) ===");
  console.log(`model: ${OPENAI_MATCHER_MODEL}`);
  console.log(`prompt: ${getOpenAiPromptVersion()}`);
  console.log("");
  console.log(`direct FP: ${direct.fp}`);
  console.log(`direct FN: ${direct.fn}`);
  console.log(`indirect FP: ${indirect.fp}`);
  console.log(`indirect FN: ${indirect.fn}`);
  console.log(`reject FP: ${reject.fp}`);
  console.log("");
  console.log("GO: direct FP=0 AND indirect FP=0 AND reject FP=0");

  const adopted = rows.filter((row) => row.adopted && row.shouldAdopt);
  console.log(`\n採用ケース explanation 一覧 (${adopted.length}):`);
  if (adopted.length === 0) {
    console.log("  (none)");
  } else {
    for (const row of adopted) {
      console.log(
        `  [${row.category}] ${row.label}\n    「${row.playerQuote}」→「${row.updateSummary}」 conf=${row.confidence} type=${row.matchType ?? "none"}`,
      );
    }
  }

  console.log("\nFP 代表ケース:");
  const allFp = rows.filter((row) => row.isFalsePositive);
  if (allFp.length === 0) {
    console.log("  (none)");
  } else {
    for (const row of allFp) {
      console.log(
        `  [${row.category}] ${row.label}\n    「${row.playerQuote}」→「${row.updateSummary}」 conf=${row.confidence} type=${row.matchType ?? "none"}`,
      );
    }
  }

  console.log("\nFN 代表ケース:");
  const allFn = rows.filter((row) => row.isFalseNegative);
  if (allFn.length === 0) {
    console.log("  (none)");
  } else {
    for (const row of allFn) {
      console.log(
        `  [${row.category}] ${row.label} conf=${row.confidence} type=${row.matchType ?? "none"}`,
      );
    }
  }
}

function parseMode(): RunMode {
  const args = process.argv.slice(2);
  if (args.includes("--live")) {
    return "live";
  }
  if (args.includes("--fixture")) {
    return "fixture";
  }
  return "validate";
}

async function runMatcherForCase(
  mode: RunMode,
  testCase: (typeof STAGING_LABELED_CASES)[number],
) {
  const candidates = [testCase.candidate];

  if (mode === "fixture") {
    return runFixtureMatcher(testCase.devlog, candidates);
  }

  return runOpenAiAdoptionMatcher(testCase.devlog, candidates);
}

async function main() {
  loadEnvLocal();
  validateStagingLabeledSetCounts();
  const mode = parseMode();

  console.log("=== Forge voice adoption staging labeled set ===");
  console.log(
    `direct=${STAGING_LABELED_SET_COUNTS.direct} indirect=${STAGING_LABELED_SET_COUNTS.indirect} reject=${STAGING_LABELED_SET_COUNTS.reject} total=${STAGING_LABELED_SET_COUNTS.total}`,
  );

  if (mode === "validate") {
    console.log("\nLabeled set structure OK.");
    console.log("Next: npm run verify:voice-adoption:staging -- --live");
    console.log("Requires OPENAI_API_KEY and VOICE_ADOPTION_MATCHER_MODE=live");
    return;
  }

  if (mode === "live" && !process.env.OPENAI_API_KEY) {
    console.error("OPENAI_API_KEY is required for --live mode");
    console.error("Add OPENAI_API_KEY=sk-... to .env.local (do not commit)");
    process.exit(1);
  }

  if (mode === "live") {
    process.env.VOICE_ADOPTION_MATCHER_MODE = "live";
  } else {
    process.env.VOICE_ADOPTION_MATCHER_MODE = "fixture";
  }

  console.log(`\nRunning matcher mode: ${mode} (${STAGING_LABELED_CASES.length} cases)...`);

  const rows = [];

  for (const testCase of STAGING_LABELED_CASES) {
    const output = await runMatcherForCase(mode, testCase);
    rows.push(evaluateStagingCase(testCase, output));
  }

  const report = buildStagingPrecisionReport(rows);
  console.log(`\n${formatStagingReportForConsole(report)}`);

  console.log("\n--- Representative cases ---");

  const fpRows = report.rows.filter((row) => row.isFalsePositive);
  if (fpRows.length > 0) {
    console.log("\nFALSE POSITIVES (blocking):");
    for (const row of fpRows) {
      console.log(
        `  [${row.category}] ${row.label}\n    quote: 「${row.playerQuote}」\n    summary: 「${row.updateSummary}」\n    conf=${row.confidence} type=${row.matchType ?? "none"}`,
      );
    }
  } else {
    console.log("\nFALSE POSITIVES: none");
  }

  const fnRows = report.rows.filter((row) => row.isFalseNegative);
  if (fnRows.length > 0) {
    console.log(`\nFALSE NEGATIVES (${fnRows.length} — informational, recall OK to drop):`);
    for (const row of fnRows.slice(0, 10)) {
      console.log(
        `  [${row.category}] ${row.label} conf=${row.confidence} type=${row.matchType ?? "none"}`,
      );
    }
    if (fnRows.length > 10) {
      console.log(`  ... and ${fnRows.length - 10} more`);
    }
  } else {
    console.log("\nFALSE NEGATIVES: none");
  }

  const adoptedOk = report.rows.filter((row) => row.adopted && row.shouldAdopt);
  if (adoptedOk.length > 0) {
    console.log(`\nADOPTED (${adoptedOk.length}) — Explanation Quality review:`);
    for (const row of adoptedOk.slice(0, 8)) {
      console.log(
        `  [${row.category}] ${row.label}\n    「${row.playerQuote}」→「${row.updateSummary}」 conf=${row.confidence}`,
      );
    }
    if (adoptedOk.length > 8) {
      console.log(`  ... and ${adoptedOk.length - 8} more`);
    }
  }

  console.log("\n--- Summary counts ---");
  console.log(`FP total: ${report.falsePositiveCount}`);
  console.log(`FN total: ${report.falseNegativeCount}`);
  for (const stats of report.byCategory) {
    console.log(
      `  ${stats.category}: adopted=${stats.adopted} FP=${stats.falsePositives.length} FN=${stats.falseNegatives.length}`,
    );
  }

  if (mode === "live") {
    printLiveEvaluationReport(rows);
  }

  if (mode === "fixture") {
    console.log(
      "\nNote: --fixture uses deterministic stub, not OpenAI. Staging GO requires --live.",
    );
  }

  if (!report.goCriteriaMet) {
    console.error("\nSTAGING VERIFY FAILED (false positive detected)");
    process.exit(1);
  }

  if (mode === "live") {
    console.log(
      "\nAutomated GO criteria passed. Complete Explanation Quality manual review before prod GO.",
    );
  }
}

void main();
