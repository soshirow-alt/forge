-- =============================================================================
-- Step 5 — Migration 073 (Production manual apply)
-- =============================================================================
-- Dashboard貼付元（正本）:
--   supabase/migrations/073_user_notifications_authenticated_read_access.sql
--
-- Prerequisite: 070 applied. Apply 074 immediately after 073 — do not leave
-- 073-only state for long (followed_developer INSERT policy needs 074).
--
-- Requires pre-audit PASS:
--   authenticated SELECT on project_watches
--   authenticated SELECT on confirmation_requests
-- =============================================================================

SELECT 'Paste full contents of supabase/migrations/073_user_notifications_authenticated_read_access.sql' AS instruction;
