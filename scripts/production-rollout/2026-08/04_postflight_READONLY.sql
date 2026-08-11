-- =============================================================================
-- Production rollout POSTFLIGHT (READ-ONLY) — 2026-08 package (076–101)
-- Target: Production Supabase bpnisgzxuwdxelhnduuf
-- Run AFTER 01 + 02 + 03 APPLY files all succeeded.
-- Compare core row counts to 00_preflight baseline (must match for listed tables).
-- No DDL / DML. Safe to re-run.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- A. Row counts (must match preflight for these tables)
-- -----------------------------------------------------------------------------
SELECT 'A projects' AS label, count(*)::bigint AS row_count FROM public.projects
UNION ALL
SELECT 'A developer_profiles', count(*)::bigint FROM public.developer_profiles
UNION ALL
SELECT 'A project_feedback', count(*)::bigint FROM public.project_feedback
UNION ALL
SELECT 'A project_voice_responses', count(*)::bigint FROM public.project_voice_responses
UNION ALL
SELECT 'A user_notifications', count(*)::bigint FROM public.user_notifications
UNION ALL
SELECT 'A user_settings', count(*)::bigint FROM public.user_settings
ORDER BY label;

-- New tables may be empty on Production (expected; do not seed from Staging).
SELECT 'A2 project_usage_relations' AS label, count(*)::bigint AS row_count
FROM public.project_usage_relations
UNION ALL
SELECT 'A2 platform_announcements', count(*)::bigint FROM public.platform_announcements
UNION ALL
SELECT 'A2 collab_consultations', count(*)::bigint FROM public.collab_consultations
UNION ALL
SELECT 'A2 transactional_email_outbox', count(*)::bigint FROM public.transactional_email_outbox
ORDER BY label;

-- -----------------------------------------------------------------------------
-- B. Core schema / category (076–085)
-- -----------------------------------------------------------------------------
SELECT 'B1 projects.category' AS check_name,
       CASE WHEN EXISTS (
         SELECT 1 FROM information_schema.columns
         WHERE table_schema = 'public' AND table_name = 'projects' AND column_name = 'category'
       ) THEN 'OK' ELSE 'FAIL' END AS status;

SELECT 'B2 projects.category all non-null + check' AS check_name,
       CASE
         WHEN count(*) FILTER (WHERE category IS NULL) > 0 THEN 'FAIL null category'
         WHEN count(*) FILTER (
           WHERE category NOT IN ('game', 'audio', 'asset', 'dev-tool', 'service-app')
         ) > 0 THEN 'FAIL invalid category'
         ELSE 'OK'
       END AS status,
       count(*)::bigint AS project_count
FROM public.projects;

SELECT 'B3 projects.stream_policy / quick_try / usable_for_creation' AS check_name,
       CASE WHEN EXISTS (
         SELECT 1 FROM information_schema.columns
         WHERE table_schema = 'public' AND table_name = 'projects' AND column_name = 'stream_policy'
       ) AND EXISTS (
         SELECT 1 FROM information_schema.columns
         WHERE table_schema = 'public' AND table_name = 'projects' AND column_name = 'quick_try'
       ) AND EXISTS (
         SELECT 1 FROM information_schema.columns
         WHERE table_schema = 'public' AND table_name = 'projects' AND column_name = 'usable_for_creation'
       ) THEN 'OK' ELSE 'FAIL' END AS status;

SELECT 'B4 developer_profiles.activity_tags' AS check_name,
       CASE WHEN EXISTS (
         SELECT 1 FROM information_schema.columns
         WHERE table_schema = 'public' AND table_name = 'developer_profiles'
           AND column_name = 'activity_tags'
       ) THEN 'OK' ELSE 'FAIL' END AS status;

SELECT 'B5 project_usage_relations + RPC' AS check_name,
       CASE WHEN to_regclass('public.project_usage_relations') IS NOT NULL
         AND to_regprocedure('public.get_public_project_usage_relations(uuid,integer)') IS NOT NULL
         THEN 'OK' ELSE 'FAIL' END AS status;

SELECT 'B6 platform_announcements table' AS check_name,
       CASE WHEN to_regclass('public.platform_announcements') IS NOT NULL
         THEN 'OK' ELSE 'FAIL' END AS status;

