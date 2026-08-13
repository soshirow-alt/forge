/**
 * Same-mode shell persistence contracts (Player / Studio).
 * Run: npx --yes tsx scripts/verify-shell-persistence.ts
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(process.cwd());

function read(rel: string): string {
  return readFileSync(resolve(root, rel), "utf8");
}

function assertExists(rel: string) {
  assert.ok(existsSync(resolve(root, rel)), `missing: ${rel}`);
}

// Player chrome mounts once in (player) layout
const playerLayout = read("app/(player)/layout.tsx");
assert.match(playerLayout, /PlayerShellLayout/);

const playerShell = read("components/player-shell.tsx");
assert.match(playerShell, /PlayerShellNestContext/);
assert.match(playerShell, /createContext\(false\)/);
assert.match(playerShell, /if \(nested\)/);

// Sidebar primary links must stay inside (player) route group
const primaryHrefMatches = [
  ...playerShell.matchAll(/href:\s*"(\/[^"]+)"/g),
].map((m) => m[1]!);
assert.ok(primaryHrefMatches.includes("/home"));
assert.ok(primaryHrefMatches.includes("/search"));
assert.ok(primaryHrefMatches.includes("/search/creators"));
assert.ok(primaryHrefMatches.includes("/rankings/influence"));

const playerRoutes = [
  "app/(player)/games/[id]/page.tsx",
  "app/(player)/creators/[id]/page.tsx",
  "app/(player)/search/creators/page.tsx",
  "app/(player)/guide/page.tsx",
  "app/(player)/notifications/page.tsx",
  "app/(player)/mypage/profile/page.tsx",
  "app/(player)/rankings/influence/page.tsx",
  "app/(player)/search/page.tsx",
  "app/(player)/home/page.tsx",
  "app/(player)/settings/page.tsx",
  "app/(player)/messages/page.tsx",
];
for (const rel of playerRoutes) {
  assertExists(rel);
}

assert.equal(existsSync(resolve(root, "app/games/[id]/page.tsx")), false);
assert.equal(existsSync(resolve(root, "app/creators/[id]/page.tsx")), false);
assert.equal(existsSync(resolve(root, "app/search/creators/page.tsx")), false);
assert.equal(existsSync(resolve(root, "app/guide/page.tsx")), false);
assert.equal(existsSync(resolve(root, "app/rankings/influence/page.tsx")), false);

const playerLoadings = [
  "app/(player)/home/loading.tsx",
  "app/(player)/messages/loading.tsx",
  "app/(player)/settings/loading.tsx",
];
for (const rel of playerLoadings) {
  const src = read(rel);
  assert.doesNotMatch(src, /PlayerShell/);
  assert.match(src, /PageLoadingSkeleton|読み込み/);
}

// Studio chrome mounts once in studio layout; loading replaces main only
const studioLayout = read("app/studio/layout.tsx");
assert.match(studioLayout, /StudioAccessLayout/);
assert.match(studioLayout, /StudioShell/);

const studioShell = read("components/studio-shell.tsx");
assert.match(studioShell, /StudioShellNestContext/);
assert.match(studioShell, /HeaderSearchFormFromUrl/);
assert.match(studioShell, /studio-mypage-q:/);
assert.match(studioShell, /\/studio\/mypage/);
assert.match(studioShell, /pathname\.startsWith\("\/studio\/rankings"\)/);
assert.match(studioShell, /shouldHideV0MockContent\(\)/);
assert.match(studioShell, /from "@\/lib\/production-mode"/);
assert.doesNotMatch(studioShell, /StudioShellNestedBridge/);
assert.doesNotMatch(studioShell, /nestedChrome/);

const playerHeader = read("components/player-header-search-form.tsx");
assert.match(playerHeader, /HeaderSearchFormFromUrl/);
assert.match(playerHeader, /player-search-q:/);
assert.match(playerHeader, /useSearchParams/);
assert.match(playerHeader, /searchParams\.get\("q"\)/);

const studioLoading = read("app/studio/loading.tsx");
assert.doesNotMatch(studioLoading, /StudioShell/);
assert.match(studioLoading, /PageLoadingSkeleton/);

assert.match(playerShell, /data-forge-mode="player"/);
assert.match(studioShell, /data-forge-mode="studio"/);

console.log("verify-shell-persistence: PASS");
