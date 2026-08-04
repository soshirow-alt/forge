/**
 * Unit checks for featured hero 4-slot picking + legacy selectHeroItems
 * + Player IA Home usage pair selection.
 * Run: npx --yes tsx scripts/verify-home-discovery-selection.ts
 */
import {
  selectHeroItems,
  type HomeDiscoveryCandidate,
} from "../lib/home-discovery-selection";
import { pickFeaturedHeroSlots } from "../lib/home-featured-hero-selection";
import type { FeaturedHeroType } from "../lib/home-featured-hero";
import {
  selectUsagePairs,
  type UsagePairRef,
} from "../lib/player-ia/home-shelf-selection";
import type { ProjectCategoryId } from "../lib/project-categories";

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

// --- Player IA Home usage pair selection (Connections shelf) ---
function up(
  id: string,
  sourceProjectId: string,
  sourceCategory: ProjectCategoryId,
  targetProjectId: string,
  targetCategory: ProjectCategoryId,
): UsagePairRef {
  return {
    id,
    sourceProjectId,
    sourceCategory,
    targetProjectId,
    targetCategory,
  };
}

function pairKeys(items: UsagePairRef[]) {
  return items.map((i) => `${i.sourceCategory}>${i.targetCategory}`);
}

{
  // 1. Four distinct category-pair keys → pick all four kinds first
  const ranked = [
    up("r1", "s1", "game", "t1", "audio"),
    up("r2", "s2", "game", "t2", "asset"),
    up("r3", "s3", "game", "t3", "dev-tool"),
    up("r4", "s4", "service-app", "t4", "dev-tool"),
  ];
  const picked = selectUsagePairs(ranked, 4);
  assert(picked.length === 4, "four items");
  assert(
    new Set(ids(picked)).size === 4 &&
      ["r1", "r2", "r3", "r4"].every((id) => ids(picked).includes(id)),
    `four keys ids: ${ids(picked)}`,
  );
  assert(new Set(pairKeys(picked)).size === 4, "four distinct pair keys");
}

{
  // 2. Same key has two early candidates; other keys exist → second same-key after other keys
  const ranked = [
    up("a1", "g1", "game", "a1p", "audio"),
    up("a2", "g2", "game", "a2p", "audio"),
    up("b1", "g3", "game", "b1p", "asset"),
    up("c1", "g4", "game", "c1p", "dev-tool"),
    up("d1", "svc1", "service-app", "d1p", "dev-tool"),
  ];
  const picked = selectUsagePairs(ranked, 4);
  assert(picked[0].id === "a1", "first keeps ranked head");
  assert(
    !picked.slice(0, 3).some((p) => p.id === "a2"),
    "same-key second not before other keys fill",
  );
  assert(new Set(pairKeys(picked)).size >= 3, "at least 3 pair keys in 4 slots");
  assert(
    picked.some((p) => p.id === "d1" || p.sourceCategory === "service-app"),
    "service-app relation can appear when ranked",
  );
}

{
  // 3. Different source categories → soft prefer unused source category
  const ranked = [
    up("g1", "game1", "game", "aud1", "audio"),
    up("g2", "game2", "game", "ast1", "asset"),
    up("s1", "svc1", "service-app", "tool1", "dev-tool"),
    up("g3", "game3", "game", "tool2", "dev-tool"),
  ];
  const picked = selectUsagePairs(ranked, 3);
  assert(picked.some((p) => p.sourceCategory === "service-app"), "unused source cat soft preferred");
  assert(new Set(picked.map((p) => p.sourceCategory)).size >= 2, "source cats diversify");
}

{
  // 4. Only two unique keys → stage 2 fills from ranked order
  const ranked = [
    up("a1", "g1", "game", "a1p", "audio"),
    up("a2", "g2", "game", "a2p", "audio"),
    up("b1", "g3", "game", "b1p", "asset"),
    up("b2", "g4", "game", "b2p", "asset"),
  ];
  const picked = selectUsagePairs(ranked, 4);
  assert(ids(picked).join(",") === "a1,b1,a2,b2", `two-key fill: ${ids(picked)}`);
  assert(new Set(pairKeys(picked)).size === 2, "only two pair keys available");
}

