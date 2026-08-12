/**
 * Times full Player IA Home loader (includes FB fill) cold vs warm via module cache.
 * Run: npx --yes tsx scripts/perf/measure-player-ia-home-loader.ts
 */
import { performance } from "node:perf_hooks";
import { readFileSync, existsSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

function loadEnvLocal() {
  const envPath = resolve(root, ".env.local");
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    if (!line || line.startsWith("#")) continue;
    const i = line.indexOf("=");
    if (i <= 0) continue;
    const key = line.slice(0, i).trim();
    let val = line.slice(i + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = val;
  }
}

loadEnvLocal();

async function main() {
  const { loadPlayerIaHomeDetailed } = await import(
    "../../lib/player-ia/load-player-ia-home"
  );

  const t0 = performance.now();
  const cold = await loadPlayerIaHomeDetailed();
  const coldMs = Math.round((performance.now() - t0) * 10) / 10;

  const t1 = performance.now();
  const warm = await loadPlayerIaHomeDetailed();
  const warmMs = Math.round((performance.now() - t1) * 10) / 10;

  const report = {
    at: new Date().toISOString(),
    coldMs,
    warmMs,
    coldCacheHit: Boolean(cold.cacheHit),
    warmCacheHit: Boolean(warm.cacheHit),
    coldTiming: cold.timing ?? null,
    shelfCounts: cold.home
      ? {
          feedback: cold.home.feedbackGathering?.length ?? 0,
          updates: cold.home.meaningfulUpdates?.length ?? 0,
          newest: cold.home.newestProjects?.length ?? 0,
        }
      : null,
  };

  const out = resolve(root, ".agent/runtime/perf-home-loader.json");
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
