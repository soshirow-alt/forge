-- READ-ONLY audit — Player IA 5-category / Search genre·tag seed state (Staging)
-- Target ref: vuqpwvjvgyxffmvpfrxo
-- DO NOT run write statements. DO NOT run on Production (bpnisgzxuwdxelhnduuf).
--
-- Scope: forge-ia-seed-v1 projects only (eeeeeeee-eeee-4eee-8eee-*).
-- No PII / secrets. Counts and distributions for Owner Preview E2E prep.

-- ---------------------------------------------------------------------------
-- 0. Environment
-- ---------------------------------------------------------------------------
SELECT
  'env' AS section,
  EXISTS (
    SELECT 1 FROM public.projects
    WHERE id = '41ff5a96-105c-42a2-87b4-787bcfeacb45'::uuid
      AND visibility = 'public'
  ) AS smoke_a_public,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM public.projects
      WHERE id = '41ff5a96-105c-42a2-87b4-787bcfeacb45'::uuid
        AND visibility = 'public'
    ) THEN 'PASS'
    ELSE 'FAIL_wrong_project_or_Production'
  END AS verdict;

-- ---------------------------------------------------------------------------
-- 1. Category counts (seed public)
-- ---------------------------------------------------------------------------
SELECT
  'category_counts' AS section,
  coalesce(category, '(null)') AS category,
  count(*)::int AS project_count
FROM public.projects
WHERE 'forge-ia-seed-v1' = ANY (coalesce(tags, '{}'))
  AND id::text LIKE 'eeeeeeee-eeee-4eee-8eee-%'
GROUP BY coalesce(category, '(null)')
ORDER BY 1;

SELECT
  'category_counts_summary' AS section,
  count(*) FILTER (WHERE category = 'game')::int AS game_n,
  count(*) FILTER (WHERE category = 'audio')::int AS audio_n,
  count(*) FILTER (WHERE category = 'asset')::int AS asset_n,
  count(*) FILTER (WHERE category = 'dev-tool')::int AS dev_tool_n,
  count(*) FILTER (WHERE category = 'service-app')::int AS service_app_n,
  count(*)::int AS total_seed,
  CASE
    WHEN count(*) = 40
     AND count(*) FILTER (WHERE category = 'game') = 8
     AND count(*) FILTER (WHERE category = 'audio') = 8
     AND count(*) FILTER (WHERE category = 'asset') = 8
     AND count(*) FILTER (WHERE category = 'dev-tool') = 8
     AND count(*) FILTER (WHERE category = 'service-app') = 8
    THEN 'PASS'
    ELSE 'FAIL'
  END AS verdict
FROM public.projects
WHERE 'forge-ia-seed-v1' = ANY (coalesce(tags, '{}'))
  AND id::text LIKE 'eeeeeeee-eeee-4eee-8eee-%';

-- ---------------------------------------------------------------------------
-- 2. Game genre distribution
-- ---------------------------------------------------------------------------
SELECT
  'game_genre_dist' AS section,
  g AS genre,
  count(*)::int AS project_count
FROM public.projects p
CROSS JOIN LATERAL unnest(coalesce(p.genres, '{}')) AS g
WHERE p.category = 'game'
  AND 'forge-ia-seed-v1' = ANY (coalesce(p.tags, '{}'))
GROUP BY g
ORDER BY project_count DESC, g;

-- ---------------------------------------------------------------------------
-- 3. Game feature-tag distribution (excludes seed marker)
-- ---------------------------------------------------------------------------
SELECT
  'game_feature_tag_dist' AS section,
  t AS feature_tag,
  count(*)::int AS project_count
FROM public.projects p
CROSS JOIN LATERAL unnest(coalesce(p.tags, '{}')) AS t
WHERE p.category = 'game'
  AND 'forge-ia-seed-v1' = ANY (coalesce(p.tags, '{}'))
  AND t <> 'forge-ia-seed-v1'
GROUP BY t
ORDER BY project_count DESC, t;

-- ---------------------------------------------------------------------------
-- 4. Genre + tag intersections (Search AND cases)
-- ---------------------------------------------------------------------------
SELECT
  'genre_tag_intersection' AS section,
  'ローグライク+ピクセルアート' AS combo,
  count(*)::int AS hits,
  CASE WHEN count(*) >= 1 THEN 'PASS_multi_or_single' ELSE 'FAIL' END AS verdict
