/**
 * Scan public cards (include_guest=true) for body_text length >1000.
 * Complements table audit when guest table GRANTs are missing.
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
if (!new URL(url).hostname.startsWith(STAGING)) process.exit(2);
const anon = createClient(url, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
  auth: { persistSession: false },
});
const admin = createClient(url, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const { data: projects } = await admin
  .from("projects")
  .select("id, playable_version, visibility")
  .limit(100);

let maxBody = 0;
let over = 0;
let scanned = 0;
const overSamples = [];

for (const p of projects ?? []) {
  const versions = [...new Set([p.playable_version, "0.1", "1.0"].filter(Boolean))];
  for (const v of versions) {
    const { data, error } = await anon.rpc("get_public_feedback_cards", {
      p_project_id: String(p.id),
      p_version_key: String(v),
      p_include_guest: true,
      p_limit: 100,
      p_offset: 0,
    });
    if (error || !data) continue;
    for (const c of data) {
      scanned += 1;
      const len = c.body_text ? String(c.body_text).length : 0;
      if (len > maxBody) maxBody = len;
      if (len > 1000) {
        over += 1;
        overSamples.push({
          project: p.id,
          source: c.target_source,
          len,
        });
      }
    }
  }
}

console.log(
  JSON.stringify(
    {
      scannedCards: scanned,
      maxBodyTextLen: maxBody,
      bodyOver1000: over,
      overSamples,
      projectsProbed: (projects ?? []).length,
    },
    null,
    2,
  ),
);
