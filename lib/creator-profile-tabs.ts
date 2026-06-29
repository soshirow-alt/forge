export type CreatorProfileTab = "overview" | "devlog" | "achievements" | "followers";

const TAB_IDS: CreatorProfileTab[] = [
  "overview",
  "devlog",
  "achievements",
  "followers",
];

export function parseCreatorProfileTab(
  param: string | null,
  options?: { includeFollowers?: boolean },
): CreatorProfileTab {
  const includeFollowers = options?.includeFollowers ?? false;
  if (param === "devlog" || param === "achievements") {
    return param;
  }
  if (param === "followers" && includeFollowers) {
    return "followers";
  }
  return "overview";
}

export function buildCreatorProfileTabHref(
  creatorId: string,
  tab: CreatorProfileTab,
): string {
  const base = `/creators/${encodeURIComponent(creatorId)}`;
  return tab === "overview" ? base : `${base}?tab=${tab}`;
}

export function isCreatorProfileTab(value: string): value is CreatorProfileTab {
  return TAB_IDS.includes(value as CreatorProfileTab);
}