FROM public.projects
WHERE category = 'game'
  AND 'forge-ia-seed-v1' = ANY (coalesce(tags, '{}'))
  AND genres && ARRAY['ローグライク']::text[]
  AND tags && ARRAY['ピクセルアート']::text[];

SELECT
  'genre_tag_intersection' AS section,
  'アクション+協力プレイ' AS combo,
  count(*)::int AS hits,
  CASE WHEN count(*) >= 1 THEN 'PASS' ELSE 'FAIL' END AS verdict
FROM public.projects
WHERE category = 'game'
  AND 'forge-ia-seed-v1' = ANY (coalesce(tags, '{}'))
  AND genres && ARRAY['アクション']::text[]
  AND tags && ARRAY['協力プレイ']::text[];

SELECT
  'genre_tag_intersection' AS section,
  'ローグライク+協力プレイ' AS combo,
  count(*)::int AS hits,
  CASE WHEN count(*) = 0 THEN 'PASS_zero' ELSE 'FAIL_expected_zero' END AS verdict
FROM public.projects
WHERE category = 'game'
  AND 'forge-ia-seed-v1' = ANY (coalesce(tags, '{}'))
  AND genres && ARRAY['ローグライク']::text[]
  AND tags && ARRAY['協力プレイ']::text[];

-- ---------------------------------------------------------------------------
-- 5. Asset kinds / formats / tastes / tools (085 structured attrs)
-- ---------------------------------------------------------------------------
SELECT
  'asset_kinds_attrs' AS section,
  count(*)::int AS asset_n,
  count(*) FILTER (
    WHERE coalesce(cardinality(asset_kinds), 0) >= 1
  )::int AS has_asset_kinds_n,
  count(*) FILTER (
    WHERE category_attributes ? 'formats'
  )::int AS has_formats_n,
  count(*) FILTER (
    WHERE category_attributes ? 'tastes'
  )::int AS has_tastes_n,
  count(*) FILTER (
    WHERE category_attributes ? 'tools'
  )::int AS has_tools_n,
  CASE
    WHEN count(*) = 8
     AND count(*) FILTER (WHERE coalesce(cardinality(asset_kinds), 0) >= 1) = 8
    THEN 'PASS'
    ELSE 'FAIL'
  END AS verdict
FROM public.projects
WHERE category = 'asset'
  AND 'forge-ia-seed-v1' = ANY (coalesce(tags, '{}'));

SELECT
  'asset_character_format_split' AS section,
  count(*) FILTER (WHERE category_attributes->'formats' ? '2D')::int AS format_2d_n,
  count(*) FILTER (WHERE category_attributes->'formats' ? '3D')::int AS format_3d_n,
  CASE
    WHEN count(*) FILTER (WHERE category_attributes->'formats' ? '2D') >= 1
     AND count(*) FILTER (WHERE category_attributes->'formats' ? '3D') >= 1
    THEN 'PASS'
    ELSE 'FAIL'
  END AS verdict
FROM public.projects
WHERE category = 'asset'
  AND 'forge-ia-seed-v1' = ANY (coalesce(tags, '{}'))
  AND 'キャラクター' = ANY (asset_kinds);

-- ---------------------------------------------------------------------------
-- 6. Public / thumbnail / publish destinations
-- ---------------------------------------------------------------------------
SELECT
  'public_thumb_publish' AS section,
  category,
  count(*)::int AS n,
  count(*) FILTER (WHERE visibility = 'public')::int AS public_n,
  count(*) FILTER (WHERE thumbnail_url IS NOT NULL)::int AS has_thumb_n,
  count(*) FILTER (
    WHERE publish_destinations IS NOT NULL
      AND publish_destinations <> '[]'::jsonb
  )::int AS has_publish_dest_n,
  count(*) FILTER (WHERE estimated_play_time IS NOT NULL)::int AS has_play_time_n,
  count(*) FILTER (
    WHERE play_access_type IS NOT NULL AND play_access_type <> 'unspecified'
  )::int AS has_play_access_n
FROM public.projects
WHERE 'forge-ia-seed-v1' = ANY (coalesce(tags, '{}'))
GROUP BY category
ORDER BY category;

