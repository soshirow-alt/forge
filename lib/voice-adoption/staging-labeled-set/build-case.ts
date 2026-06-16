import type { StagingLabeledCase, StagingLabeledCategory } from "./types";

let devlogCounter = 0;

function nextDevlogId(category: StagingLabeledCategory, index: number): string {
  devlogCounter += 1;
  return `staging-${category}-${String(index).padStart(2, "0")}`;
}

type BuildCaseInput = {
  category: StagingLabeledCategory;
  index: number;
  label: string;
  voiceLabel: string;
  devlogTitle: string;
  devlogContent: string;
  publishedVersion?: string;
  referenceUpdateSummary?: string;
  explanationNote?: string;
};

export function buildStagingCase(input: BuildCaseInput): StagingLabeledCase {
  const id = nextDevlogId(input.category, input.index);
  const shouldAdopt = input.category !== "reject";
  const expectedMatchType =
    input.category === "reject"
      ? "none"
      : input.category === "indirect"
        ? "indirect"
        : "direct";

  return {
    id,
    category: input.category,
    label: input.label,
    shouldAdopt,
    expectedMatchType,
    referenceUpdateSummary: input.referenceUpdateSummary,
    explanationNote: input.explanationNote,
    devlog: {
      id: `${id}-devlog`,
      projectId: "staging-eval",
      title: input.devlogTitle,
      content: input.devlogContent,
      publishedVersion: input.publishedVersion ?? "0.2",
      publishedAt: "2026-06-16T12:00:00.000Z",
      createdAt: "2026-06-16T11:00:00.000Z",
    },
    candidate: {
      voiceResponseId: `${id}-voice`,
      userId: `staging-user-${input.category}-${String(input.index).padStart(2, "0")}`,
      projectId: "staging-eval",
      versionKey: "0.1",
      promptText: "改善してほしい点は？",
      answerValue: id,
      answerLabel: input.voiceLabel,
      createdAt: "2026-06-10T10:00:00.000Z",
    },
  };
}
