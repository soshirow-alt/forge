-- =============================================================================
-- Production post-audit (READ-ONLY) — bpnisgzxuwdxelhnduuf
-- Run AFTER migrations 070–074 all succeeded.
-- Compare row counts to 00-pre-audit baseline (must match).
-- No write tests on existing user data.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- A. Row counts (must match pre-audit baseline)
-- -----------------------------------------------------------------------------
SELECT 'A projects' AS label, count(*)::bigint AS row_count FROM public.projects
UNION ALL
SELECT 'A project_voice_responses', count(*)::bigint FROM public.project_voice_responses
UNION ALL
SELECT 'A project_guest_voice_responses', count(*)::bigint FROM public.project_guest_voice_responses
UNION ALL
SELECT 'A user_notifications', count(*)::bigint FROM public.user_notifications
UNION ALL
SELECT 'A developer_feedback_helpful_marks', count(*)::bigint FROM public.developer_feedback_helpful_marks
ORDER BY label;

-- -----------------------------------------------------------------------------
-- B. R18 / age_rating (070)
-- -----------------------------------------------------------------------------
SELECT 'B1 age_rating column exists' AS check_name,
       CASE WHEN EXISTS (
         SELECT 1 FROM information_schema.columns
         WHERE table_schema = 'public' AND table_name = 'projects' AND column_name = 'age_rating'
       ) THEN 'OK' ELSE 'FAIL' END AS status;

SELECT 'B2 all projects general' AS check_name,
       CASE WHEN count(*) FILTER (WHERE age_rating IS DISTINCT FROM 'general') = 0
         THEN 'OK' ELSE 'FAIL non-general exists' END AS status,
       count(*) FILTER (WHERE age_rating = 'general')::bigint AS general_count,
       count(*) FILTER (WHERE age_rating = 'r18')::bigint AS r18_count
FROM public.projects;

SELECT 'B3 age_rating check constraint' AS check_name,
       CASE WHEN EXISTS (
         SELECT 1 FROM pg_constraint c
         JOIN pg_class t ON t.oid = c.conrelid
         JOIN pg_namespace n ON n.oid = t.relnamespace
         WHERE n.nspname = 'public' AND t.relname = 'projects'
           AND c.conname = 'projects_age_rating_check'
       ) THEN 'OK' ELSE 'FAIL' END AS status;

-- -----------------------------------------------------------------------------
-- C. 1000-character constraints (070–072)
-- -----------------------------------------------------------------------------
SELECT 'C1 registered answer_value <= 1000 constraint' AS check_name,
       CASE WHEN EXISTS (
         SELECT 1 FROM pg_constraint c
         JOIN pg_class t ON t.oid = c.conrelid
         JOIN pg_namespace n ON n.oid = t.relnamespace
         WHERE n.nspname = 'public' AND t.relname = 'project_voice_responses'
           AND c.conname = 'project_voice_responses_answer_value_len'
       ) THEN 'OK' ELSE 'FAIL' END AS status;

SELECT 'C2 registered optional_comment <= 1000' AS check_name,
       CASE WHEN EXISTS (
         SELECT 1 FROM pg_constraint c
         JOIN pg_class t ON t.oid = c.conrelid
         JOIN pg_namespace n ON n.oid = t.relnamespace
         WHERE n.nspname = 'public' AND t.relname = 'project_voice_responses'
           AND c.conname = 'project_voice_responses_optional_comment_len'
       ) THEN 'OK' ELSE 'FAIL' END AS status;

SELECT 'C3 guest answer_value <= 1000' AS check_name,
       CASE WHEN EXISTS (
         SELECT 1 FROM pg_constraint c
         JOIN pg_class t ON t.oid = c.conrelid
         JOIN pg_namespace n ON n.oid = t.relnamespace
         WHERE n.nspname = 'public' AND t.relname = 'project_guest_voice_responses'
           AND c.conname = 'project_guest_voice_responses_answer_value_len'
       ) THEN 'OK' ELSE 'FAIL' END AS status;

