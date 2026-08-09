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
  getSearchAttrFilterSpecs,
  parseFeatureTagFilterValues,
  parseGenreFilterValues,
  PLAYER_IA_SEARCH_LEGACY_HIDDEN_PARAMS,
  readSearchFilterDraftFromParams,
  sanitizeSearchQuery,
} from "../lib/player-ia/search-filter-state";
import { buildSearchHrefForCategory } from "../lib/player-ia/search-href";
import { PROJECT_FORMAL_FILTER_OWNERSHIP } from "../lib/project-formal-filter-ownership";
import { PROJECT_FORMAL_FILTER_REGISTRY } from "../lib/project-formal-filter-registry";

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
    draft: {
      q: "  RPG  demo ",
      genres: ["RPG", "アクション"],
      tags: ["ピクセルアート"],
      attrFilters: {},
    },
    current: new URLSearchParams("quick_try=1&feedback_wanted=1"),
  }),
  "/search?quick_try=1&feedback_wanted=1&category=game&sort=updated&q=RPG+demo&genre=RPG%2C%E3%82%A2%E3%82%AF%E3%82%B7%E3%83%A7%E3%83%B3&tag=%E3%83%94%E3%82%AF%E3%82%BB%E3%83%AB%E3%82%A2%E3%83%BC%E3%83%88",
);

