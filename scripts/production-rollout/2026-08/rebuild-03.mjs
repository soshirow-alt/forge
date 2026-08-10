import fs from "fs";
import path from "path";

const outDir = "scripts/production-rollout/2026-08";
const migrations = [
  "093_feedback_reciprocity_notifications.sql",
  "094_platform_announcement_publish_window.sql",
  "095_feedback_reciprocity_project_id_text_cast.sql",
  "096_transactional_email_preferences.sql",
  "097_transactional_email_pref_allows_harden.sql",
  "098_remove_dead_notify_studio_voice.sql",
  "099_messaging_pair_identity.sql",
  "100_messaging_context_segments.sql",
  "101_messaging_pair_email_read_harden.sql",
];

function stripTxn(sql) {
  return sql
    .replace(/^\uFEFF/, "")
    .replace(/^\s*BEGIN\s*;\s*/i, "")
    .replace(/\s*COMMIT\s*;\s*$/i, "")
    .trimEnd();
}

const header = `-- =============================================================================
-- Production rollout APPLY 03 - reciprocity / email prefs / messaging (093-101)
-- Target: Production Supabase bpnisgzxuwdxelhnduuf
-- Apply via: Supabase Dashboard -> SQL Editor (OWNER MANUAL ONLY)
-- Pure SQL (no \\i / \\set / psql meta). One transaction for this file.
-- Source: canonical supabase/migrations/ (concatenated; originals untouched).
-- DO NOT apply Staging seed / beautify / fixture SQL with this package.
-- Forward-only: do not edit applied migrations; fix with a later migration.
-- =============================================================================

BEGIN;

`;

let body = header;
for (const name of migrations) {
  const raw = fs.readFileSync(path.join("supabase/migrations", name), "utf8");
  body += `\n-- === ${name} ===\n`;
  body += stripTxn(raw);
  body += `\n\n-- === end ${name} ===\n`;
}
body += `\nCOMMIT;\n`;

const outPath = path.join(outDir, "03_notifications_email_and_finalization.sql");
fs.writeFileSync(outPath, body, "utf8");

const sample = "新しいメッセージが届きました";
const jpOk = body.includes(sample);
console.log(
  JSON.stringify(
    {
      bytes: Buffer.byteLength(body),
      jpOk,
      hasBegin: /^BEGIN;/m.test(body),
      commitCount: (body.match(/^COMMIT;/gm) || []).length,
      outPath,
    },
    null,
    2,
  ),
);
