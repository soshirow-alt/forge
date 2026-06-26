import type { ConfirmationRequestDraft } from "@/lib/confirmation-request-draft";
import { formatLinkedPriorityLine } from "@/lib/confirmation-request-messages";

export function formatChangeCheckConfirmedBody(
  confirmation: ConfirmationRequestDraft,
): {
  changeLine: string;
  askLine: string | null;
  priorityLine: string | null;
} {
  const changeLine = confirmation.changesSummary.trim();
  const ask = confirmation.askSummary.trim();
  const duration = confirmation.estimatedDuration.trim();
  const priorityLine = formatLinkedPriorityLine(confirmation.linkedPriorities);

  if (!ask && !duration) {
    return { changeLine, askLine: null, priorityLine };
  }

  const durationPrefix = duration ? `${duration}ほど遊んで、` : "";
  const askCore = ask || "変更を確認してほしい";
  const askLine = `${durationPrefix}${askCore}${ask.endsWith("。") || ask.endsWith("？") || ask.endsWith("?") ? "" : "そうです。"}`;

  return { changeLine, askLine, priorityLine };
}