assert.equal(
  buildSearchHrefFromFilters({
    category: "audio",
    sort: "newest",
    draft: { q: "bgm", genres: ["RPG"], tags: ["ピクセルアート"], attrFilters: {} },
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
assert.ok(
  !(PLAYER_IA_SEARCH_LEGACY_HIDDEN_PARAMS as readonly string[]).includes("asset_kind"),
  "asset_kind must no longer be a legacy-hidden param",
);
{
  const assetKindOwnership = PROJECT_FORMAL_FILTER_OWNERSHIP.find(
    (row) => row.id === "asset_kind",
  );
  assert.ok(assetKindOwnership, "missing ownership for asset_kind");
  assert.equal(assetKindOwnership!.playerIaSearchUi, "active");
}

// --- 2026-08 five-category formal filters: generic registry-driven Search UI ---

// asset category renders asset_kind / format / taste / tool (excludes genre/tag)
{
  const specs = getSearchAttrFilterSpecs("asset");
  assert.deepEqual(
    specs.map((s) => s.fieldId).sort(),
    ["asset_formats", "asset_kind", "asset_tastes", "asset_tools"].sort(),
  );
  assert.ok(!specs.some((s) => s.fieldId === "genre" || s.fieldId === "feature_tag"));
}

// game category renders play_time / play_environment / player_count in
// addition to the dedicated genre/tag panels (not duplicated here)
{
  const specs = getSearchAttrFilterSpecs("game");
  assert.deepEqual(
    specs.map((s) => s.fieldId).sort(),
    ["play_environment", "play_time", "player_count"].sort(),
  );
}

// unknown / "all" category → no category-specific attr filters
assert.deepEqual(getSearchAttrFilterSpecs("all"), []);
assert.deepEqual(getSearchAttrFilterSpecs(null), []);

// draft round-trip: asset_kind (registry urlKey) parses as multi even from a
// single legacy-style value, and category switch clears cross-category attrs
{
  const assetDraft = readSearchFilterDraftFromParams(
    new URLSearchParams("category=asset&asset_kind=キャラクター&format=2D&taste=アニメ・トゥーン"),
    "asset",
  );
  assert.deepEqual(assetDraft.attrFilters.asset_kind, ["キャラクター"]);
  assert.deepEqual(assetDraft.attrFilters.asset_formats, ["2D"]);
  assert.deepEqual(assetDraft.attrFilters.asset_tastes, ["アニメ・トゥーン"]);

  const href = buildSearchHrefFromFilters({
    category: "asset",
    sort: "newest",
    draft: assetDraft,
    current: null,
  });
  assert.match(href, /category=asset/);
  assert.match(href, /asset_kind=/);
  assert.match(href, /format=2D/);

  // switching category away from asset clears asset-only params
  const switched = buildSearchHrefForCategory(
    "audio",
    new URLSearchParams(href.replace(/^\/search\?/, "")),
  );
  assert.doesNotMatch(switched, /asset_kind/);
  assert.doesNotMatch(switched, /format=/);
  assert.match(switched, /category=audio/);
}

// audio: kinds / moods / purposes / duration bucket all registry-driven
{
  const audioDraft = readSearchFilterDraftFromParams(
    new URLSearchParams("category=audio&audio_kind=楽曲&mood=明るい&duration=1〜3分"),
    "audio",
  );
  assert.deepEqual(audioDraft.attrFilters.audio_kinds, ["楽曲"]);
  assert.deepEqual(audioDraft.attrFilters.audio_moods, ["明るい"]);
  assert.deepEqual(audioDraft.attrFilters.audio_duration_bucket, ["1〜3分"]);
}

// catalog RPC args: category-specific filters map onto the migration-085 axes
{
  const parsedAsset = parseCatalogSearchParams(
    new URLSearchParams(
      "category=asset&asset_kind=キャラクター,背景・風景&format=2D&taste=アニメ・トゥーン",
    ),
  );
  assert.deepEqual(parsedAsset.assetKinds, ["キャラクター", "背景・風景"]);
  assert.deepEqual(parsedAsset.attrFormats, ["2D"]);
  assert.deepEqual(parsedAsset.attrTastes, ["アニメ・トゥーン"]);

  // legacy single-value link (old AssetKindId, e.g. "font") still parses via
  // the unvalidated singular `assetKind` (`p_asset_kind`) for backward compat;
  // it's not a canonical multi-select label so it doesn't join `assetKinds`.
  const parsedAssetLegacy = parseCatalogSearchParams(
    new URLSearchParams("category=asset&asset_kind=font"),
  );
  assert.equal(parsedAssetLegacy.assetKind, "font");
  assert.equal(parsedAssetLegacy.assetKinds, undefined);

  // new canonical single-value link parses as both singular and 1-item multi
  const parsedAssetCanonicalSingle = parseCatalogSearchParams(
    new URLSearchParams("category=asset&asset_kind=キャラクター"),
  );
  assert.equal(parsedAssetCanonicalSingle.assetKind, "キャラクター");
  assert.deepEqual(parsedAssetCanonicalSingle.assetKinds, ["キャラクター"]);

  const parsedGameAttrs = parseCatalogSearchParams(
    new URLSearchParams("category=game&play_time=5分未満&env=PC,スマホ&players=1人"),
  );
  assert.deepEqual(parsedGameAttrs.playTimes, ["5分未満"]);
  assert.deepEqual(parsedGameAttrs.playEnvs, ["PC対応", "スマホ対応"]);
  assert.deepEqual(parsedGameAttrs.playerCounts, ["1人"]);

  // wrong-category attr params (asset-only `format`) must not leak into audio
  const parsedAudioNoLeak = parseCatalogSearchParams(
    new URLSearchParams("category=audio&format=2D"),
  );
  assert.equal(parsedAudioNoLeak.attrFormats, undefined);
}

// RPC wiring: 085 args conditional (never sent when empty)
assert.match(catalogDb, /p_attr_kinds/);
assert.match(catalogDb, /p_attr_music_genres/);
assert.match(catalogDb, /p_attr_moods/);
assert.match(catalogDb, /p_attr_purposes/);
assert.match(catalogDb, /p_duration_buckets/);
assert.match(catalogDb, /p_attr_formats/);
assert.match(catalogDb, /p_attr_tastes/);
assert.match(catalogDb, /p_attr_tools/);
assert.match(catalogDb, /p_attr_environments/);
assert.match(catalogDb, /p_attr_features/);
assert.match(catalogDb, /p_asset_kinds/);
assert.match(catalogDb, /p_play_times/);
assert.match(catalogDb, /p_play_envs/);
assert.match(catalogDb, /p_player_counts/);
assert.match(catalogDb, /Only send 085 args when used/);

// registry sanity — every searchApplicable field has a non-empty urlKey/options
for (const spec of PROJECT_FORMAL_FILTER_REGISTRY) {
  if (!spec.searchApplicable) continue;
  assert.ok(spec.urlKey.trim().length > 0, `${spec.fieldId} missing urlKey`);
  assert.ok(spec.options.length > 0, `${spec.fieldId} has no options`);
}

// filter panel renders registry-driven sections generically (not hardcoded
// per-category blocks for the new five-category fields)
assert.match(filterPanel, /getSearchAttrFilterSpecs/);
assert.doesNotMatch(filterPanel, /AUDIO_KIND_OPTIONS|ASSET_TASTE_OPTIONS|DEV_TOOL_KIND_OPTIONS/);

console.log("player-ia-search-sidebar-filters ok");
