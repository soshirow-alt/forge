import {
  findDeveloperProfileByRouteId,
  resolveOwnerUserIdFromRouteId,
  type DeveloperProfile,
} from "@/lib/developer-profiles";
import { resolvePublicProfileDisplay } from "@/lib/public-profile-display";

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
  getOwnerPublicGames: (ownerId: string) => {
    title: string;
    thumbnailUrl?: string;
    ownerName?: string;
  }[],
): FollowedDeveloperSummary[] {
  return developerUserIds.map((userId) => {
    const profile = profiles.find((item) => item.userId === userId);
    const games = getOwnerPublicGames(userId);
    const display = resolvePublicProfileDisplay(profile, {
      userId,
      fallbackName: games[0]?.ownerName ?? "開発者",
    });

    return {
      userId,
      routeId: display.routeId,
      name: display.displayName,
      avatar: display.avatarSrc,
      publicGameCount: games.length,
    };
  });
}
