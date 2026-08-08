/**
 * Direct tests for project tag compose boundaries.
 * Usage: npx tsx scripts/verify-project-tags-compose.ts
 */
import assert from "node:assert/strict";
import {
  composeProjectTagsForWrite,
  extractFeatureTagsFromProjectTags,
  isPlayEnvironmentOwnedTag,
  PROJECT_TAG_RECRUITMENT,
} from "../lib/project-tags";
import {
  ENV_PC_TAG,
  DIST_EXTERNAL_TAG,
  DIST_DOWNLOAD_TAG,
  TRUST_VERIFIED_TAG,
  EMPTY_PLAY_ENVIRONMENT_FORM,
} from "../lib/play-environment";

const envPc = {
  ...EMPTY_PLAY_ENVIRONMENT_FORM,
  pc: true,
  distribution: "external" as const,
};

const composed = composeProjectTagsForWrite({
  featureTags: ["癒し系", "ピクセルアート"],
  playEnvironment: envPc,
  existingTags: [
    "癒し系",
    "古いレガシータグ",
    ENV_PC_TAG,
    DIST_DOWNLOAD_TAG,
    TRUST_VERIFIED_TAG,
    PROJECT_TAG_RECRUITMENT,
  ],
});

assert.ok(composed.includes("癒し系"));
assert.ok(composed.includes("ピクセルアート"));
assert.ok(composed.includes(ENV_PC_TAG));
assert.ok(composed.includes(DIST_EXTERNAL_TAG));
assert.ok(!composed.includes(DIST_DOWNLOAD_TAG), "old dist tag replaced by new env");
assert.ok(composed.includes("古いレガシータグ"), "unknown/legacy must be preserved");
assert.ok(
  composed.includes(TRUST_VERIFIED_TAG),
  "trust must be preserved when already present",
);
assert.ok(
  !composed.includes(PROJECT_TAG_RECRUITMENT),
  "recruitment left to DB mergeTagsWithRecruitment",
);

const fresh = composeProjectTagsForWrite({
  featureTags: ["癒し系"],
  playEnvironment: EMPTY_PLAY_ENVIRONMENT_FORM,
  existingTags: [],
});
assert.ok(!fresh.includes(TRUST_VERIFIED_TAG), "Studio must not grant trust on new compose");

assert.deepEqual(extractFeatureTagsFromProjectTags(composed), [
  "癒し系",
  "ピクセルアート",
]);
assert.equal(isPlayEnvironmentOwnedTag(ENV_PC_TAG), true);
assert.equal(isPlayEnvironmentOwnedTag(TRUST_VERIFIED_TAG), false);

console.log("project-tags-compose ok");
