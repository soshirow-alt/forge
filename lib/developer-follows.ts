import {
  findDeveloperProfileByRouteId,
  resolveOwnerUserIdFromRouteId,
  type DeveloperProfile,
} from "@/lib/developer-profiles";

export type FollowedDeveloperSummary = {
  userId: string;
  routeId: string;
  name: string;
  avatar: string;
  publicGameCount: number;
};

/** Route key / UUID → developer auth user id for DB writes. */
export function resolveDeveloperUserIdForFollow(
  routeOrDeveloperKey: string,
  profiles: DeveloperProfile[],
): string | null {
  const fromProfile = findDeveloperProfileByRouteId(profiles, routeOrDeveloperKey);
  if (fromProfile) {
    return fromProfile.userId;
  }

  return resolveOwnerUserIdFromRouteId(routeOrDeveloperKey);
}

export function buildFollowedDeveloperSummaries(
  developerUserIds: string[],
  profiles: DeveloperProfile[],
  getOwnerPublicGames: (ownerId: string) => { title: string; thumbnailUrl?: string; ownerName?: string }[],
): FollowedDeveloperSummary[] {
  return developerUserIds.map((userId) => {
    const profile = profiles.find((item) => item.userId === userId);
    const games = getOwnerPublicGames(userId);
    const name =
      profile?.publicName ??
      games[0]?.ownerName ??
      "開発者";
    const routeId = profile?.creatorId ?? `dev-${userId}`;
    const avatar = games[0]?.thumbnailUrl?.trim() || "/images/landing/game-1.png";

    return {
      userId,
      routeId,
      name,
      avatar,
      publicGameCount: games.length,
    };
  });
}