SELECT 'C4 guest optional_comment <= 1000' AS check_name,
       CASE WHEN EXISTS (
         SELECT 1 FROM pg_constraint c
         JOIN pg_class t ON t.oid = c.conrelid
         JOIN pg_namespace n ON n.oid = t.relnamespace
         WHERE n.nspname = 'public' AND t.relname = 'project_guest_voice_responses'
           AND c.conname = 'project_guest_voice_responses_optional_comment_len'
       ) THEN 'OK' ELSE 'FAIL' END AS status;

SELECT 'C5 no rows over 1000 after apply' AS check_name,
       (
         (SELECT count(*) FROM public.project_voice_responses WHERE char_length(answer_value) > 1000)
         + (SELECT count(*) FROM public.project_voice_responses
            WHERE optional_comment IS NOT NULL AND char_length(optional_comment) > 1000)
         + (SELECT count(*) FROM public.project_guest_voice_responses WHERE char_length(answer_value) > 1000)
         + (SELECT count(*) FROM public.project_guest_voice_responses
            WHERE optional_comment IS NOT NULL AND char_length(optional_comment) > 1000)
       )::bigint AS over_total,
       CASE WHEN (
         (SELECT count(*) FROM public.project_voice_responses WHERE char_length(answer_value) > 1000)
         + (SELECT count(*) FROM public.project_voice_responses
            WHERE optional_comment IS NOT NULL AND char_length(optional_comment) > 1000)
         + (SELECT count(*) FROM public.project_guest_voice_responses WHERE char_length(answer_value) > 1000)
         + (SELECT count(*) FROM public.project_guest_voice_responses
            WHERE optional_comment IS NOT NULL AND char_length(optional_comment) > 1000)
       ) = 0 THEN 'OK' ELSE 'FAIL' END AS status;

-- project_feedback 2000-char constraint unchanged (spot check constraint exists)
SELECT 'C6 project_feedback body fields constraint present' AS check_name,
       count(*)::int AS constraint_count
FROM pg_constraint c
JOIN pg_class t ON t.oid = c.conrelid
JOIN pg_namespace n ON n.oid = t.relnamespace
WHERE n.nspname = 'public' AND t.relname = 'project_feedback';

-- -----------------------------------------------------------------------------
-- D. Public FB engagement objects (070–071)
-- -----------------------------------------------------------------------------
SELECT 'D1 feedback_card_empathies' AS check_name,
       CASE WHEN to_regclass('public.feedback_card_empathies') IS NOT NULL THEN 'OK' ELSE 'FAIL' END AS status;

SELECT 'D2 feedback_card_replies' AS check_name,
       CASE WHEN to_regclass('public.feedback_card_replies') IS NOT NULL THEN 'OK' ELSE 'FAIL' END AS status;

SELECT 'D3 get_public_feedback_cards' AS check_name,
       CASE WHEN to_regprocedure(
         'public.get_public_feedback_cards(text,text,boolean,integer,integer)'
       ) IS NOT NULL THEN 'OK' ELSE 'FAIL' END AS status;

SELECT 'D4 toggle_feedback_card_empathy EXECUTE authenticated only' AS check_name,
       has_function_privilege('authenticated', 'public.toggle_feedback_card_empathy(text,text,text)', 'EXECUTE') AS auth_exec,
       has_function_privilege('anon', 'public.toggle_feedback_card_empathy(text,text,text)', 'EXECUTE') AS anon_exec;

SELECT 'D5 create_feedback_card_reply exists' AS check_name,
       CASE WHEN to_regprocedure('public.create_feedback_card_reply(text,text,text,text)') IS NOT NULL
         THEN 'OK' ELSE 'FAIL' END AS status;

SELECT 'D6 feedback_reply notification type in check' AS check_name,
       pg_get_constraintdef(c.oid) AS type_check_def
FROM pg_constraint c
JOIN pg_class t ON t.oid = c.conrelid
JOIN pg_namespace n ON n.oid = t.relnamespace
WHERE n.nspname = 'public' AND t.relname = 'user_notifications'
  AND c.conname = 'user_notifications_type_check';