SELECT 'B7 search_public_catalog' AS check_name,
       CASE WHEN to_regprocedure('public.search_public_catalog(text,integer)') IS NOT NULL
         THEN 'OK' ELSE 'FAIL' END AS status;

SELECT 'B8 home shelves RPCs' AS check_name,
       CASE
         WHEN EXISTS (
           SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
           WHERE n.nspname = 'public' AND p.proname = 'get_home_feedback_gathering_projects'
         )
         AND EXISTS (
           SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
           WHERE n.nspname = 'public' AND p.proname = 'get_home_meaningful_updates'
         )
         AND EXISTS (
           SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
           WHERE n.nspname = 'public' AND p.proname = 'get_home_newest_projects'
         )
         THEN 'OK' ELSE 'FAIL' END AS status;

SELECT 'B9 get_public_projects_by_category (085 final arity)' AS check_name,
       CASE WHEN to_regprocedure(
         'public.get_public_projects_by_category(text,text,boolean,boolean,boolean,text,text,integer,integer,text,text[],text[],text[],text[],text[],text[],text[],text[],text[],text[],text[],text[],text[],text[],text[],text[])'
       ) IS NOT NULL THEN 'OK' ELSE 'FAIL' END AS status;

SELECT 'B10 get_public_feedback_cards (081 guest re-enable)' AS check_name,
       CASE WHEN to_regprocedure(
         'public.get_public_feedback_cards(text,text,boolean,integer,integer)'
       ) IS NOT NULL THEN 'OK' ELSE 'FAIL' END AS status;

-- -----------------------------------------------------------------------------
-- C. Collaboration / messaging / email (086–101)
-- -----------------------------------------------------------------------------
SELECT 'C1 collab_consultations' AS check_name,
       CASE WHEN to_regclass('public.collab_consultations') IS NOT NULL
         THEN 'OK' ELSE 'FAIL' END AS status;

SELECT 'C2 collab_consultation_messages' AS check_name,
       CASE WHEN to_regclass('public.collab_consultation_messages') IS NOT NULL
         THEN 'OK' ELSE 'FAIL' END AS status;

SELECT 'C3 collab_consultation_reads' AS check_name,
       CASE WHEN to_regclass('public.collab_consultation_reads') IS NOT NULL
         THEN 'OK' ELSE 'FAIL' END AS status;

SELECT 'C4 user_blocks' AS check_name,
       CASE WHEN to_regclass('public.user_blocks') IS NOT NULL
         THEN 'OK' ELSE 'FAIL' END AS status;

SELECT 'C5 create_collab_consultation' AS check_name,
       CASE WHEN to_regprocedure(
         'public.create_collab_consultation(uuid,text,text,uuid,uuid)'
       ) IS NOT NULL THEN 'OK' ELSE 'FAIL' END AS status;

SELECT 'C6 list_my_collab_consultations' AS check_name,
       CASE WHEN to_regprocedure('public.list_my_collab_consultations()') IS NOT NULL
         THEN 'OK' ELSE 'FAIL' END AS status;

SELECT 'C7 send_collab_consultation_message' AS check_name,
       CASE WHEN to_regprocedure('public.send_collab_consultation_message(uuid,text)') IS NOT NULL
         THEN 'OK' ELSE 'FAIL' END AS status;

SELECT 'C8 mark_collab_consultation_read' AS check_name,
       CASE WHEN to_regprocedure('public.mark_collab_consultation_read(uuid)') IS NOT NULL
         THEN 'OK' ELSE 'FAIL' END AS status;

SELECT 'C9 pair unique index collab_consultations_one_open_pair_uidx' AS check_name,
       CASE WHEN EXISTS (
         SELECT 1 FROM pg_class c
         JOIN pg_namespace n ON n.oid = c.relnamespace
         WHERE n.nspname = 'public' AND c.relname = 'collab_consultations_one_open_pair_uidx'
       ) THEN 'OK' ELSE 'FAIL' END AS status;

