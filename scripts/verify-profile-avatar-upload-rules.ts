/**
 * Offline checks for profile avatar save/upload helpers (no network).
 */
import assert from "node:assert/strict";
import {
  MAX_PROFILE_AVATAR_URL_CHARS,
  isHttpsAvatarUrl,
  isManagedProfileAvatarObjectPath,
  isRasterDataAvatar,
  isSvgDataAvatar,
  normalizeAllowedAvatarMime,
  profileAvatarObjectPath,
  sniffAvatarImageMime,
} from "../lib/profile-avatar-upload-rules";
import { classifyAvatarDraft } from "../lib/supabase/profile-avatar-storage";

assert.equal(normalizeAllowedAvatarMime("image/jpeg"), "image/jpeg");
assert.equal(normalizeAllowedAvatarMime("image/jpg"), "image/jpeg");
assert.equal(normalizeAllowedAvatarMime("image/gif"), null);
assert.equal(normalizeAllowedAvatarMime("application/pdf"), null);

assert.equal(isHttpsAvatarUrl("https://example.com/a.jpg"), true);
assert.equal(isHttpsAvatarUrl("http://example.com/a.jpg"), false);

assert.equal(isSvgDataAvatar("data:image/svg+xml,%3Csvg"), true);
assert.equal(isRasterDataAvatar("data:image/jpeg;base64,/9j/"), true);
assert.equal(isRasterDataAvatar("data:image/svg+xml,%3Csvg"), false);

const path = profileAvatarObjectPath(
  "11111111-1111-4111-8111-111111111111",
  "abcd1234abcd1234",
  "jpg",
);
assert.equal(
  path,
  "profile-avatars/11111111-1111-4111-8111-111111111111/abcd1234abcd1234.jpg",
);
assert.equal(isManagedProfileAvatarObjectPath(path), true);
assert.equal(isManagedProfileAvatarObjectPath("other/x.jpg"), false);

assert.equal(classifyAvatarDraft("").kind, "empty");
assert.equal(classifyAvatarDraft("https://cdn.example/a.jpg").kind, "https");
assert.equal(
  classifyAvatarDraft("data:image/svg+xml," + "a".repeat(100)).kind,
  "svg-preset",
);
assert.equal(
  classifyAvatarDraft("data:image/jpeg;base64," + "a".repeat(100)).kind,
  "raster-data",
);
assert.equal(
  classifyAvatarDraft("data:image/svg+xml," + "a".repeat(MAX_PROFILE_AVATAR_URL_CHARS + 1))
    .kind,
  "unsupported",
);

// JPEG magic
const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, ...Array(20).fill(0)]);
assert.equal(sniffAvatarImageMime(jpeg), "image/jpeg");

console.log("PASS verify-profile-avatar-upload-rules");
