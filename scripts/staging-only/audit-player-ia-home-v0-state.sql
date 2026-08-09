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
  to_regprocedure('public.get_home_feedback_gathering_projects(integer, text)') IS NOT NULL
    AS feedback_gathering,
  to_regprocedure('public.get_home_meaningful_updates(integer, text)') IS NOT NULL
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
    WHEN to_regprocedure('public.get_home_feedback_gathering_projects(integer, text)') IS NOT NULL
     AND to_regprocedure('public.get_home_meaningful_updates(integer, text)') IS NOT NULL
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
  0 AS expected_staging_senyo_in_description,
  count(*) FILTER (WHERE coalesce(description, '') LIKE '%Staging専用%') AS actual_staging_senyo_in_description,
  0 AS expected_ia_seed_in_creator_or_owner_name,
  count(*) FILTER (
    WHERE coalesce(creator, '') ~* 'IA Seed'
       OR coalesce(owner_name, '') ~* 'IA Seed'
  ) AS actual_ia_seed_in_creator_or_owner_name,
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
  0 AS expected_seed_title_ufffd,
  count(*) FILTER (
    WHERE position(chr(65533) in coalesce(title, '')) > 0
  ) AS actual_seed_title_ufffd,
  1 AS expected_se_kit_title_exact,
  count(*) FILTER (
    WHERE id = 'eeeeeeee-eeee-4eee-8eee-000000000011'::uuid
      AND title = 'SEキット基礎'
  ) AS actual_se_kit_title_exact,
  CASE
    WHEN count(*) = 40
     AND count(*) FILTER (WHERE 'forge-ia-seed-v1' = ANY (coalesce(tags, '{}'::text[]))) = 40
     AND count(*) FILTER (WHERE title LIKE '[IA Seed]%') = 0
     AND count(*) FILTER (WHERE coalesce(description, '') LIKE '[IA Seed]%') = 0
     AND count(*) FILTER (WHERE coalesce(overview_introduction, '') LIKE '[IA Seed]%') = 0
     AND count(*) FILTER (WHERE coalesce(description, '') LIKE '%Staging専用%') = 0
     AND count(*) FILTER (
       WHERE coalesce(creator, '') ~* 'IA Seed'
          OR coalesce(owner_name, '') ~* 'IA Seed'
     ) = 0
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
     AND count(*) FILTER (
       WHERE position(chr(65533) in coalesce(title, '')) > 0
     ) = 0
     AND count(*) FILTER (
       WHERE id = 'eeeeeeee-eeee-4eee-8eee-000000000011'::uuid
         AND title = 'SEキット基礎'
     ) = 1
    THEN 'PASS'
    WHEN count(*) = 40
     AND count(*) FILTER (WHERE 'forge-ia-seed-v1' = ANY (coalesce(tags, '{}'::text[]))) = 40
     AND count(*) FILTER (WHERE title LIKE '[IA Seed]%') = 40
     AND count(*) FILTER (WHERE coalesce(description, '') LIKE '[IA Seed]%') = 40
     AND count(*) FILTER (WHERE coalesce(description, '') LIKE '%Staging専用%') = 40
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
-- 4. Announcements (seed UUIDs) — natural user-facing copy after beautify
-- GATE_ASSERT:seed_announcements
-- ---------------------------------------------------------------------------
WITH expected_copy (id, title, body, expected_status) AS (
  VALUES
    ('aaaaaaaa-aaaa-4aaa-8aaa-000000000001'::uuid,
     '作品へのフィードバックを募集しています',
     '気になった作品を試して、良かった点や改善してほしい点を開発者へ届けてみてください。',
     'published'),
    ('aaaaaaaa-aaaa-4aaa-8aaa-000000000002'::uuid,
     '制作に使える素材・ツールを探せます',
     '音楽・音声、アセット、開発ツールなど、制作に活用できる作品をまとめて探せます。',
     'published'),
    ('aaaaaaaa-aaaa-4aaa-8aaa-000000000003'::uuid,
     'サムネイル未設定作品の表示を改善しました',
     '画像がない作品でも内容を確認しやすいフォールバック表示に対応しました。',
     'published'),
    ('aaaaaaaa-aaaa-4aaa-8aaa-000000000004'::uuid,
     '作品同士のつながりを確認できます',
     '素材やツールが別の作品で使われた関係を、Homeから確認できます。',
     'published'),
    ('aaaaaaaa-aaaa-4aaa-8aaa-000000000005'::uuid,
     '新着作品と更新作品を見つけやすくしました',
     '公開されたばかりの作品や、最近更新された作品をHomeで確認できます。',
     'published'),
    ('aaaaaaaa-aaaa-4aaa-8aaa-000000000006'::uuid,
     '5カテゴリの掲載に対応しました',
     'ゲーム、音楽・音声、アセット、開発ツール、サービス・アプリを掲載・探索できます。',
     'published'),
    ('aaaaaaaa-aaaa-4aaa-8aaa-000000000007'::uuid,
     '開発者プロフィールの表示改善',
     '作品と制作者の活動がより分かりやすくなる表示改善を準備しています。',
     'draft'),
    ('aaaaaaaa-aaaa-4aaa-8aaa-000000000008'::uuid,
     'フィードバック機能の改善',
     '送ったフィードバックや開発者からの返信を追いやすくする改善を準備しています。',
     'draft')
),
seed_rows AS (
  SELECT a.*
  FROM public.platform_announcements a
  WHERE a.id::text LIKE 'aaaaaaaa-aaaa-4aaa-8aaa-%'
),
metrics AS (
  SELECT
    (SELECT count(*)::integer FROM seed_rows) AS actual_rows,
    (SELECT count(*)::integer FROM seed_rows WHERE status = 'published') AS actual_published,
    (SELECT count(*)::integer FROM seed_rows WHERE status = 'draft') AS actual_draft,
    (
      SELECT count(*)::integer
      FROM seed_rows a
      INNER JOIN expected_copy e ON a.id = e.id AND a.title = e.title AND a.body = e.body
    ) AS actual_exact_copy_matches,
    (
      SELECT count(*)::integer
      FROM seed_rows a
      INNER JOIN expected_copy e ON a.id = e.id AND a.status = e.expected_status
    ) AS actual_status_matches_fixture,
    (
      SELECT count(*)::integer
      FROM seed_rows
      WHERE lower(coalesce(title, '') || ' ' || coalesce(body, '')) LIKE '%preview%'
    ) AS actual_preview_remaining,
    (
      SELECT count(*)::integer
      FROM seed_rows
      WHERE lower(coalesce(title, '') || ' ' || coalesce(body, '')) LIKE '%staging%'
    ) AS actual_staging_remaining,
    (
      SELECT count(*)::integer
      FROM seed_rows
      WHERE lower(coalesce(title, '') || ' ' || coalesce(body, '')) LIKE '%seed%'
    ) AS actual_seed_remaining,
    (
      SELECT count(*)::integer
      FROM seed_rows
      WHERE coalesce(title, '') LIKE '%[IA Seed]%'
         OR coalesce(body, '') LIKE '%[IA Seed]%'
         OR coalesce(title, '') || coalesce(body, '') ~* '\[IA Seed\]'
    ) AS actual_ia_seed_remaining,
    (
      SELECT count(*)::integer
      FROM seed_rows
      WHERE coalesce(title, '') || coalesce(body, '') LIKE '%確認用%'
         OR coalesce(title, '') || coalesce(body, '') LIKE '%確認メモ%'
    ) AS actual_kakunin_markers,
    (
      SELECT count(*)::integer
      FROM public.platform_announcements a
      WHERE a.id::text NOT LIKE 'aaaaaaaa-aaaa-4aaa-8aaa-%'
        AND EXISTS (
          SELECT 1 FROM expected_copy e
          WHERE e.title = a.title AND e.body = a.body
        )
    ) AS actual_non_seed_mutated_to_seed_copy,
    (
      SELECT count(*)::integer
      FROM seed_rows
      WHERE id = 'aaaaaaaa-aaaa-4aaa-8aaa-000000000001'::uuid
        AND importance = 'important'
        AND status = 'published'
    ) AS actual_important_published_001
)
SELECT
  'seed_announcements' AS section,
  8 AS expected_rows,
  m.actual_rows,
  6 AS expected_published,
  m.actual_published,
  2 AS expected_draft,
  m.actual_draft,
  8 AS expected_exact_copy_matches,
  m.actual_exact_copy_matches,
  8 AS expected_status_matches_fixture,
  m.actual_status_matches_fixture,
  0 AS expected_preview_remaining,
  m.actual_preview_remaining,
  0 AS expected_staging_remaining,
  m.actual_staging_remaining,
  0 AS expected_seed_remaining,
  m.actual_seed_remaining,
  0 AS expected_ia_seed_remaining,
  m.actual_ia_seed_remaining,
  0 AS expected_kakunin_markers,
  m.actual_kakunin_markers,
  0 AS expected_non_seed_mutated_to_seed_copy,
  m.actual_non_seed_mutated_to_seed_copy,
  1 AS expected_important_published_001,
  m.actual_important_published_001,
  CASE
    WHEN m.actual_rows = 8
     AND m.actual_published = 6
     AND m.actual_draft = 2
     AND m.actual_exact_copy_matches = 8
     AND m.actual_status_matches_fixture = 8
     AND m.actual_preview_remaining = 0
     AND m.actual_staging_remaining = 0
     AND m.actual_seed_remaining = 0
     AND m.actual_ia_seed_remaining = 0
     AND m.actual_kakunin_markers = 0
     AND m.actual_non_seed_mutated_to_seed_copy = 0
     AND m.actual_important_published_001 = 1
    THEN 'PASS'
    WHEN m.actual_rows = 8
     AND m.actual_published = 6
     AND m.actual_draft = 2
     AND m.actual_ia_seed_remaining = 8
    THEN 'NOT_APPLIED'
    ELSE 'FAIL'
  END AS verdict
