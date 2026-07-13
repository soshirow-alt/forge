/**
 * Unit checks for home discovery hero selection (shelves keep RPC order;
 * hero duplication in shelves is allowed — no soft exclusion).
 * Run: npx --yes tsx scripts/verify-home-discovery-selection.ts
 */
import {
  selectHeroItems,
  type HomeDiscoveryCandidate,
} from "../lib/home-discovery-selection";

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

// 1) three distinct firsts
{
  const trending = [c("t1", "trending", 1), c("t2", "trending", 2)];
  const updated = [c("u1", "updated", 1), c("u2", "updated", 2)];
  const newest = [c("n1", "newest", 1), c("n2", "newest", 2)];
  const hero = selectHeroItems(trending, updated, newest);
  assert(ids(hero).join(",") === "t1,u1,n1", "distinct firsts");
  assert(hero[0]?.heroSource === "trending", "source trending");
  assert(hero[1]?.heroSource === "updated", "source updated");
  assert(hero[2]?.heroSource === "newest", "source newest");
}

// 2) all firsts identical
{
  const trending = [c("x", "trending", 1), c("t2", "trending", 2), c("t3", "trending", 3)];
  const updated = [c("x", "updated", 1), c("u2", "updated", 2)];
  const newest = [c("x", "newest", 1), c("n2", "newest", 2)];
  const hero = selectHeroItems(trending, updated, newest);
  assert(ids(hero).join(",") === "x,t2,u2", `same first fill next: ${ids(hero)}`);
  assertUnique(hero, "same first");
}

// 3) trending empty
{
  const hero = selectHeroItems(
    [],
    [c("u1", "updated", 1), c("u2", "updated", 2)],
    [c("n1", "newest", 1), c("n2", "newest", 2)],
  );
  assert(ids(hero).join(",") === "u1,n1,u2", `trending empty: ${ids(hero)}`);
}

// 4) updated empty
{
  const hero = selectHeroItems(
    [c("t1", "trending", 1), c("t2", "trending", 2)],
    [],
    [c("n1", "newest", 1), c("n2", "newest", 2)],
  );
  assert(ids(hero).join(",") === "t1,n1,t2", `updated empty: ${ids(hero)}`);
}

// 5) newest only
{
  const hero = selectHeroItems(
    [],
    [],
    [c("n1", "newest", 1), c("n2", "newest", 2), c("n3", "newest", 3)],
  );
  assert(ids(hero).join(",") === "n1,n2,n3", "newest only");
}

// 6) one public work
{
  const only = [c("a", "newest", 1)];
  const hero = selectHeroItems(only, only, only);
  assert(ids(hero).join(",") === "a", "single work");
}

// 7) two public works
{
  const trending = [c("a", "trending", 1), c("b", "trending", 2)];
  const updated = [c("a", "updated", 1), c("b", "updated", 2)];
  const newest = [c("b", "newest", 1), c("a", "newest", 2)];
  const hero = selectHeroItems(trending, updated, newest);
  assert(hero.length === 2, "two works length");
  assertUnique(hero, "two works");
}

// 8) shelf arrays stay untouched by hero pick (duplication allowed)
{
  const trending = [
    c("slime", "trending", 1),
    c("a", "trending", 2),
    c("b", "trending", 3),
  ];
  const hero = selectHeroItems(trending, [], []);
  assert(hero[0]?.id === "slime", "hero is trending rank1");
  assert(ids(trending).join(",") === "slime,a,b", "trending shelf order unchanged");
}

console.log("verify-home-discovery-selection: PASS");
