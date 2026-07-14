/**
 * Local verify for shared public profile display / X link resolvers.
 * Run: npx --yes tsx scripts/verify-public-profile-display.ts
 */
import { resolvePublicXLink, normalizePublicXHandle } from "../lib/public-x-link";
import {
  defaultPublicAvatarSrc,
  resolvePublicAvatarSrc,
  resolvePublicProfileDisplay,
} from "../lib/public-profile-display";
import type { DeveloperProfile } from "../lib/developer-profiles";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

assert(normalizePublicXHandle("@Foo_Bar") === "Foo_Bar", "handle normalize");
assert(normalizePublicXHandle("https://x.com/foo") === "foo", "url handle");
assert(normalizePublicXHandle("https://evil.com/foo") === null, "reject non-x");
assert(resolvePublicXLink("not valid!!") === null, "invalid");
assert(resolvePublicXLink("@abc")?.href === "https://x.com/abc", "href");

const profile: DeveloperProfile = {
  userId: "11111111-1111-1111-1111-111111111111",
  creatorId: "dev-11111111-1111-1111-1111-111111111111",
  publicName: "Test Dev",
  profile: "hello",
  avatarUrl: "https://example.com/a.png",
  xAccount: "@tester",
  website: "example.com",
};

const withAvatar = resolvePublicProfileDisplay(profile, {
  userId: profile.userId,
});
assert(withAvatar.avatarSrc === "https://example.com/a.png", "avatar from profile");
assert(withAvatar.xAccount === "@tester", "x from profile");

const noAvatar = resolvePublicAvatarSrc(undefined, profile.userId);
assert(noAvatar === defaultPublicAvatarSrc(profile.userId), "preset fallback");
assert(!noAvatar.includes("supabase.co/storage"), "no storage as avatar fallback");

console.log("verify-public-profile-display: PASS");
