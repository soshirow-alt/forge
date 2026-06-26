import type { ConfirmationRequestDraft } from "@/lib/confirmation-request-draft";
import type { LinkedPriorityRef } from "@/lib/confirmation-request-draft";

export function createConfirmationRequestNotificationMessage(
  projectTitle: string,
  draft: ConfirmationRequestDraft,
): string {
  const changes = draft.changesSummary.trim();
  const ask = draft.askSummary.trim();
  const duration = draft.estimatedDuration.trim();
  const priorities = draft.linkedPriorities.map((item) => item.title).filter(Boolean);

  const parts: string[] = [`「${projectTitle}」`];

  if (changes) {
    parts.push(changes);
  } else if (priorities.length > 0) {
    parts.push(`「${priorities[0]}」への対応`);
  } else {
    parts.push("更新");
  }

  parts.push("について確認してほしいそうです");

  if (duration) {
    return `${parts.join(" — ")}（${duration}ほど）`;
  }

  if (ask) {
    const suffix =
      ask.endsWith("。") || ask.endsWith("？") || ask.endsWith("?") ? "" : "。";
    return `${parts.join(" — ")}。${ask}${suffix}`;
  }

  return parts.join(" — ");
}

export function formatLinkedPriorityLine(
  priorities: LinkedPriorityRef[],
): string | null {
  if (priorities.length === 0) {
    return null;
  }

  const titles = priorities.map((item) => item.title).filter(Boolean);
  if (titles.length === 0) {
    return null;
  }

  if (titles.length === 1) {
    return `「${titles[0]}」への対応が含まれています。`;
  }

  return `「${titles[0]}」ほか ${titles.length - 1}件の課題への対応が含まれています。`;
}
