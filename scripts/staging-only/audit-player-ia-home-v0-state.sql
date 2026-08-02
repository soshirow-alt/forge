-- READ-ONLY audit — Player IA home v0 / beautify apply state (Staging)
-- Target ref: vuqpwvjvgyxffmvpfrxo
-- DO NOT run write statements. DO NOT run on Production (bpnisgzxuwdxelhnduuf).
--
-- Purpose: compare expected vs actual inventory / display state after 083 + beautify.
-- PASS/FAIL columns are for human reading in SQL Editor (no writes).
--
-- Thumbnail rules (real schema 035 + app lib/project-thumbnails.ts):
--   image: thumbnail_url = thumbnail_urls[1], paths under /images/staging-only/player-ia/
--   no-image (…0004 / …0021): thumbnail_url IS NULL AND thumbnail_urls = '{}'
--   Never require thumbnail_urls IS NULL (column is NOT NULL DEFAULT '{}').

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
  ) AS hero_carousel_present,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM public.projects
      WHERE id = '41ff5a96-105c-42a2-87b4-787bcfeacb45'::uuid
        AND visibility = 'public'
    )
    AND EXISTS (
      SELECT 1 FROM public.projects
      WHERE id = 'dddddddd-dddd-4ddd-8ddd-000000000203'::uuid
    )
    THEN 'PASS'
    ELSE 'FAIL'
  END AS verdict;

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
ORDER BY p.proname, pg_get_function_identity_arguments(p.oid);

-- ---------------------------------------------------------------------------
-- 1b. RPC presence / OUT shape summary
-- GATE_ASSERT:rpc_083_presence
-- ---------------------------------------------------------------------------
SELECT
  'rpc_083_presence' AS section,
  to_regprocedure('public.get_home_feedback_gathering_projects(integer)') IS NOT NULL
    AS feedback_gathering,
  to_regprocedure('public.get_home_meaningful_updates(integer)') IS NOT NULL
    AS meaningful_updates,
  to_regprocedure('public.get_home_newest_projects(integer, text)') IS NOT NULL
    AS newest_projects,
  to_regprocedure('public.get_home_review_highlights(integer)') IS NOT NULL
    AS review_highlights,
  (
    SELECT pg_get_function_result(p.oid)
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'get_home_feedback_gathering_projects'
    LIMIT 1
  ) AS feedback_gathering_result,
  (
    SELECT pg_get_function_result(p.oid)
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'get_home_meaningful_updates'
    LIMIT 1
  ) AS meaningful_updates_result,
  (
    SELECT pg_get_function_result(p.oid)
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'get_home_newest_projects'
    LIMIT 1
  ) AS newest_projects_result,
  CASE
    WHEN to_regprocedure('public.get_home_feedback_gathering_projects(integer)') IS NOT NULL
     AND to_regprocedure('public.get_home_meaningful_updates(integer)') IS NOT NULL
     AND to_regprocedure('public.get_home_newest_projects(integer, text)') IS NOT NULL
     AND to_regprocedure('public.get_home_review_highlights(integer)') IS NOT NULL
     AND EXISTS (
       SELECT 1
       FROM pg_proc p
       JOIN pg_namespace n ON n.oid = p.pronamespace
       WHERE n.nspname = 'public'
         AND p.proname = 'get_home_feedback_gathering_projects'
         AND pg_get_function_result(p.oid) ILIKE '%empathy_count%'
         AND pg_get_function_result(p.oid) ILIKE '%window_days%'
     )
     AND EXISTS (
       SELECT 1
       FROM pg_proc p
       JOIN pg_namespace n ON n.oid = p.pronamespace
       WHERE n.nspname = 'public'
         AND p.proname = 'get_home_meaningful_updates'
         AND pg_get_function_result(p.oid) ILIKE '%update_label%'
         AND pg_get_function_result(p.oid) ILIKE '%update_summary%'
     )
     AND EXISTS (
       SELECT 1
       FROM pg_proc p
       JOIN pg_namespace n ON n.oid = p.pronamespace
       WHERE n.nspname = 'public'
         AND p.proname = 'get_home_newest_projects'
         AND pg_get_function_result(p.oid) ILIKE '%description%'
     )
    THEN 'PASS'
    ELSE 'FAIL'
  END AS verdict;

