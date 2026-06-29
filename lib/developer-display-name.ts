import type { DeveloperProfile } from "@/lib/developer-profiles";

export function resolveDeveloperPublicName(
  user: { name: string },
  profile: DeveloperProfile | undefined,
): string {
  const fromProfile = profile?.publicName?.trim();
  if (fromProfile) {
    return fromProfile;
  }

  const fromUser = user.name.trim();
  return fromUser || "開発者";
}
