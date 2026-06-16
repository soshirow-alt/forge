import { filterAdoptableMatcherMatches } from "@/lib/voice-adoption/adoption-match-eval";
import type { MatcherOutput } from "@/lib/voice-adoption/types";
import type { StagingLabeledCase, StagingLabeledCategory } from "@/lib/voice-adoption/staging-labeled-set/types";

export type StagingCaseResult = {
  caseId: string;
  label: string;
  category: StagingLabeledCategory;
  shouldAdopt: boolean;
  adopted: boolean;
  matchType: "direct" | "indirect" | "none" | undefined;
  confidence: number;
  playerQuote: string;
  updateSummary: string;
  isFalsePositive: boolean;
  isFalseNegative: boolean;
  needsExplanationReview: boolean;
};

export type CategoryPrecisionStats = {
  category: StagingLabeledCategory;
  total: number;
  adopted: number;
  falsePositives: string[];
  falseNegatives: string[];
};

export type StagingPrecisionReport = {
  totalCases: number;
  adoptedCount: number;
  falsePositiveCount: number;
  falseNegativeCount: number;
  falsePositives: string[];
  falseNegatives: string[];
  byCategory: CategoryPrecisionStats[];
  recallByCategory: Record<StagingLabeledCategory, number>;
  precision: number;
  recall: number;
  goCriteriaMet: boolean;
  rows: StagingCaseResult[];
};

export function evaluateStagingCase(
  testCase: StagingLabeledCase,
  output: MatcherOutput,
): StagingCaseResult {
  const adoptable = filterAdoptableMatcherMatches(output.matches);
  const match = output.matches.find(
    (entry) => entry.voiceResponseId === testCase.candidate.voiceResponseId,
  );
  const adopted = adoptable.some(
    (entry) => entry.voiceResponseId === testCase.candidate.voiceResponseId,
  );

  const isFalsePositive = adopted && !testCase.shouldAdopt;
  const isFalseNegative = !adopted && testCase.shouldAdopt;
  const needsExplanationReview =
    adopted && testCase.shouldAdopt && Boolean(testCase.referenceUpdateSummary);

  return {
    caseId: testCase.id,
    label: testCase.label,
    category: testCase.category,
    shouldAdopt: testCase.shouldAdopt,
    adopted,
    matchType: match?.matchType,
    confidence: match?.confidence ?? 0,
    playerQuote: match?.playerQuote ?? "",
    updateSummary: match?.updateSummary ?? "",
    isFalsePositive,
    isFalseNegative,
    needsExplanationReview,
  };
}

function statsForCategory(
  category: StagingLabeledCategory,
  rows: StagingCaseResult[],
): CategoryPrecisionStats {
  const categoryRows = rows.filter((row) => row.category === category);
  return {
    category,
    total: categoryRows.length,
    adopted: categoryRows.filter((row) => row.adopted).length,
    falsePositives: categoryRows
      .filter((row) => row.isFalsePositive)
      .map((row) => row.label),
    falseNegatives: categoryRows
      .filter((row) => row.isFalseNegative)
      .map((row) => row.label),
  };
}

export function buildStagingPrecisionReport(
  rows: StagingCaseResult[],
): StagingPrecisionReport {
  const falsePositives = rows.filter((row) => row.isFalsePositive).map((row) => row.label);
  const falseNegatives = rows.filter((row) => row.isFalseNegative).map((row) => row.label);
  const adoptedCount = rows.filter((row) => row.adopted).length;
  const expectedAdoptCount = rows.filter((row) => row.shouldAdopt).length;

  const byCategory = (
    ["direct", "indirect", "reject"] as StagingLabeledCategory[]
  ).map((category) => statsForCategory(category, rows));

  const recallByCategory = {
    direct: calcRecall(rows, "direct"),
    indirect: calcRecall(rows, "indirect"),
    reject: calcRecall(rows, "reject", true),
  } as Record<StagingLabeledCategory, number>;

  const precision =
    adoptedCount === 0 ? 1 : (adoptedCount - falsePositives.length) / adoptedCount;

  const recall =
    expectedAdoptCount === 0
      ? 1
      : (expectedAdoptCount - falseNegatives.length) / expectedAdoptCount;

  const directFp = byCategory.find((entry) => entry.category === "direct")!
    .falsePositives.length;
  const indirectFp = byCategory.find((entry) => entry.category === "indirect")!
    .falsePositives.length;
  const rejectFp = byCategory.find((entry) => entry.category === "reject")!
    .falsePositives.length;

  const goCriteriaMet = directFp === 0 && indirectFp === 0 && rejectFp === 0;

  return {
    totalCases: rows.length,
    adoptedCount,
    falsePositiveCount: falsePositives.length,
    falseNegativeCount: falseNegatives.length,
    falsePositives,
    falseNegatives,
    byCategory,
    recallByCategory,
    precision,
    recall,
    goCriteriaMet,
    rows,
  };
}

function calcRecall(
  rows: StagingCaseResult[],
  category: StagingLabeledCategory,
  invert = false,
): number {
  const categoryRows = rows.filter((row) => row.category === category);
  if (categoryRows.length === 0) {
    return 1;
  }

  if (invert) {
    const correctReject = categoryRows.filter((row) => !row.adopted).length;
    return correctReject / categoryRows.length;
  }

  const expected = categoryRows.filter((row) => row.shouldAdopt).length;
  if (expected === 0) {
    return 1;
  }

  const hit = categoryRows.filter((row) => row.adopted && row.shouldAdopt).length;
  return hit / expected;
}

export function formatStagingReportForConsole(report: StagingPrecisionReport): string {
  const lines: string[] = [
    "=== Forge voice adoption staging precision ===",
    `cases: ${report.totalCases}`,
    `adopted: ${report.adoptedCount}`,
    `precision: ${(report.precision * 100).toFixed(1)}%`,
    `recall: ${(report.recall * 100).toFixed(1)}% (recall drop OK)`,
    "",
    "GO criteria (false positive = 0 per category):",
  ];

  for (const stats of report.byCategory) {
    lines.push(
      `- ${stats.category}: FP=${stats.falsePositives.length} FN=${stats.falseNegatives.length} (recall ${(report.recallByCategory[stats.category] * 100).toFixed(1)}%)`,
    );
  }

  lines.push("");
  lines.push(`GO: ${report.goCriteriaMet ? "PASS" : "FAIL"}`);

  if (report.falsePositives.length > 0) {
    lines.push("");
    lines.push("false positives:");
    for (const label of report.falsePositives) {
      lines.push(`  - ${label}`);
    }
  }

  if (report.falseNegatives.length > 0) {
    lines.push("");
    lines.push("false negatives (informational):");
    for (const label of report.falseNegatives) {
      lines.push(`  - ${label}`);
    }
  }

  const reviewRows = report.rows.filter((row) => row.needsExplanationReview);
  if (reviewRows.length > 0) {
    lines.push("");
    lines.push("explanation quality — manual review:");
    for (const row of reviewRows) {
      lines.push(
        `  - ${row.label}: 「${row.playerQuote}」→「${row.updateSummary}」 conf=${row.confidence}`,
      );
    }
  }

  return lines.join("\n");
}
