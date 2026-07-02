import { DEFAULT_PLAYABLE_VERSION } from "@/lib/playable-version";

export const INITIAL_PROJECT_DEVLOG_TITLE = "初回公開";

export const INITIAL_PROJECT_DEVLOG_PUBLISHED_VERSION = DEFAULT_PLAYABLE_VERSION;

export function buildInitialProjectDevlogContent(introduction: string): string {
  return introduction.trim();
}