-- ---------------------------------------------------------------------------
-- 2. Seed project inventory + thumbnail health
-- GATE_ASSERT:seed_project_inventory
-- ---------------------------------------------------------------------------
SELECT
  'seed_project_inventory' AS section,
  40 AS expected_seed_uuid_count,
  count(*) AS actual_seed_uuid_count,
  40 AS expected_tagged_count,
  count(*) FILTER (WHERE 'forge-ia-seed-v1' = ANY (coalesce(tags, '{}'::text[])))
    AS actual_tagged_count,
  0 AS expected_title_still_prefixed_after_beautify,
  count(*) FILTER (WHERE title LIKE '[IA Seed]%') AS actual_title_still_prefixed,
  0 AS expected_description_prefixed_after_beautify,
  count(*) FILTER (WHERE coalesce(description, '') LIKE '[IA Seed]%') AS actual_description_prefixed,
  0 AS expected_overview_prefixed_after_beautify,
  count(*) FILTER (WHERE coalesce(overview_introduction, '') LIKE '[IA Seed]%') AS actual_overview_prefixed,
  38 AS expected_staging_only_thumbs,
  count(*) FILTER (
    WHERE thumbnail_url LIKE '/images/staging-only/player-ia/%'
      AND thumbnail_urls = ARRAY[thumbnail_url]::text[]
  ) AS actual_aligned_staging_thumbs,
  2 AS expected_no_image_edges,
  count(*) FILTER (
    WHERE id IN (
      'eeeeeeee-eeee-4eee-8eee-000000000004'::uuid,
      'eeeeeeee-eeee-4eee-8eee-000000000021'::uuid
    )
    AND thumbnail_url IS NULL
    AND thumbnail_urls = '{}'::text[]
  ) AS actual_no_image_edges,
  0 AS expected_thumb_mismatch_on_image_seeds,
  count(*) FILTER (
    WHERE 'forge-ia-seed-v1' = ANY (coalesce(tags, '{}'::text[]))
      AND id NOT IN (
        'eeeeeeee-eeee-4eee-8eee-000000000004'::uuid,
        'eeeeeeee-eeee-4eee-8eee-000000000021'::uuid
      )
      AND (
        thumbnail_url IS NULL
        OR cardinality(thumbnail_urls) <> 1
        OR thumbnail_urls[1] IS DISTINCT FROM thumbnail_url
      )
  ) AS actual_thumb_mismatch_on_image_seeds,
  0 AS expected_non_seed_staging_thumbs,
  (
    SELECT count(*) FROM public.projects
    WHERE id::text NOT LIKE 'eeeeeeee-eeee-4eee-8eee-%'
      AND thumbnail_url LIKE '/images/staging-only/player-ia/%'
  ) AS actual_non_seed_staging_thumbs,
  CASE
    WHEN count(*) = 40
     AND count(*) FILTER (WHERE 'forge-ia-seed-v1' = ANY (coalesce(tags, '{}'::text[]))) = 40
     AND count(*) FILTER (WHERE title LIKE '[IA Seed]%') = 0
     AND count(*) FILTER (WHERE coalesce(description, '') LIKE '[IA Seed]%') = 0
     AND count(*) FILTER (WHERE coalesce(overview_introduction, '') LIKE '[IA Seed]%') = 0
     AND count(*) FILTER (
       WHERE thumbnail_url LIKE '/images/staging-only/player-ia/%'
         AND thumbnail_urls = ARRAY[thumbnail_url]::text[]
     ) = 38
     AND count(*) FILTER (
       WHERE id IN (
         'eeeeeeee-eeee-4eee-8eee-000000000004'::uuid,
         'eeeeeeee-eeee-4eee-8eee-000000000021'::uuid
       )
       AND thumbnail_url IS NULL
       AND thumbnail_urls = '{}'::text[]
     ) = 2
     AND count(*) FILTER (
       WHERE 'forge-ia-seed-v1' = ANY (coalesce(tags, '{}'::text[]))
         AND id NOT IN (
           'eeeeeeee-eeee-4eee-8eee-000000000004'::uuid,
           'eeeeeeee-eeee-4eee-8eee-000000000021'::uuid
         )
         AND (
           thumbnail_url IS NULL
           OR cardinality(thumbnail_urls) <> 1
           OR thumbnail_urls[1] IS DISTINCT FROM thumbnail_url
         )
     ) = 0
     AND (
       SELECT count(*) FROM public.projects
       WHERE id::text NOT LIKE 'eeeeeeee-eeee-4eee-8eee-%'
         AND thumbnail_url LIKE '/images/staging-only/player-ia/%'
     ) = 0
    THEN 'PASS'
    WHEN count(*) = 40
     AND count(*) FILTER (WHERE 'forge-ia-seed-v1' = ANY (coalesce(tags, '{}'::text[]))) = 40
     AND count(*) FILTER (WHERE title LIKE '[IA Seed]%') = 40
     AND count(*) FILTER (WHERE coalesce(description, '') LIKE '[IA Seed]%') = 40
     AND count(*) FILTER (WHERE coalesce(overview_introduction, '') LIKE '[IA Seed]%') = 40
     AND count(*) FILTER (
       WHERE thumbnail_url LIKE '/images/staging-only/player-ia/%'
     ) = 0
     AND (
       SELECT count(*) FROM public.projects
       WHERE id::text NOT LIKE 'eeeeeeee-eeee-4eee-8eee-%'
         AND thumbnail_url LIKE '/images/staging-only/player-ia/%'
     ) = 0
    THEN 'NOT_APPLIED'
    ELSE 'FAIL'
  END AS verdict
