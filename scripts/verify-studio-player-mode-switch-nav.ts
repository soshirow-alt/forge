/**
 * Deterministic checks for Studio→Player mode switch:
 * - Link to /home (no async-then-push)
 * - Immediate pending feedback on click
 * - Home FB fill must not sequential-scan with enriched cards
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

function read(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel), "utf8");
}

const modeSwitch = read("components/forge-shell-mobile-nav.tsx");
assert.match(modeSwitch, /mode === "studio"/);
assert.match(
  modeSwitch,
  /mode === "studio"[\s\S]*?<Link[\s\S]*?href="\/home"/,
);
assert.doesNotMatch(
  modeSwitch,
  /mode === "studio"[\s\S]*?router\.push/,
);
assert.doesNotMatch(
  modeSwitch,
  /mode === "studio"[\s\S]*?await /,
);
assert.match(modeSwitch, /setNavPending\(true\)/);
assert.match(modeSwitch, /移動中…/);
assert.match(modeSwitch, /prefetch/);

const studioShell = read("components/studio-shell.tsx");
assert.match(studioShell, /<ForgeShellModeSwitch mode="studio"/);
assert.doesNotMatch(
  studioShell,
  /ForgeShellModeSwitch[\s\S]{0,200}onClick=\{async/,
);

const homeDb = read("lib/supabase/player-ia-home-db.ts");
assert.match(homeDb, /fetchPublicFeedbackCardsForHomeFill/);
assert.match(homeDb, /HOME_FB_FILL_PROBE_CONCURRENCY/);
assert.doesNotMatch(homeDb, /listProjectIdsWithVisibleFeedbackSignals/);
assert.doesNotMatch(
  homeDb,
  /for \(const project of targets\) \{[\s\S]*fetchPublicFeedbackCardsEnriched/,
);

const cardsServer = read("lib/supabase/public-feedback-cards-server.ts");
assert.match(cardsServer, /export async function fetchPublicFeedbackCardsForHomeFill/);
assert.match(cardsServer, /prefetchHomeFillVersionKeysByProject/);
assert.match(cardsServer, /listHomeFillFeedbackVersionKeys/);
assert.match(cardsServer, /fetchRpcCards\(supabase, projectId, versionKey, 1\)/);
assert.match(cardsServer, /project_version_prompts/);
assert.match(cardsServer, /project_devlogs/);
assert.match(cardsServer, /versionKeys/);
assert.doesNotMatch(
  cardsServer,
  /export async function listProjectIdsWithVisibleFeedbackSignals/,
);

console.log("studio-player-mode-switch-nav ok");
