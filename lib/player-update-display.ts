import type { DevlogEntry } from "@/lib/devlogs";

/** プレイヤー向け — 開発者行動ではなく「自分に起きた変化」 */
export function buildPlayerUpdateHeadline(input: {
  publishedVersion?: string | null;
  isVersionPublish: boolean;
}): string {
  if (input.isVersionPublish) {
    const version = input.publishedVersion?.trim();
    if (version) {
      return `版 ${version} が公開されました`;
    }
    return "新バージョンが公開されました";
  }

  return "プレイした版の続きが公開されました";
}

export function buildPlayerUpdateBadgeLabel(input: {
  isVersionPublish: boolean;
}): string {
  return input.isVersionPublish ? "新バージョン" : "更新";
}

export function isVersionPublishDevlog(devlog: DevlogEntry | undefined): boolean {
  return Boolean(devlog?.publishedVersion?.trim());
}