FROM public.projects
WHERE id::text LIKE 'eeeeeeee-eeee-4eee-8eee-%';

SELECT
  'seed_category_counts' AS section,
  coalesce(category, 'game') AS category,
  8 AS expected_n,
  count(*) AS actual_n,
  CASE WHEN count(*) = 8 THEN 'PASS' ELSE 'FAIL' END AS verdict
FROM public.projects
WHERE id::text LIKE 'eeeeeeee-eeee-4eee-8eee-%'
GROUP BY coalesce(category, 'game')
ORDER BY coalesce(category, 'game');

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
    WHEN thumbnail_urls IS NULL THEN 'null_array_INVALID_on_real_schema'
    WHEN cardinality(thumbnail_urls) = 0 THEN 'empty_array'
    ELSE thumbnail_urls[1]
  END AS thumbnail_urls_first,
  CASE
    WHEN title LIKE '[IA Seed]%' THEN 'prefixed'
    ELSE 'clean'
  END AS title_state,
  CASE
    WHEN thumbnail_url LIKE '/images/staging-only/player-ia/%'
     AND thumbnail_urls = ARRAY[thumbnail_url]::text[] THEN 'staging_aligned'
    WHEN thumbnail_url IS NULL AND thumbnail_urls = '{}'::text[] THEN 'no_image'
    WHEN thumbnail_url IS NULL AND thumbnail_urls IS NULL THEN 'null_both_legacy'
    ELSE 'other_or_mismatch'
  END AS thumb_state
FROM public.projects
WHERE id::text LIKE 'eeeeeeee-eeee-4eee-8eee-%'
ORDER BY id
LIMIT 40;

