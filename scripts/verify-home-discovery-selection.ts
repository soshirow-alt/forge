/**
 * Unit checks for featured hero 4-slot picking + legacy selectHeroItems.
 * Run: npx --yes tsx scripts/verify-home-discovery-selection.ts
 */
import {
  selectHeroItems,
  type HomeDiscoveryCandidate,
} from "../lib/home-discovery-selection";
import { pickFeaturedHeroSlots } from "../lib/home-featured-hero-selection";
import type { FeaturedHeroType } from "../lib/home-featured-hero";

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

function c(
  id: string,
  section: HomeDiscoveryCandidate["section"],
  rank: number,
): HomeDiscoveryCandidate {
  return { id, section, rank };
}

function ids(items: { id: string }[]) {
  return items.map((item) => item.id);
}

function assertUnique(items: { id: string }[], label: string) {
  const seen = new Set<string>();
  for (const item of items) {
    assert(!seen.has(item.id), `${label}: duplicate ${item.id}`);
    seen.add(item.id);
  }
}

function fc(
  id: string,
  featuredType: FeaturedHeroType,
  axisRank: number,
  ownerId?: string,
) {
  return { id, featuredType, axisRank, ownerId };
}

// --- legacy selectHeroItems (shelves still use three axes) ---
{
  const trending = [c("t1", "trending", 1), c("t2", "trending", 2)];
  const updated = [c("u1", "updated", 1), c("u2", "updated", 2)];
  const newest = [c("n1", "newest", 1), c("n2", "newest", 2)];
  const hero = selectHeroItems(trending, updated, newest);
  assert(ids(hero).join(",") === "t1,u1,n1", "legacy distinct firsts");
}

{
  const trending = [c("x", "trending", 1), c("t2", "trending", 2)];
  const updated = [c("x", "updated", 1), c("u2", "updated", 2)];
  const newest = [c("x", "newest", 1), c("n2", "newest", 2)];
  const hero = selectHeroItems(trending, updated, newest);
  assert(ids(hero).join(",") === "x,t2,u2", "legacy same first fill");
  assertUnique(hero, "legacy same first");
}

// --- 066 featured 4-slot picker ---
{
  const picked = pickFeaturedHeroSlots({
    reaction: [fc("r1", "reaction", 1, "o1"), fc("r2", "reaction", 2, "o2")],
    rising_plays: [
      fc("p1", "rising_plays", 1, "o3"),
      fc("p2", "rising_plays", 2, "o4"),
    ],
    newest: [fc("n1", "newest", 1, "o5")],
    updated: [fc("u1", "updated", 1, "o6")],
  });
  assert(
    ids(picked).join(",") === "r1,p1,n1,u1",
    `four distinct: ${ids(picked)}`,
  );
  assertUnique(picked, "four distinct");
}

{
  // reaction #1 coincides with rising #1 → rising takes next
  const picked = pickFeaturedHeroSlots({
    reaction: [fc("same", "reaction", 1, "o1")],
    rising_plays: [
      fc("same", "rising_plays", 1, "o1"),
      fc("p2", "rising_plays", 2, "o2"),
    ],
    newest: [fc("n1", "newest", 1, "o3")],
    updated: [],
  });
  assert(ids(picked).join(",") === "same,p2,n1", `dedupe rising: ${ids(picked)}`);
}

{
  // soft owner diversity: prefer other owner when available
  const picked = pickFeaturedHeroSlots({
    reaction: [fc("r1", "reaction", 1, "o1")],
    rising_plays: [
      fc("p-same-owner", "rising_plays", 1, "o1"),
      fc("p-other", "rising_plays", 2, "o2"),
    ],
    newest: [fc("n1", "newest", 1, "o1")],
    updated: [fc("u1", "updated", 1, "o9")],
  });
  assert(
    ids(picked).join(",") === "r1,p-other,n1,u1",
    `owner soft prefer: ${ids(picked)}`,
  );
}

{
  // newest guarantee: only same-owner candidates still allowed
  const picked = pickFeaturedHeroSlots({
    reaction: [fc("r1", "reaction", 1, "o1")],
    rising_plays: [],
    newest: [fc("n1", "newest", 1, "o1")],
    updated: [],
  });
  assert(ids(picked).join(",") === "r1,n1", `newest kept: ${ids(picked)}`);
}

{
  // empty rising → fewer than 4 slides, no padding
  const picked = pickFeaturedHeroSlots({
    reaction: [fc("r1", "reaction", 1)],
    rising_plays: [],
    newest: [fc("n1", "newest", 1)],
    updated: [fc("u1", "updated", 1)],
  });
  assert(picked.length === 3, "no fill for empty axis");
  assert(
    !picked.some((p) => p.featuredType === "rising_plays"),
    "no rising slot",
  );
}

console.log("verify-home-discovery-selection: PASS");
