import { STAGING_DIRECT_CASES } from "./direct-cases";
import { STAGING_INDIRECT_CASES } from "./indirect-cases";
import { STAGING_REJECT_CASES } from "./reject-cases";
import type { StagingLabeledCase, StagingLabeledCategory } from "./types";

export type { StagingLabeledCase, StagingLabeledCategory } from "./types";

export const STAGING_LABELED_CASES: StagingLabeledCase[] = [
  ...STAGING_DIRECT_CASES,
  ...STAGING_INDIRECT_CASES,
  ...STAGING_REJECT_CASES,
];

export const STAGING_LABELED_SET_COUNTS = {
  direct: STAGING_DIRECT_CASES.length,
  indirect: STAGING_INDIRECT_CASES.length,
  reject: STAGING_REJECT_CASES.length,
  total: STAGING_LABELED_CASES.length,
} as const;

export function validateStagingLabeledSetCounts(): void {
  const errors: string[] = [];

  if (STAGING_DIRECT_CASES.length !== 20) {
    errors.push(`direct must be 20, got ${STAGING_DIRECT_CASES.length}`);
  }
  if (STAGING_INDIRECT_CASES.length !== 20) {
    errors.push(`indirect must be 20, got ${STAGING_INDIRECT_CASES.length}`);
  }
  if (STAGING_REJECT_CASES.length !== 20) {
    errors.push(`reject must be 20, got ${STAGING_REJECT_CASES.length}`);
  }
  if (STAGING_LABELED_CASES.length !== 60) {
    errors.push(`total must be 60, got ${STAGING_LABELED_CASES.length}`);
  }

  const ids = new Set<string>();
  for (const testCase of STAGING_LABELED_CASES) {
    if (ids.has(testCase.id)) {
      errors.push(`duplicate case id: ${testCase.id}`);
    }
    ids.add(testCase.id);

    if (testCase.shouldAdopt !== (testCase.category !== "reject")) {
      errors.push(`shouldAdopt mismatch: ${testCase.id}`);
    }
  }

  if (errors.length > 0) {
    throw new Error(`Staging labeled set invalid:\n${errors.join("\n")}`);
  }
}

export function getStagingCasesByCategory(
  category: StagingLabeledCategory,
): StagingLabeledCase[] {
  return STAGING_LABELED_CASES.filter((testCase) => testCase.category === category);
}
