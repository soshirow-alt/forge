/**
 * Public catalog soft-cache key safety.
 * Run: npx --yes tsx scripts/verify-public-catalog-soft-cache.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { buildPublicCatalogCacheKey } from "../lib/player-ia/load-public-catalog";
import type { CatalogSearchParams } from "../lib/supabase/public-catalog-db";

const src = readFileSync(
  resolve(process.cwd(), "lib/player-ia/load-public-catalog.ts"),
  "utf8",
);

assert.match(src, /FORGE_PUBLIC_SOFT_CACHE_TTL_MS/);
assert.match(src, /publicCatalogInflight/);
assert.match(src, /buildPublicCatalogCacheKey/);
assert.match(src, /PUBLIC_CATALOG_CACHE_MAX/);
assert.match(src, /prunePublicCatalogCache/);

const base: CatalogSearchParams = {
  category: "game",
  sort: "newest",
  query: null,
  quickTry: null,
  feedbackWanted: null,
  usableForCreation: null,
};

const keyNull = buildPublicCatalogCacheKey(base, 48, 0);
const keyFalse = buildPublicCatalogCacheKey(
  { ...base, quickTry: false },
  48,
  0,
);
const keyOffset = buildPublicCatalogCacheKey(base, 48, 48);
const keyLimit = buildPublicCatalogCacheKey(base, 24, 0);

assert.notEqual(keyNull, keyFalse, "null vs false must differ");
assert.notEqual(keyNull, keyOffset, "offset must differ");
assert.notEqual(keyNull, keyLimit, "limit must differ");

const pending = readFileSync(
  resolve(process.cwd(), "components/pending-nav-link.tsx"),
  "utf8",
);
assert.match(pending, /sameDestination/);
assert.match(pending, /defaultPrevented/);

const registered = readFileSync(
  resolve(process.cwd(), "components/registered-account-prompt-provider.tsx"),
  "utf8",
);
assert.match(registered, /sameDestination/);
assert.match(registered, /usePathname/);

console.log("verify-public-catalog-soft-cache: PASS");
