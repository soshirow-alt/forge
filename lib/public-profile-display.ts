/**
 * Shared public profile display resolvers.
 * Source of truth: `developer_profiles` (never game thumbnails as avatars).
 */
import type { DeveloperProfile } from "@/lib/developer-profiles";
import {
  publicBioForDisplay,
  publicProfileFromDeveloperRow,
} from "@/lib/public-profile";
import { profileAvatarPresets } from "@/lib/profile-avatar-presets";

export type ResolvedPublicProfileDisplay = {
  userId: string;
  routeId: string;
  displayName: string;
  handle: string;
  bio: string;
  /** Non-empty avatar URL or shared preset path — never a project thumbnail. */
  avatarSrc: string;
  /** Raw avatar_url from profile when set; null when using preset fallback. */
  avatarUrl: string | null;
  xAccount?: string;
  website?: string;
};

/** Stable emoji preset when `avatar_url` is empty (never game / landing thumbs). */
export function defaultPublicAvatarSrc(userId: string): string {
  const pool = profileAvatarPresets;
  const index =
    userId.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0) %
    pool.length;
  return pool[index]!.src;
}

/**
 * Avatar display src from developer_profiles only.
 * Empty / whitespace → shared preset. Never substitute project thumbnails.
 */
export function resolvePublicAvatarSrc(
  profile: DeveloperProfile | undefined | null,
  userId: string,
): string {
  const fromRow = profile?.avatarUrl?.trim();
  if (fromRow) return fromRow;
  return defaultPublicAvatarSrc(userId);
}

export function resolvePublicProfileDisplay(
  profile: DeveloperProfile | undefined | null,
  options: {
    userId: string;
    fallbackName?: string;
  },
): ResolvedPublicProfileDisplay {
  const userId = options.userId;
  const fields = publicProfileFromDeveloperRow(
    profile ?? undefined,
    options.fallbackName ?? "プレイヤー",
  );
  const routeId = profile?.creatorId ?? `dev-${userId}`;
  const handle = routeId.replace(/^dev-/, "").slice(0, 12);
  const avatarUrl = fields.avatarUrl;
  return {
    userId,
    routeId,
    displayName: fields.displayName,
    handle,
    bio: fields.bio,
    avatarSrc: resolvePublicAvatarSrc(profile, userId),
    avatarUrl,
    xAccount: fields.xAccount,
    website: fields.website,
  };
}

export function publicBioOneLine(
  bio: string | null | undefined,
  maxLen = 80,
): string {
  const text = publicBioForDisplay(bio).replace(/\s+/g, " ").trim();
  if (text.length <= maxLen) return text;
  return `${text.slice(0, maxLen)}…`;
}
