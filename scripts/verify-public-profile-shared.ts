/**
 * Local verify: shared public profile helpers (no network).
 * Run: npx --yes tsx scripts/verify-public-profile-shared.ts
 */
import assert from "node:assert/strict";
import type { DeveloperProfile } from "../lib/developer-profiles";
import {
  normalizePublicBioForStorage,
  publicBioForDisplay,
  publicProfileFromDeveloperRow,
  toDeveloperProfileInput,
} from "../lib/public-profile";

assert.equal(publicBioForDisplay("（自己紹介は未設定）"), "");
assert.equal(publicBioForDisplay(""), "");
assert.equal(publicBioForDisplay("  hello  "), "hello");
assert.equal(normalizePublicBioForStorage(""), "");
assert.equal(normalizePublicBioForStorage("（自己紹介は未設定）"), "");
assert.equal(normalizePublicBioForStorage(" bio "), "bio");

const existing: DeveloperProfile = {
  userId: "u1",
  creatorId: "dev-u1",
  publicName: "旧名",
  profile: "旧bio",
  avatarUrl: "/images/landing/game-1.png",
  xAccount: "oldx",
  website: "https://old.example",
  discordUrl: "https://discord.gg/x",
};

const fields = publicProfileFromDeveloperRow(existing, "fallback");
assert.equal(fields.displayName, "旧名");
assert.equal(fields.bio, "旧bio");
assert.equal(fields.avatarUrl, "/images/landing/game-1.png");

const input = toDeveloperProfileInput(
  {
    displayName: "新名",
    bio: "新しい自己紹介",
    avatarUrl: "/images/landing/game-2.png",
    website: "https://new.example",
  },
  existing,
);
assert.equal(input.publicName, "新名");
assert.equal(input.profile, "新しい自己紹介");
assert.equal(input.avatarUrl, "/images/landing/game-2.png");
assert.equal(input.website, "https://new.example");
assert.equal(input.xAccount, "oldx");
assert.equal(input.discordUrl, "https://discord.gg/x");

const emptyUser = publicProfileFromDeveloperRow(undefined, "AuthName");
assert.equal(emptyUser.displayName, "AuthName");
assert.equal(emptyUser.bio, "");
assert.equal(emptyUser.avatarUrl, null);

console.log(JSON.stringify({ ok: true, sharedPublicProfile: true }));
