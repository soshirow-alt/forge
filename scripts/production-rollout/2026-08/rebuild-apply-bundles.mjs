/**
 * Rebuild Production APPLY 01–03 from canonical supabase/migrations/*.sql
 * and write UTF-8 files. Used by verify-production-rollout-bundle.mjs.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "../../..");
const outDir = __dirname;

export const APPLY_BUNDLES = [
  {
    file: "01_core_schema_and_category.sql",
    title: "core schema + category / catalog / home (076-085)",
    migrations: [
      "076_player_ia_categories_attributes.sql",
      "077_project_usage_relations.sql",
      "078_platform_announcements.sql",
      "079_global_public_search.sql",
      "080_player_ia_home_feed.sql",
      "081_guest_feedback_public_reenable.sql",
      "082_guest_feedback_service_role_grants.sql",
      "083_player_ia_home_v0_shelves.sql",
      "084_catalog_search_query_genres_tags.sql",
      "085_catalog_five_category_filters.sql",
    ],
  },
  {
    file: "02_collaboration_and_messaging.sql",
    title: "collaboration / requests / seen-ack / email outbox (086-092)",
    migrations: [
      "086_developer_community_open_posting.sql",
      "087_collab_consultations.sql",
      "088_usage_relation_requests.sql",
      "089_notification_seen_ack.sql",
      "090_transactional_email_outbox.sql",
      "091_collab_notification_email_hooks.sql",
      "092_consultation_message_email_read_to_unread.sql",
    ],
  },
  {
    file: "03_notifications_email_and_finalization.sql",
    title: "reciprocity / email prefs / messaging (093-101)",
    migrations: [
      "093_feedback_reciprocity_notifications.sql",
      "094_platform_announcement_publish_window.sql",
      "095_feedback_reciprocity_project_id_text_cast.sql",
      "096_transactional_email_preferences.sql",
      "097_transactional_email_pref_allows_harden.sql",
      "098_remove_dead_notify_studio_voice.sql",
      "099_messaging_pair_identity.sql",
      "100_messaging_context_segments.sql",
      "101_messaging_pair_email_read_harden.sql",
    ],
  },
];

export function stripTxn(sql) {
  return sql
    .replace(/^\uFEFF/, "")
    .replace(/^\s*BEGIN\s*;\s*/i, "")
    .replace(/\s*COMMIT\s*;\s*$/i, "")
    .trimEnd();
}

export function normalizeSql(sql) {
  return stripTxn(sql)
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .trim();
}

export function buildApplyFile(bundle) {
  const header = `-- =============================================================================
-- Production rollout APPLY — ${bundle.title}
-- File: ${bundle.file}
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
  for (const name of bundle.migrations) {
    const raw = fs.readFileSync(
      path.join(root, "supabase", "migrations", name),
      "utf8",
    );
    body += `\n-- === ${name} ===\n`;
    body += stripTxn(raw);
    body += `\n\n-- === end ${name} ===\n`;
  }
  body += `\nCOMMIT;\n`;
  return body;
}

export function writeApplyBundles() {
  const results = [];
  for (const bundle of APPLY_BUNDLES) {
    const body = buildApplyFile(bundle);
    const outPath = path.join(outDir, bundle.file);
    fs.writeFileSync(outPath, body, "utf8");
    results.push({
      file: bundle.file,
      bytes: Buffer.byteLength(body, "utf8"),
      migrations: bundle.migrations.length,
    });
  }
  return results;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  console.log(JSON.stringify(writeApplyBundles(), null, 2));
}
