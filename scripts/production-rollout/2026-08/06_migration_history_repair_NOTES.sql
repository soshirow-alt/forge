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
-- PRODUCTION 2026-08 STATUS (confirmed by 00/04 section E)
--   migration_history_status = TABLE_ABSENT
--   supabase_migrations.schema_migrations does not exist.
--   Objects for 076–101 are present (postflight PASS). 001–075 were also
--   historically applied via SQL Editor — their history rows are likewise absent.
--
-- OFFICIAL INIT vs REPAIR (do not guess beyond published docs)
--   Official troubleshooting: the table is created by `supabase db push`,
--   which ALSO applies any migration files not in history.
--   That is NOT safe here: local supabase/migrations has 001–101; none are
--   recorded remotely; `db push` would attempt to re-apply them.
--   Official `supabase migration repair --status applied <version>`:
--     "updates the tracking table only — it does not apply or revert any SQL."
--     Docs assume the tracking table already exists. They do NOT document
--     repair as a safe initializer when the relation is missing.
--   Therefore: TABLE_ABSENT + official repair/init = NOT confirmed safe.
--   STOP / BLOCKED on history repair until Owner has a separate CLI program
--   that (a) does not run `db push` against Production, (b) does not CREATE
--   the table by hand, (c) does not hand-INSERT rows, and (d) accounts for
--   001–075 as well as 076–101 (repairing only 076–101 would leave 001–075
--   pending for any later `db push`).
--
-- History repair is NOT a prerequisite for Next.js Production deploy.
-- Runtime does not read schema_migrations. Do not block code deploy on this
-- file. Do not leave this as a reason to re-run APPLY 01–03.
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