-- ---------------------------------------------------------------------------
-- 7. Non-game Studio attribute keys present (kinds[] canonical + legacy kind)
-- ---------------------------------------------------------------------------
SELECT
  'non_game_studio_attrs' AS section,
  category,
  count(*) FILTER (
    WHERE category_attributes ? 'kinds'
  )::int AS has_kinds_array,
  count(*) FILTER (
    WHERE category_attributes ? 'kind' AND NOT (category_attributes ? 'kinds')
  )::int AS legacy_singular_kind_only,
  count(*) FILTER (
    WHERE category_attributes ? 'musicDuration'
       OR category_attributes ? 'musicGenres'
  )::int AS audio_shape,
  count(*) FILTER (
    WHERE category_attributes ? 'moods' OR category_attributes ? 'purposes'
  )::int AS mood_purpose_shape,
  count(*) FILTER (
    WHERE category_attributes ? 'toolUsageMethod'
       OR category_attributes ? 'toolEnvironments'
  )::int AS tool_shape,
  count(*) FILTER (
    WHERE category_attributes ? 'features'
  )::int AS has_features,
  count(*) FILTER (
    WHERE category_attributes ? 'serviceEnvironments'
  )::int AS service_shape
FROM public.projects
WHERE 'forge-ia-seed-v1' = ANY (coalesce(tags, '{}'))
  AND category IN ('audio', 'dev-tool', 'service-app')
GROUP BY category
ORDER BY category;

-- ---------------------------------------------------------------------------
-- 7b. Legacy singular `kind` read-fallback coverage (085)
-- ---------------------------------------------------------------------------
SELECT
  'legacy_singular_kind_rows' AS section,
  category,
  category_attributes->>'kind' AS legacy_kind,
  CASE
    WHEN count(*) >= 1 THEN 'PASS_present'
    ELSE 'FAIL_missing'
  END AS verdict
FROM public.projects
WHERE 'forge-ia-seed-v1' = ANY (coalesce(tags, '{}'))
  AND category IN ('audio', 'service-app')
  AND category_attributes ? 'kind'
  AND NOT (category_attributes ? 'kinds')
GROUP BY category, category_attributes->>'kind'
ORDER BY category;

-- ---------------------------------------------------------------------------
-- 8. Game: play_times / play_envs / player_counts (085 dedicated column)
-- ---------------------------------------------------------------------------
SELECT
  'game_play_filters' AS section,
  count(*)::int AS game_n,
  count(*) FILTER (WHERE estimated_play_time IS NOT NULL)::int AS has_play_time_n,
  count(*) FILTER (
    WHERE tags && ARRAY['PC対応', 'スマホ対応', 'ブラウザ対応']::text[]
  )::int AS has_play_env_tag_n,
  count(*) FILTER (WHERE coalesce(cardinality(player_counts), 0) >= 1)::int AS has_player_counts_n,
  CASE
    WHEN count(*) FILTER (WHERE coalesce(cardinality(player_counts), 0) >= 1) > 0
     AND count(*) FILTER (WHERE coalesce(cardinality(player_counts), 0) = 0) > 0
    THEN 'PASS_partial_coverage'
    ELSE 'FAIL'
  END AS verdict
FROM public.projects
WHERE category = 'game'
  AND 'forge-ia-seed-v1' = ANY (coalesce(tags, '{}'));

-- ---------------------------------------------------------------------------
-- 9. Audio duration buckets (musicDuration parse coverage, 085)
-- ---------------------------------------------------------------------------
SELECT
  'audio_duration_buckets' AS section,
  category_attributes->>'musicDuration' AS music_duration,
  category_attributes->'kinds' AS kinds,
  category_attributes->>'kind' AS legacy_kind
FROM public.projects
WHERE category = 'audio'
  AND 'forge-ia-seed-v1' = ANY (coalesce(tags, '{}'))
ORDER BY music_duration;

-- ---------------------------------------------------------------------------
-- 10. Home-related activity inventory (seed UUIDs)
-- ---------------------------------------------------------------------------
SELECT
  'home_activity' AS section,
  (SELECT count(*)::int FROM public.project_usage_relations
    WHERE id::text LIKE 'ffffffff-ffff-4fff-8fff-%') AS usage_n,
  (SELECT count(*)::int FROM public.project_devlogs
    WHERE id::text LIKE '66666666-6666-4666-8666-%') AS devlog_n,
  (SELECT count(*)::int FROM public.project_release_events
    WHERE id::text LIKE '55555555-5555-4555-8555-%') AS release_n,
  (SELECT count(*)::int FROM public.platform_announcements
    WHERE id::text LIKE 'aaaaaaaa-aaaa-4aaa-8aaa-%'
      AND status = 'published') AS ann_published_n;
