-- =============================================================================
-- Step 3 — Migration 071 (Production manual apply)
-- =============================================================================
-- Dashboard貼付元（正本）:
--   supabase/migrations/071_public_feedback_engagement_harden.sql
--
-- Prerequisite: 070 applied successfully.
-- 071 aborts if optional_comment > 1000 exists (no silent truncate).
-- =============================================================================

SELECT 'Paste full contents of supabase/migrations/071_public_feedback_engagement_harden.sql' AS instruction;
