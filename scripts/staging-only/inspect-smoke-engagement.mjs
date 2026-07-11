/**
 * STAGING ONLY — probe voice/watch columns on Smoke A.
 */
import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync } from "node:fs";

const STAGING_REF = "vuqpwvjvgyxffmvpfrxo";
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
if (extractRef(env.NEXT_PUBLIC_SUPABASE_URL || "") !== STAGING_REF) {
  console.error("Abort: not staging");
  process.exit(1);
}
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const pid = "41ff5a96-105c-42a2-87b4-787bcfeacb45";
const [voices, watches, feedback] = await Promise.all([
  sb.from("project_voice_responses").select("*").eq("project_id", pid).limit(1),
  sb.from("project_watches").select("*").eq("project_id", pid).limit(1),
  sb.from("project_feedback").select("*").eq("project_id", pid).limit(1),
]);
console.log(
  JSON.stringify(
    {
      voiceKeys: voices.data?.[0] ? Object.keys(voices.data[0]) : null,
      voiceErr: voices.error,
      watchKeys: watches.data?.[0] ? Object.keys(watches.data[0]) : null,
      watchErr: watches.error,
      feedbackKeys: feedback.data?.[0] ? Object.keys(feedback.data[0]) : null,
      feedbackSample: feedback.data?.[0]
        ? {
            user_id: feedback.data[0].user_id,
            created_at: feedback.data[0].created_at,
          }
        : null,
      voiceSample: voices.data?.[0]
        ? {
            user_id: voices.data[0].user_id,
            created_at: voices.data[0].created_at,
            moderation_status: voices.data[0].moderation_status,
          }
        : null,
    },
    null,
    2,
  ),
);