{
  // 5. Same key max 2
  const ranked = [
    up("a1", "g1", "game", "a1p", "audio"),
    up("a2", "g2", "game", "a2p", "audio"),
    up("a3", "g3", "game", "a3p", "audio"),
    up("b1", "g4", "game", "b1p", "asset"),
  ];
  const picked = selectUsagePairs(ranked, 4);
  const audioCount = picked.filter(
    (p) => `${p.sourceCategory}>${p.targetCategory}` === "game>audio",
  ).length;
  assert(audioCount === 2, `game>audio capped at 2, got ${audioCount}`);
  assert(!picked.some((p) => p.id === "a3"), "third same-key excluded");
}

{
  // 6. Duplicate relation ids excluded
  const ranked = [
    up("dup", "g1", "game", "a1", "audio"),
    up("dup", "g1", "game", "a1", "audio"),
    up("b1", "g2", "game", "b1p", "asset"),
  ];
  const picked = selectUsagePairs(ranked, 4);
  assert(picked.filter((p) => p.id === "dup").length === 1, "dup id once");
}

{
  // 7. Self relation excluded
  const ranked = [
    up("self", "g1", "game", "g1", "game"),
    up("ok", "g2", "game", "a1", "audio"),
  ];
  const picked = selectUsagePairs(ranked, 4);
  assert(ids(picked).join(",") === "ok", "self excluded");
}

{
  // 8. Candidate shortage → allow below limit
  const ranked = [up("only", "g1", "game", "a1", "audio")];
  const picked = selectUsagePairs(ranked, 4);
  assert(picked.length === 1, "below limit ok");
}

{
  // 9. Stable for same input order
  const ranked = [
    up("a1", "g1", "game", "a1p", "audio"),
    up("b1", "g2", "game", "b1p", "asset"),
    up("c1", "g3", "game", "c1p", "dev-tool"),
    up("d1", "s1", "service-app", "d1p", "dev-tool"),
    up("a2", "g4", "game", "a2p", "audio"),
  ];
  const first = ids(selectUsagePairs(ranked, 4)).join(",");
  const second = ids(selectUsagePairs(ranked, 4)).join(",");
  assert(first === second, "stable selection");
}

{
  // 10. Rank order preserved among stage-1 picks when soft-deferring for unused source
  const ranked = [
    up("g-audio", "g1", "game", "a1", "audio"),
    up("g-asset", "g2", "game", "as1", "asset"),
    up("svc-tool", "s1", "service-app", "t1", "dev-tool"),
    up("g-tool", "g3", "game", "t2", "dev-tool"),
  ];
  const picked = selectUsagePairs(ranked, 4);
  assert(
    ids(picked).join(",") === "g-audio,svc-tool,g-asset,g-tool",
    `rank-preserving soft defer: ${ids(picked)}`,
  );
  assert(picked[0].id === "g-audio", "RPC head retained");
  assert(picked[1].id === "svc-tool", "unused source inserted before deferred same-source keys finish");
}

{
  // 11. Deferred head of a pair-key is not replaced by a later same-key candidate
  const ranked = [
    up("g-audio", "g1", "game", "a1", "audio"),
    up("asset-early", "g2", "game", "as1", "asset"),
    up("svc-tool", "s1", "service-app", "t1", "dev-tool"),
    up("asset-late", "g9", "game", "as9", "asset"),
    up("g-tool", "g3", "game", "t2", "dev-tool"),
  ];
  const picked = selectUsagePairs(ranked, 4);
  assert(picked.some((p) => p.id === "asset-early"), "deferred early same-key kept");
  assert(!picked.some((p) => p.id === "asset-late"), "later same-key must not leapfrog");
  assert(
    ids(picked).indexOf("asset-early") < ids(picked).indexOf("asset-late") ||
      !picked.some((p) => p.id === "asset-late"),
    "early deferred before late same-key",
  );
}

{
  // 12. Unused target soft preference: when sources are all unused, prefer
  // unused target over repeating an already-shown target.
  const ranked = [
    up("g-audio", "g1", "game", "a1", "audio"),
    up("svc-audio", "s1", "service-app", "a2", "audio"),
    up("asset-tool", "as1", "asset", "t1", "dev-tool"),
  ];
  const picked = selectUsagePairs(ranked, 2);
  assert(ids(picked).join(",") === "g-audio,asset-tool", `unused target soft: ${ids(picked)}`);
  assert(
    new Set(picked.map((p) => p.targetCategory)).size === 2,
    "two distinct target categories",
  );
  assert(!picked.some((p) => p.id === "svc-audio"), "repeat target deferred behind unused target");
}

console.log("verify-home-discovery-selection: PASS");
