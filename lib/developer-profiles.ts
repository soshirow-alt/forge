export type DeveloperProfile = {
  userId: string;
  creatorId: string;
  publicName: string;
  profile: string;
  xAccount?: string;
  website?: string;
};

export type DeveloperProfileInput = {
  publicName: string;
  profile: string;
  xAccount?: string;
  website?: string;
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

export function findDeveloperProfileByPublicName(
  profiles: DeveloperProfile[],
  publicName: string,
): DeveloperProfile | undefined {
  return profiles.find((profile) => profile.publicName === publicName);
}
