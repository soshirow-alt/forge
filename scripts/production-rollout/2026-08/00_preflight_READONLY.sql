-- =============================================================================
-- Production rollout PREFLIGHT (READ-ONLY) — 2026-08 package (076–100)
-- Target: Production Supabase bpnisgzxuwdxelhnduuf
-- Run BEFORE any APPLY file. STOP if preflight_verdict = FAIL.
-- No DDL / DML. Safe to re-run.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- A. Project identity (human check — confirm Dashboard project is Production)
-- -----------------------------------------------------------------------------
SELECT
  current_database() AS database_name,
  current_user AS db_user,
  now() AS checked_at;

-- Expected Production ref (human): bpnisgzxuwdxelhnduuf
-- If you are on Staging vuqpwvjvgyxffmvpfrxo, STOP — wrong package target.

-- -----------------------------------------------------------------------------
-- B. Baseline through migration 075 (must already be present)
-- -----------------------------------------------------------------------------
SELECT 'B1 projects.age_rating (070)' AS check_name,
       CASE WHEN EXISTS (
         SELECT 1 FROM information_schema.columns
         WHERE table_schema = 'public' AND table_name = 'projects' AND column_name = 'age_rating'
       ) THEN 'OK' ELSE 'FAIL missing 070 baseline' END AS status;

SELECT 'B2 feedback_card_empathies (070)' AS check_name,
       CASE WHEN to_regclass('public.feedback_card_empathies') IS NOT NULL
         THEN 'OK' ELSE 'FAIL missing 070 baseline' END AS status;

SELECT 'B3 feedback_card_replies (070)' AS check_name,
       CASE WHEN to_regclass('public.feedback_card_replies') IS NOT NULL
         THEN 'OK' ELSE 'FAIL missing 070 baseline' END AS status;

SELECT 'B4 developer_has_follower (074)' AS check_name,
       CASE WHEN to_regprocedure('public.developer_has_follower(uuid)') IS NOT NULL
         THEN 'OK' ELSE 'FAIL missing 074 baseline' END AS status;

SELECT 'B5 user_notifications authenticated SELECT (073)' AS check_name,
       CASE WHEN has_table_privilege('authenticated', 'public.user_notifications', 'SELECT')
         THEN 'OK' ELSE 'FAIL missing 073 grant' END AS status;

SELECT 'B6 project_feedback_owner_reads / related (075 surface)' AS check_name,
       CASE WHEN to_regclass('public.project_feedback') IS NOT NULL
         THEN 'OK' ELSE 'FAIL missing project_feedback' END AS status;

-- -----------------------------------------------------------------------------
-- C. 076–100 objects must NOT already exist (fresh Production apply)
-- Partial apply → FAIL (resume manually after review; do not blindly re-run 01)
-- -----------------------------------------------------------------------------
SELECT 'C1 projects.category (076)' AS check_name,
       CASE WHEN EXISTS (
         SELECT 1 FROM information_schema.columns
         WHERE table_schema = 'public' AND table_name = 'projects' AND column_name = 'category'
       ) THEN 'FAIL already present (076+ applied?)' ELSE 'OK not present' END AS status;

SELECT 'C2 projects.stream_policy (076)' AS check_name,
       CASE WHEN EXISTS (
         SELECT 1 FROM information_schema.columns
         WHERE table_schema = 'public' AND table_name = 'projects' AND column_name = 'stream_policy'
       ) THEN 'FAIL already present' ELSE 'OK not present' END AS status;

SELECT 'C3 developer_profiles.activity_tags (076)' AS check_name,
       CASE WHEN EXISTS (
         SELECT 1 FROM information_schema.columns
         WHERE table_schema = 'public' AND table_name = 'developer_profiles'
           AND column_name = 'activity_tags'
       ) THEN 'FAIL already present' ELSE 'OK not present' END AS status;

SELECT 'C4 project_usage_relations (077)' AS check_name,
       CASE WHEN to_regclass('public.project_usage_relations') IS NOT NULL
         THEN 'FAIL already present' ELSE 'OK not present' END AS status;

SELECT 'C5 platform_announcements (078)' AS check_name,
       CASE WHEN to_regclass('public.platform_announcements') IS NOT NULL
         THEN 'FAIL already present' ELSE 'OK not present' END AS status;

SELECT 'C6 search_public_catalog (079)' AS check_name,
       CASE WHEN EXISTS (
         SELECT 1 FROM pg_proc p
         JOIN pg_namespace n ON n.oid = p.pronamespace
         WHERE n.nspname = 'public' AND p.proname = 'search_public_catalog'
       ) THEN 'FAIL already present' ELSE 'OK not present' END AS status;

SELECT 'C7 get_home_newest_projects (080/083)' AS check_name,
       CASE WHEN EXISTS (
         SELECT 1 FROM pg_proc p
         JOIN pg_namespace n ON n.oid = p.pronamespace
         WHERE n.nspname = 'public' AND p.proname = 'get_home_newest_projects'
       ) THEN 'FAIL already present' ELSE 'OK not present' END AS status;

SELECT 'C8 get_home_feedback_gathering_projects (083/085)' AS check_name,
       CASE WHEN EXISTS (
         SELECT 1 FROM pg_proc p
         JOIN pg_namespace n ON n.oid = p.pronamespace
         WHERE n.nspname = 'public' AND p.proname = 'get_home_feedback_gathering_projects'
       ) THEN 'FAIL already present' ELSE 'OK not present' END AS status;

