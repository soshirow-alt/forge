/**
 * Read-only: count optional_comment longer than 1000 on Staging.
 * HARD GUARD: vuqpwvjvgyxffmvpfrxo
 */
import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync } from "node:fs";

const STAGING = "vuqpwvjvgyxffmvpfrxo";

function loadEnv() {
  const env = { ...process.env };
  for (const p of [".env.local", ".env"]) {
    if (!existsSync(p)) continue;
    for (const line of readFileSync(p, "utf8").split(/\r?\n/)) {
      const t = line.trim();
      if (!t || t.startsWith("#")) continue;
      const i = t.indexOf("=");
      if (i <= 0) continue;
      const k = t.slice(0, i).trim();
      let v = t.slice(i + 1).trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'")))
        v = v.slice(1, -1);
      if (!env[k]) env[k] = v;
    }
  }
  return env;
}

const env = loadEnv();
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const ref = new URL(url).hostname.split(".")[0];
if (ref !== STAGING) {
  console.error(JSON.stringify({ blocked: true, ref }));
  process.exit(2);
}

const admin = createClient(url, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function probe(table) {
  // Fetch optional_comment only; compute lengths client-side (no SQL exec).
  const { data, error } = await admin.from(table).select("id, optional_comment");
  if (error) {
    return { table, error: error.message, code: error.code, over1000: null, maxLen: null, n: null };
  }
  let over = 0;
  let maxLen = 0;
  for (const row of data ?? []) {
    const len = row.optional_comment ? String(row.optional_comment).length : 0;
    if (len > maxLen) maxLen = len;
    if (len > 1000) over += 1;
  }
  return { table, error: null, over1000: over, maxLen, n: (data ?? []).length };
}

const registered = await probe("project_voice_responses");
const guest = await probe("project_guest_voice_responses");
console.log(JSON.stringify({ ref, registered, guest }, null, 2));
