/**
 * Creator-facing activity category filters (5 formal project categories).
 * Selector label for service-app is 「サービス」; DB key stays service-app.
 */

import {
  ACTIVITY_TAG_IDS,
  ACTIVITY_TAG_LABELS,
  PROJECT_CATEGORY_IDS,
  PROJECT_CATEGORY_SELECTOR_LABELS,
  type ActivityTagId,
  type ProjectCategoryId,
} from "@/lib/project-categories";

export const CREATOR_ACTIVITY_CATEGORY_FILTERS: {
  id: ProjectCategoryId;
  label: string;
}[] = PROJECT_CATEGORY_IDS.map((id) => ({
  id,
  label: PROJECT_CATEGORY_SELECTOR_LABELS[id],
}));

/** Profile 「制作領域」 — creator-facing activity tags (exclude bare player). */
export const CREATOR_CAPABILITY_TAG_IDS: ActivityTagId[] = ACTIVITY_TAG_IDS.filter(
  (id) => id !== "player",
);

export function creatorCapabilityTagLabel(id: ActivityTagId): string {
  if (id === "tool_developer") return "ツール開発";
  if (id === "service_app_developer") return "サービス開発";
  if (id === "game_creator") return "ゲーム開発";
  if (id === "audio_creator") return "音楽・音声";
  if (id === "asset_creator") return "アセット制作";
  if (id === "streamer_creator") return "配信・動画";
  return ACTIVITY_TAG_LABELS[id];
}

export function isActivityTagId(value: string): value is ActivityTagId {
  return (ACTIVITY_TAG_IDS as readonly string[]).includes(value);
}
