/**
 * STAGING ONLY — probe get_home_discovery_feed as anon + service_role.
 */
import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync } from "node:fs";

const STAGING_REF = "vuqpwvjvgyxffmvpfrxo";
const PROD_REF = "bpnisgzxuwdxelhnduuf";

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
    const m = new URL(url).hostname.match(/^([a-z0-9]+)\.supabase\.co$/i);
    return m ? m[1] : null;
  } catch {
    return null;
  }
}

const env = loadEnv();
const ref = extractRef(env.NEXT_PUBLIC_SUPABASE_URL || "");
if (ref !== STAGING_REF || ref === PROD_REF) {
  console.error("Abort: not staging", ref);
  process.exit(1);
}

async function probe(label, key) {
  const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, key);
  const { data, error } = await sb.rpc("get_home_discovery_feed");
  return {
    label,
    ok: !error,
    error: error
      ? { message: error.message, code: error.code }
      : null,
    rowCount: Array.isArray(data) ? data.length : null,
    bySection: Array.isArray(data)
      ? data.reduce((acc, row) => {
          const s = row.section;
          acc[s] = (acc[s] ?? 0) + 1;
          return acc;
        }, {})
      : null,
    rows: Array.isArray(data) ? data : null,
  };
}

const anon = await probe("anon", env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
const service = await probe("service_role", env.SUPABASE_SERVICE_ROLE_KEY);

// publish RPC permission checks (expect fail for anon)
const anonSb = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);
const { error: anonPublishErr } = await anonSb.rpc(
  "publish_project_version_with_devlog",
  {
    p_project_id: "00000000-0000-0000-0000-000000000001",
    p_version_key: "9.9.9",
    p_title: "x",
    p_content: "y",
  },
);

console.log(
  JSON.stringify(
    {
      ref,
      feed: { anon, service },
      publishAnon: anonPublishErr
        ? { message: anonPublishErr.message, code: anonPublishErr.code }
        : { unexpectedSuccess: true },
    },
    null,
    2,
  ),
);
