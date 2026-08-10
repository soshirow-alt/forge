-- =============================================================================
-- Production rollout — migration history repair NOTES (OWNER ACTION)
-- File: 06_migration_history_repair_NOTES.sql
-- Target: Production Supabase bpnisgzxuwdxelhnduuf
--
-- CONTEXT
-- - This 2026-08 package pastes bundled SQL in Dashboard SQL Editor.
-- - That path applies objects but does NOT automatically INSERT into
--   supabase_migrations.schema_migrations for versions 076–100.
-- - Missing history rows can cause a later `supabase db push` / CLI migrate
--   to attempt re-applying canonical files (often failing on IF NOT EXISTS /
--   CREATE conflicts, or worse on non-idempotent steps).
--
-- POLICY
-- - Repair ONLY AFTER 04_postflight_READONLY.sql returns PASS.
-- - Repair is history-table only — do not re-run APPLY 01/02/03 to "fix" history.
-- - Prefer official Supabase migration repair tooling when available for the
--   linked project. Hand-written INSERT below is a documented last resort.
-- - DO NOT RUN the INSERT block until Owner explicitly chooses to repair.
-- - Forward-only: never edit/delete/squash files under supabase/migrations/.
--
-- This file is safe to open/paste as documentation: the write block is commented.
-- =============================================================================

-- Read-only: current recorded versions in the 070–100 band
SELECT version, name, inserted_at
FROM supabase_migrations.schema_migrations
WHERE version ~ '^(07[0-9]|08[0-9]|09[0-9]|100)'
ORDER BY version;

-- Read-only: which 076–100 versions are missing from history
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
    ('100', 'messaging_context_segments')
)
SELECT e.version, e.name,
       CASE WHEN m.version IS NULL THEN 'MISSING from schema_migrations' ELSE 'present' END AS history_status
FROM expected e
LEFT JOIN supabase_migrations.schema_migrations m ON m.version = e.version
ORDER BY e.version;

-- =============================================================================
-- DO NOT RUN UNTIL: postflight PASS + Owner explicit repair GO
-- Preferred: `supabase migration repair --status applied <version>` (or Dashboard
-- equivalent) for each missing version, matching remote Production project.
--
-- Last-resort hand INSERT (COMMENTED). Confirm schema_migrations column shape
-- on Production before adapting (`version`, `name`, `statements`/`inserted_at`
-- vary by CLI era). If unsure, STOP and use official repair — do not guess.
-- =============================================================================
/*
-- EXAMPLE ONLY — adapt to actual schema_migrations columns on Production.
-- DO NOT RUN blindly.

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
  'Read-only notes only. Repair is Owner ACTION after postflight PASS.' AS message;
