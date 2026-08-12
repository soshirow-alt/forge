/**
 * Deterministic checks for Studio metrics soft-cache identity + Studio notifications
 * surface routing + forge-safe-pb additive safe-area (no padding clobber).
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  clearStudioHomeMetricsSoftCache,
  readStudioHomeMetricsSoftCache,
  selectOwnedStudioMetricsSnapshot,
  studioHomeMetricsCacheKey,
  writeStudioHomeMetricsSoftCache,
} from "../lib/studio-home-metrics-soft-cache";
import { EMPTY_STUDIO_HOME_CONNECTION_METRICS } from "../lib/studio-home-metrics";

const ROOT = process.cwd();

function read(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel), "utf8");
}

const softCacheMod = read("lib/studio-home-metrics-soft-cache.ts");
assert.match(softCacheMod, /studioHomeMetricsCacheKey/);
assert.match(softCacheMod, /\$\{userId\}:\$\{granularity\}/);
assert.match(softCacheMod, /clearStudioHomeMetricsSoftCache/);
assert.match(softCacheMod, /STUDIO_HOME_METRICS_SOFT_CACHE_TTL_MS = 20_000/);
assert.match(softCacheMod, /entry\.userId !== userId/);
assert.match(softCacheMod, /selectOwnedStudioMetricsSnapshot/);

const metricsHook = read("hooks/use-studio-home-metrics.ts");
assert.match(metricsHook, /snapshot\.userId === userId/);
assert.match(metricsHook, /const visible:/);
assert.match(metricsHook, /MetricsSnapshot/);
assert.match(metricsHook, /readStudioHomeMetricsSoftCache\(userId, granularity\)/);
assert.match(metricsHook, /writeStudioHomeMetricsSoftCache\(userId, granularity/);
assert.match(metricsHook, /cache: "no-store"/);
assert.match(metricsHook, /clearStudioHomeMetricsSoftCache\(\)/);
assert.doesNotMatch(
  metricsHook,
  /new Map<StudioHomeGranularity/,
);

const authProvider = read("components/auth-provider.tsx");
assert.match(authProvider, /clearStudioHomeMetricsSoftCache/);
assert.match(authProvider, /event === "SIGNED_OUT"/);

clearStudioHomeMetricsSoftCache();
writeStudioHomeMetricsSoftCache("user-a", "week", {
  metrics: EMPTY_STUDIO_HOME_CONNECTION_METRICS,
  rpcReady: true,
  granularityFallback: false,
});
assert.ok(readStudioHomeMetricsSoftCache("user-a", "week"));
assert.equal(readStudioHomeMetricsSoftCache("user-b", "week"), null);
assert.equal(
  studioHomeMetricsCacheKey("user-a", "week"),
  "user-a:week",
);
clearStudioHomeMetricsSoftCache();
assert.equal(readStudioHomeMetricsSoftCache("user-a", "week"), null);

const snapA = {
  userId: "user-a",
  metrics: EMPTY_STUDIO_HOME_CONNECTION_METRICS,
  rpcReady: true,
  granularityFallback: false,
};
assert.ok(selectOwnedStudioMetricsSnapshot(snapA, "user-a"));
assert.equal(selectOwnedStudioMetricsSnapshot(snapA, "user-b"), null);
assert.equal(selectOwnedStudioMetricsSnapshot(snapA, null), null);
assert.equal(selectOwnedStudioMetricsSnapshot(null, "user-a"), null);

const globals = read("app/globals.css");
assert.match(globals, /\.forge-safe-pb::after/);
assert.match(globals, /safe-area-inset-bottom/);
assert.doesNotMatch(
  globals,
  /\.forge-safe-pb\s*\{\s*padding-bottom:\s*env\(safe-area-inset-bottom/,
);

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
