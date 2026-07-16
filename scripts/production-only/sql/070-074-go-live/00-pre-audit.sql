-- =============================================================================
-- Production pre-audit (READ-ONLY) — bpnisgzxuwdxelhnduuf
-- Run BEFORE migrations 070–074.
-- STOP if any row in section "STOP checks" shows status = 'FAIL'.
-- Do NOT truncate or UPDATE existing data to pass checks.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- A. 1000-character pre-check (must be 0 overages)
-- -----------------------------------------------------------------------------
SELECT 'A1 registered answer_value > 1000' AS check_name,
       count(*)::bigint AS over_count,
       coalesce(max(char_length(answer_value)), 0)::integer AS max_len
FROM public.project_voice_responses
WHERE char_length(answer_value) > 1000;

SELECT 'A2 registered optional_comment > 1000' AS check_name,
       count(*)::bigint AS over_count,
       coalesce(max(char_length(optional_comment)), 0)::integer AS max_len
FROM public.project_voice_responses
WHERE optional_comment IS NOT NULL
  AND char_length(optional_comment) > 1000;

SELECT 'A3 guest answer_value > 1000' AS check_name,
       count(*)::bigint AS over_count,
       coalesce(max(char_length(answer_value)), 0)::integer AS max_len
FROM public.project_guest_voice_responses
WHERE char_length(answer_value) > 1000;

SELECT 'A4 guest optional_comment > 1000' AS check_name,
       count(*)::bigint AS over_count,
       coalesce(max(char_length(optional_comment)), 0)::integer AS max_len
FROM public.project_guest_voice_responses
WHERE optional_comment IS NOT NULL
  AND char_length(optional_comment) > 1000;

-- -----------------------------------------------------------------------------
-- B. Baseline row counts (record these; must match post-audit)
-- -----------------------------------------------------------------------------
SELECT 'B projects' AS label, count(*)::bigint AS row_count FROM public.projects
UNION ALL
SELECT 'B project_voice_responses', count(*)::bigint FROM public.project_voice_responses
UNION ALL
SELECT 'B project_guest_voice_responses', count(*)::bigint FROM public.project_guest_voice_responses
UNION ALL
SELECT 'B user_notifications', count(*)::bigint FROM public.user_notifications
UNION ALL
SELECT 'B developer_feedback_helpful_marks', count(*)::bigint FROM public.developer_feedback_helpful_marks
ORDER BY label;

-- -----------------------------------------------------------------------------
-- C. Migration 070–074 objects must NOT exist yet
-- -----------------------------------------------------------------------------
SELECT 'C1 projects.age_rating column' AS check_name,
       CASE WHEN EXISTS (
         SELECT 1 FROM information_schema.columns
         WHERE table_schema = 'public' AND table_name = 'projects' AND column_name = 'age_rating'
       ) THEN 'FAIL already exists' ELSE 'OK not present' END AS status;

SELECT 'C2 feedback_card_empathies table' AS check_name,
       CASE WHEN to_regclass('public.feedback_card_empathies') IS NOT NULL
         THEN 'FAIL already exists' ELSE 'OK not present' END AS status;

SELECT 'C3 feedback_card_replies table' AS check_name,
       CASE WHEN to_regclass('public.feedback_card_replies') IS NOT NULL
         THEN 'FAIL already exists' ELSE 'OK not present' END AS status;

SELECT 'C4 developer_has_follower function' AS check_name,
       CASE WHEN to_regprocedure('public.developer_has_follower(uuid)') IS NOT NULL
         THEN 'FAIL already exists' ELSE 'OK not present' END AS status;

SELECT 'C5 project_voice_responses_answer_value_len constraint' AS check_name,
       CASE WHEN EXISTS (
         SELECT 1 FROM pg_constraint c
         JOIN pg_class t ON t.oid = c.conrelid
         JOIN pg_namespace n ON n.oid = t.relnamespace
         WHERE n.nspname = 'public' AND t.relname = 'project_voice_responses'
           AND c.conname = 'project_voice_responses_answer_value_len'
       ) THEN 'FAIL already exists' ELSE 'OK not present' END AS status;

SELECT 'C6 project_voice_responses_optional_comment_len constraint' AS check_name,
       CASE WHEN EXISTS (
         SELECT 1 FROM pg_constraint c
         JOIN pg_class t ON t.oid = c.conrelid
         JOIN pg_namespace n ON n.oid = t.relnamespace
         WHERE n.nspname = 'public' AND t.relname = 'project_voice_responses'
           AND c.conname = 'project_voice_responses_optional_comment_len'
       ) THEN 'FAIL already exists' ELSE 'OK not present' END AS status;

SELECT 'C7 user_notifications authenticated SELECT grant (073)' AS check_name,
       CASE WHEN has_table_privilege('authenticated', 'public.user_notifications', 'SELECT')
         THEN 'WARN already granted (073 may be partial)' ELSE 'OK not yet granted' END AS status;

-- -----------------------------------------------------------------------------
-- D. Prerequisite GRANT checks (STOP if FAIL)
-- 073 INSERT policies reference project_watches and confirmation_requests.
-- Production must already have table SELECT for authenticated.
-- Do NOT apply Staging-only sync SQL here.
-- -----------------------------------------------------------------------------
SELECT 'D1 project_watches authenticated SELECT' AS check_name,
       CASE WHEN has_table_privilege('authenticated', 'public.project_watches', 'SELECT')
         THEN 'OK' ELSE 'FAIL missing GRANT' END AS status;

