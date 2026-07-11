/**
 * Cold-load probe for Preview /home discovery feed.
 * Hits the page HTML and the Staging RPC directly (anon) N times.
 * Does not write anything.
 */
import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync } from "node:fs";

const STAGING_REF = "vuqpwvjvgyxffmvpfrxo";
const PREVIEW_HOME =
  "https://forge-git-preview-landing-01-soshirow-alts-projects.vercel.app/home";
const LOADS = 12;

function loadEnv(path = ".env.local") {
  const env = { ...process.env };
  if (!existsSync(path)) return env;
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    env[trimmed.slice(0, eq).trim()] = value;
  }
  return env;
}

function extractRef(url) {
  try {
    return new URL(url).hostname.match(/^([a-z0-9]+)\.supabase\.co$/i)?.[1] ?? null;
  } catch {
    return null;
  }
}

const env = loadEnv();
const ref = extractRef(env.NEXT_PUBLIC_SUPABASE_URL || "");
if (ref !== STAGING_REF) {
  console.error("Abort: not staging", ref);
  process.exit(1);
}

const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const rpcResults = [];
for (let i = 1; i <= LOADS; i += 1) {
  const started = Date.now();
  const { data, error } = await sb.rpc("get_home_discovery_feed");
  rpcResults.push({
    n: i,
    ok: !error,
    ms: Date.now() - started,
    rowCount: Array.isArray(data) ? data.length : null,
    status: error?.status ?? (error ? "error" : 200),
    code: error?.code ?? null,
    message: error?.message ?? null,
  });
}

const pageResults = [];
for (let i = 1; i <= LOADS; i += 1) {
  const started = Date.now();
  const url = `${PREVIEW_HOME}?cold=${Date.now()}-${i}`;
  const res = await fetch(url, {
    headers: {
      "Cache-Control": "no-cache",
      Pragma: "no-cache",
    },
    cache: "no-store",
  });
  const html = await res.text();
  const hasErrorBanner = html.includes("ホームの発見データを読み込めませんでした");
  const hasHeroMarker = html.includes("注目の作品") || html.includes("DiscoveryHome");
  // Client component — error banner is client-rendered; HTML shell may not include it.
  // Record shell health + any embedded error strings.
  pageResults.push({
    n: i,
    httpStatus: res.status,
    ms: Date.now() - started,
    cacheControl: res.headers.get("cache-control"),
    hasErrorBannerInHtml: hasErrorBanner,
    htmlBytes: html.length,
    hasForge: html.includes("Forge"),
  });
}

const rpcFail = rpcResults.filter((r) => !r.ok);
const pageFail = pageResults.filter((r) => r.httpStatus !== 200);

console.log(
  JSON.stringify(
    {
      ref,
      previewHome: PREVIEW_HOME,
      loads: LOADS,
      rpc: {
        pass: rpcFail.length === 0,
        failCount: rpcFail.length,
        results: rpcResults,
      },
      previewHtml: {
        note: "Error banner is client-rendered; HTML probe checks shell HTTP only. Browser CDP covers UI flash.",
        pass: pageFail.length === 0,
        failCount: pageFail.length,
        results: pageResults,
      },
    },
    null,
    2,
  ),
);

if (rpcFail.length || pageFail.length) process.exit(1);
