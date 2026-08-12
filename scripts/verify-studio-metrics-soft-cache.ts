/**
 * Static verify: Studio metrics soft cache must be keyed by userId and cleared on logout.
 * Run: npx --yes tsx scripts/verify-studio-metrics-soft-cache.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(process.cwd());

function read(rel: string): string {
  return readFileSync(resolve(root, rel), "utf8");
}

const softCache = read("lib/studio-home-metrics-soft-cache.ts");
const hook = read("hooks/use-studio-home-metrics.ts");
const auth = read("components/auth-provider.tsx");

assert.match(
  hook,
  /snapshot\.userId === userId/,
  "hook must guard render against mismatched user snapshot",
);
assert.match(
  hook,
  /EMPTY_STUDIO_HOME_CONNECTION_METRICS/,
  "hook must fall back to empty metrics for mismatched user",
);
assert.match(
  softCache,
  /userId:\s*string/,
  "soft cache entry must store userId",
);
assert.match(
  softCache,
  /\$\{userId\}:\$\{granularity\}/,
  "cache key must include userId + granularity",
);
assert.match(
  softCache,
  /export function clearStudioHomeMetricsSoftCache/,
  "must export clear helper",
);
assert.match(
  softCache,
  /entry\.userId !== userId/,
  "read must reject mismatched userId",
);

assert.match(
  hook,
  /readStudioHomeMetricsSoftCache\(userId,\s*granularity\)/,
  "hook must read with userId",
);
assert.match(
  hook,
  /writeStudioHomeMetricsSoftCache\(userId,\s*granularity/,
  "hook must write with userId",
);
assert.doesNotMatch(
  hook,
  /Map<StudioHomeGranularity/,
  "hook must not key soft cache by granularity alone",
);

assert.match(
  auth,
  /clearStudioHomeMetricsSoftCache\(\)/,
  "auth provider must clear soft cache",
);
assert.match(
  auth,
  /event === "SIGNED_OUT"/,
  "auth must clear on SIGNED_OUT",
);
assert.match(auth, /const logout = useCallback/, "logout path must exist");

const logoutBlock = auth.slice(auth.indexOf("const logout = useCallback"));
assert.match(
  logoutBlock.slice(0, 400),
  /clearStudioHomeMetricsSoftCache\(\)/,
  "logout must clear Studio metrics soft cache",
);

console.log("verify-studio-metrics-soft-cache: PASS");
