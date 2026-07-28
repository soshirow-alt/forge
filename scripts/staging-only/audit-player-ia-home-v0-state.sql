-- READ-ONLY audit — Player IA home v0 / beautify apply state (Staging)
-- Target ref: vuqpwvjvgyxffmvpfrxo
-- DO NOT run write statements. DO NOT run on Production (bpnisgzxuwdxelhnduuf).
--
-- Purpose: decide whether beautify / 083 effects are present from REAL row state +
-- transaction structure notes (do not infer from errors alone).
--
-- Transaction note for failed beautify run:
--   Source file used BEGIN … COMMIT around projects → announcements →
--   project_devlogs → project_release_events → thumbnails.
--   Failure was on project_devlogs UPDATE (immutable body trigger).
--   IF the Dashboard ran the file as ONE transaction, all prior UPDATEs rolled back.
--   IF the client auto-committed per statement (or ran sections separately),
--   projects / announcements may have been committed before the failure.
--   Use the SELECTs below; do not assume either case.

-- ---------------------------------------------------------------------------
-- 0. Environment markers (Staging smoke / hero)
-- ---------------------------------------------------------------------------
SELECT
  'env_markers' AS section,
  EXISTS (
    SELECT 1 FROM public.projects
    WHERE id = '41ff5a96-105c-42a2-87b4-787bcfeacb45'::uuid
      AND visibility = 'public'
  ) AS smoke_a_public_present,
  EXISTS (
    SELECT 1 FROM public.projects
    WHERE id = 'dddddddd-dddd-4ddd-8ddd-000000000203'::uuid
  ) AS hero_carousel_present;

-- ---------------------------------------------------------------------------
-- 1. migration 083 RPC presence / OUT shape (read-only)
-- ---------------------------------------------------------------------------
SELECT
  'rpc_083' AS section,
  p.proname,
  pg_get_function_identity_arguments(p.oid) AS args,
  pg_get_function_result(p.oid) AS result
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname IN (
    'get_home_feedback_gathering_projects',
    'get_home_meaningful_updates',
    'get_home_newest_projects',
    'get_home_review_highlights'
  )
ORDER BY p.proname, 2;

-- ---------------------------------------------------------------------------
-- 2. Seed project inventory (expect 40 / 8 per category)
-- ---------------------------------------------------------------------------
SELECT
  'seed_project_counts' AS section,
  count(*) AS seed_uuid_count,
  count(*) FILTER (WHERE 'forge-ia-seed-v1' = ANY (coalesce(tags, '{}'::text[]))) AS tagged_count,
  count(*) FILTER (WHERE title LIKE '[IA Seed]%') AS title_still_prefixed,
  count(*) FILTER (WHERE title NOT LIKE '[IA Seed]%') AS title_unprefixed,
  count(*) FILTER (
    WHERE thumbnail_url LIKE '/images/staging-only/player-ia/%'
  ) AS staging_only_thumb_count,
  count(*) FILTER (
    WHERE id IN (
      'eeeeeeee-eeee-4eee-8eee-000000000004'::uuid,
      'eeeeeeee-eeee-4eee-8eee-000000000021'::uuid
    )
    AND thumbnail_url IS NULL
  ) AS no_image_edge_null_count,
  count(*) FILTER (
    WHERE id IN (
      'eeeeeeee-eeee-4eee-8eee-000000000004'::uuid,
      'eeeeeeee-eeee-4eee-8eee-000000000021'::uuid
    )
    AND thumbnail_url IS NOT NULL
  ) AS no_image_edge_unexpected_thumb
FROM public.projects
WHERE id::text LIKE 'eeeeeeee-eeee-4eee-8eee-%';

SELECT
  'seed_category_counts' AS section,
  coalesce(category, 'game') AS category,
  count(*) AS n
FROM public.projects
WHERE id::text LIKE 'eeeeeeee-eeee-4eee-8eee-%'
GROUP BY 1
ORDER BY 1;

-- ---------------------------------------------------------------------------
-- 3. Sample seed titles + thumbnails (detect partial beautify)
-- ---------------------------------------------------------------------------
SELECT
  'seed_title_thumb_sample' AS section,
  id,
  title,
  left(coalesce(description, ''), 80) AS description_prefix,
  thumbnail_url,
  CASE
    WHEN title LIKE '[IA Seed]%' THEN 'prefixed'
    ELSE 'clean'
  END AS title_state,
  CASE
    WHEN thumbnail_url LIKE '/images/staging-only/player-ia/%' THEN 'staging_local'
    WHEN thumbnail_url IS NULL THEN 'null'
    ELSE 'other'
  END AS thumb_state
FROM public.projects
WHERE id::text LIKE 'eeeeeeee-eeee-4eee-8eee-%'
ORDER BY id
LIMIT 40;

-- ---------------------------------------------------------------------------
-- 4. Announcements (seed UUIDs)
-- ---------------------------------------------------------------------------
SELECT
  'seed_announcements' AS section,
  count(*) AS seed_announcement_rows,
  count(*) FILTER (WHERE status = 'published') AS published_count,
  count(*) FILTER (WHERE status = 'draft') AS draft_count,
  count(*) FILTER (WHERE title LIKE '[IA Seed]%') AS title_still_prefixed,
  count(*) FILTER (WHERE body LIKE '[IA Seed]%') AS body_still_prefixed
