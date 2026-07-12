/**
 * Production-only helpers for home discovery go-live.
 * Loads .env.vercel.production (Vercel production pull). Never writes unless --execute.
 */
import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync } from "node:fs";

export const PROD_REF = "bpnisgzxuwdxelhnduuf";
export const STAGING_REF = "vuqpwvjvgyxffmvpfrxo";

export function loadEnvFile(path) {
  const env = { ...process.env };
  if (!existsSync(path)) {
    throw new Error(`Missing env file: ${path}`);
  }
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
    // Vercel may escape newlines as \n inside quotes
    value = value.replace(/\\n/g, "\n");
    env[trimmed.slice(0, eq).trim()] = value;
  }
  return env;
}

export function extractRef(url) {
  try {
    return new URL(url).hostname.match(/^([a-z0-9]+)\.supabase\.co$/i)?.[1] ?? null;
  } catch {
    return null;
  }
}

export function requireProductionEnv(path = ".env.vercel.production") {
  const env = loadEnvFile(path);
  const ref = extractRef(env.NEXT_PUBLIC_SUPABASE_URL || "");
  if (ref !== PROD_REF) {
    throw new Error(`Abort: expected production ref ${PROD_REF}, got ${ref}`);
  }
  if (ref === STAGING_REF) {
    throw new Error("Abort: staging ref");
  }
  if (!env.NEXT_PUBLIC_SUPABASE_ANON_KEY || !env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Abort: missing anon/service keys");
  }
  return { env, ref };
}

export function prodClients(path = ".env.vercel.production") {
  const { env, ref } = requireProductionEnv(path);
  const anon = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const service = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return { env, ref, anon, service };
}