SELECT 'D2 confirmation_requests authenticated SELECT' AS check_name,
       CASE WHEN has_table_privilege('authenticated', 'public.confirmation_requests', 'SELECT')
         THEN 'OK' ELSE 'FAIL missing GRANT' END AS status;

SELECT 'D3 developer_follows authenticated SELECT (must NOT be broad table grant)' AS check_name,
       CASE
         WHEN has_table_privilege('authenticated', 'public.developer_follows', 'SELECT')
           AND NOT EXISTS (
             SELECT 1 FROM pg_policies
             WHERE schemaname = 'public' AND tablename = 'developer_follows'
               AND policyname = 'Users can read own developer follows'
           ) THEN 'FAIL unexpected broad SELECT without RLS policy'
         WHEN has_table_privilege('authenticated', 'public.developer_follows', 'SELECT')
           THEN 'OK (RLS limits to follower_id = auth.uid())'
         ELSE 'OK no table SELECT grant (074 uses DEFINER RPC)'
       END AS status;

-- -----------------------------------------------------------------------------
-- E. STOP checks summary (any FAIL → do not apply migrations)
-- -----------------------------------------------------------------------------
WITH checks AS (
  SELECT count(*) AS n FROM public.project_voice_responses WHERE char_length(answer_value) > 1000
  UNION ALL SELECT count(*) FROM public.project_voice_responses
    WHERE optional_comment IS NOT NULL AND char_length(optional_comment) > 1000
  UNION ALL SELECT count(*) FROM public.project_guest_voice_responses WHERE char_length(answer_value) > 1000
  UNION ALL SELECT count(*) FROM public.project_guest_voice_responses
    WHERE optional_comment IS NOT NULL AND char_length(optional_comment) > 1000
),
over AS (SELECT coalesce(max(n), 0) AS max_over FROM checks),
grants AS (
  SELECT
    has_table_privilege('authenticated', 'public.project_watches', 'SELECT') AS pw_sel,
    has_table_privilege('authenticated', 'public.confirmation_requests', 'SELECT') AS cr_sel
),
objs AS (
  SELECT
    EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'projects' AND column_name = 'age_rating'
    ) AS age_rating_exists,
    to_regclass('public.feedback_card_empathies') IS NOT NULL AS empathies_exists,
    to_regclass('public.feedback_card_replies') IS NOT NULL AS replies_exists,
    to_regprocedure('public.developer_has_follower(uuid)') IS NOT NULL AS has_follower_fn
)
SELECT
  CASE
    WHEN (SELECT max_over FROM over) > 0 THEN 'FAIL text > 1000 exists'
    WHEN NOT (SELECT pw_sel FROM grants) THEN 'FAIL project_watches SELECT missing for authenticated'
    WHEN NOT (SELECT cr_sel FROM grants) THEN 'FAIL confirmation_requests SELECT missing for authenticated'
    WHEN (SELECT age_rating_exists OR empathies_exists OR replies_exists OR has_follower_fn FROM objs)
      THEN 'FAIL 070–074 object already present'
    ELSE 'PASS proceed to rollback snapshot then migrations'
  END AS pre_audit_verdict;

-- -----------------------------------------------------------------------------
-- F. user_notifications — current GRANT / policy (baseline)
-- -----------------------------------------------------------------------------
SELECT grantee, privilege_type, is_grantable
FROM information_schema.role_table_grants
WHERE table_schema = 'public' AND table_name = 'user_notifications'
ORDER BY grantee, privilege_type;

SELECT
  pol.polname AS policy_name,
  CASE pol.polcmd
    WHEN 'r' THEN 'SELECT' WHEN 'a' THEN 'INSERT'
    WHEN 'w' THEN 'UPDATE' WHEN 'd' THEN 'DELETE' WHEN '*' THEN 'ALL'
  END AS command,
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
-- G. feedback_card_empathies — baseline (expect: table absent before 070)
-- -----------------------------------------------------------------------------
SELECT
  CASE WHEN to_regclass('public.feedback_card_empathies') IS NULL
    THEN 'OK table absent (expected pre-070)'
    ELSE 'WARN table already exists — review policies/GRANT below'
  END AS empathies_table_status;

SELECT grantee, privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public' AND table_name = 'feedback_card_empathies'
ORDER BY grantee, privilege_type;

SELECT policyname, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'feedback_card_empathies'
ORDER BY policyname;

-- -----------------------------------------------------------------------------
-- H. Functions replaced by 070–074 (save definitions via 08-rollback-snapshot)
-- -----------------------------------------------------------------------------
SELECT p.proname AS function_name,
       pg_get_function_identity_arguments(p.oid) AS args,
       p.prosecdef AS security_definer
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname IN (
    'get_public_feedback_cards',
    'resolve_feedback_card_id',
    'toggle_feedback_card_empathy',
    'toggle_feedback_card_helpful',
    'list_feedback_card_replies',
    'create_feedback_card_reply',
    'delete_feedback_card_reply',
    'developer_has_follower'
  )
ORDER BY function_name, args;
