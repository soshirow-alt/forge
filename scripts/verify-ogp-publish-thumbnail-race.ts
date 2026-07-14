/**
 * Focused verify for OGP publish thumbnail race gate (no DB/Storage).
 *
 * Usage: npx tsx scripts/verify-ogp-publish-thumbnail-race.ts
 */
import assert from "node:assert/strict";
import {
  isProjectPublishSubmitDisabled,
  projectPublishSubmitLabel,
  resolveInsertVisibility,
  resolvePublishOgImageCandidate,
  shouldDeferPublicUntilThumbnailsReady,
} from "../lib/project-publish-og-gate";
import {
  DEFAULT_GAME_OG_PATH,
  resolveOgImageUrl,
  resolveProjectOgImageUrl,
} from "../lib/og-image-url";
import { buildGameDetailMetadata } from "../lib/game-detail-metadata";
import type { ProjectOgData } from "../lib/supabase/project-og";

const ORIGIN = "https://forge.example.com";
process.env.NEXT_PUBLIC_SITE_URL = ORIGIN;

function pass(message: string) {
  console.log(`PASS ${message}`);
}

// --- Gate: defer public until thumbs ready ---
assert.equal(
  shouldDeferPublicUntilThumbnailsReady({
    intendedVisibility: "public",
    pendingThumbnailCount: 2,
  }),
  true,
);
pass("defer public when public + pending thumbs");

assert.equal(
  shouldDeferPublicUntilThumbnailsReady({
    intendedVisibility: "public",
    pendingThumbnailCount: 0,
  }),
  false,
);
pass("do not defer public when no thumbs");

assert.equal(
  shouldDeferPublicUntilThumbnailsReady({
    intendedVisibility: "private",
    pendingThumbnailCount: 3,
  }),
  false,
);
pass("do not defer when already private");

assert.equal(
  resolveInsertVisibility({
    intendedVisibility: "public",
    pendingThumbnailCount: 1,
  }),
  "private",
);
pass("insert visibility private while materializing thumbs");

assert.equal(
  resolveInsertVisibility({
    intendedVisibility: "public",
    pendingThumbnailCount: 0,
  }),
  "public",
);
pass("insert visibility public when no thumbs");

// --- Submit disabled while upload/read pending ---
assert.equal(
  isProjectPublishSubmitDisabled({ submitting: false, thumbnailsBusy: true }),
  true,
);
pass("cannot submit while thumbnail read pending");

assert.equal(
  isProjectPublishSubmitDisabled({ submitting: true, thumbnailsBusy: false }),
  true,
);
pass("cannot submit while publishing/upload in flight");

assert.equal(
  isProjectPublishSubmitDisabled({ submitting: false, thumbnailsBusy: false }),
  false,
);
pass("can submit after thumbnail read complete and idle");

assert.equal(
  projectPublishSubmitLabel({
    submitting: false,
    thumbnailsBusy: true,
    hasThumbnails: false,
  }),
  "画像を読み込み中…",
);
pass("label while local multi-image read pending");

assert.equal(
  projectPublishSubmitLabel({
    submitting: true,
    thumbnailsBusy: false,
    hasThumbnails: true,
  }),
  "画像をアップロード中…",
);
pass("label while Storage upload in flight with thumbs");

assert.equal(
  projectPublishSubmitLabel({
    submitting: true,
    thumbnailsBusy: false,
    hasThumbnails: false,
  }),
  "投稿中…",
);
pass("label while publish without thumbs");

// --- Metadata always absolute https og:image ---
const derived =
  "https://cdn.example.com/p/og-aaaaaaaaaaaaaaaa-1200x630.jpg";
const withDerived = resolvePublishOgImageCandidate({
  ogImageUrl: derived,
  siteOrigin: ORIGIN,
});
assert.equal(withDerived.absoluteOgImage, derived);
assert.equal(withDerived.usedDefault, false);
pass("uses derived og when available (not wrong default)");

const withoutOg = resolvePublishOgImageCandidate({
  ogImageUrl: null,
  siteOrigin: ORIGIN,
});
assert.equal(
  withoutOg.absoluteOgImage,
  `${ORIGIN}${DEFAULT_GAME_OG_PATH}`,
);
assert.equal(withoutOg.usedDefault, true);
pass("default absolute https when og unavailable");

const projectWithOg: ProjectOgData = {
  id: "11111111-1111-4111-8111-111111111111",
  title: "Race Fix Game",
  description: "desc",
  overviewIntroduction: "",
  playableVersion: "0.1",
  phase: "プロトタイプ",
  releaseStatus: null,
  ogImageUrl: derived,
};
const meta = buildGameDetailMetadata(projectWithOg);
const ogImages = meta.openGraph?.images;
const first =
  Array.isArray(ogImages) && ogImages[0]
    ? typeof ogImages[0] === "string"
      ? ogImages[0]
      : String((ogImages[0] as { url: string | URL }).url)
    : "";
assert.ok(first.startsWith("https://"));
assert.equal(first, derived);
pass("HTML metadata has absolute https og:image after publish with thumb/og");

assert.equal(
  resolveProjectOgImageUrl(projectWithOg.id, derived, ORIGIN),
  derived,
);
pass("no wrong default when thumb/og exists");

assert.equal(
  resolveOgImageUrl(null, ORIGIN),
  `${ORIGIN}${DEFAULT_GAME_OG_PATH}`,
);
pass("default when og unavailable");

const editedOg =
  "https://cdn.example.com/p/og-bbbbbbbbbbbbbbbb-1200x630.jpg";
const editedMeta = buildGameDetailMetadata({
  ...projectWithOg,
  ogImageUrl: editedOg,
});
const editedImages = editedMeta.openGraph?.images;
const editedFirst =
  Array.isArray(editedImages) && editedImages[0]
    ? typeof editedImages[0] === "string"
      ? editedImages[0]
      : String((editedImages[0] as { url: string | URL }).url)
    : "";
assert.equal(editedFirst, editedOg);
pass("edit main image / re-derive updates metadata og:image");

// Multi-image early submit: pending count > 0 forces private insert
assert.equal(
  resolveInsertVisibility({
    intendedVisibility: "public",
    pendingThumbnailCount: 5,
  }),
  "private",
);
pass("block early public discoverability for multi-image pending insert");

console.log("All ogp-publish-thumbnail-race checks passed.");
