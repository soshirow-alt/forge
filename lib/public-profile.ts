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
  xAccount?: string;
  website?: string;
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
  return {
    publicName: fields.displayName.trim(),
    profile: normalizePublicBioForStorage(fields.bio),
    avatarUrl: fields.avatarUrl?.trim() || undefined,
    xAccount: fields.xAccount?.trim() || existing?.xAccount,
    website: fields.website?.trim() || existing?.website,
    discordUrl: existing?.discordUrl,
    youtubeUrl: existing?.youtubeUrl,
  };
}

/** @deprecated Prefer normalizePublicBioForStorage — kept for call sites that still import normalize. */
export { normalizeDeveloperProfileText };
