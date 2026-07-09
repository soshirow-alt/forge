/**
 * READ-ONLY — Supabase connection target check (no DB writes).
 *
 * Usage:
 *   node scripts/check-supabase-connection-target.mjs
 *   node scripts/check-supabase-connection-target.mjs --env-file .env.local
 *   node scripts/check-supabase-connection-target.mjs --env-file .env.vercel
 *
 * Never logs secret key values (service role / anon).
 */
import { existsSync, readFileSync } from "node:fs";

const PROD_REF_DEFAULT = "bpnisgzxuwdxelhnduuf";

function parseArgs(argv) {
  const args = { envFile: ".env.local" };
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === "--env-file" && argv[i + 1]) {
      args.envFile = argv[++i];
    }
  }
  return args;
}

function loadEnvFile(path) {
  const merged = { ...process.env };
  if (!existsSync(path)) return merged;
  const raw = readFileSync(path, "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    merged[key] = value;
  }
  return merged;
}

function extractSupabaseRef(url) {
  if (!url) return null;
  try {
    const host = new URL(url).hostname;
    const match = host.match(/^([a-z0-9]+)\.supabase\.co$/i);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

function secretPresence(value) {
  if (!value || !String(value).trim()) return "missing";
  return "present";
}

function classifyRuntime(env) {
  const vercelEnv = env.VERCEL_ENV?.trim();
  if (vercelEnv === "production") return "vercel-production";
  if (vercelEnv === "preview") return "vercel-preview";
  if (vercelEnv === "development") return "vercel-development";
  if (env.VERCEL === "1") return "vercel-unknown";
  return "local-or-ci";
}

function shouldWarnNonProdToProd(runtimeClass, targetRef, prodRef) {
  if (!targetRef || targetRef !== prodRef) return false;
  return runtimeClass !== "vercel-production";
}

function connectivityProbe(url, anonKey) {
  if (!url || !anonKey) return { skipped: true, reason: "missing url or anon key" };
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  return fetch(`${url}/rest/v1/projects?select=id&limit=0`, {
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
    },
    signal: controller.signal,
  })
    .then(async (res) => {
      clearTimeout(timer);
      return {
        skipped: false,
        httpStatus: res.status,
        ok: res.status === 200 || res.status === 206,
      };
    })
    .catch((err) => {
      clearTimeout(timer);
      return {
        skipped: false,
        ok: false,
        error: err instanceof Error ? err.message : String(err),
      };
    });
}

const { envFile } = parseArgs(process.argv);
const env = loadEnvFile(envFile);
const prodRef =
  env.FORGE_PRODUCTION_SUPABASE_REF?.trim() || PROD_REF_DEFAULT;
const url = env.NEXT_PUBLIC_SUPABASE_URL?.trim() || "";
const targetRef = extractSupabaseRef(url);
const runtimeClass = classifyRuntime(env);
const warn = shouldWarnNonProdToProd(runtimeClass, targetRef, prodRef);

const report = {
  checkedAt: new Date().toISOString(),
  envFile,
  runtime: {
    class: runtimeClass,
    VERCEL_ENV: env.VERCEL_ENV ?? null,
    NODE_ENV: env.NODE_ENV ?? null,
  },
  supabase: {
    urlHost: url ? (() => { try { return new URL(url).hostname; } catch { return "invalid-url"; } })() : null,
    targetRef,
    productionRef: prodRef,
    pointsToProduction: targetRef === prodRef,
    anonKey: secretPresence(env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    serviceRoleKey: secretPresence(env.SUPABASE_SERVICE_ROLE_KEY),
  },
  guard: {
    FORGE_PRODUCTION_SUPABASE_REF: env.FORGE_PRODUCTION_SUPABASE_REF?.trim() || `(default ${PROD_REF_DEFAULT})`,
    FORGE_ALLOW_PRODUCTION_SUPABASE_WRITE:
      env.FORGE_ALLOW_PRODUCTION_SUPABASE_WRITE === "1" ? "1 (explicit allow)" : "unset",
    FORGE_PRODUCTION_MODE: env.FORGE_PRODUCTION_MODE ?? "unset",
  },
  warnings: [],
};

if (!url) {
  report.warnings.push("NEXT_PUBLIC_SUPABASE_URL is missing");
}
if (!targetRef) {
  report.warnings.push("Could not extract Supabase project ref from URL");
}
if (warn) {
  report.warnings.push(
    `NON-PRODUCTION runtime (${runtimeClass}) points to PRODUCTION Supabase ref (${prodRef}). Switch to staging ref.`,
  );
}
if (env.FORGE_ALLOW_PRODUCTION_SUPABASE_WRITE === "1" && runtimeClass !== "local-or-ci") {
  report.warnings.push(
    "FORGE_ALLOW_PRODUCTION_SUPABASE_WRITE=1 is set outside local — remove from Preview/Production Vercel env.",
  );
}

const probe = await connectivityProbe(url, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
report.connectivity = probe;

console.log(JSON.stringify(report, null, 2));

if (report.warnings.length > 0) {
  process.exit(1);
}