-- ---------------------------------------------------------------------------
-- 4. Announcements (seed UUIDs)
-- GATE_ASSERT:seed_announcements
-- ---------------------------------------------------------------------------
SELECT
  'seed_announcements' AS section,
  8 AS expected_rows,
  count(*) AS actual_rows,
  6 AS expected_published,
  count(*) FILTER (WHERE status = 'published') AS actual_published,
  2 AS expected_draft,
  count(*) FILTER (WHERE status = 'draft') AS actual_draft,
  0 AS expected_title_prefixed_after_beautify,
  count(*) FILTER (WHERE title LIKE '[IA Seed]%') AS actual_title_prefixed,
  0 AS expected_body_prefixed_after_beautify,
  count(*) FILTER (WHERE body LIKE '[IA Seed]%') AS actual_body_prefixed,
  8 AS expected_exact_copy_matches,
  (
    SELECT count(*)
    FROM public.platform_announcements a
    JOIN (
      VALUES
        ('aaaaaaaa-aaaa-4aaa-8aaa-000000000001'::uuid,
         'Preview用: Playerホーム棚の確認メモ',
         'Staging限定のお知らせです。フィードバックが集まっている作品・最近アップデート・使用ペア棚の見た目確認用。Production向けの告知ではありません。'),
        ('aaaaaaaa-aaaa-4aaa-8aaa-000000000002'::uuid,
         'カテゴリ8件ずつの表示密度を見る',
         'game / audio / asset / dev-tool / service-app が各8件ある前提で、カード密度と省略を確認してください。'),
        ('aaaaaaaa-aaaa-4aaa-8aaa-000000000003'::uuid,
         'サムネなし2件のフォールバック確認',
         '意図的にサムネなしのseedが2件あります。プレースホルダ表示が崩れていないかだけ見てください。'),
        ('aaaaaaaa-aaaa-4aaa-8aaa-000000000004'::uuid,
         '使用関係ペアの並びに注意',
         'Forgeでつながった作品棚はseedのusage関係を使います。実ユーザー作品への影響はありません。'),
        ('aaaaaaaa-aaaa-4aaa-8aaa-000000000005'::uuid,
         '新着・更新棚の並び確認',
         'first_published_at と更新要約の見え方をStagingで確認するためのメモです。'),
        ('aaaaaaaa-aaaa-4aaa-8aaa-000000000006'::uuid,
         'お知らせ一覧の公開6件サンプル',
         'published 6件のうちの1件です。draft 2件は公開一覧に出ない想定です。'),
        ('aaaaaaaa-aaaa-4aaa-8aaa-000000000007'::uuid,
         '（draft）下書きお知らせA',
         'Staging draft。公開一覧・ホームには出さない想定の確認用です。'),
        ('aaaaaaaa-aaaa-4aaa-8aaa-000000000008'::uuid,
         '（draft）下書きお知らせB',
         'Staging draft。published/draft件数（6/2）を崩さないための確認用です。')
    ) AS expected(id, title, body)
      ON a.id = expected.id
     AND a.title = expected.title
     AND a.body = expected.body
  ) AS actual_exact_copy_matches,
  CASE
    WHEN count(*) = 8
     AND count(*) FILTER (WHERE status = 'published') = 6
     AND count(*) FILTER (WHERE status = 'draft') = 2
     AND count(*) FILTER (WHERE title LIKE '[IA Seed]%') = 0
     AND count(*) FILTER (WHERE body LIKE '[IA Seed]%') = 0
     AND (
       SELECT count(*)
       FROM public.platform_announcements a
       JOIN (
         VALUES
           ('aaaaaaaa-aaaa-4aaa-8aaa-000000000001'::uuid,
            'Preview用: Playerホーム棚の確認メモ',
            'Staging限定のお知らせです。フィードバックが集まっている作品・最近アップデート・使用ペア棚の見た目確認用。Production向けの告知ではありません。'),
           ('aaaaaaaa-aaaa-4aaa-8aaa-000000000002'::uuid,
            'カテゴリ8件ずつの表示密度を見る',
            'game / audio / asset / dev-tool / service-app が各8件ある前提で、カード密度と省略を確認してください。'),
           ('aaaaaaaa-aaaa-4aaa-8aaa-000000000003'::uuid,
            'サムネなし2件のフォールバック確認',
            '意図的にサムネなしのseedが2件あります。プレースホルダ表示が崩れていないかだけ見てください。'),
           ('aaaaaaaa-aaaa-4aaa-8aaa-000000000004'::uuid,
            '使用関係ペアの並びに注意',
            'Forgeでつながった作品棚はseedのusage関係を使います。実ユーザー作品への影響はありません。'),
           ('aaaaaaaa-aaaa-4aaa-8aaa-000000000005'::uuid,
            '新着・更新棚の並び確認',
            'first_published_at と更新要約の見え方をStagingで確認するためのメモです。'),
           ('aaaaaaaa-aaaa-4aaa-8aaa-000000000006'::uuid,
            'お知らせ一覧の公開6件サンプル',
            'published 6件のうちの1件です。draft 2件は公開一覧に出ない想定です。'),
           ('aaaaaaaa-aaaa-4aaa-8aaa-000000000007'::uuid,
            '（draft）下書きお知らせA',
            'Staging draft。公開一覧・ホームには出さない想定の確認用です。'),
           ('aaaaaaaa-aaaa-4aaa-8aaa-000000000008'::uuid,
            '（draft）下書きお知らせB',
            'Staging draft。published/draft件数（6/2）を崩さないための確認用です。')
       ) AS expected(id, title, body)
         ON a.id = expected.id
        AND a.title = expected.title
        AND a.body = expected.body
     ) = 8
    THEN 'PASS'
    WHEN count(*) = 8
     AND count(*) FILTER (WHERE status = 'published') = 6
     AND count(*) FILTER (WHERE status = 'draft') = 2
     AND count(*) FILTER (WHERE title LIKE '[IA Seed]%') = 8
     AND count(*) FILTER (WHERE body LIKE '[IA Seed]%') = 8
    THEN 'NOT_APPLIED'
    ELSE 'FAIL'
  END AS verdict
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
-- 5. Seed inventory (usage / FB / empathy / replies / devlogs / releases)
-- GATE_ASSERT:seed_related_inventory
-- ---------------------------------------------------------------------------
SELECT
  'seed_related_inventory' AS section,
  12 AS expected_usage,
  (SELECT count(*) FROM public.project_usage_relations
    WHERE id::text LIKE 'ffffffff-ffff-4fff-8fff-%') AS actual_usage,
  31 AS expected_registered_fb,
  (SELECT count(*) FROM public.project_feedback
    WHERE id::text LIKE '99999999-9999-4999-8999-%') AS actual_registered_fb,
  7 AS expected_guest_fb,
  (SELECT count(*) FROM public.project_guest_feedback
    WHERE id::text LIKE 'bbbbbbbb-bbbb-4bbb-8bbb-%') AS actual_guest_fb,
  72 AS expected_empathy,
  (SELECT count(*) FROM public.feedback_card_empathies
    WHERE id::text LIKE '88888888-8888-4888-8888-%') AS actual_empathy,
  13 AS expected_replies,
  (SELECT count(*) FROM public.feedback_card_replies
    WHERE id::text LIKE '77777777-7777-4777-8777-%') AS actual_replies,
  45 AS expected_devlogs,
  (SELECT count(*) FROM public.project_devlogs
    WHERE id::text LIKE '66666666-6666-4666-8666-%') AS actual_devlogs,
  8 AS expected_releases,
  (SELECT count(*) FROM public.project_release_events
    WHERE id::text LIKE '55555555-5555-4555-8555-%') AS actual_releases,
  CASE
    WHEN (SELECT count(*) FROM public.project_usage_relations
            WHERE id::text LIKE 'ffffffff-ffff-4fff-8fff-%') = 12
     AND (SELECT count(*) FROM public.project_feedback
            WHERE id::text LIKE '99999999-9999-4999-8999-%') = 31
     AND (SELECT count(*) FROM public.project_guest_feedback
            WHERE id::text LIKE 'bbbbbbbb-bbbb-4bbb-8bbb-%') = 7
     AND (SELECT count(*) FROM public.feedback_card_empathies
            WHERE id::text LIKE '88888888-8888-4888-8888-%') = 72
     AND (SELECT count(*) FROM public.feedback_card_replies
            WHERE id::text LIKE '77777777-7777-4777-8777-%') = 13
     AND (SELECT count(*) FROM public.project_devlogs
            WHERE id::text LIKE '66666666-6666-4666-8666-%') = 45
     AND (SELECT count(*) FROM public.project_release_events
            WHERE id::text LIKE '55555555-5555-4555-8555-%') = 8
    THEN 'PASS'
    ELSE 'FAIL_OR_PARTIAL_SEED'
  END AS verdict;

