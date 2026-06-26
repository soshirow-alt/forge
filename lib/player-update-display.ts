import type { DevlogEntry } from "@/lib/devlogs";
import type { ConfirmationRequestDraft } from "@/lib/confirmation-request-draft";
import { hasConfirmationRequestContent } from "@/lib/confirmation-request-draft";

/** プレイヤー向け — 開発者行動ではなく「自分に起きた変化」 */
export function buildPlayerUpdateHeadline(input: {
  publishedVersion?: string | null;
  isVersionPublish: boolean;
  confirmation?: ConfirmationRequestDraft | null;
}): string {
  if (input.confirmation && hasConfirmationRequestContent(input.confirmation)) {
    const ask = input.confirmation.askSummary.trim();
    const changes = input.confirmation.changesSummary.trim();
    const duration = input.confirmation.estimatedDuration.trim();

    if (ask) {
      const suffix =
        ask.endsWith("。") || ask.endsWith("？") || ask.endsWith("?") ? "" : "、確認してほしいそうです";
      return duration ? `${duration}ほど遊んで、${ask}${suffix}` : `${ask}${suffix}`;
    }

    if (changes) {
      return `${changes}について、確認してほしいそうです`;
    }

    return "開発者から確認依頼が届いています";
  }

  if (input.isVersionPublish) {
    const version = input.publishedVersion?.trim();
    if (version) {
      return `ver ${version} が公開されました`;
    }
    return "新バージョンが公開されました";
  }

  return "プレイしたverの続きが公開されました";
}

export function buildPlayerUpdateBadgeLabel(input: {
  isVersionPublish: boolean;
  hasConfirmationRequest?: boolean;
}): string {
  if (input.hasConfirmationRequest) {
    return "確認依頼";
  }

  return input.isVersionPublish ? "新バージョン" : "更新";
}

export function isVersionPublishDevlog(devlog: DevlogEntry | undefined): boolean {
  return Boolean(devlog?.publishedVersion?.trim());
}
