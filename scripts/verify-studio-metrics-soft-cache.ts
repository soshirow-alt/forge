/**
 * Studio metrics soft-cache + visible-snapshot safety.
 * Run: npx --yes tsx scripts/verify-studio-metrics-soft-cache.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { EMPTY_STUDIO_HOME_CONNECTION_METRICS } from "../lib/studio-home-metrics";
import { selectVisibleStudioMetricsSnapshot } from "../lib/studio-home-metrics-visible";

const root = resolve(process.cwd());

function read(rel: string): string {
  return readFileSync(resolve(root, rel), "utf8");
}

const softCache = read("lib/studio-home-metrics-soft-cache.ts");
const hook = read("hooks/use-studio-home-metrics.ts");
const auth = read("components/auth-provider.tsx");
const visibleSrc = read("lib/studio-home-metrics-visible.ts");

assert.match(softCache, /userId:\s*string/);
assert.match(softCache, /\$\{userId\}:\$\{granularity\}/);
assert.match(softCache, /export function clearStudioHomeMetricsSoftCache/);
assert.match(softCache, /entry\.userId !== userId/);
assert.match(hook, /selectVisibleStudioMetricsSnapshot/);
assert.match(visibleSrc, /export function selectVisibleStudioMetricsSnapshot/);
assert.match(auth, /clearStudioHomeMetricsSoftCache\(\)/);
assert.match(auth, /event === "SIGNED_OUT"/);
const logoutBlock = auth.slice(auth.indexOf("const logout = useCallback"));
assert.match(logoutBlock.slice(0, 400), /clearStudioHomeMetricsSoftCache\(\)/);

// Pure A→B→logout render selection (no React mount required).
const metricsA = {
  ...EMPTY_STUDIO_HOME_CONNECTION_METRICS,
  // brand a fake shape via JSON identity
} as typeof EMPTY_STUDIO_HOME_CONNECTION_METRICS;
const snapA = {
  userId: "user-a",
  metrics: metricsA,
  rpcReady: true,
  granularityFallback: false,
  initialLoading: false,
  fetching: false,
  error: false,
};

const visibleForB = selectVisibleStudioMetricsSnapshot(
  snapA,
  "user-b",
  EMPTY_STUDIO_HOME_CONNECTION_METRICS,
  true,
);
assert.equal(visibleForB.userId, "user-b");
assert.equal(visibleForB.metrics, EMPTY_STUDIO_HOME_CONNECTION_METRICS);
assert.equal(visibleForB.rpcReady, false);
assert.equal(visibleForB.initialLoading, true);

const visibleLogout = selectVisibleStudioMetricsSnapshot(
  snapA,
  null,
  EMPTY_STUDIO_HOME_CONNECTION_METRICS,
  true,
);
assert.equal(visibleLogout.userId, null);
assert.equal(visibleLogout.metrics, EMPTY_STUDIO_HOME_CONNECTION_METRICS);
assert.equal(visibleLogout.initialLoading, false);

const visibleSame = selectVisibleStudioMetricsSnapshot(
  snapA,
  "user-a",
  EMPTY_STUDIO_HOME_CONNECTION_METRICS,
  true,
);
assert.equal(visibleSame.metrics, metricsA);
assert.equal(visibleSame.rpcReady, true);

console.log("verify-studio-metrics-soft-cache: PASS");
