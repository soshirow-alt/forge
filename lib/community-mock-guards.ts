/** Mock / demo community identifiers — mirrors BUILTIN_OPEN_COMMUNITY_IDS in developer-community-v0-store.ts */

const BUILTIN_MOCK_COMMUNITY_IDS = new Set([
  "shaneco",
  "sora-games",
  "lunaworks",
  "greensmith",
]);

const BLOCKED_NAME_FRAGMENTS = [
  "しゃねこ",
  "しゃねこコミュニティ",
  "shaneco",
  "mock",
  "demo",
] as const;

function normalizeToken(value: string): string {
  return value.trim().toLowerCase();
}

function containsBlockedFragment(value: string): boolean {
  const normalized = normalizeToken(value);
  if (!normalized) {
    return true;
  }
  return BLOCKED_NAME_FRAGMENTS.some((fragment) =>
    normalized.includes(normalizeToken(fragment)),
  );
}

export function isMockCommunityId(id: string): boolean {
  const normalized = normalizeToken(id);
  if (!normalized) {
    return true;
  }
  if (BUILTIN_MOCK_COMMUNITY_IDS.has(normalized)) {
    return true;
  }
  return normalized.startsWith("mock") || normalized.startsWith("demo");
}

export function isMockCommunityName(name: string): boolean {
  return containsBlockedFragment(name);
}

export function isBlockedCommunityUserName(name: string | null | undefined): boolean {
  if (name == null) {
    return true;
  }
  return containsBlockedFragment(name);
}

type ResolveCommunityDisplayNameOptions = {
  user?: { name: string } | null;
  publicName?: string | null;
  /** When true, produce a community name (may append コミュニティ). */
  forCommunityName?: boolean;
};

export function resolveCommunityDisplayName(
  options: ResolveCommunityDisplayNameOptions,
): string {
  const publicName = options.publicName?.trim();
  if (publicName && !isBlockedCommunityUserName(publicName)) {
    return appendCommunitySuffix(publicName, options.forCommunityName);
  }

  const userName = options.user?.name?.trim();
  if (userName && !isBlockedCommunityUserName(userName)) {
    return appendCommunitySuffix(userName, options.forCommunityName);
  }

  return options.forCommunityName ? "あなたのコミュニティ" : "開発者コミュニティ";
}

function appendCommunitySuffix(base: string, forCommunityName?: boolean): string {
  if (!forCommunityName) {
    return base;
  }
  if (base === "あなたのコミュニティ" || base.endsWith("コミュニティ")) {
    return base;
  }
  return `${base}コミュニティ`;
}

export function isSafeDeveloperCommunityProfile(profile: {
  id: string;
  name: string;
} | null | undefined): boolean {
  if (!profile) {
    return false;
  }
  return !isMockCommunityId(profile.id) && !isMockCommunityName(profile.name);
}
