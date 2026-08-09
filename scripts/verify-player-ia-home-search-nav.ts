/**
 * Behavioral checks: Home CTA / Search query preserve / quick_try chip hide / catalog params.
 * Usage: npx tsx scripts/verify-player-ia-home-search-nav.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { PLAYER_IA_HOME_FEATURE_CARDS } from "../lib/player-ia/home-feature-cards";
import {
  buildCatalogQueryString,
  parseCatalogSearchParams,
  PLAYER_IA_SEARCH_CATALOG_LIMIT,
} from "../lib/player-ia/catalog-search-params";
import { buildSearchHrefForCategory } from "../lib/player-ia/search-href";

const ROOT = path.resolve(import.meta.dirname, "..");

function read(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel), "utf8");
}

// --- A. Home CTAs (2026-08 five-category redesign) ---
assert.equal(PLAYER_IA_HOME_FEATURE_CARDS.length, 5);
assert.deepEqual(
  PLAYER_IA_HOME_FEATURE_CARDS.map((c) => c.id),
  ["game", "audio", "asset", "dev-tool", "service-app"],
);

// Every card: a spotlight CTA (link or coming_soon) + an always-link search CTA
// to its own category. No "publish" card / CTA on this feature grid (Studio
// submit lives elsewhere — home.tsx top-level CTA, not this card grid).
for (const card of PLAYER_IA_HOME_FEATURE_CARDS) {
  assert.ok(card.title.trim().length > 0, `${card.id} needs a title`);
  assert.ok(card.description.trim().length > 0, `${card.id} needs a description`);
  assert.equal(card.ctas.length, 2, `${card.id} must have exactly 2 CTAs`);

  const spotlight = card.ctas.find((cta) => cta.id === "spotlight");
  assert.ok(spotlight, `${card.id} missing spotlight CTA`);
  assert.equal(spotlight!.label, "注目作品を見る");

  const search = card.ctas.find((cta) => cta.id === "search");
  assert.ok(search, `${card.id} missing search CTA`);
  assert.equal(search!.kind, "link", `${card.id} search CTA must always link`);
  assert.equal(
    (search as { href: string }).href,
    `/search?category=${card.id}`,
  );

  // PlayerIaHomeCategoryCta's id union is only "spotlight" | "search" — no
  // "publish" CTA variant exists on this card grid (Studio submit lives
  // elsewhere), so the 2-CTA-exactly check above already proves this.
  for (const cta of card.ctas) {
    if (cta.kind !== "link") continue;
    const href = (cta as { href: string }).href;
    assert.equal(href.includes("quick_try"), false, `${card.id} must not use quick_try`);
    assert.equal(
      href.includes("usable_for_creation"),
      false,
      `${card.id} must not use usable_for_creation`,
    );
    assert.equal(href.includes("/studio/submit"), false, `${card.id} must not link to Studio submit`);
  }
}

// Only "game" has a live spotlight destination today; the other four
// categories are coming-soon (no seeded per-category spotlight feed yet).
const gameCard = PLAYER_IA_HOME_FEATURE_CARDS.find((c) => c.id === "game")!;
const gameSpotlight = gameCard.ctas.find((cta) => cta.id === "spotlight")!;
assert.equal(gameSpotlight.kind, "link");
assert.equal((gameSpotlight as { href: string }).href, "/home/game");

for (const id of ["audio", "asset", "dev-tool", "service-app"] as const) {
  const card = PLAYER_IA_HOME_FEATURE_CARDS.find((c) => c.id === id)!;
  const spotlight = card.ctas.find((cta) => cta.id === "spotlight")!;
  assert.equal(spotlight.kind, "coming_soon", `${id} spotlight should be coming_soon`);
}

const homePage = read("components/player-ia/player-ia-home-page.tsx");
assert.match(homePage, /PLAYER_IA_HOME_FEATURE_CARDS/);
assert.match(homePage, /作品を見つける・試す/);
assert.match(homePage, /sm:grid-cols-2 xl:grid-cols-3/);
assert.match(homePage, /Coming Soon/);
assert.doesNotMatch(homePage, /遊ぶ・試す/);
assert.doesNotMatch(homePage, /制作に使う/);
assert.match(homePage, /initialHome/);
assert.match(homePage, /if \(initialHome\) \{\s*return;/);
assert.match(homePage, /fetch\("\/api\/discovery\/player-ia-home"/);

const homeRoute = read("app/(player)/home/page.tsx");
assert.match(homeRoute, /loadPlayerIaHome/);
assert.match(homeRoute, /initialHome=\{initialHome\}/);

// "game" card spotlight CTA target must not be a dead link
assert.ok(
  fs.existsSync(path.join(ROOT, "app/(player)/home/game/page.tsx")),
  "/home/game route must exist (game card spotlight CTA target)",
);
const homeGameRoute = read("app/(player)/home/game/page.tsx");
assert.match(
  homeGameRoute,
  /PlayerIaGameHomePage|loadPlayerIaGameHome/,
  "/home/game must serve game category Home (not Search redirect-only)",
);
assert.doesNotMatch(
  homeGameRoute,
  /redirect\(buildSearchCategoryHref\("game"\)\)/,
  "/home/game must not solely redirect to Search for Player IA",
);
assert.match(
  homeGameRoute,
  /PlayerIaGameHomePage/,
  "/home/game renders PlayerIaGameHomePage",
);

// --- B. legacy filter chips hidden, API path retained ---
const searchPage = read("components/player-ia/player-ia-search-page.tsx");
assert.doesNotMatch(searchPage, /label=["']すぐ試せる["']/);
assert.doesNotMatch(searchPage, />すぐ試せる</);
assert.doesNotMatch(searchPage, /FB募集中/);
assert.doesNotMatch(searchPage, /制作に使える/);
assert.match(searchPage, /Legacy surface filters/);
assert.match(searchPage, /catalogQuery === initialCatalogQuery/);
assert.match(searchPage, /useServerData/);
assert.match(searchPage, /PlayerIaSearchFilterPanel/);

const catalogRoute = read("app/api/search/catalog/route.ts");
assert.match(catalogRoute, /loadPublicCatalog/);

// Direct quick_try still parses
const withQuick = parseCatalogSearchParams(
  new URLSearchParams("quick_try=1&sort=updated"),
);
assert.equal(withQuick.quickTry, true);
assert.equal(withQuick.sort, "updated");

// --- C. Query preserve ---
assert.equal(
  buildSearchHrefForCategory(
    "audio",
    new URLSearchParams("usable_for_creation=1"),
  ),
  "/search?usable_for_creation=1&category=audio",
);
assert.equal(
  buildSearchHrefForCategory(
    "asset",
    new URLSearchParams("category=game&sort=updated&feedback_wanted=1"),
  ),
  "/search?category=asset&sort=updated&feedback_wanted=1",
);
assert.equal(
  buildSearchHrefForCategory(
    "all",
    new URLSearchParams("category=audio&usable_for_creation=1"),
  ),
  "/search?usable_for_creation=1",
);
assert.equal(
  buildSearchHrefForCategory(
    "game",
    new URLSearchParams("quick_try=1&sort=updated"),
  ),
  "/search?quick_try=1&sort=updated&category=game",
);
assert.equal(
  buildSearchHrefForCategory(null, new URLSearchParams("category=game")),
  "/search",
);
// no empty values / no duplicate category
assert.equal(
  buildSearchHrefForCategory(
    "audio",
    new URLSearchParams("category=game&category=asset&usable_for_creation=1"),
  ),
  "/search?category=audio&usable_for_creation=1",
);

const tabs = read("components/player-ia/player-ia-category-tabs.tsx");
assert.match(tabs, /buildSearchHrefForCategory/);
assert.doesNotMatch(tabs, /href=\{item\.href\}/);

// Combined query → catalog string includes both
const combined = buildCatalogQueryString(
  new URLSearchParams("category=audio&usable_for_creation=1"),
  { limit: PLAYER_IA_SEARCH_CATALOG_LIMIT },
);
assert.match(combined, /category=audio/);
assert.match(combined, /usable_for_creation=1/);
assert.match(combined, new RegExp(`limit=${PLAYER_IA_SEARCH_CATALOG_LIMIT}`));

const parsedCombined = parseCatalogSearchParams(
  new URLSearchParams("category=audio&usable_for_creation=1&feedback_wanted=1&stream_policy=ok&asset_kind=font&sort=updated&quick_try=1"),
);
assert.equal(parsedCombined.category, "audio");
assert.equal(parsedCombined.usableForCreation, true);
assert.equal(parsedCombined.feedbackWanted, true);
assert.equal(parsedCombined.streamPolicy, "ok");
assert.equal(parsedCombined.assetKind, "font");
assert.equal(parsedCombined.sort, "updated");
assert.equal(parsedCombined.quickTry, true);

// --- D. Search server initial ---
const searchRoute = read("app/(player)/search/page.tsx");
assert.match(searchRoute, /loadPublicCatalog/);
assert.match(searchRoute, /initialCatalogQuery/);
assert.match(searchRoute, /shouldServePlayerIaRedesign/);
assert.match(searchRoute, /WorksSearchPage/);
assert.match(searchRoute, /nowMs/);

assert.equal(
  fs.existsSync(path.join(ROOT, "app/(player)/search/loading.tsx")),
  false,
  "shared /search loading.tsx must not affect Production WorksSearchPage",
);

const homeApi = read("app/api/discovery/player-ia-home/route.ts");
assert.match(homeApi, /loadPlayerIaHome/);
assert.match(homeApi, /shouldServePlayerIaRedesign/);

const formatSrc = read("lib/player-ia/format.ts");
assert.match(formatSrc, /PLAYER_IA_DISPLAY_TIME_ZONE/);
assert.match(formatSrc, /nowMs/);
assert.match(formatSrc, /timeZone/);

console.log("player-ia-home-search-nav ok");
