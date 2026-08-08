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

// --- A. Home CTAs ---
assert.equal(PLAYER_IA_HOME_FEATURE_CARDS.length, 4);
assert.deepEqual(
  PLAYER_IA_HOME_FEATURE_CARDS.map((c) => c.id),
  ["play", "listen", "service", "publish"],
);
assert.equal(PLAYER_IA_HOME_FEATURE_CARDS[0].title, "遊ぶ");
assert.equal(PLAYER_IA_HOME_FEATURE_CARDS[0].href, "/search?category=game");
assert.equal(PLAYER_IA_HOME_FEATURE_CARDS[0].description, "ゲームを探して遊ぶ");
assert.equal(PLAYER_IA_HOME_FEATURE_CARDS[1].title, "聞く");
assert.equal(PLAYER_IA_HOME_FEATURE_CARDS[1].href, "/search?category=audio");
assert.equal(
  PLAYER_IA_HOME_FEATURE_CARDS[1].description,
  "音楽・音声作品を探して聞く",
);
assert.equal(PLAYER_IA_HOME_FEATURE_CARDS[2].title, "サービスを探す");
assert.equal(
  PLAYER_IA_HOME_FEATURE_CARDS[2].href,
  "/search?category=service-app",
);
assert.equal(
  PLAYER_IA_HOME_FEATURE_CARDS[2].description,
  "サービスやアプリを探して試す",
);
assert.equal(PLAYER_IA_HOME_FEATURE_CARDS[3].title, "掲載する");
assert.equal(PLAYER_IA_HOME_FEATURE_CARDS[3].href, "/studio/submit");
assert.equal(PLAYER_IA_HOME_FEATURE_CARDS[3].description, "作品を掲載して届ける");

for (const card of PLAYER_IA_HOME_FEATURE_CARDS) {
  assert.equal(
    card.href.includes("quick_try"),
    false,
    `${card.id} must not use quick_try`,
  );
  assert.equal(
    card.href.includes("usable_for_creation"),
    false,
    `${card.id} must not use usable_for_creation`,
  );
}

const homePage = read("components/player-ia/player-ia-home-page.tsx");
assert.match(homePage, /PLAYER_IA_HOME_FEATURE_CARDS/);
assert.match(homePage, /sm:grid-cols-2 xl:grid-cols-4/);
assert.doesNotMatch(homePage, /遊ぶ・試す/);
assert.doesNotMatch(homePage, /制作に使う/);
assert.match(homePage, /initialHome/);
assert.match(homePage, /if \(initialHome\) \{\s*return;/);
assert.match(homePage, /fetch\("\/api\/discovery\/player-ia-home"/);

const homeRoute = read("app/(player)/home/page.tsx");
assert.match(homeRoute, /loadPlayerIaHome/);
assert.match(homeRoute, /initialHome=\{initialHome\}/);

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
