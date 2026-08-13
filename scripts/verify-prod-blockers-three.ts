/**
 * Deterministic checks for Production blockers trio:
 * - Studio metrics soft-cache identity + render-time ownership
 * - Studio notifications surface routing
 * - forge-safe-pb additive safe-area (no padding clobber)
 *
 * Ownership guard lives in selectVisibleStudioMetricsSnapshot (not an inline
 * `snapshot.userId === userId` in the hook). Runtime-test that pure function.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  clearStudioHomeMetricsSoftCache,
  readStudioHomeMetricsSoftCache,
  studioHomeMetricsCacheKey,
  writeStudioHomeMetricsSoftCache,
} from "../lib/studio-home-metrics-soft-cache";
import { selectVisibleStudioMetricsSnapshot } from "../lib/studio-home-metrics-visible";
import { EMPTY_STUDIO_HOME_CONNECTION_METRICS } from "../lib/studio-home-metrics";

const ROOT = process.cwd();

function read(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel), "utf8");
}

// --- Source wiring (current architecture) ---
const softCacheMod = read("lib/studio-home-metrics-soft-cache.ts");
assert.match(softCacheMod, /studioHomeMetricsCacheKey/);
assert.match(softCacheMod, /\$\{userId\}:\$\{granularity\}/);
assert.match(softCacheMod, /clearStudioHomeMetricsSoftCache/);
assert.match(softCacheMod, /STUDIO_HOME_METRICS_SOFT_CACHE_TTL_MS = 20_000/);
assert.match(softCacheMod, /entry\.userId !== userId/);

const visibleMod = read("lib/studio-home-metrics-visible.ts");
assert.match(visibleMod, /export function selectVisibleStudioMetricsSnapshot/);
assert.match(visibleMod, /snapshot\.userId === currentUserId/);

const metricsHook = read("hooks/use-studio-home-metrics.ts");
assert.match(metricsHook, /selectVisibleStudioMetricsSnapshot/);
assert.match(
  metricsHook,
  /readStudioHomeMetricsSoftCache\(\s*userId,\s*granularity\s*\)/,
);
assert.match(
  metricsHook,
  /writeStudioHomeMetricsSoftCache\(\s*userId,\s*granularity/,
);
assert.match(metricsHook, /cache:\s*"no-store"/);
assert.match(metricsHook, /clearStudioHomeMetricsSoftCache\(\)/);
assert.doesNotMatch(metricsHook, /new Map<StudioHomeGranularity/);

const authProvider = read("components/auth-provider.tsx");
assert.match(authProvider, /clearStudioHomeMetricsSoftCache/);
assert.match(authProvider, /event === "SIGNED_OUT"/);
const logoutBlock = authProvider.slice(
  authProvider.indexOf("const logout = useCallback"),
);
assert.match(
  logoutBlock.slice(0, 500),
  /clearStudioHomeMetricsSoftCache\(\)/,
  "logout must clear Studio metrics soft cache",
);

// --- Soft cache: userId isolation + clear ---
clearStudioHomeMetricsSoftCache();
writeStudioHomeMetricsSoftCache("user-a", "week", {
  metrics: EMPTY_STUDIO_HOME_CONNECTION_METRICS,
  rpcReady: true,
  granularityFallback: false,
});
assert.ok(readStudioHomeMetricsSoftCache("user-a", "week"));
assert.equal(
  readStudioHomeMetricsSoftCache("user-b", "week"),
  null,
  "user-b must not read user-a metrics via soft cache",
);
assert.equal(
  studioHomeMetricsCacheKey("user-a", "week"),
  "user-a:week",
);
clearStudioHomeMetricsSoftCache();
assert.equal(
  readStudioHomeMetricsSoftCache("user-a", "week"),
  null,
  "clearStudioHomeMetricsSoftCache must drop all entries",
);

// --- Render ownership: foreign / anonymous snapshots stay invisible ---
const metricsA = { ...EMPTY_STUDIO_HOME_CONNECTION_METRICS };
const snapA = {
  userId: "user-a" as string | null,
  metrics: metricsA,
  rpcReady: true,
  granularityFallback: false,
  initialLoading: false,
  fetching: false,
  error: false,
};

const visibleSame = selectVisibleStudioMetricsSnapshot(
  snapA,
  "user-a",
  EMPTY_STUDIO_HOME_CONNECTION_METRICS,
  true,
);
assert.equal(visibleSame.metrics, metricsA);
assert.equal(visibleSame.rpcReady, true);

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
assert.notEqual(visibleForB.metrics, metricsA);

const visibleLogout = selectVisibleStudioMetricsSnapshot(
  snapA,
  null,
  EMPTY_STUDIO_HOME_CONNECTION_METRICS,
  true,
);
assert.equal(visibleLogout.userId, null);
assert.equal(visibleLogout.metrics, EMPTY_STUDIO_HOME_CONNECTION_METRICS);
assert.equal(visibleLogout.initialLoading, false);
assert.notEqual(visibleLogout.metrics, metricsA);

// --- Messages safe-area: additive, not padding clobber ---
const globals = read("app/globals.css");
assert.match(globals, /\.forge-safe-pb::after/);
assert.match(globals, /safe-area-inset-bottom/);
assert.doesNotMatch(
  globals,
  /\.forge-safe-pb\s*\{\s*padding-bottom:\s*env\(safe-area-inset-bottom/,
);

// --- Studio notifications keep Studio shell; item hrefs untouched ---
const studioShell = read("components/studio-shell.tsx");
assert.match(studioShell, /href="\/studio\/notifications"/);
assert.doesNotMatch(studioShell, /title="通知（プレイヤー画面）"/);

const studioNotifPage = read("components/studio-notifications-page.tsx");
assert.match(studioNotifPage, /NotificationsV0Page/);
assert.match(studioNotifPage, /surface="studio"/);
assert.doesNotMatch(studioNotifPage, /studio-notifications-v0-mock-data/);

const notifV0 = read("components/notifications-v0-page.tsx");
assert.match(notifV0, /surface\?: NotificationsSurface/);
assert.match(notifV0, /StudioShell activeNav="notifications"/);
assert.match(notifV0, /PlayerShell activeNav="notifications"/);
assert.match(notifV0, /href=\{item\.href\}/);

const studioRoute = read("app/studio/notifications/page.tsx");
assert.match(studioRoute, /RegisteredAccountGuard/);
assert.match(studioRoute, /StudioNotificationsPage/);

console.log("verify-prod-blockers-three: PASS");
