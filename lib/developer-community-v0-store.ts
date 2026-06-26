/** v0 — 開発者が開設したコミュニティ（localStorage + 既存 mock 併用） */

export type DeveloperCommunityProfile = {
  id: string;
  name: string;
  avatar: string;
  handle: string;
  description: string;
  memberCountLabel: number;
};

const STORAGE_KEY = "forge-v0-developer-communities";

/** mock 上、最初からコミュニティがある開発者 */
const BUILTIN_OPEN_COMMUNITY_IDS = new Set([
  "shaneco",
  "sora-games",
  "lunaworks",
  "greensmith",
]);

const serverSnapshot: DeveloperCommunityProfile[] = [];

let cachedClientSnapshot: DeveloperCommunityProfile[] | null = null;

function cloneCommunities(
  communities: DeveloperCommunityProfile[],
): DeveloperCommunityProfile[] {
  return communities.map((item) => ({ ...item }));
}

function readOpened(): DeveloperCommunityProfile[] {
  if (typeof window === "undefined") {
    return [];
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    return JSON.parse(raw) as DeveloperCommunityProfile[];
  } catch {
    return [];
  }
}

function refreshClientSnapshot(
  communities?: DeveloperCommunityProfile[],
): DeveloperCommunityProfile[] {
  cachedClientSnapshot = cloneCommunities(communities ?? readOpened());
  return cachedClientSnapshot;
}

/** SSR / hydration 用。localStorage を読まない固定スナップショット */
export function getDeveloperCommunitiesServerSnapshot(): DeveloperCommunityProfile[] {
  return serverSnapshot;
}

function writeOpened(communities: DeveloperCommunityProfile[]) {
  if (typeof window === "undefined") {
    return;
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(communities));
  refreshClientSnapshot(communities);
}

export function communityIdFromUser(userId: string, handle?: string): string {
  const slug = handle?.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "") || "";
  if (slug) {
    return slug;
  }
  return `dev-${userId.slice(0, 8)}`;
}

export function openDeveloperCommunity(profile: DeveloperCommunityProfile) {
  const list = readOpened();
  if (list.some((item) => item.id === profile.id)) {
    return;
  }
  writeOpened([...list, profile]);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("forge-developer-community-change"));
  }
}

/** useSyncExternalStore 用。参照が変わるのは store 更新時のみ */
export function getOpenedDeveloperCommunities(): DeveloperCommunityProfile[] {
  if (typeof window === "undefined") {
    return getDeveloperCommunitiesServerSnapshot();
  }
  if (cachedClientSnapshot === null) {
    return refreshClientSnapshot();
  }
  return cachedClientSnapshot;
}

export function getOwnCommunityForUser(
  userId: string,
  slugSource?: string,
): DeveloperCommunityProfile | null {
  const id = communityIdFromUser(userId, slugSource);
  return readOpened().find((item) => item.id === id) ?? null;
}

export function findOwnCommunityInList(
  userId: string,
  slugSource: string | undefined,
  opened: DeveloperCommunityProfile[],
): DeveloperCommunityProfile | null {
  const id = communityIdFromUser(userId, slugSource);
  return opened.find((item) => item.id === id) ?? null;
}

export function hasDeveloperOpenCommunity(developerId: string): boolean {
  if (BUILTIN_OPEN_COMMUNITY_IDS.has(developerId)) {
    return true;
  }
  return readOpened().some((item) => item.id === developerId);
}

export function subscribeDeveloperCommunities(listener: () => void): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }
  const handler = () => {
    refreshClientSnapshot();
    listener();
  };
  window.addEventListener("forge-developer-community-change", handler);
  return () => window.removeEventListener("forge-developer-community-change", handler);
}