-- ---------------------------------------------------------------------------
-- 6. Immutable surfaces — beautify must NOT strip published bodies
-- GATE_ASSERT:seed_devlogs_immutable_check
-- ---------------------------------------------------------------------------
SELECT
  'seed_devlogs_immutable_check' AS section,
  45 AS expected_seed_devlog_rows,
  count(*) AS actual_seed_devlog_rows,
  45 AS expected_title_still_prefixed,
  count(*) FILTER (WHERE title LIKE '[IA Seed]%') AS actual_title_still_prefixed,
  45 AS expected_content_still_prefixed,
  count(*) FILTER (WHERE content LIKE '[IA Seed]%') AS actual_content_still_prefixed,
  17 AS expected_published_version_set,
  count(*) FILTER (WHERE published_version IS NOT NULL) AS actual_published_version_set,
  0 AS expected_published_content_stripped,
  count(*) FILTER (
    WHERE published_version IS NOT NULL
      AND content NOT LIKE '[IA Seed]%'
  ) AS actual_published_content_stripped,
  CASE
    WHEN count(*) = 45
     AND count(*) FILTER (WHERE title LIKE '[IA Seed]%') = 45
     AND count(*) FILTER (WHERE content LIKE '[IA Seed]%') = 45
     AND count(*) FILTER (WHERE published_version IS NOT NULL) = 17
     AND count(*) FILTER (
       WHERE published_version IS NOT NULL
         AND content NOT LIKE '[IA Seed]%'
     ) = 0
    THEN 'PASS_title_and_content_untouched'
    ELSE 'FAIL_published_devlog_changed_or_incomplete'
  END AS verdict
