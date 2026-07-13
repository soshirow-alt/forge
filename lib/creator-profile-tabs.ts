export type CreatorProfileTab = "games" | "devlog";

const TAB_IDS: CreatorProfileTab[] = ["games", "devlog"];

export function parseCreatorProfileTab(
  param: string | null,
  _options?: { includeFollowers?: boolean },
): CreatorProfileTab {
  // Legacy aliases from older public profile URLs
  if (param === "devlog") return "devlog";
  if (param === "overview" || param === "achievements" || param === "followers") {
    return "games";
  }
  if (param === "games") return "games";
  return "games";
}

export function buildCreatorProfileTabHref(
  creatorId: string,
  tab: CreatorProfileTab,
): string {
  const base = `/creators/${encodeURIComponent(creatorId)}`;
  return tab === "games" ? base : `${base}?tab=${tab}`;
}

export function isCreatorProfileTab(value: string): value is CreatorProfileTab {
  return TAB_IDS.includes(value as CreatorProfileTab);
}
