/**
 * Behavioral checks: Player IA Search sidebar filters (genre/tag/q, layout, URL rules).
 * Usage: npx tsx scripts/verify-player-ia-search-sidebar-filters.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  buildCatalogQueryString,
  parseCatalogSearchParams,
  PLAYER_IA_SEARCH_CATALOG_LIMIT,
} from "../lib/player-ia/catalog-search-params";
import {
  buildSearchHrefFromFilters,
  emptySearchFilterDraft,
  parseFeatureTagFilterValues,
  parseGenreFilterValues,
  PLAYER_IA_SEARCH_LEGACY_HIDDEN_PARAMS,
  readSearchFilterDraftFromParams,
  sanitizeSearchQuery,
} from "../lib/player-ia/search-filter-state";
import { buildSearchHrefForCategory } from "../lib/player-ia/search-href";
import { PROJECT_FORMAL_FILTER_OWNERSHIP } from "../lib/project-formal-filter-ownership";

const ROOT = path.resolve(import.meta.dirname, "..");

function read(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel), "utf8");
}

const searchPage = read("components/player-ia/player-ia-search-page.tsx");
const filterPanel = read(
  "components/player-ia/player-ia-search-filter-panel.tsx",
);
const catalogDb = read("lib/supabase/public-catalog-db.ts");
const migration = read(
  "supabase/migrations/084_catalog_search_query_genres_tags.sql",
);
const worksSearch = read("components/works-search-page.tsx");

// --- Layout / UX ---
assert.match(filterPanel, /絞り込み/);
assert.match(filterPanel, /すべてクリア/);
assert.match(filterPanel, /この条件で検索/);
assert.match(filterPanel, /キーワード/);
assert.match(filterPanel, /ジャンル/);
assert.match(filterPanel, /特徴タグ/);
assert.match(filterPanel, /FORGE_GENRE_OPTIONS/);
assert.match(filterPanel, /FORGE_FEATURE_TAG_OPTIONS/);
assert.match(filterPanel, /sticky/);
assert.match(filterPanel, /xl:w-72/);
assert.match(filterPanel, /PlayerIaSearchFilterMobileTrigger/);
assert.match(filterPanel, /role="dialog"/);
assert.match(searchPage, /PlayerIaSearchFilterPanel/);
assert.match(searchPage, /PlayerIaSearchFilterMobileTrigger/);
assert.match(searchPage, /xl:flex-row/);
assert.match(searchPage, /max-w-\[1400px\]/);
assert.match(searchPage, /2xl:grid-cols-3/);

// Legacy surface chips gone
assert.doesNotMatch(searchPage, /FB募集中/);
assert.doesNotMatch(searchPage, /制作に使える/);
assert.doesNotMatch(searchPage, /すぐ試せる/);
assert.doesNotMatch(searchPage, /ASSET_KIND/);
assert.doesNotMatch(searchPage, /STREAM_POLICY/);
assert.match(searchPage, /Legacy surface filters/);

// Production path untouched
assert.match(worksSearch, /export function WorksSearchPage/);
assert.match(worksSearch, /絞り込み/);

// --- Category filter surface rules ---
assert.match(filterPanel, /categorySupportsGameFilters/);
assert.match(filterPanel, /showGameFilters/);

// --- URL helpers ---
assert.equal(
  buildSearchHrefForCategory(
    "audio",
    new URLSearchParams("category=game&genre=RPG&tag=ピクセルアート&q=hello&sort=updated"),
  ),
  "/search?category=audio&q=hello&sort=updated",
);
assert.equal(
  buildSearchHrefForCategory(
    "game",
    new URLSearchParams("category=audio&q=hello&sort=updated"),
  ),
  "/search?category=game&q=hello&sort=updated",
);
assert.equal(
  buildSearchHrefForCategory(
    "all",
    new URLSearchParams("category=game&genre=RPG&q=hi&sort=updated&quick_try=1"),
  ),
  "/search?q=hi&sort=updated&quick_try=1",
);
assert.equal(
  buildSearchHrefForCategory(
    "game",
    new URLSearchParams("category=game&genre=RPG&tag=ピクセルアート"),
  ),
  "/search?category=game&genre=RPG&tag=%E3%83%94%E3%82%AF%E3%82%BB%E3%83%AB%E3%82%A2%E3%83%BC%E3%83%88",
);

// clear / apply helpers
assert.equal(
  buildSearchHrefFromFilters({
    category: "game",
    sort: "updated",
    draft: { q: "  RPG  demo ", genres: ["RPG", "アクション"], tags: ["ピクセルアート"] },
    current: new URLSearchParams("quick_try=1&feedback_wanted=1"),
  }),
  "/search?quick_try=1&feedback_wanted=1&category=game&sort=updated&q=RPG+demo&genre=RPG%2C%E3%82%A2%E3%82%AF%E3%82%B7%E3%83%A7%E3%83%B3&tag=%E3%83%94%E3%82%AF%E3%82%BB%E3%83%AB%E3%82%A2%E3%83%BC%E3%83%88",
);

assert.equal(
  buildSearchHrefFromFilters({
    category: "audio",
    sort: "newest",
    draft: { q: "bgm", genres: ["RPG"], tags: ["ピクセルアート"] },
    current: new URLSearchParams("stream_policy=ok"),
  }),
  "/search?stream_policy=ok&category=audio&q=bgm",
);

assert.equal(
  buildSearchHrefFromFilters({
    category: "all",
    sort: null,
    draft: emptySearchFilterDraft(),
    current: new URLSearchParams("q=x&genre=RPG&usable_for_creation=1"),
  }),
  "/search?usable_for_creation=1",
);

// parse multi genre/tag (comma + repeated)
assert.deepEqual(parseGenreFilterValues(["RPG", "アクション", "not-a-genre"]), [
  "RPG",
  "アクション",
]);
assert.deepEqual(parseFeatureTagFilterValues(["ピクセルアート", "pc", "癒し系"]), [
  "ピクセルアート",
  "癒し系",
]);

const draft = readSearchFilterDraftFromParams(
  new URLSearchParams(
    "q=test&genre=RPG,アクション&tag=ピクセルアート&tag=癒し系",
  ),
);
assert.equal(draft.q, "test");
assert.deepEqual(draft.genres, ["RPG", "アクション"]);
assert.deepEqual(draft.tags, ["ピクセルアート", "癒し系"]);

assert.equal(sanitizeSearchQuery("a".repeat(100)).length, 80);
assert.equal(sanitizeSearchQuery("  hello   world  "), "hello world");

// catalog params
const parsedGame = parseCatalogSearchParams(
  new URLSearchParams(
    "category=game&q=hello&genre=RPG&tag=ピクセルアート&sort=updated&quick_try=1",
  ),
);
assert.equal(parsedGame.category, "game");
assert.equal(parsedGame.query, "hello");
assert.deepEqual(parsedGame.genres, ["RPG"]);
assert.deepEqual(parsedGame.tags, ["ピクセルアート"]);
assert.equal(parsedGame.quickTry, true);

const parsedAudio = parseCatalogSearchParams(
  new URLSearchParams("category=audio&genre=RPG&tag=ピクセルアート&q=hi"),
);
assert.equal(parsedAudio.category, "audio");
assert.equal(parsedAudio.query, "hi");
assert.equal(parsedAudio.genres, null);
assert.equal(parsedAudio.tags, null);

const qs = buildCatalogQueryString(
  new URLSearchParams("category=game&genre=RPG,アクション&tag=癒し系&q=foo"),
  { limit: PLAYER_IA_SEARCH_CATALOG_LIMIT },
);
assert.match(qs, /category=game/);
assert.match(qs, /q=foo/);
assert.match(qs, /genre=RPG/);
assert.match(qs, /tag=/);
assert.match(qs, new RegExp(`limit=${PLAYER_IA_SEARCH_CATALOG_LIMIT}`));

// RPC wiring: conditional 084 args + no client full-catalog filter
assert.match(catalogDb, /p_query/);
assert.match(catalogDb, /p_genres/);
assert.match(catalogDb, /p_tags/);
assert.match(catalogDb, /Only send 084 args when used/);
assert.doesNotMatch(searchPage, /fetchPublicProjects/);
assert.doesNotMatch(filterPanel, /getAllProjects|fetchAll/);

// migration contract
assert.match(migration, /p_query text/);
assert.match(migration, /p_genres text\[\]/);
assert.match(migration, /p_tags text\[\]/);
assert.match(migration, /projects_tags_gin_idx/);
assert.match(migration, /DROP FUNCTION IF EXISTS public\.get_public_projects_by_category/);
assert.match(migration, /GRANT EXECUTE/);
assert.match(searchPage, /表示 \$\{projects\.length\}件/);
assert.match(searchPage, /PLAYER_IA_SEARCH_CATALOG_LIMIT/);
assert.equal(PLAYER_IA_SEARCH_CATALOG_LIMIT, 48);
assert.match(migration, /p\.genres && p_genres/);
assert.match(migration, /p\.tags && p_tags/);
assert.doesNotMatch(
  migration,
  /coalesce\(p\.genres[\s\S]{0,80}&&\s*p_genres/,
);
assert.doesNotMatch(
  migration,
  /coalesce\(p\.tags[\s\S]{0,80}&&\s*p_tags/,
);

// changelog reason for hidden filters
const changelog = read("docs/forge-changelog.md");
assert.match(changelog, /2026-08-08 — Player IA Search 右sidebar/);

// 076 formal filter ownership — hidden params must not be active Studio/IA UI
for (const id of PLAYER_IA_SEARCH_LEGACY_HIDDEN_PARAMS) {
  const spec = PROJECT_FORMAL_FILTER_OWNERSHIP.find((row) => row.id === id);
  assert.ok(spec, `missing ownership for ${id}`);
  assert.notEqual(spec.playerIaSearchUi, "active", `${id} must not be active IA Search UI`);
  assert.equal(spec.studioWrite, "no", `${id} must not be Studio-written`);
}

console.log("player-ia-search-sidebar-filters ok");