FROM public.project_devlogs
WHERE id::text LIKE '66666666-6666-4666-8666-%';

SELECT
  'seed_release_notes_check' AS section,
  count(*) AS seed_release_rows,
  count(*) FILTER (WHERE coalesce(note, '') LIKE '[IA Seed]%') AS note_still_prefixed,
  CASE
    WHEN count(*) > 0
     AND count(*) FILTER (WHERE coalesce(note, '') LIKE '[IA Seed]%') = count(*)
    THEN 'PASS_notes_untouched'
    WHEN count(*) = 0
    THEN 'NO_ROWS'
    ELSE 'FAIL_OR_PARTIAL'
  END AS verdict
FROM public.project_release_events
WHERE id::text LIKE '55555555-5555-4555-8555-%';

-- GATE_ASSERT:immutable_trigger
SELECT
  'immutable_trigger' AS section,
  EXISTS (
    SELECT 1
    FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    JOIN pg_proc p ON p.oid = t.tgfoid
    WHERE n.nspname = 'public'
      AND c.relname = 'project_devlogs'
      AND NOT t.tgisinternal
      AND t.tgname = 'project_devlogs_immutable_body'
      AND p.proname = 'enforce_devlog_immutable_body'
      AND t.tgenabled IN ('O', 'A')
  ) AS trigger_present_enabled_correct_fn,
  (
    SELECT t.tgenabled
    FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relname = 'project_devlogs'
      AND NOT t.tgisinternal
      AND t.tgname = 'project_devlogs_immutable_body'
    LIMIT 1
  ) AS tgenabled,
  (
    SELECT p.proname
    FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    JOIN pg_proc p ON p.oid = t.tgfoid
    WHERE n.nspname = 'public'
      AND c.relname = 'project_devlogs'
      AND NOT t.tgisinternal
      AND t.tgname = 'project_devlogs_immutable_body'
    LIMIT 1
  ) AS function_name,
  CASE
    WHEN EXISTS (
      SELECT 1
      FROM pg_trigger t
      JOIN pg_class c ON c.oid = t.tgrelid
      JOIN pg_namespace n ON n.oid = c.relnamespace
      JOIN pg_proc p ON p.oid = t.tgfoid
      WHERE n.nspname = 'public'
        AND c.relname = 'project_devlogs'
        AND NOT t.tgisinternal
        AND t.tgname = 'project_devlogs_immutable_body'
        AND p.proname = 'enforce_devlog_immutable_body'
        AND t.tgenabled IN ('O', 'A')
    )
    THEN 'PASS'
    ELSE 'FAIL'
  END AS verdict;

-- ---------------------------------------------------------------------------
-- 7. Non-seed sanity (smoke title must stay Smoke A)
-- ---------------------------------------------------------------------------
SELECT
  'non_seed_sanity' AS section,
  (SELECT title FROM public.projects
     WHERE id = '41ff5a96-105c-42a2-87b4-787bcfeacb45'::uuid) AS smoke_title,
  (SELECT title FROM public.projects
     WHERE id = 'dddddddd-dddd-4ddd-8ddd-000000000203'::uuid) AS hero_title,
  CASE
    WHEN (SELECT title FROM public.projects
            WHERE id = '41ff5a96-105c-42a2-87b4-787bcfeacb45'::uuid) = 'Smoke A'
    THEN 'PASS'
    ELSE 'FAIL'
  END AS smoke_verdict;

-- ---------------------------------------------------------------------------
-- 8. Interpretation helper
-- ---------------------------------------------------------------------------
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