FROM public.platform_announcements
WHERE id::text LIKE 'aaaaaaaa-aaaa-4aaa-8aaa-%';

SELECT
  'seed_announcement_rows' AS section,
  id,
  slug,
  status,
  title,
  left(body, 100) AS body_prefix
FROM public.platform_announcements
WHERE id::text LIKE 'aaaaaaaa-aaaa-4aaa-8aaa-%'
ORDER BY published_at DESC NULLS LAST, id;

-- ---------------------------------------------------------------------------
-- 5. Seed devlogs — were titles/content stripped? (immutable body)
-- ---------------------------------------------------------------------------
SELECT
  'seed_devlogs' AS section,
  count(*) AS seed_devlog_rows,
  count(*) FILTER (WHERE title LIKE '[IA Seed]%') AS title_still_prefixed,
  count(*) FILTER (WHERE content LIKE '[IA Seed]%') AS content_still_prefixed,
  count(*) FILTER (WHERE published_version IS NOT NULL) AS published_version_set
FROM public.project_devlogs
WHERE id::text LIKE '66666666-6666-4666-8666-%';

SELECT
  'seed_devlog_sample' AS section,
  id,
  project_id,
  title,
  left(content, 80) AS content_prefix,
  published_version,
  is_initial_publish
FROM public.project_devlogs
WHERE id::text LIKE '66666666-6666-4666-8666-%'
ORDER BY id
LIMIT 20;

-- ---------------------------------------------------------------------------
-- 6. Seed release event notes
-- ---------------------------------------------------------------------------
SELECT
  'seed_release_notes' AS section,
  count(*) AS seed_release_rows,
  count(*) FILTER (WHERE coalesce(note, '') LIKE '[IA Seed]%') AS note_still_prefixed
FROM public.project_release_events
WHERE id::text LIKE '55555555-5555-4555-8555-%';

-- ---------------------------------------------------------------------------
-- 7. Usage relations / FB inventory (expect 12 usage; FB counts from seed)
-- ---------------------------------------------------------------------------
SELECT
  'usage_relations' AS section,
  count(*) AS seed_usage_rows
FROM public.project_usage_relations
WHERE id::text LIKE 'ffffffff-ffff-4fff-8fff-%';

SELECT
  'immutable_trigger' AS section,
  t.tgname AS trigger_name,
  p.proname AS function_name,
  pg_get_triggerdef(t.oid) AS trigger_def
FROM pg_trigger t
JOIN pg_class c ON c.oid = t.tgrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
JOIN pg_proc p ON p.oid = t.tgfoid
WHERE n.nspname = 'public'
  AND c.relname = 'project_devlogs'
  AND NOT t.tgisinternal
  AND t.tgname = 'project_devlogs_immutable_body';

-- ---------------------------------------------------------------------------
-- 8. Interpretation helper (read-only; human decides)
-- ---------------------------------------------------------------------------
-- beautify_projects_applied_likely:
--   title_unprefixed high AND/OR staging_only_thumb_count > 0
-- beautify_announcements_applied_likely:
--   seed announcement title_still_prefixed low vs expected 8
-- beautify_devlogs_applied:
--   should be FALSE if content_still_prefixed remains high (trigger blocked)
-- full_transaction_rollback_likely:
--   titles still prefixed AND thumbs not staging-local AND announcements still prefixed
--   AND devlogs still prefixed
-- partial_apply_possible:
--   projects/announcements cleaned but failure after those statements
--   (only if client did not honor single transaction)
SELECT
  'interpretation_inputs' AS section,
  (SELECT count(*) FROM public.projects
     WHERE id::text LIKE 'eeeeeeee-eeee-4eee-8eee-%'
       AND title LIKE '[IA Seed]%') AS projects_title_prefixed,
  (SELECT count(*) FROM public.projects
     WHERE id::text LIKE 'eeeeeeee-eeee-4eee-8eee-%'
       AND thumbnail_url LIKE '/images/staging-only/player-ia/%') AS projects_staging_thumbs,
  (SELECT count(*) FROM public.platform_announcements
     WHERE id::text LIKE 'aaaaaaaa-aaaa-4aaa-8aaa-%'
       AND title LIKE '[IA Seed]%') AS announcements_title_prefixed,
  (SELECT count(*) FROM public.project_devlogs
     WHERE id::text LIKE '66666666-6666-4666-8666-%'
       AND content LIKE '[IA Seed]%') AS devlogs_content_prefixed,
  (SELECT count(*) FROM public.project_release_events
     WHERE id::text LIKE '55555555-5555-4555-8555-%'
       AND coalesce(note, '') LIKE '[IA Seed]%') AS release_notes_prefixed,
  to_regprocedure('public.get_home_feedback_gathering_projects(integer)') IS NOT NULL
    AS rpc_feedback_gathering_exists,
  to_regprocedure('public.get_home_meaningful_updates(integer)') IS NOT NULL
    AS rpc_meaningful_updates_exists;
