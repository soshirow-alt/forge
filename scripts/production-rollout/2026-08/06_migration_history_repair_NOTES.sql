-- =============================================================================
-- Production rollout — migration history repair (OWNER ACTION — do not run yet)
-- File: 06_migration_history_repair_NOTES.sql
-- Target: Production Supabase bpnisgzxuwdxelhnduuf
--
-- WHY THIS EXISTS
-- Dashboard SQL Editor APPLY of 01/02/03 creates DB objects but does NOT insert
-- rows into supabase_migrations.schema_migrations for versions 076–101.
-- Without repair, a later `supabase db push` / migration tooling may try to
-- re-apply canonical files against an already-updated schema.
--
-- WHEN
-- 1. 04_postflight_READONLY.sql returned PASS (objects present).
-- 2. Owner explicitly chooses to repair history (separate GO from APPLY).
-- 3. Prefer official repair tooling first; hand INSERT is last resort.
--
-- WHAT TO RECORD
-- Exactly versions 076 through 101 (inclusive), matching filenames under
-- supabase/migrations/. Do not invent versions. Do not mark unapplied versions.
--
-- FAILURE MODES
-- A) Objects new, history old (this package's default after APPLY without repair)
--    → Safe for runtime. Unsafe for CLI migrate. Repair history; do NOT re-run APPLY.
-- B) History claims applied, objects missing
--    → Do NOT insert more history. Investigate; forward-fix with new migration
--      or re-run the missing APPLY file only after Owner review.
-- C) Partial history (e.g. 076–090 present, 091–101 missing)
--    → Repair only the MISSING versions after postflight confirms objects.
--
-- This file is documentation + read-only probes. Write block stays commented.
-- =============================================================================

-- Read-only: recorded versions in the 070–101 band
SELECT version, name, inserted_at
FROM supabase_migrations.schema_migrations
WHERE version ~ '^(07[0-9]|08[0-9]|09[0-9]|10[01])$'
ORDER BY version;

-- Read-only: which 076–101 versions are missing from history
WITH expected(version, name) AS (
  VALUES
    ('076', 'player_ia_categories_attributes'),
    ('077', 'project_usage_relations'),
    ('078', 'platform_announcements'),
    ('079', 'global_public_search'),
    ('080', 'player_ia_home_feed'),
    ('081', 'guest_feedback_public_reenable'),
    ('082', 'guest_feedback_service_role_grants'),
    ('083', 'player_ia_home_v0_shelves'),
    ('084', 'catalog_search_query_genres_tags'),
    ('085', 'catalog_five_category_filters'),
    ('086', 'developer_community_open_posting'),
    ('087', 'collab_consultations'),
    ('088', 'usage_relation_requests'),
    ('089', 'notification_seen_ack'),
    ('090', 'transactional_email_outbox'),
    ('091', 'collab_notification_email_hooks'),
    ('092', 'consultation_message_email_read_to_unread'),
    ('093', 'feedback_reciprocity_notifications'),
    ('094', 'platform_announcement_publish_window'),
    ('095', 'feedback_reciprocity_project_id_text_cast'),
    ('096', 'transactional_email_preferences'),
    ('097', 'transactional_email_pref_allows_harden'),
    ('098', 'remove_dead_notify_studio_voice'),
    ('099', 'messaging_pair_identity'),
    ('100', 'messaging_context_segments'),
    ('101', 'messaging_pair_email_read_harden')
)
SELECT e.version, e.name,
       CASE WHEN m.version IS NULL THEN 'MISSING from schema_migrations' ELSE 'present' END AS history_status
FROM expected e
LEFT JOIN supabase_migrations.schema_migrations m ON m.version = e.version
ORDER BY e.version;

-- =============================================================================
-- REPAIR PROCEDURE (Owner)
--
-- Preferred (official):
--   For each MISSING version from the query above, against the Production project:
--     supabase migration repair --status applied <version>
--   (or Dashboard equivalent). Confirm column/version format matches remote.
--
-- After repair, re-run the MISSING-check CTE — expect all 076–101 = present.
--
-- Last-resort hand INSERT (COMMENTED). Confirm schema_migrations column shape
-- on Production before adapting. If unsure, STOP — use official repair only.
-- =============================================================================
/*
-- EXAMPLE ONLY — adapt to actual schema_migrations columns on Production.
-- DO NOT RUN blindly. Only after postflight PASS + Owner repair GO.

INSERT INTO supabase_migrations.schema_migrations (version, name)
VALUES
  ('076', 'player_ia_categories_attributes'),
  ('077', 'project_usage_relations'),
  ('078', 'platform_announcements'),
  ('079', 'global_public_search'),
  ('080', 'player_ia_home_feed'),
  ('081', 'guest_feedback_public_reenable'),
  ('082', 'guest_feedback_service_role_grants'),
  ('083', 'player_ia_home_v0_shelves'),
  ('084', 'catalog_search_query_genres_tags'),
  ('085', 'catalog_five_category_filters'),
  ('086', 'developer_community_open_posting'),
  ('087', 'collab_consultations'),
  ('088', 'usage_relation_requests'),
  ('089', 'notification_seen_ack'),
  ('090', 'transactional_email_outbox'),
  ('091', 'collab_notification_email_hooks'),
  ('092', 'consultation_message_email_read_to_unread'),
  ('093', 'feedback_reciprocity_notifications'),
  ('094', 'platform_announcement_publish_window'),
  ('095', 'feedback_reciprocity_project_id_text_cast'),
  ('096', 'transactional_email_preferences'),
  ('097', 'transactional_email_pref_allows_harden'),
  ('098', 'remove_dead_notify_studio_voice'),
  ('099', 'messaging_pair_identity'),
  ('100', 'messaging_context_segments'),
  ('101', 'messaging_pair_email_read_harden')
ON CONFLICT (version) DO NOTHING;
*/

SELECT
  'HISTORY_REPAIR_NOT_EXECUTED' AS result,
  'Read-only notes only. Repair is Owner ACTION after postflight PASS.' AS message,
  'Objects-without-history is recoverable via repair; do not re-APPLY 01-03 to fix history.' AS guidance;
