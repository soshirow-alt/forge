/**
 * Executable pending-nav lifecycle contract (A→B→A) + source wiring checks.
 * Models pathname-keyed remount used by PendingNavLink / RegisteredOnlyLink.
 * Run: npx --yes tsx scripts/verify-pending-nav-reset.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(process.cwd());

function read(rel: string): string {
  return readFileSync(resolve(root, rel), "utf8");
}

/** Mirrors keyed-inner remount: pathname change resets pending to false. */
type ArmState = { pathname: string; pending: boolean };

function createArm(pathname: string): ArmState {
  return { pathname, pending: false };
}

function onPathname(state: ArmState, nextPath: string): ArmState {
  if (nextPath === state.pathname) return state;
  // key={pathname} remount → fresh useState(false)
  return { pathname: nextPath, pending: false };
}

function onClick(state: ArmState, targetPath: string): ArmState {
  const sameDestination = targetPath === state.pathname;
  if (sameDestination) return state;
  if (state.pending) return state;
  return { ...state, pending: true };
}

function attrs(state: ArmState) {
  return {
    ariaDisabled: state.pending || undefined,
    ariaBusy: state.pending || undefined,
    tabIndex: state.pending ? -1 : undefined,
    pendingClass: state.pending,
  };
}

function assertIdle(state: ArmState, label: string) {
  const a = attrs(state);
  assert.equal(state.pending, false, `${label}: pending false`);
  assert.equal(a.ariaDisabled, undefined, `${label}: aria-disabled cleared`);
  assert.equal(a.ariaBusy, undefined, `${label}: aria-busy cleared`);
  assert.equal(a.tabIndex, undefined, `${label}: tabIndex restored`);
  assert.equal(a.pendingClass, false, `${label}: pending class off`);
}

function assertPending(state: ArmState, label: string) {
  const a = attrs(state);
  assert.equal(state.pending, true, `${label}: pending true`);
  assert.equal(a.ariaDisabled, true, `${label}: aria-disabled while pending`);
  assert.equal(a.tabIndex, -1, `${label}: tabIndex -1 while pending`);
  assert.equal(a.pendingClass, true, `${label}: pending class on`);
}

function runRoundTrip(label: string) {
  let state = createArm("/home");
  assertIdle(state, `${label} start@/home`);

  // A → B
  state = onClick(state, "/search");
  assertPending(state, `${label} click search@/home`);
  state = onPathname(state, "/search");
  assertIdle(state, `${label} arrived@/search`);

  // B → A
  state = onClick(state, "/home");
  assertPending(state, `${label} click home@/search`);
  state = onPathname(state, "/home");
  assertIdle(state, `${label} arrived@/home`);

  // A → B again (must not stick from earlier arm)
  state = onClick(state, "/search");
  assertPending(state, `${label} second click search@/home`);
  state = onPathname(state, "/search");
  assertIdle(state, `${label} second arrived@/search`);

  // same-route click never arms
  state = onClick(state, "/search");
  assertIdle(state, `${label} same-route click stays idle`);
}

runRoundTrip("PendingNavLink lifecycle");
runRoundTrip("RegisteredOnlyLink lifecycle");

function assertWiring(src: string, label: string) {
  assert.match(src, /key=\{pathname\}/, `${label}: key={pathname} remount`);
  assert.match(src, /setPending\(true\)/, `${label}: arms pending on click`);
  assert.match(src, /useState\(false\)/, `${label}: fresh pending state`);
  assert.match(src, /sameDestination/, `${label}: skips same destination`);
  assert.doesNotMatch(
    src,
    /disabled=\{sameDestination\}/,
    `${label}: active !== permanent disable`,
  );
  assert.doesNotMatch(
    src,
    /useEffect\(\s*\(\)\s*=>\s*\{\s*setPending\(false\)/,
    `${label}: no setState-in-effect`,
  );
}

assertWiring(read("components/pending-nav-link.tsx"), "PendingNavLink");
assertWiring(
  read("components/registered-account-prompt-provider.tsx"),
  "RegisteredOnlyLink",
);

console.log("verify-pending-nav-reset: PASS (executed A→B→A→B lifecycle)");
