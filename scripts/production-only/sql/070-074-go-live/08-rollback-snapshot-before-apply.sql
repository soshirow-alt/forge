-- =============================================================================
-- Rollback snapshot (READ-ONLY) — run BEFORE applying 070–074
-- Save all result sets. Use if you need to restore pre-migration definitions.
-- This file does NOT execute rollback — definitions only.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. user_notifications — GRANTs
-- -----------------------------------------------------------------------------
SELECT grantee, privilege_type, is_grantable
FROM information_schema.role_table_grants
WHERE table_schema = 'public' AND table_name = 'user_notifications'
ORDER BY grantee, privilege_type;

SELECT grantee, column_name, privilege_type
FROM information_schema.column_privileges
WHERE table_schema = 'public' AND table_name = 'user_notifications'
ORDER BY grantee, column_name, privilege_type;

-- -----------------------------------------------------------------------------
-- 2. user_notifications — RLS policies (full expressions)
-- -----------------------------------------------------------------------------
SELECT
  pol.polname AS policy_name,
  CASE pol.polcmd
    WHEN 'r' THEN 'SELECT' WHEN 'a' THEN 'INSERT'
    WHEN 'w' THEN 'UPDATE' WHEN 'd' THEN 'DELETE' WHEN '*' THEN 'ALL'
  END AS command,
  pol.polpermissive AS permissive,
  (
    SELECT coalesce(array_agg(rol.rolname ORDER BY rol.rolname), ARRAY[]::name[])
    FROM pg_catalog.pg_roles rol WHERE rol.oid = ANY (pol.polroles)
  ) AS roles,
  pg_catalog.pg_get_expr(pol.polqual, pol.polrelid) AS using_expression,
  pg_catalog.pg_get_expr(pol.polwithcheck, pol.polrelid) AS with_check_expression
FROM pg_catalog.pg_policy pol
JOIN pg_catalog.pg_class cls ON cls.oid = pol.polrelid
JOIN pg_catalog.pg_namespace nsp ON nsp.oid = cls.relnamespace
WHERE nsp.nspname = 'public' AND cls.relname = 'user_notifications'
ORDER BY pol.polname, command;

-- -----------------------------------------------------------------------------
-- 3. user_notifications — type CHECK constraint
-- -----------------------------------------------------------------------------
SELECT c.conname, pg_get_constraintdef(c.oid) AS definition
FROM pg_constraint c
JOIN pg_class t ON t.oid = c.conrelid
JOIN pg_namespace n ON n.oid = t.relnamespace
WHERE n.nspname = 'public' AND t.relname = 'user_notifications'
  AND c.contype = 'c'
ORDER BY c.conname;

-- -----------------------------------------------------------------------------
-- 4. feedback_card_empathies — GRANT / policy (expect absent pre-070)
-- -----------------------------------------------------------------------------
SELECT
  CASE WHEN to_regclass('public.feedback_card_empathies') IS NULL
    THEN 'absent' ELSE 'present' END AS table_status;

SELECT grantee, privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public' AND table_name = 'feedback_card_empathies'
ORDER BY grantee, privilege_type;

SELECT policyname, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'feedback_card_empathies'
ORDER BY policyname;

-- -----------------------------------------------------------------------------
-- 5. Functions replaced or added by 070–074 — full definitions
-- -----------------------------------------------------------------------------
SELECT pg_get_functiondef(p.oid) AS definition
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname = 'get_public_feedback_cards'
  AND pg_get_function_identity_arguments(p.oid) =
      'p_project_id text, p_version_key text, p_include_guest boolean, p_limit integer, p_offset integer';

SELECT pg_get_functiondef(p.oid) AS definition
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public' AND p.proname = 'resolve_feedback_card_id';

SELECT pg_get_functiondef(p.oid) AS definition
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public' AND p.proname = 'toggle_feedback_card_empathy';

SELECT pg_get_functiondef(p.oid) AS definition
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public' AND p.proname = 'toggle_feedback_card_helpful';

SELECT pg_get_functiondef(p.oid) AS definition
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public' AND p.proname = 'list_feedback_card_replies';

SELECT pg_get_functiondef(p.oid) AS definition
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public' AND p.proname = 'create_feedback_card_reply';

SELECT pg_get_functiondef(p.oid) AS definition
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public' AND p.proname = 'delete_feedback_card_reply';

SELECT pg_get_functiondef(p.oid) AS definition
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public' AND p.proname = 'developer_has_follower';

-- -----------------------------------------------------------------------------
-- 6. project_watches / confirmation_requests / developer_follows — GRANT baseline
-- -----------------------------------------------------------------------------
SELECT 'project_watches' AS table_name, grantee, privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public' AND table_name = 'project_watches'
  AND grantee IN ('authenticated', 'anon', 'service_role')
ORDER BY grantee, privilege_type;

SELECT 'confirmation_requests' AS table_name, grantee, privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public' AND table_name = 'confirmation_requests'
  AND grantee IN ('authenticated', 'anon', 'service_role')
ORDER BY grantee, privilege_type;

SELECT 'developer_follows' AS table_name, grantee, privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public' AND table_name = 'developer_follows'
  AND grantee IN ('authenticated', 'anon', 'service_role')
ORDER BY grantee, privilege_type;

SELECT policyname, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'developer_follows'
ORDER BY policyname;

-- -----------------------------------------------------------------------------
-- 7. Voice response length constraints (pre-072 / pre-071 baseline)
-- -----------------------------------------------------------------------------
SELECT c.conname, pg_get_constraintdef(c.oid) AS definition
FROM pg_constraint c
JOIN pg_class t ON t.oid = c.conrelid
JOIN pg_namespace n ON n.oid = t.relnamespace
WHERE n.nspname = 'public'
  AND t.relname IN ('project_voice_responses', 'project_guest_voice_responses')
  AND c.contype = 'c'
ORDER BY t.relname, c.conname;

-- -----------------------------------------------------------------------------
-- 8. projects columns (pre-070: no age_rating expected)
-- -----------------------------------------------------------------------------
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'projects'
  AND column_name IN ('age_rating', 'id', 'title', 'visibility')
ORDER BY column_name;
