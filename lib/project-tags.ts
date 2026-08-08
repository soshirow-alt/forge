/**
 * projects.tags purpose boundaries (single physical column, code namespaces).
 *
 * Roles:
 * - feature: FORGE_FEATURE_TAG_OPTIONS (Studio + Search tag filter)
 * - play-environment: PC/スマホ/ブラウザ + 配布:* meta (play-environment.ts)
 * - system/recruitment: テスター募集中 (mergeTagsWithRecruitment at DB boundary)
 * - system/trust: 安全確認 — Studio does not grant; preserve when already present
 * - unknown/legacy: preserved on update; not shown as feature UI options
 *
 * Physical column split is intentionally NOT done here.
 */

import {
  pickFeatureTagsFromGameTags,
  sanitizeFeatureTagsForSave,
  type ForgeFeatureTagOption,
} from "@/lib/forge-feature-tag-options";
import {
  DISTRIBUTION_TAGS,
  ENVIRONMENT_TAGS,
  mergePlayEnvironmentIntoTags,
  parsePlayEnvironmentFromTags,
  TRUST_VERIFIED_TAG,
  type PlayEnvironmentFormState,
} from "@/lib/play-environment";

export const PROJECT_TAG_RECRUITMENT = "テスター募集中";

export function extractFeatureTagsFromProjectTags(
  tags: string[] | null | undefined,
): ForgeFeatureTagOption[] {
  return pickFeatureTagsFromGameTags(tags ?? []);
}

export function extractPlayEnvironmentFromProjectTags(
  tags: string[] | null | undefined,
): PlayEnvironmentFormState {
  return parsePlayEnvironmentFromTags(tags ?? []);
}

function isRecruitmentTag(tag: string): boolean {
  return tag === PROJECT_TAG_RECRUITMENT;
}

/**
 * Play-env / distribution meta owned by play-environment.ts.
 * Feature options must never include these strings.
 * Note: TRUST_VERIFIED_TAG is NOT play-env — it is preserved separately.
 */
export function isPlayEnvironmentOwnedTag(tag: string): boolean {
  return (
    (ENVIRONMENT_TAGS as readonly string[]).includes(tag) ||
    (DISTRIBUTION_TAGS as readonly string[]).includes(tag) ||
    tag.startsWith("配布:")
  );
}

/**
 * Compose tags for Studio write without wiping unknown/legacy or trust tags.
 * Feature + play-env are replaced; other non-recruitment tags from `existingTags` stay.
 * Recruitment is applied later via mergeTagsWithRecruitment(lookingForTesters).
 * Trust (`安全確認`) is never granted by Studio — only preserved if already present.
 */
export function composeProjectTagsForWrite(input: {
  featureTags: string[];
  playEnvironment: PlayEnvironmentFormState;
  /** Prior projects.tags — unknown/legacy/trust preserved. */
  existingTags?: string[] | null;
}): string[] {
  const feature = sanitizeFeatureTagsForSave(input.featureTags);
  const existing = input.existingTags ?? [];
  const hadTrust = existing.includes(TRUST_VERIFIED_TAG);
  const preserved = existing.filter(
    (tag) =>
      pickFeatureTagsFromGameTags([tag]).length === 0 &&
      !isPlayEnvironmentOwnedTag(tag) &&
      !isRecruitmentTag(tag) &&
      tag !== TRUST_VERIFIED_TAG,
  );
  // mergePlayEnvironmentIntoTags strips meta tags (including trust) — re-attach trust after.
  const merged = mergePlayEnvironmentIntoTags(
    [...feature, ...preserved],
    input.playEnvironment,
  );
  if (hadTrust && !merged.includes(TRUST_VERIFIED_TAG)) {
    return [...merged, TRUST_VERIFIED_TAG];
  }
  return merged;
}