SELECT 'C10 mark_read FOR UPDATE (101)' AS check_name,
       CASE WHEN pg_get_functiondef('public.mark_collab_consultation_read(uuid)'::regprocedure)
              ILIKE '%FOR UPDATE%'
         THEN 'OK' ELSE 'FAIL' END AS status;

SELECT 'C11 open pairs uniqueness (0 duplicate open pairs)' AS check_name,
       CASE WHEN (
         SELECT count(*) FROM (
           SELECT 1
           FROM public.collab_consultations
           WHERE status = 'open'
           GROUP BY LEAST(initiator_id, counterpart_id), GREATEST(initiator_id, counterpart_id)
           HAVING count(*) > 1
         ) d
       ) = 0 THEN 'OK' ELSE 'FAIL' END AS status;

SELECT 'C12 transactional_email_outbox' AS check_name,
       CASE WHEN to_regclass('public.transactional_email_outbox') IS NOT NULL
         THEN 'OK' ELSE 'FAIL' END AS status;

SELECT 'C13 enqueue_transactional_email' AS check_name,
       CASE WHEN EXISTS (
         SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
         WHERE n.nspname = 'public' AND p.proname = 'enqueue_transactional_email'
       ) THEN 'OK' ELSE 'FAIL' END AS status;

SELECT 'C14 user_settings.notify_email' AS check_name,
       CASE WHEN EXISTS (
         SELECT 1 FROM information_schema.columns
         WHERE table_schema = 'public' AND table_name = 'user_settings'
           AND column_name = 'notify_email'
       ) THEN 'OK' ELSE 'FAIL' END AS status;

SELECT 'C14 transactional_email_pref_allows' AS check_name,
       CASE WHEN to_regprocedure('public.transactional_email_pref_allows(uuid,text)') IS NOT NULL
         THEN 'OK' ELSE 'FAIL' END AS status;

SELECT 'C15 platform_announcements publish window cols (094)' AS check_name,
       CASE WHEN EXISTS (
         SELECT 1 FROM information_schema.columns
         WHERE table_schema = 'public' AND table_name = 'platform_announcements'
           AND column_name = 'starts_at'
       ) AND EXISTS (
         SELECT 1 FROM information_schema.columns
         WHERE table_schema = 'public' AND table_name = 'platform_announcements'
           AND column_name = 'ends_at'
       ) AND EXISTS (
         SELECT 1 FROM information_schema.columns
         WHERE table_schema = 'public' AND table_name = 'platform_announcements'
           AND column_name = 'cta_label'
       ) AND EXISTS (
         SELECT 1 FROM information_schema.columns
         WHERE table_schema = 'public' AND table_name = 'platform_announcements'
           AND column_name = 'cta_url'
       ) THEN 'OK' ELSE 'FAIL' END AS status;

SELECT 'C16 get_public_platform_announcements (094 window filter)' AS check_name,
       CASE WHEN to_regprocedure('public.get_public_platform_announcements(integer,integer)') IS NOT NULL
         THEN 'OK' ELSE 'FAIL' END AS status;

SELECT 'C17 get_public_platform_announcement_archive' AS check_name,
       CASE WHEN to_regprocedure('public.get_public_platform_announcement_archive(integer,integer)') IS NOT NULL
         THEN 'OK' ELSE 'FAIL' END AS status;

SELECT 'C18 reciprocity helper consider_feedback_reciprocity' AS check_name,
       CASE WHEN to_regprocedure('public.consider_feedback_reciprocity(uuid,uuid)') IS NOT NULL
         THEN 'OK' ELSE 'FAIL' END AS status;

SELECT 'C19 notification seen-ack RPCs (089)' AS check_name,
       CASE WHEN to_regprocedure('public.mark_notifications_seen()') IS NOT NULL
         AND to_regprocedure('public.acknowledge_notification(uuid)') IS NOT NULL
         THEN 'OK' ELSE 'FAIL' END AS status;

SELECT 'C20 usage relation request RPCs (088)' AS check_name,
       CASE WHEN to_regprocedure('public.request_project_usage_relation(uuid,uuid,text)') IS NOT NULL
         AND to_regprocedure('public.decide_project_usage_relation(uuid,text)') IS NOT NULL
         THEN 'OK' ELSE 'FAIL' END AS status;

