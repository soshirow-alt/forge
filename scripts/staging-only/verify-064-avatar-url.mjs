/**
 * Staging-only: verify developer_profiles.avatar_url + optional profile roundtrip.
 * Guard: aborts unless NEXT_PUBLIC_SUPABASE_URL ref === vuqpwvjvgyxffmvpfrxo
 *
 * Usage: node scripts/staging-only/verify-064-avatar-url.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync } from "node:fs";

const STAGING_REF = "vuqpwvjvgyxffmvpfrxo";
const PROD_REF = "bpnisgzxuwdxelhnduuf";

function loadEnv(path) {
  const env = { ...process.env };
  if (!existsSync(path)) return env;
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq <= 0) continue;
    let v = t.slice(eq + 1).trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    const k = t.slice(0, eq).trim();
    if (!env[k]) env[k] = v;
  }
  return env;
}

const env = loadEnv(".env.local");
const url = (env.NEXT_PUBLIC_SUPABASE_URL || "").trim();
const key = (env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
let ref = null;
try {
  ref = new URL(url).hostname.split(".")[0];
} catch {
  ref = null;
}

if (ref !== STAGING_REF) {
  console.error(JSON.stringify({ ok: false, reason: "not_staging", ref, expected: STAGING_REF }));
  process.exit(2);
}
if (ref === PROD_REF) {
  console.error(JSON.stringify({ ok: false, reason: "refused_production" }));
  process.exit(2);
}
if (!key) {
  console.error(JSON.stringify({ ok: false, reason: "missing_service_role" }));
  process.exit(2);
}

const sb = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

const { data, error } = await sb
  .from("developer_profiles")
  .select("user_id, public_name, profile, avatar_url")
  .limit(3);

if (error) {
  console.log(
    JSON.stringify({
      ok: false,
      columnOk: false,
      error: error.message,
      code: error.code,
    }),
  );
  process.exit(1);
}

const row = data?.[0];
let roundtrip = null;
if (row?.user_id) {
  const marker = `__forge_064_smoke_${Date.now()}__`;
  const prev = row.profile;
  const { error: upErr } = await sb
    .from("developer_profiles")
    .update({ profile: marker, avatar_url: "/images/landing/game-1.png" })
    .eq("user_id", row.user_id);
  if (upErr) {
    roundtrip = { ok: false, error: upErr.message };
  } else {
    const { data: readBack, error: readErr } = await sb
      .from("developer_profiles")
      .select("profile, avatar_url")
      .eq("user_id", row.user_id)
      .maybeSingle();
    await sb
      .from("developer_profiles")
      .update({ profile: prev, avatar_url: row.avatar_url ?? null })
      .eq("user_id", row.user_id);
    roundtrip = {
      ok: !readErr && readBack?.profile === marker && readBack?.avatar_url === "/images/landing/game-1.png",
      restored: true,
      readProfileMatch: readBack?.profile === marker,
      readAvatarOk: readBack?.avatar_url === "/images/landing/game-1.png",
      error: readErr?.message ?? null,
    };
  }
}

console.log(
  JSON.stringify(
    {
      ok: true,
      ref: STAGING_REF,
      columnOk: true,
      sampleCount: data?.length ?? 0,
      roundtrip,
    },
    null,
    2,
  ),
);
