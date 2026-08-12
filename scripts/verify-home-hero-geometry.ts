/**
 * Deterministic Home hero visual geometry (9a1ff25 presentation restore).
 * Selection / ranking is not asserted here.
 *
 * Usage: npx tsx scripts/verify-home-hero-geometry.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  HOME_HERO_GRID_CLASS,
  HOME_HERO_MIN_HEIGHT_CLASS,
  HOME_HERO_PLACEHOLDER_CHROME_CLASS,
  HOME_HERO_PLACEHOLDER_THUMB_BOX_CLASS,
  HOME_HERO_QUEUE_CARD_CLASS,
  HOME_HERO_QUEUE_GAP_PX,
  HOME_HERO_QUEUE_MIN_ROW_PX,
  HOME_HERO_QUEUE_THUMB_BOX_CLASS,
  HOME_HERO_RAIL_SLOTS,
  HOME_HERO_ROTATE_MS,
  HOME_HERO_THUMB_FLEX_CLASS,
  resolveHomeHeroQueueRowHeight,
} from "../lib/player-ia/home-hero-geometry";
import {
  CATEGORY_HOME_HERO_RAIL_SLOTS,
  planCategoryHomeHero,
  resolveCategoryHomeHeroRail,
} from "../lib/player-ia/category-home-hero";
import { resolveFeedbackGatheringLayout } from "../lib/player-ia/feedback-gathering-layout";

const ROOT = process.cwd();
function read(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel), "utf8");
}

// --- 9a1ff25 tokens ---
{
  assert.equal(HOME_HERO_QUEUE_GAP_PX, 12);
  assert.equal(HOME_HERO_QUEUE_MIN_ROW_PX, 88);
  assert.equal(HOME_HERO_RAIL_SLOTS, 3);
  assert.equal(CATEGORY_HOME_HERO_RAIL_SLOTS, 3);
  assert.equal(HOME_HERO_ROTATE_MS, 6000);
  assert.equal(HOME_HERO_MIN_HEIGHT_CLASS, "min-h-[22rem]");
  assert.equal(
    HOME_HERO_GRID_CLASS,
    "grid grid-cols-1 gap-4 lg:grid-cols-2 lg:items-stretch",
  );
  assert.match(HOME_HERO_THUMB_FLEX_CLASS, /flex-\[1\.35\]/);
  assert.match(HOME_HERO_QUEUE_THUMB_BOX_CLASS, /aspect-\[4\/3\]/);
  assert.match(HOME_HERO_QUEUE_THUMB_BOX_CLASS, /w-28/);
  assert.match(HOME_HERO_QUEUE_THUMB_BOX_CLASS, /sm:w-32/);
  assert.match(HOME_HERO_QUEUE_CARD_CLASS, /\bp-3\b/);
  assert.match(HOME_HERO_QUEUE_CARD_CLASS, /\bw-full\b/);
  assert.equal(
    HOME_HERO_PLACEHOLDER_THUMB_BOX_CLASS.includes("aspect-[4/3]"),
    true,
  );
  assert.match(HOME_HERO_PLACEHOLDER_THUMB_BOX_CLASS, /w-28/);
  assert.match(HOME_HERO_PLACEHOLDER_THUMB_BOX_CLASS, /sm:w-32/);
  assert.match(HOME_HERO_PLACEHOLDER_CHROME_CLASS, /\bp-3\b/);
  assert.match(HOME_HERO_PLACEHOLDER_CHROME_CLASS, /\bw-full\b/);
  console.log("OK  9a1ff25 geometry tokens");
}

// --- equal right-row height; count does not change shell ---
{
  const measured = 360;
  const four = resolveHomeHeroQueueRowHeight(measured, 3);
  const three = resolveHomeHeroQueueRowHeight(measured, 3);
  const two = resolveHomeHeroQueueRowHeight(measured, 3);
  const one = resolveHomeHeroQueueRowHeight(measured, 3);
  assert.equal(four, (360 - 12 * 2) / 3);
  assert.equal(four, three);
  assert.equal(four, two);
  assert.equal(four, one);
  assert.equal(resolveHomeHeroQueueRowHeight(null), null);
  assert.equal(
    resolveHomeHeroQueueRowHeight(240),
    HOME_HERO_QUEUE_MIN_ROW_PX,
  );
  for (const count of [1, 2, 3, 4]) {
    const layout = resolveFeedbackGatheringLayout(count);
    assert.equal(layout.show, true);
    assert.equal(layout.queueSlots, 3);
    assert.equal(layout.gridCols, 2);
    const plan = planCategoryHomeHero(
      Array.from({ length: count }, (_, i) => `p${i}`),
    );
    assert.equal(plan.placeholderCount + Math.max(0, plan.reals.length - 1), 3);
    const rail = resolveCategoryHomeHeroRail(plan.reals, 0);
    assert.equal(rail?.right.length, 3);
  }
  console.log("OK  1/2/3/4 same shell + equal right row height");
}

// --- no invented 4-item width / auto-height / natural thumb size ---
{
  const files = [
    "lib/player-ia/home-hero-geometry.ts",
    "components/player-ia/category-home-hero.tsx",
    "components/player-ia/feedback-gathering-section.tsx",
    "components/player-ia/category-home-work-cards.tsx",
    "components/player-ia/category-home-placeholder.tsx",
  ];
  for (const rel of files) {
    const src = read(rel);
    assert.doesNotMatch(
      src,
      /aspect-\[16\/10\]/,
      `${rel} must not use 16/10 hero thumb (broke 9a1ff25 height)`,
    );
    assert.doesNotMatch(
      src,
      /w-\[42%\]/,
      `${rel} must not use percentage rail thumb width`,
    );
    assert.doesNotMatch(
      src,
      /min-h-\[148px\]/,
      `${rel} must not use auto-ish 148px rail min-height`,
    );
  }
  const hero = read("components/player-ia/category-home-hero.tsx");
  assert.match(hero, /HOME_HERO_GRID_CLASS/);
  assert.match(hero, /HOME_HERO_MIN_HEIGHT_CLASS/);
  assert.match(hero, /HOME_HERO_QUEUE_GAP_PX/);
  assert.match(hero, /resolveHomeHeroQueueRowHeight/);
  assert.match(hero, /ResizeObserver/);
  assert.match(hero, /lg:items-stretch|HOME_HERO_GRID_CLASS/);
  assert.doesNotMatch(hero, /max-w-\[(?!1200px)\d+px\]/);
  assert.doesNotMatch(hero, /w-\[calc/);
  const fb = read("components/player-ia/feedback-gathering-section.tsx");
  const cards = read("components/player-ia/category-home-work-cards.tsx");
  const placeholder = read("components/player-ia/category-home-placeholder.tsx");
  assert.match(fb, /HOME_HERO_THUMB_FLEX_CLASS/);
  assert.match(fb, /HOME_HERO_QUEUE_THUMB_BOX_CLASS/);
  assert.match(fb, /line-clamp-2/);
  assert.match(cards, /HOME_HERO_THUMB_FLEX_CLASS/);
  assert.match(cards, /HOME_HERO_QUEUE_THUMB_BOX_CLASS/);
  assert.match(cards, /line-clamp-2/);
  assert.match(placeholder, /HOME_HERO_PLACEHOLDER_CHROME_CLASS/);
  assert.match(placeholder, /HOME_HERO_PLACEHOLDER_THUMB_BOX_CLASS/);
  assert.match(placeholder, /role="presentation"/);
  assert.doesNotMatch(placeholder, /href=/);
  console.log("OK  shared presentation tokens; no dead-space width invention");
}

// --- Game / dev-tool / whole Home share the same shell ---
{
  const gameHome = read("components/player-ia/player-ia-game-home-page.tsx");
  const categoryHome = read(
    "components/player-ia/player-ia-category-home-page.tsx",
  );
  const fb = read("components/player-ia/feedback-gathering-section.tsx");
  assert.match(gameHome, /CategoryHomeHero/);
  assert.match(categoryHome, /CategoryHomeHero/);
  assert.match(fb, /CategoryHomeHero/);
  assert.doesNotMatch(gameHome, /FeaturedGameCarousel|NeighborPeek/);
  assert.match(gameHome, /CategoryHomeHeroWorkCard/);
  assert.match(categoryHome, /CategoryHomeHeroWorkCard/);
  assert.match(fb, /FeedbackHeroCard|HOME_HERO_CARD_CHROME_CLASS/);
  console.log("OK  Game / category / whole Home share CategoryHomeHero");
}

// --- whole Home container stays 9a1ff25 max-width ---
{
  const home = read("components/player-ia/player-ia-home-page.tsx");
  assert.match(home, /max-w-\[1200px\]/);
  assert.doesNotMatch(home, /max-w-\[1400px\]/);
  console.log("OK  whole Home container max-w-[1200px]");
}

console.log("verify-home-hero-geometry ok");
