/**
 * Unit checks for home discovery hero/carousel pure functions.
 * Run: npx --yes tsx scripts/verify-home-discovery-selection.ts
 */
import {
  buildSectionCarouselItems,
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

// 8–11) carousel first page excludes hero; later can reappear; no dup; no cross-fill
{
  const candidates = [
    c("h1", "updated", 1),
    c("a", "updated", 2),
    c("b", "updated", 3),
    c("c", "updated", 4),
    c("d", "updated", 5),
    c("e", "updated", 6),
  ];
  const heroIds = new Set(["h1"]);
  const carousel = buildSectionCarouselItems(candidates, heroIds, 4);
  assert(carousel.slice(0, 4).every((item) => item.id !== "h1"), "first page no hero");
  assert(
    carousel.slice(4).some((item) => item.id === "h1"),
    "hero reappears after first page",
  );
  assertUnique(carousel, "carousel");
  assert(carousel.length === candidates.length, "no drop / no cross-fill");
  assert(ids(carousel).slice(0, 4).join(",") === "a,b,c,d", "first page order");
}

// filter().slice anti-pattern check (heroes would vanish)
{
  const candidates = [
    c("h1", "newest", 1),
    c("a", "newest", 2),
    c("b", "newest", 3),
  ];
  const bad = candidates.filter((item) => item.id !== "h1");
  assert(!bad.some((item) => item.id === "h1"), "bad filter removes hero forever");
  const good = buildSectionCarouselItems(candidates, new Set(["h1"]), 4);
  assert(good.some((item) => item.id === "h1"), "good rebuild keeps hero later");
}

console.log("verify-home-discovery-selection: PASS");