FROM metrics m;

SELECT
  'seed_announcement_rows' AS section,
  id,
  slug,
  status,
  importance,
  title,
  left(body, 100) AS body_prefix,
  published_at
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
-- 7b. Dedicated IA developer_profiles (exact creator_id + user_id pairs)
-- GATE_ASSERT:seed_developer_profiles
-- ---------------------------------------------------------------------------
WITH allowlist (creator_id, user_id, display_name) AS (
  VALUES
    ('ia-seed-dev-01', 'a1a1a1a1-a1a1-41a1-81a1-000000000001'::uuid, 'ゲーム職人'),
    ('ia-seed-dev-02', 'a1a1a1a1-a1a1-41a1-81a1-000000000002'::uuid, 'ホラー好きDev'),
    ('ia-seed-dev-03', 'a1a1a1a1-a1a1-41a1-81a1-000000000003'::uuid, 'Unity屋'),
    ('ia-seed-dev-04', 'a1a1a1a1-a1a1-41a1-81a1-000000000004'::uuid, 'UEクリエイター'),
    ('ia-seed-dev-05', 'a1a1a1a1-a1a1-41a1-81a1-000000000005'::uuid, 'Godot民'),
    ('ia-seed-dev-06', 'a1a1a1a1-a1a1-41a1-81a1-000000000006'::uuid, '配信者A'),
    ('ia-seed-dev-07', 'a1a1a1a1-a1a1-41a1-81a1-000000000007'::uuid, '配信者B'),
    ('ia-seed-dev-08', 'a1a1a1a1-a1a1-41a1-81a1-000000000008'::uuid, 'ドット絵師'),
    ('ia-seed-dev-09', 'a1a1a1a1-a1a1-41a1-81a1-000000000009'::uuid, '3Dキャラ職人'),
    ('ia-seed-dev-10', 'a1a1a1a1-a1a1-41a1-81a1-000000000010'::uuid, 'BGM制作'),
    ('ia-seed-dev-11', 'a1a1a1a1-a1a1-41a1-81a1-000000000011'::uuid, 'SE職人'),
    ('ia-seed-dev-12', 'a1a1a1a1-a1a1-41a1-81a1-000000000012'::uuid, 'ツール屋'),
    ('ia-seed-dev-13', 'a1a1a1a1-a1a1-41a1-81a1-000000000013'::uuid, 'サービス開発'),
    ('ia-seed-dev-14', 'a1a1a1a1-a1a1-41a1-81a1-000000000014'::uuid, '分析屋'),
    ('ia-seed-dev-15', 'a1a1a1a1-a1a1-41a1-81a1-000000000015'::uuid, 'Bot作者'),
    ('ia-seed-dev-16', 'a1a1a1a1-a1a1-41a1-81a1-000000000016'::uuid, 'マルチA'),
    ('ia-seed-dev-17', 'a1a1a1a1-a1a1-41a1-81a1-000000000017'::uuid, 'マルチB'),
    ('ia-seed-dev-18', 'a1a1a1a1-a1a1-41a1-81a1-000000000018'::uuid, 'テスト募集'),
    ('ia-seed-dev-19', 'a1a1a1a1-a1a1-41a1-81a1-000000000019'::uuid, '制作に使える派'),
    ('ia-seed-dev-20', 'a1a1a1a1-a1a1-41a1-81a1-000000000020'::uuid, '超長い制作者プロフィール名の折り返し検証用ABCDEFG')
),
profile_metrics AS (
  SELECT
    CASE WHEN to_regclass('public.developer_profiles') IS NULL THEN 0
         ELSE (
           SELECT count(*)::integer
           FROM public.developer_profiles dp
           INNER JOIN allowlist a
             ON dp.creator_id = a.creator_id
            AND dp.user_id = a.user_id
         )
    END AS exact_pair_rows,
    CASE WHEN to_regclass('public.developer_profiles') IS NULL THEN 0
         ELSE (
           SELECT count(*)::integer
           FROM public.developer_profiles dp
           INNER JOIN allowlist a
             ON dp.creator_id = a.creator_id
            AND dp.user_id = a.user_id
           WHERE dp.public_name = a.display_name
         )
    END AS naturalized_exact_pairs,
    CASE WHEN to_regclass('public.developer_profiles') IS NULL THEN 0
         ELSE (
           SELECT count(*)::integer
           FROM public.developer_profiles dp
           INNER JOIN allowlist a
             ON dp.creator_id = a.creator_id
            AND dp.user_id = a.user_id
           WHERE coalesce(dp.public_name, '') ~* 'IA Seed'
         )
    END AS ia_seed_remaining_on_exact_pairs,
    CASE WHEN to_regclass('public.developer_profiles') IS NULL THEN 0
         ELSE (
           SELECT count(*)::integer
           FROM public.developer_profiles dp
           WHERE coalesce(dp.creator_id, '') LIKE 'ia-seed-dev-%'
             AND NOT EXISTS (
               SELECT 1 FROM allowlist a
               WHERE a.user_id = dp.user_id AND a.creator_id = dp.creator_id
             )
         )
    END AS prefix_or_pair_mismatch_rows,
    CASE WHEN to_regclass('public.developer_profiles') IS NULL THEN 0
         ELSE (
           SELECT count(*)::integer
           FROM public.developer_profiles dp
           WHERE coalesce(dp.creator_id, '') LIKE 'ia-seed-dev-%'
             AND NOT EXISTS (
               SELECT 1 FROM allowlist a
               WHERE a.user_id = dp.user_id AND a.creator_id = dp.creator_id
             )
             AND EXISTS (
               SELECT 1 FROM allowlist a WHERE a.display_name = dp.public_name
             )
         )
    END AS mismatch_mutated_to_allowlist_name,
    CASE WHEN to_regclass('public.developer_profiles') IS NULL THEN 0
         ELSE (
           SELECT count(*)::integer
           FROM public.developer_profiles dp
           WHERE NOT EXISTS (
               SELECT 1 FROM allowlist a
               WHERE a.user_id = dp.user_id AND a.creator_id = dp.creator_id
             )
             AND EXISTS (
               SELECT 1 FROM allowlist a WHERE a.display_name = dp.public_name
             )
             AND coalesce(dp.creator_id, '') NOT LIKE 'ia-seed-dev-%'
         )
    END AS non_seed_mutated_to_allowlist_name,
    CASE WHEN to_regclass('public.developer_profiles') IS NULL THEN true
         ELSE NOT EXISTS (
           SELECT 1 FROM public.developer_profiles dp
           WHERE dp.user_id = 'cccccccc-cccc-4ccc-8ccc-000000000001'::uuid
             AND dp.public_name IS DISTINCT FROM 'IA Seed PrefixOnly Trap'
         )
    END AS prefix_trap_immutable_ok,
    CASE WHEN to_regclass('public.developer_profiles') IS NULL THEN true
         ELSE NOT EXISTS (
           SELECT 1 FROM public.developer_profiles dp
           WHERE dp.user_id = 'a1a1a1a1-a1a1-41a1-81a1-000000000099'::uuid
             AND dp.public_name IS DISTINCT FROM 'IA Seed UserOnly Trap'
         )
    END AS user_trap_immutable_ok,
    CASE WHEN to_regclass('public.developer_profiles') IS NULL THEN true
         ELSE NOT EXISTS (
           SELECT 1 FROM public.developer_profiles dp
           WHERE dp.user_id = 'bbbbbbbb-bbbb-4bbb-8bbb-000000009999'::uuid
             AND dp.public_name IS DISTINCT FROM 'Unrelated Studio'
         )
    END AS non_seed_sentinel_immutable_ok,
    CASE WHEN to_regclass('public.developer_profiles') IS NULL THEN true
         ELSE NOT EXISTS (
           SELECT 1 FROM public.developer_profiles dp
           WHERE dp.creator_id IN (
             'hc-dev-b-forge-st-hero-carousel-v1',
             'hc-dev-c-forge-st-hero-carousel-v1'
           )
             AND dp.public_name IS DISTINCT FROM CASE dp.creator_id
               WHEN 'hc-dev-b-forge-st-hero-carousel-v1' THEN 'HC Dev B'
               WHEN 'hc-dev-c-forge-st-hero-carousel-v1' THEN 'HC Dev C'
             END
         )
    END AS hero_profiles_immutable_ok
)
SELECT
  'seed_developer_profiles' AS section,
  20 AS expected_exact_pairs_when_auth_seeded,
  m.exact_pair_rows AS actual_exact_pair_rows,
  m.naturalized_exact_pairs AS actual_naturalized_exact_pairs,
  m.ia_seed_remaining_on_exact_pairs AS actual_ia_seed_name_remaining_on_exact_pairs,
  m.prefix_or_pair_mismatch_rows AS actual_prefix_or_pair_mismatch_rows,
  m.mismatch_mutated_to_allowlist_name AS actual_mismatch_mutated_to_allowlist_name,
  m.non_seed_mutated_to_allowlist_name AS actual_non_seed_mutated_to_allowlist_name,
  0 AS expected_mismatch_or_non_seed_mutated,
  m.prefix_trap_immutable_ok AS actual_prefix_trap_immutable_ok,
  m.user_trap_immutable_ok AS actual_user_trap_immutable_ok,
  m.non_seed_sentinel_immutable_ok AS actual_non_seed_sentinel_immutable_ok,
  m.hero_profiles_immutable_ok AS actual_hero_profiles_immutable_ok,
  CASE
    WHEN to_regclass('public.developer_profiles') IS NULL THEN 'SKIP_NO_TABLE'
    WHEN m.exact_pair_rows = 0 THEN 'SKIP_NO_DEDICATED_ROWS'
    WHEN m.exact_pair_rows = 20
     AND m.naturalized_exact_pairs = 20
     AND m.ia_seed_remaining_on_exact_pairs = 0
     AND m.mismatch_mutated_to_allowlist_name = 0
     AND m.non_seed_mutated_to_allowlist_name = 0
     AND m.prefix_trap_immutable_ok
     AND m.user_trap_immutable_ok
     AND m.non_seed_sentinel_immutable_ok
     AND m.hero_profiles_immutable_ok
    THEN 'PASS'
    ELSE 'FAIL'
  END AS verdict
FROM profile_metrics m;

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
  to_regprocedure('public.get_home_feedback_gathering_projects(integer, text)') IS NOT NULL
    AS rpc_feedback_gathering_exists,
  to_regprocedure('public.get_home_meaningful_updates(integer, text)') IS NOT NULL
    AS rpc_meaningful_updates_exists;
