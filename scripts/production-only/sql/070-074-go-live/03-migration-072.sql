-- =============================================================================
-- Step 4 — Migration 072 (Production manual apply)
-- =============================================================================
-- Dashboard貼付元（正本）:
--   supabase/migrations/072_registered_voice_answer_value_max_1000.sql
--
-- Prerequisite: 070, 071 applied successfully.
-- 072 aborts if answer_value > 1000 exists (no silent truncate).
-- =============================================================================

SELECT 'Paste full contents of supabase/migrations/072_registered_voice_answer_value_max_1000.sql' AS instruction;