SELECT 'C9 collab_consultations (087)' AS check_name,
       CASE WHEN to_regclass('public.collab_consultations') IS NOT NULL
         THEN 'FAIL already present' ELSE 'OK not present' END AS status;

SELECT 'C10 user_blocks (087)' AS check_name,
       CASE WHEN to_regclass('public.user_blocks') IS NOT NULL
         THEN 'FAIL already present' ELSE 'OK not present' END AS status;

SELECT 'C11 transactional_email_outbox (090)' AS check_name,
       CASE WHEN to_regclass('public.transactional_email_outbox') IS NOT NULL
         THEN 'FAIL already present' ELSE 'OK not present' END AS status;

SELECT 'C12 user_settings.notify_email (096)' AS check_name,
       CASE WHEN EXISTS (
         SELECT 1 FROM information_schema.columns
         WHERE table_schema = 'public' AND table_name = 'user_settings'
           AND column_name = 'notify_email'
       ) THEN 'FAIL already present' ELSE 'OK not present' END AS status;

SELECT 'C13 platform_announcements.starts_at (094)' AS check_name,
       CASE WHEN EXISTS (
         SELECT 1 FROM information_schema.columns
         WHERE table_schema = 'public' AND table_name = 'platform_announcements'
           AND column_name = 'starts_at'
       ) THEN 'FAIL already present' ELSE 'OK not present' END AS status;

SELECT 'C14 create_collab_consultation (087+)' AS check_name,
       CASE WHEN EXISTS (
         SELECT 1 FROM pg_proc p
         JOIN pg_namespace n ON n.oid = p.pronamespace
         WHERE n.nspname = 'public' AND p.proname = 'create_collab_consultation'
       ) THEN 'FAIL already present' ELSE 'OK not present' END AS status;

SELECT 'C15 collab_consultations_one_open_pair_uidx (099)' AS check_name,
       CASE WHEN EXISTS (
         SELECT 1 FROM pg_class c
         JOIN pg_namespace n ON n.oid = c.relnamespace
         WHERE n.nspname = 'public' AND c.relname = 'collab_consultations_one_open_pair_uidx'
       ) THEN 'FAIL already present' ELSE 'OK not present' END AS status;

-- -----------------------------------------------------------------------------
-- D. Baseline row counts (record; compare in postflight — expect same for core tables)
-- -----------------------------------------------------------------------------
SELECT 'D projects' AS label, count(*)::bigint AS row_count FROM public.projects
UNION ALL
SELECT 'D developer_profiles', count(*)::bigint FROM public.developer_profiles
UNION ALL
SELECT 'D project_feedback', count(*)::bigint FROM public.project_feedback
UNION ALL
SELECT 'D project_voice_responses', count(*)::bigint FROM public.project_voice_responses
UNION ALL
SELECT 'D user_notifications', count(*)::bigint FROM public.user_notifications
UNION ALL
SELECT 'D user_settings', count(*)::bigint FROM public.user_settings
ORDER BY label;

-- -----------------------------------------------------------------------------
-- E. schema_migrations snapshot (informational — SQL Editor apply does not auto-write)
-- -----------------------------------------------------------------------------
SELECT version, name, inserted_at
FROM supabase_migrations.schema_migrations
WHERE version ~ '^(07[0-9]|08[0-9]|09[0-9]|100)'
ORDER BY version;

-- Expect: versions through 075 may or may not be listed depending on how Production
-- was historically applied. Absence of 076–100 here is NORMAL before this package.
-- Do NOT treat missing 076–100 rows as "need to apply" alone — use object checks above.

-- -----------------------------------------------------------------------------
-- F. STOP verdict (any FAIL in C* or missing B* → do not apply)
-- -----------------------------------------------------------------------------
WITH baseline AS (
  SELECT
    EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'projects' AND column_name = 'age_rating'
    ) AS has_age_rating,
    to_regclass('public.feedback_card_empathies') IS NOT NULL AS has_empathies,
    to_regprocedure('public.developer_has_follower(uuid)') IS NOT NULL AS has_follower,
    has_table_privilege('authenticated', 'public.user_notifications', 'SELECT') AS has_notif_select
),
already AS (
  SELECT
    EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'projects' AND column_name = 'category'
    ) AS has_category,
    to_regclass('public.project_usage_relations') IS NOT NULL AS has_usage,
    to_regclass('public.platform_announcements') IS NOT NULL AS has_announcements,
    to_regclass('public.collab_consultations') IS NOT NULL AS has_collab,
    to_regclass('public.transactional_email_outbox') IS NOT NULL AS has_outbox,
    EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'user_settings'
        AND column_name = 'notify_email'
    ) AS has_notify_email
)
SELECT
  CASE
    WHEN NOT (SELECT has_age_rating AND has_empathies AND has_follower AND has_notif_select FROM baseline)
      THEN 'FAIL baseline 070–074/075 incomplete — do not apply 076–100'
    WHEN (SELECT has_category OR has_usage OR has_announcements OR has_collab OR has_outbox OR has_notify_email FROM already)
      THEN 'FAIL 076–100 objects already partially/fully present — stop and review (do not re-run 01 blindly)'
    ELSE 'PASS proceed to 01_core_schema_and_category.sql'
  END AS preflight_verdict;
