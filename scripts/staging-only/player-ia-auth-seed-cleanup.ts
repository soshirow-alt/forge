/**
 * STAGING ONLY — cleanup for player-ia-auth-seed.ts
 *
 * Deletes dedicated developer_profiles (creator_id ia-seed-dev-%) then auth users
 * created/marked by forge-ia-auth-seed-v1 via Admin API.
 *
 * Usage:
 *   npx --yes tsx scripts/staging-only/player-ia-auth-seed-cleanup.ts           # dry-run
 *   npx --yes tsx scripts/staging-only/player-ia-auth-seed-cleanup.ts --execute
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const STAGING_REF = "vuqpwvjvgyxffmvpfrxo";
const PROD_REF = "bpnisgzxuwdxelhnduuf";
const MARKER = "forge-ia-auth-seed-v1";
const EMAIL_DOMAIN = "forge-ia-seed.local";

function userId(n: number): string {
  return `a1a1a1a1-a1a1-41a1-81a1-${String(n).padStart(12, "0")}`;
}

function loadEnv(): Record<string, string> {
  const env: Record<string, string> = { ...process.env } as Record<string, string>;
  for (const file of [".env.local", ".env"]) {
    const p = resolve(process.cwd(), file);
    if (!existsSync(p)) continue;
    for (const line of readFileSync(p, "utf8").split("\n")) {
      const t = line.trim();
      if (!t || t.startsWith("#")) continue;
      const eq = t.indexOf("=");
      if (eq < 0) continue;
      let value = t.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      const key = t.slice(0, eq).trim();
      if (env[key] == null || env[key] === "") env[key] = value;
    }
  }
  return env;
}

function extractRef(url: string): string | null {
  try {
    const m = new URL(url).hostname.match(/^([a-z0-9]+)\.supabase\.co$/i);
    return m ? m[1] : null;
  } catch {
    return null;
  }
}

async function listAllUsers(sb: SupabaseClient) {
  const users: Array<{ id: string; email?: string; user_metadata?: Record<string, unknown> }> = [];
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await sb.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw new Error(`listUsers failed: ${error.message}`);
    users.push(...(data.users as typeof users));
    if (data.users.length < 200) break;
  }
  return users;
}

async function main() {
  const execute = process.argv.includes("--execute");
  const fixedIds = Array.from({ length: 20 }, (_, i) => userId(i + 1));

  console.log(
    JSON.stringify(
      {
        mode: execute ? "execute" : "dry-run",
        stagingRef: STAGING_REF,
        fixedUserIds: fixedIds.length,
        marker: MARKER,
      },
      null,
      2,
    ),
  );

  if (!execute) {
    console.log("Dry-run only. Pass --execute to delete Staging auth seed rows.");
    return;
  }

  const env = loadEnv();
  const url = env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL || "";
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY || "";
  if (!url || !serviceKey) {
    console.error("SKIP: missing credentials — auth cleanup not applied.");
    process.exit(0);
  }

  const ref = extractRef(url);
  if (ref === PROD_REF) throw new Error("ABORT: Production ref — refuse");
  if (ref !== STAGING_REF) {
    throw new Error(`ABORT: expected Staging ref ${STAGING_REF}, got ${ref}`);
  }

  const sb = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { error: delProfErr } = await sb
    .from("developer_profiles")
    .delete()
    .like("creator_id", "ia-seed-dev-%");
  if (delProfErr) throw new Error(`delete profiles failed: ${delProfErr.message}`);

  const users = await listAllUsers(sb);
  const targets = users.filter(
    (u) =>
      fixedIds.includes(u.id) ||
      (u.email && u.email.endsWith(`@${EMAIL_DOMAIN}`)) ||
      u.user_metadata?.forge_seed_marker === MARKER,
  );

  for (const u of targets) {
    const { error } = await sb.auth.admin.deleteUser(u.id);
    if (error) throw new Error(`deleteUser failed for ${u.id}: ${error.message}`);
    console.log(`deleted auth user ${u.id} (${u.email ?? "?"})`);
  }

  console.log(`DONE auth cleanup: profiles ia-seed-dev-% + ${targets.length} auth users`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