-- -----------------------------------------------------------------------------
-- D. Grants smoke (spot checks)
-- -----------------------------------------------------------------------------
SELECT 'D1 create_collab_consultation EXECUTE authenticated' AS check_name,
       has_function_privilege(
         'authenticated',
         'public.create_collab_consultation(uuid,text,text,uuid,uuid)',
         'EXECUTE'
       ) AS auth_exec,
       has_function_privilege(
         'anon',
         'public.create_collab_consultation(uuid,text,text,uuid,uuid)',
         'EXECUTE'
       ) AS anon_exec;

SELECT 'D2 list_my_collab_consultations EXECUTE authenticated' AS check_name,
       has_function_privilege('authenticated', 'public.list_my_collab_consultations()', 'EXECUTE') AS auth_exec,
       has_function_privilege('anon', 'public.list_my_collab_consultations()', 'EXECUTE') AS anon_exec;

SELECT 'D3 search_public_catalog EXECUTE anon+authenticated' AS check_name,
       has_function_privilege('anon', 'public.search_public_catalog(text,integer)', 'EXECUTE') AS anon_exec,
       has_function_privilege('authenticated', 'public.search_public_catalog(text,integer)', 'EXECUTE') AS auth_exec;

-- -----------------------------------------------------------------------------
-- E. migration history presence (informational — never FROM the history table)
-- Production may have no supabase_migrations.schema_migrations (SQL Editor apply
-- does not create/write it). TABLE_ABSENT is expected and is NOT a postflight FAIL.
-- Verdict uses B/C/F object presence + pair invariant only.
-- History repair is a separate OWNER ACTION after postflight PASS — see 06_*.
-- -----------------------------------------------------------------------------
SELECT
  CASE
    WHEN to_regclass('supabase_migrations.schema_migrations') IS NULL
      THEN 'TABLE_ABSENT'
    ELSE 'TABLE_PRESENT'
  END AS migration_history_status,
  (to_regnamespace('supabase_migrations') IS NOT NULL) AS history_schema_exists,
  'informational only — do not FAIL postflight on TABLE_ABSENT — use B/C/F objects'
    AS history_note;

-- -----------------------------------------------------------------------------
-- F. Postflight verdict
-- -----------------------------------------------------------------------------
WITH checks AS (
  SELECT
    EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'projects' AND column_name = 'category'
    ) AS has_category,
    to_regclass('public.collab_consultations') IS NOT NULL AS has_collab,
    EXISTS (
      SELECT 1 FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' AND c.relname = 'collab_consultations_one_open_pair_uidx'
    ) AS has_pair_uidx,
    to_regclass('public.transactional_email_outbox') IS NOT NULL AS has_outbox,
    EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'user_settings'
        AND column_name = 'notify_email'
    ) AS has_notify_email,
    to_regprocedure('public.create_collab_consultation(uuid,text,text,uuid,uuid)') IS NOT NULL AS has_create,
    to_regprocedure('public.list_my_collab_consultations()') IS NOT NULL AS has_list,
    EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'platform_announcements'
        AND column_name = 'starts_at'
    ) AS has_starts_at,
    to_regprocedure(
      'public.get_public_projects_by_category(text,text,boolean,boolean,boolean,text,text,integer,integer,text,text[],text[],text[],text[],text[],text[],text[],text[],text[],text[],text[],text[],text[],text[],text[],text[])'
    ) IS NOT NULL AS has_catalog_rpc,
    (
      SELECT count(*) FROM (
        SELECT 1
        FROM public.collab_consultations
        WHERE status = 'open'
        GROUP BY LEAST(initiator_id, counterpart_id), GREATEST(initiator_id, counterpart_id)
        HAVING count(*) > 1
      ) d
    ) = 0 AS pair_ok
)
SELECT
  CASE
    WHEN NOT (
      has_category AND has_collab AND has_pair_uidx AND has_outbox AND has_notify_email
      AND has_create AND has_list AND has_starts_at AND has_catalog_rpc AND pair_ok
    ) THEN 'FAIL review individual check_name rows above'
    ELSE 'PASS schema objects present — proceed to history repair NOTES (optional) then Owner GO for announcement'
  END AS postflight_verdict
FROM checks;
