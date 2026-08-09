/**
 * Featured hero thumbnail settle + API capacity (066 four-slot).
 * Usage: npx tsx scripts/verify-featured-hero-thumbnails.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { FEATURED_HERO_SLOT_COUNT } from "../lib/home-featured-hero";
import {
  buildFeaturedHeroThumbnailById,
  capFeaturedHeroThumbnailIds,
  resolveFeaturedCarouselThumbnails,
} from "../lib/player-ia/featured-hero-thumbnails";

const ROOT = path.resolve(__dirname, "..");

function read(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel), "utf8");
}

assert.equal(FEATURED_HERO_SLOT_COUNT, 4);

const four = ["a", "b", "c", "d", "e"];
assert.deepEqual(capFeaturedHeroThumbnailIds(four), ["a", "b", "c", "d"]);
assert.deepEqual(capFeaturedHeroThumbnailIds(["x", "x", "y"]), ["x", "y"]);
assert.deepEqual(capFeaturedHeroThumbnailIds([]), []);

const ids4 = ["p1", "p2", "p3", "p4"];
const byIdFull = buildFeaturedHeroThumbnailById(ids4, {
  p1: 3,
  p2: 1,
  p3: 0,
  p4: 2,
});
assert.equal(Object.keys(byIdFull).length, 4);
assert.ok(ids4.every((id) => id in byIdFull));

// Partial API response (legacy 3-ID truncation simulation): still 4 keys.
const byIdPartial = buildFeaturedHeroThumbnailById(ids4, {
  p1: 2,
  p2: 2,
  p3: 2,
});
assert.equal(Object.keys(byIdPartial).length, 4);
assert.deepEqual(byIdPartial.p4, []);

assert.deepEqual(
  resolveFeaturedCarouselThumbnails([], { status: "loading" }),
  { status: "ready", byId: {} },
);
assert.equal(
  resolveFeaturedCarouselThumbnails(ids4, { status: "loading" }).status,
  "loading",
);
const settled = resolveFeaturedCarouselThumbnails(ids4, {
  status: "ready",
  byId: { p1: ["/t/1"] },
});
assert.equal(settled.status, "ready");
assert.ok(!("p4" in (settled as { byId: Record<string, string[]> }).byId));

const api = read("app/api/public/projects/thumbnail-counts/route.ts");
assert.match(api, /FEATURED_HERO_SLOT_COUNT/);
assert.doesNotMatch(api, /MAX_HERO_IDS\s*=\s*3/);

const card = read("components/featured/featured-game-card.tsx");
assert.match(card, /compact=\{compact\}/);
assert.match(card, /DiscoveryCardStatPills/);
assert.match(card, /grid grid-cols-2/);
// Stats must sit outside the compact text overflow clip region.
const overflowIdx = card.indexOf('compact ? "gap-1 overflow-hidden"');
const pillsIdx = card.indexOf("<DiscoveryCardStatPills");
assert.ok(overflowIdx > 0 && pillsIdx > overflowIdx);
assert.ok(
  card.indexOf("shrink-0 pt-1", overflowIdx) > 0 &&
    card.indexOf("shrink-0 pt-1", overflowIdx) < pillsIdx,
);

const audit = read("docs/forge-collaboration-gap-audit.md");
assert.match(audit, /forbidden POST|禁止されたPOST|Process incident/i);
assert.match(audit, /401/);
assert.match(audit, /IMPLEMENTED.*しない|never IMPLEMENTED|not.*IMPLEMENTED/i);
assert.doesNotMatch(
  audit,
  /\|\s*Client INSERT usage\s*\|\s*\*\*Not probed\.\*\*/,
);

console.log("verify-featured-hero-thumbnails: PASS");
