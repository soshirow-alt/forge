-- =============================================================================
-- Step 6 — Migration 074 (Production manual apply)
-- =============================================================================
-- Dashboard貼付元（正本）:
--   supabase/migrations/074_user_notification_follower_recipient_helper.sql
--
-- Prerequisite: 073 applied in same session (or immediately before).
-- Do NOT GRANT developer_follows SELECT to authenticated (074 uses DEFINER RPC).
-- Do NOT apply Staging-only project_watches sync SQL on Production.
-- =============================================================================

SELECT 'Paste full contents of supabase/migrations/074_user_notification_follower_recipient_helper.sql' AS instruction;