-- -----------------------------------------------------------------------------
-- E. Empathy table — RPC-only (071): no client DML/SELECT grants
-- -----------------------------------------------------------------------------
SELECT grantee, privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public' AND table_name = 'feedback_card_empathies'
ORDER BY grantee, privilege_type;

SELECT count(*)::int AS direct_empathy_policies
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'feedback_card_empathies';

-- -----------------------------------------------------------------------------
-- F. Notifications (073–074)
-- -----------------------------------------------------------------------------
SELECT 'F1 authenticated SELECT user_notifications' AS check_name,
       CASE WHEN has_table_privilege('authenticated', 'public.user_notifications', 'SELECT')
         THEN 'OK' ELSE 'FAIL' END AS status;

SELECT 'F2 authenticated UPDATE read_at only' AS check_name,
       CASE WHEN has_column_privilege('authenticated', 'public.user_notifications', 'read_at', 'UPDATE')
         AND NOT has_column_privilege('authenticated', 'public.user_notifications', 'message', 'UPDATE')
         THEN 'OK' ELSE 'FAIL review column grants' END AS status;

SELECT 'F3 authenticated INSERT granted' AS check_name,
       CASE WHEN has_table_privilege('authenticated', 'public.user_notifications', 'INSERT')
         THEN 'OK' ELSE 'FAIL' END AS status;

SELECT 'F4 anon denied SELECT' AS check_name,
       CASE WHEN has_table_privilege('anon', 'public.user_notifications', 'SELECT')
         THEN 'FAIL anon has SELECT' ELSE 'OK' END AS status;

SELECT 'F5 developer_has_follower SECURITY DEFINER' AS check_name,
       p.prosecdef AS is_definer,
       p.proconfig AS config
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public' AND p.proname = 'developer_has_follower';

SELECT 'F6 developer_has_follower EXECUTE authenticated' AS check_name,
       has_function_privilege('authenticated', 'public.developer_has_follower(uuid)', 'EXECUTE') AS auth_exec,
       has_function_privilege('anon', 'public.developer_has_follower(uuid)', 'EXECUTE') AS anon_exec;

SELECT pol.polname, CASE pol.polcmd WHEN 'a' THEN 'INSERT' WHEN 'r' THEN 'SELECT' WHEN 'w' THEN 'UPDATE' END AS cmd,
       pg_get_expr(pol.polwithcheck, pol.polrelid) AS with_check
FROM pg_policy pol
JOIN pg_class cls ON cls.oid = pol.polrelid
JOIN pg_namespace nsp ON nsp.oid = cls.relnamespace
WHERE nsp.nspname = 'public' AND cls.relname = 'user_notifications'
ORDER BY pol.polname;

SELECT 'F7 followed_developer policy uses developer_has_follower' AS check_name,
       CASE WHEN EXISTS (
         SELECT 1 FROM pg_policy pol
         JOIN pg_class cls ON cls.oid = pol.polrelid
         JOIN pg_namespace nsp ON nsp.oid = cls.relnamespace
         WHERE nsp.nspname = 'public' AND cls.relname = 'user_notifications'
           AND pol.polname = 'Owners insert developer follower notifications'
           AND pg_get_expr(pol.polwithcheck, pol.polrelid) LIKE '%developer_has_follower%'
       ) THEN 'OK' ELSE 'FAIL' END AS status;

-- -----------------------------------------------------------------------------
-- G. Prerequisite GRANTs still present (not Staging sync — Production baseline)
-- -----------------------------------------------------------------------------
SELECT 'G1 project_watches authenticated SELECT' AS check_name,
       CASE WHEN has_table_privilege('authenticated', 'public.project_watches', 'SELECT')
         THEN 'OK' ELSE 'FAIL' END AS status;

SELECT 'G2 confirmation_requests authenticated SELECT' AS check_name,
       CASE WHEN has_table_privilege('authenticated', 'public.confirmation_requests', 'SELECT')
         THEN 'OK' ELSE 'FAIL' END AS status;

SELECT 'G3 developer_follows no broad owner SELECT policy added' AS check_name,
       count(*) FILTER (WHERE policyname ILIKE '%owner%read%follower%')::int AS suspicious_policies
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'developer_follows';
