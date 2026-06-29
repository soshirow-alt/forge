export type DeveloperProfile = {
  userId: string;
  creatorId: string;
  publicName: string;
  profile: string;
  xAccount?: string;
  website?: string;
  discordUrl?: string;
  youtubeUrl?: string;
};

export type DeveloperProfileInput = {
  publicName: string;
  profile: string;
  xAccount?: string;
  website?: string;
  discordUrl?: string;
  youtubeUrl?: string;
};

export function createDeveloperProfile(
  userId: string,
  input: DeveloperProfileInput,
): DeveloperProfile {
  return {
    userId,
    creatorId: `dev-${userId}`,
    publicName: input.publicName.trim(),
    profile: input.profile.trim(),
    xAccount: input.xAccount?.trim() || undefined,
    website: input.website?.trim() || undefined,
    discordUrl: input.discordUrl?.trim() || undefined,
    youtubeUrl: input.youtubeUrl?.trim() || undefined,
  };
}

export function findDeveloperProfileByUserId(
  profiles: DeveloperProfile[],
  userId: string,
): DeveloperProfile | undefined {
  return profiles.find((profile) => profile.userId === userId);
}

export function findDeveloperProfileByCreatorId(
  profiles: DeveloperProfile[],
  creatorId: string,
): DeveloperProfile | undefined {
  return profiles.find((profile) => profile.creatorId === creatorId);
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** `/creators/[id]` — creator_id, user uuid, or `dev-{uuid}` */
export function findDeveloperProfileByRouteId(
  profiles: DeveloperProfile[],
  routeId: string,
): DeveloperProfile | undefined {
  const byCreator = findDeveloperProfileByCreatorId(profiles, routeId);
  if (byCreator) {
    return byCreator;
  }

  const byUser = findDeveloperProfileByUserId(profiles, routeId);
  if (byUser) {
    return byUser;
  }

  if (routeId.startsWith("dev-")) {
    return findDeveloperProfileByUserId(profiles, routeId.slice(4));
  }

  return undefined;
}

export function resolveOwnerUserIdFromRouteId(routeId: string): string | null {
  if (UUID_RE.test(routeId)) {
    return routeId;
  }
  if (routeId.startsWith("dev-")) {
    const userId = routeId.slice(4);
    return UUID_RE.test(userId) ? userId : null;
  }
  return null;
}

export function findDeveloperProfileByPublicName(
  profiles: DeveloperProfile[],
  publicName: string,
): DeveloperProfile | undefined {
  return profiles.find((profile) => profile.publicName === publicName);
}
