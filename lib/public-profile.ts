/**
 * Shared public profile — single source of truth: `developer_profiles`.
 * Player / Studio / creator pages all read and write the same row.
 */
import type { DeveloperProfile, DeveloperProfileInput } from "@/lib/developer-profiles";
import {
  EMPTY_DEVELOPER_PROFILE_TEXT,
  normalizeDeveloperProfileText,
} from "@/lib/developer-profiles";

export type PublicProfileFields = {
  displayName: string;
  bio: string;
  avatarUrl: string | null;
  /**
   * Public X on developer_profiles only.
   * `undefined` preserves existing; `null` / empty clears; string sets.
   */
  xAccount?: string | null;
  /** `undefined` preserves; `null` / empty clears; string sets. */
  website?: string | null;
  /** Formal activity_tags — undefined preserves existing. */
  activityTags?: string[] | null;
};

/** Normalize bio for DB: empty string when unset (legacy placeholder → empty). */
export function normalizePublicBioForStorage(bio: string): string {
  const trimmed = bio.trim();
  if (!trimmed || trimmed === EMPTY_DEVELOPER_PROFILE_TEXT) {
    return "";
  }
  return trimmed;
}

/** Display bio: hide legacy placeholder. */
export function publicBioForDisplay(bio: string | null | undefined): string {
  const trimmed = (bio ?? "").trim();
  if (!trimmed || trimmed === EMPTY_DEVELOPER_PROFILE_TEXT) {
    return "";
  }
  return trimmed;
}

export function publicProfileFromDeveloperRow(
  profile: DeveloperProfile | undefined,
  fallbackName: string,
): PublicProfileFields {
  return {
    displayName: profile?.publicName?.trim() || fallbackName.trim() || "プレイヤー",
    bio: publicBioForDisplay(profile?.profile),
    avatarUrl: profile?.avatarUrl?.trim() || null,
    xAccount: profile?.xAccount?.trim() || undefined,
    website: profile?.website?.trim() || undefined,
  };
}

export function toDeveloperProfileInput(
  fields: PublicProfileFields,
  existing?: DeveloperProfile,
): DeveloperProfileInput {
  const nextX =
    fields.xAccount === undefined
      ? existing?.xAccount
      : fields.xAccount?.trim() || undefined;
  const nextWebsite =
    fields.website === undefined
      ? existing?.website
      : fields.website?.trim() || undefined;
  const nextActivityTags =
    fields.activityTags === undefined
      ? existing?.activityTags
      : (fields.activityTags ?? []).filter(Boolean);

  return {
    publicName: fields.displayName.trim(),
    profile: normalizePublicBioForStorage(fields.bio),
    avatarUrl: fields.avatarUrl?.trim() || undefined,
    xAccount: nextX,
    website: nextWebsite,
    discordUrl: existing?.discordUrl,
    youtubeUrl: existing?.youtubeUrl,
    activityTags: nextActivityTags,
  };
}

/** @deprecated Prefer normalizePublicBioForStorage — kept for call sites that still import normalize. */
export { normalizeDeveloperProfileText };
