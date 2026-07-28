-- STAGING ONLY — beautify Player IA seed public display (titles / announcements / thumbnails)
-- Target ref: vuqpwvjvgyxffmvpfrxo
-- DO NOT run on Production (bpnisgzxuwdxelhnduuf).
--
-- UPDATE allowlist (only):
--   public.projects
--   public.platform_announcements
--
-- Explicitly NOT updated (immutable / append-only / out of scope):
--   public.project_devlogs  — published body immutable (011 enforce_devlog_immutable_body)
--   public.project_release_events
--   developer_profiles / auth / usage / feedback tables
--
-- Markers:
--   project UUIDs: eeeeeeee-eeee-4eee-8eee-*
--   tag: forge-ia-seed-v1 (preserved)
--   announcements: aaaaaaaa-aaaa-4aaa-8aaa-*
--
-- Idempotent. All-or-nothing transaction. Unexpected counts → RAISE → full rollback.

BEGIN;

SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '60s';

DO $$
DECLARE
  v_smoke_ok boolean;
  v_hero_ok boolean;
  v_seed_n integer;
  v_cat_bad integer;
  v_prefix_projects integer;
  v_prefix_announcements integer;
  v_thumb_need integer;
  v_no_image_null integer;
BEGIN
  -- Staging hard-stop: Smoke A is Staging fixture; Production must not match this path.
  SELECT EXISTS (
    SELECT 1 FROM public.projects
    WHERE id = '41ff5a96-105c-42a2-87b4-787bcfeacb45'::uuid
      AND visibility = 'public'
  ) INTO v_smoke_ok;

  IF NOT v_smoke_ok THEN
    RAISE EXCEPTION
      'ABORT beautify-player-ia-seed-display: Staging Smoke A missing — refuse (wrong project / Production?)';
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.projects
    WHERE id = 'dddddddd-dddd-4ddd-8ddd-000000000203'::uuid
  ) INTO v_hero_ok;

  IF NOT v_hero_ok THEN
    RAISE EXCEPTION
      'ABORT beautify-player-ia-seed-display: Staging hero-carousel project missing — refuse';
  END IF;

  SELECT count(*)::integer INTO v_seed_n
  FROM public.projects
  WHERE id::text LIKE 'eeeeeeee-eeee-4eee-8eee-%'
    AND 'forge-ia-seed-v1' = ANY (coalesce(tags, '{}'::text[]));

  IF v_seed_n <> 40 THEN
    RAISE EXCEPTION
      'ABORT beautify-player-ia-seed-display: expected 40 forge-ia-seed-v1 UUID projects, got %',
      v_seed_n;
  END IF;

  SELECT count(*)::integer INTO v_cat_bad
  FROM (
    SELECT coalesce(category, 'game') AS category, count(*) AS n
    FROM public.projects
    WHERE id::text LIKE 'eeeeeeee-eeee-4eee-8eee-%'
      AND 'forge-ia-seed-v1' = ANY (coalesce(tags, '{}'::text[]))
    GROUP BY 1
  ) c
  WHERE c.n <> 8;

  IF v_cat_bad <> 0 THEN
    RAISE EXCEPTION
      'ABORT beautify-player-ia-seed-display: category counts must be 8 each before update';
  END IF;

  -- Pre-assert: noImage edge cases are exactly the two fixed IDs (may already be NULL).
  SELECT count(*)::integer INTO v_no_image_null
  FROM public.projects
  WHERE id IN (
    'eeeeeeee-eeee-4eee-8eee-000000000004'::uuid,
    'eeeeeeee-eeee-4eee-8eee-000000000021'::uuid
  );

  IF v_no_image_null <> 2 THEN
    RAISE EXCEPTION
      'ABORT beautify-player-ia-seed-display: noImage edge UUIDs missing';
  END IF;

  SELECT count(*)::integer INTO v_prefix_projects
  FROM public.projects
  WHERE id::text LIKE 'eeeeeeee-eeee-4eee-8eee-%'
    AND 'forge-ia-seed-v1' = ANY (coalesce(tags, '{}'::text[]))
    AND (
      title LIKE '[IA Seed]%'
      OR coalesce(description, '') LIKE '[IA Seed]%'
      OR coalesce(overview_introduction, '') LIKE '[IA Seed]%'
    );

  SELECT count(*)::integer INTO v_prefix_announcements
  FROM public.platform_announcements
  WHERE id::text LIKE 'aaaaaaaa-aaaa-4aaa-8aaa-%'
    AND (
      title LIKE '[IA Seed]%'
      OR body LIKE '[IA Seed]%'
    );

  SELECT count(*)::integer INTO v_thumb_need
  FROM public.projects
  WHERE id IN (
    'eeeeeeee-eeee-4eee-8eee-000000000001'::uuid,
    'eeeeeeee-eeee-4eee-8eee-000000000002'::uuid,
    'eeeeeeee-eeee-4eee-8eee-000000000003'::uuid,
    'eeeeeeee-eeee-4eee-8eee-000000000005'::uuid,
    'eeeeeeee-eeee-4eee-8eee-000000000006'::uuid,
    'eeeeeeee-eeee-4eee-8eee-000000000007'::uuid,
    'eeeeeeee-eeee-4eee-8eee-000000000008'::uuid,
    'eeeeeeee-eeee-4eee-8eee-000000000009'::uuid,
    'eeeeeeee-eeee-4eee-8eee-000000000010'::uuid,
    'eeeeeeee-eeee-4eee-8eee-000000000011'::uuid,
    'eeeeeeee-eeee-4eee-8eee-000000000012'::uuid,
    'eeeeeeee-eeee-4eee-8eee-000000000013'::uuid,
    'eeeeeeee-eeee-4eee-8eee-000000000014'::uuid,
    'eeeeeeee-eeee-4eee-8eee-000000000015'::uuid,
    'eeeeeeee-eeee-4eee-8eee-000000000016'::uuid,
    'eeeeeeee-eeee-4eee-8eee-000000000017'::uuid,
    'eeeeeeee-eeee-4eee-8eee-000000000018'::uuid,
    'eeeeeeee-eeee-4eee-8eee-000000000019'::uuid,
    'eeeeeeee-eeee-4eee-8eee-000000000020'::uuid,
    'eeeeeeee-eeee-4eee-8eee-000000000022'::uuid,
    'eeeeeeee-eeee-4eee-8eee-000000000023'::uuid,
    'eeeeeeee-eeee-4eee-8eee-000000000024'::uuid,
    'eeeeeeee-eeee-4eee-8eee-000000000025'::uuid,
    'eeeeeeee-eeee-4eee-8eee-000000000026'::uuid,
    'eeeeeeee-eeee-4eee-8eee-000000000027'::uuid,
    'eeeeeeee-eeee-4eee-8eee-000000000028'::uuid,
    'eeeeeeee-eeee-4eee-8eee-000000000029'::uuid,
    'eeeeeeee-eeee-4eee-8eee-000000000030'::uuid,
    'eeeeeeee-eeee-4eee-8eee-000000000031'::uuid,
    'eeeeeeee-eeee-4eee-8eee-000000000032'::uuid,
    'eeeeeeee-eeee-4eee-8eee-000000000033'::uuid,
    'eeeeeeee-eeee-4eee-8eee-000000000034'::uuid,
    'eeeeeeee-eeee-4eee-8eee-000000000035'::uuid,
    'eeeeeeee-eeee-4eee-8eee-000000000036'::uuid,
    'eeeeeeee-eeee-4eee-8eee-000000000037'::uuid,
    'eeeeeeee-eeee-4eee-8eee-000000000038'::uuid,
    'eeeeeeee-eeee-4eee-8eee-000000000039'::uuid,
    'eeeeeeee-eeee-4eee-8eee-000000000040'::uuid
  );

  IF v_thumb_need <> 38 THEN
    RAISE EXCEPTION
      'ABORT beautify-player-ia-seed-display: expected 38 thumbnail assignment targets, got %',
      v_thumb_need;
  END IF;

  RAISE NOTICE
    'beautify preflight OK: seed=% prefix_projects=% prefix_announcements=%',
    v_seed_n, v_prefix_projects, v_prefix_announcements;
END $$;

-- ---------------------------------------------------------------------------
-- A. Strip public "[IA Seed] " from seed project titles / copy only
-- ---------------------------------------------------------------------------
UPDATE public.projects p
SET
  title = regexp_replace(p.title, '^\[IA Seed\]\s*', ''),
  description = regexp_replace(coalesce(p.description, ''), '^\[IA Seed\]\s*', ''),
  overview_introduction = CASE
    WHEN p.overview_introduction IS NULL THEN NULL
    ELSE regexp_replace(p.overview_introduction, '^\[IA Seed\]\s*', '')
  END,
  updated_at = now()
WHERE p.id::text LIKE 'eeeeeeee-eeee-4eee-8eee-%'
  AND 'forge-ia-seed-v1' = ANY (coalesce(p.tags, '{}'::text[]))
  AND p.id NOT IN (
    '41ff5a96-105c-42a2-87b4-787bcfeacb45'::uuid,
    'dddddddd-dddd-4ddd-8ddd-000000000203'::uuid
  )
  AND (
    p.title LIKE '[IA Seed]%'
    OR coalesce(p.description, '') LIKE '[IA Seed]%'
    OR coalesce(p.overview_introduction, '') LIKE '[IA Seed]%'
  );

-- ---------------------------------------------------------------------------
-- B. Strip "[IA Seed]" from seed announcement title/body
-- ---------------------------------------------------------------------------
UPDATE public.platform_announcements a
SET
  title = regexp_replace(a.title, '^\[IA Seed\]\s*', ''),
  body = regexp_replace(a.body, '^\[IA Seed\]\s*', ''),
  updated_at = now()
WHERE a.id::text LIKE 'aaaaaaaa-aaaa-4aaa-8aaa-%'
  AND (
    a.title LIKE '[IA Seed]%'
    OR a.body LIKE '[IA Seed]%'
  );

-- ---------------------------------------------------------------------------
-- C. Assign Staging-only local thumbnails (38 projects; keep 2 noImage NULL)
-- ---------------------------------------------------------------------------
WITH assignments (project_id, image_path) AS (
  VALUES
    ('eeeeeeee-eeee-4eee-8eee-000000000001'::uuid, '/images/staging-only/player-ia/hero-wind-memory.webp'),
    ('eeeeeeee-eeee-4eee-8eee-000000000002'::uuid, '/images/staging-only/player-ia/dungeon-depths.webp'),
    ('eeeeeeee-eeee-4eee-8eee-000000000003'::uuid, '/images/staging-only/player-ia/neon-city.webp'),
    ('eeeeeeee-eeee-4eee-8eee-000000000005'::uuid, '/images/staging-only/player-ia/sea-voyage.webp'),
    ('eeeeeeee-eeee-4eee-8eee-000000000006'::uuid, '/images/staging-only/player-ia/village-story.webp'),
    ('eeeeeeee-eeee-4eee-8eee-000000000007'::uuid, '/images/staging-only/player-ia/witch-workshop.webp'),
    ('eeeeeeee-eeee-4eee-8eee-000000000008'::uuid, '/images/staging-only/player-ia/light-ruins.webp'),
    ('eeeeeeee-eeee-4eee-8eee-000000000009'::uuid, '/images/staging-only/player-ia/lofi-beats.webp'),
    ('eeeeeeee-eeee-4eee-8eee-000000000010'::uuid, '/images/staging-only/player-ia/orchestra.webp'),
    ('eeeeeeee-eeee-4eee-8eee-000000000011'::uuid, '/images/staging-only/player-ia/dungeon-bgm.webp'),
    ('eeeeeeee-eeee-4eee-8eee-000000000012'::uuid, '/images/staging-only/player-ia/ambient-forest.webp'),
    ('eeeeeeee-eeee-4eee-8eee-000000000013'::uuid, '/images/staging-only/player-ia/lofi-beats.webp'),
    ('eeeeeeee-eeee-4eee-8eee-000000000014'::uuid, '/images/staging-only/player-ia/orchestra.webp'),
    ('eeeeeeee-eeee-4eee-8eee-000000000015'::uuid, '/images/staging-only/player-ia/dungeon-bgm.webp'),
    ('eeeeeeee-eeee-4eee-8eee-000000000016'::uuid, '/images/staging-only/player-ia/ambient-forest.webp'),
    ('eeeeeeee-eeee-4eee-8eee-000000000017'::uuid, '/images/staging-only/player-ia/forest-tileset.webp'),
    ('eeeeeeee-eeee-4eee-8eee-000000000018'::uuid, '/images/staging-only/player-ia/village-tileset.webp'),
    ('eeeeeeee-eeee-4eee-8eee-000000000019'::uuid, '/images/staging-only/player-ia/fantasy-furniture.webp'),
    ('eeeeeeee-eeee-4eee-8eee-000000000020'::uuid, '/images/staging-only/player-ia/ui-animation-kit.webp'),
    ('eeeeeeee-eeee-4eee-8eee-000000000022'::uuid, '/images/staging-only/player-ia/japanese-arch.webp'),
    ('eeeeeeee-eeee-4eee-8eee-000000000023'::uuid, '/images/staging-only/player-ia/forest-tileset.webp'),
    ('eeeeeeee-eeee-4eee-8eee-000000000024'::uuid, '/images/staging-only/player-ia/ui-animation-kit.webp'),
    ('eeeeeeee-eeee-4eee-8eee-000000000025'::uuid, '/images/staging-only/player-ia/auth-sdk.webp'),
    ('eeeeeeee-eeee-4eee-8eee-000000000026'::uuid, '/images/staging-only/player-ia/savedata-plugin.webp'),
    ('eeeeeeee-eeee-4eee-8eee-000000000027'::uuid, '/images/staging-only/player-ia/logviewer.webp'),
    ('eeeeeeee-eeee-4eee-8eee-000000000028'::uuid, '/images/staging-only/player-ia/realtime-db.webp'),
    ('eeeeeeee-eeee-4eee-8eee-000000000029'::uuid, '/images/staging-only/player-ia/auth-sdk.webp'),
    ('eeeeeeee-eeee-4eee-8eee-000000000030'::uuid, '/images/staging-only/player-ia/savedata-plugin.webp'),
    ('eeeeeeee-eeee-4eee-8eee-000000000031'::uuid, '/images/staging-only/player-ia/logviewer.webp'),
    ('eeeeeeee-eeee-4eee-8eee-000000000032'::uuid, '/images/staging-only/player-ia/realtime-db.webp'),
    ('eeeeeeee-eeee-4eee-8eee-000000000033'::uuid, '/images/staging-only/player-ia/planly-app.webp'),
    ('eeeeeeee-eeee-4eee-8eee-000000000034'::uuid, '/images/staging-only/player-ia/mytracker-app.webp'),
    ('eeeeeeee-eeee-4eee-8eee-000000000035'::uuid, '/images/staging-only/player-ia/streamnote-app.webp'),
    ('eeeeeeee-eeee-4eee-8eee-000000000036'::uuid, '/images/staging-only/player-ia/cyber-buildings.webp'),
    ('eeeeeeee-eeee-4eee-8eee-000000000037'::uuid, '/images/staging-only/player-ia/planly-app.webp'),
    ('eeeeeeee-eeee-4eee-8eee-000000000038'::uuid, '/images/staging-only/player-ia/mytracker-app.webp'),
    ('eeeeeeee-eeee-4eee-8eee-000000000039'::uuid, '/images/staging-only/player-ia/streamnote-app.webp'),
    ('eeeeeeee-eeee-4eee-8eee-000000000040'::uuid, '/images/staging-only/player-ia/cyber-buildings.webp')
)
UPDATE public.projects p
SET
  thumbnail_url = a.image_path,
  thumbnail_urls = ARRAY[a.image_path]::text[],
  updated_at = now()
FROM assignments a
WHERE p.id = a.project_id
  AND 'forge-ia-seed-v1' = ANY (coalesce(p.tags, '{}'::text[]))
  AND (
    p.thumbnail_url IS DISTINCT FROM a.image_path
    OR coalesce(p.thumbnail_urls, '{}'::text[]) IS DISTINCT FROM ARRAY[a.image_path]::text[]
  );

UPDATE public.projects
SET
  thumbnail_url = NULL,
  thumbnail_urls = NULL,
  updated_at = now()
WHERE id IN (
  'eeeeeeee-eeee-4eee-8eee-000000000004'::uuid,
  'eeeeeeee-eeee-4eee-8eee-000000000021'::uuid
)
AND 'forge-ia-seed-v1' = ANY (coalesce(tags, '{}'::text[]))
AND (
  thumbnail_url IS NOT NULL
  OR thumbnail_urls IS NOT NULL
);

-- ---------------------------------------------------------------------------
-- Post-asserts (unexpected → rollback entire transaction)
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  v_seed_n integer;
  v_cat_bad integer;
  v_prefix_left integer;
  v_thumbs integer;
  v_no_image_ok integer;
  v_tag_ok integer;
  v_owner_changed integer;
  v_ann_prefix_left integer;
  v_ann_n integer;
  v_devlog_touched integer;
BEGIN
  SELECT count(*)::integer INTO v_seed_n
  FROM public.projects
  WHERE id::text LIKE 'eeeeeeee-eeee-4eee-8eee-%'
    AND 'forge-ia-seed-v1' = ANY (coalesce(tags, '{}'::text[]));

  IF v_seed_n <> 40 THEN
    RAISE EXCEPTION
      'ABORT beautify post: seed count % (expected 40)', v_seed_n;
  END IF;

  SELECT count(*)::integer INTO v_cat_bad
  FROM (
    SELECT coalesce(category, 'game') AS category, count(*) AS n
    FROM public.projects
    WHERE id::text LIKE 'eeeeeeee-eeee-4eee-8eee-%'
      AND 'forge-ia-seed-v1' = ANY (coalesce(tags, '{}'::text[]))
    GROUP BY 1
  ) c
  WHERE c.n <> 8;

  IF v_cat_bad <> 0 THEN
    RAISE EXCEPTION 'ABORT beautify post: category 8-each violated';
  END IF;

  SELECT count(*)::integer INTO v_prefix_left
  FROM public.projects
  WHERE id::text LIKE 'eeeeeeee-eeee-4eee-8eee-%'
    AND 'forge-ia-seed-v1' = ANY (coalesce(tags, '{}'::text[]))
    AND (
      title LIKE '[IA Seed]%'
      OR coalesce(description, '') LIKE '[IA Seed]%'
      OR coalesce(overview_introduction, '') LIKE '[IA Seed]%'
    );

  IF v_prefix_left <> 0 THEN
    RAISE EXCEPTION
      'ABORT beautify post: % projects still carry [IA Seed] prefix',
      v_prefix_left;
  END IF;

  SELECT count(*)::integer INTO v_thumbs
  FROM public.projects
  WHERE id::text LIKE 'eeeeeeee-eeee-4eee-8eee-%'
    AND thumbnail_url LIKE '/images/staging-only/player-ia/%';

  IF v_thumbs <> 38 THEN
    RAISE EXCEPTION
      'ABORT beautify post: staging-only thumbs=% (expected 38)', v_thumbs;
  END IF;

  SELECT count(*)::integer INTO v_no_image_ok
  FROM public.projects
  WHERE id IN (
    'eeeeeeee-eeee-4eee-8eee-000000000004'::uuid,
    'eeeeeeee-eeee-4eee-8eee-000000000021'::uuid
  )
  AND thumbnail_url IS NULL
  AND thumbnail_urls IS NULL;

  IF v_no_image_ok <> 2 THEN
    RAISE EXCEPTION 'ABORT beautify post: noImage edge cases not NULL';
  END IF;

  SELECT count(*)::integer INTO v_tag_ok
  FROM public.projects
  WHERE id::text LIKE 'eeeeeeee-eeee-4eee-8eee-%'
    AND 'forge-ia-seed-v1' = ANY (coalesce(tags, '{}'::text[]));

  IF v_tag_ok <> 40 THEN
    RAISE EXCEPTION 'ABORT beautify post: forge-ia-seed-v1 tag missing on some seeds';
  END IF;

  -- owner_id must remain non-null on all seeds (never rewritten by this script)
  SELECT count(*)::integer INTO v_owner_changed
  FROM public.projects
  WHERE id::text LIKE 'eeeeeeee-eeee-4eee-8eee-%'
    AND owner_id IS NULL;

  IF v_owner_changed <> 0 THEN
    RAISE EXCEPTION 'ABORT beautify post: seed owner_id became NULL';
  END IF;

  SELECT count(*)::integer INTO v_ann_n
  FROM public.platform_announcements
  WHERE id::text LIKE 'aaaaaaaa-aaaa-4aaa-8aaa-%';

  IF v_ann_n <> 8 THEN
    RAISE EXCEPTION 'ABORT beautify post: announcement seed count % (expected 8)', v_ann_n;
  END IF;

  SELECT count(*)::integer INTO v_ann_prefix_left
  FROM public.platform_announcements
  WHERE id::text LIKE 'aaaaaaaa-aaaa-4aaa-8aaa-%'
    AND (
      title LIKE '[IA Seed]%'
      OR body LIKE '[IA Seed]%'
    );

  IF v_ann_prefix_left <> 0 THEN
    RAISE EXCEPTION
      'ABORT beautify post: % announcements still carry [IA Seed] prefix',
      v_ann_prefix_left;
  END IF;

  -- Safety: this script must never have updated project_devlogs. Prefix may remain.
  SELECT count(*)::integer INTO v_devlog_touched
  FROM public.project_devlogs
  WHERE id::text LIKE '66666666-6666-4666-8666-%'
    AND content NOT LIKE '[IA Seed]%'
    AND title NOT LIKE '[IA Seed]%';

  -- Do not fail if seed was regenerated without prefix; only ensure we did not
  -- require content mutation. Immutable rows may still be prefixed — that is OK.
  RAISE NOTICE 'beautify post: seed_devlogs with both title+content unprefixed=% (informational)', v_devlog_touched;
END $$;

COMMIT;

SELECT
  'beautify-player-ia-seed-display OK' AS status,
  (
    SELECT count(*) FROM public.projects
    WHERE id::text LIKE 'eeeeeeee-eeee-4eee-8eee-%'
      AND 'forge-ia-seed-v1' = ANY (coalesce(tags, '{}'::text[]))
  ) AS seed_project_count,
  (
    SELECT count(*) FROM public.projects
    WHERE id::text LIKE 'eeeeeeee-eeee-4eee-8eee-%'
      AND (
        title LIKE '[IA Seed]%'
        OR coalesce(description, '') LIKE '[IA Seed]%'
      )
  ) AS projects_still_prefixed,
  (
    SELECT count(*) FROM public.projects
    WHERE id::text LIKE 'eeeeeeee-eeee-4eee-8eee-%'
      AND thumbnail_url LIKE '/images/staging-only/player-ia/%'
  ) AS staging_only_thumb_count,
  (
    SELECT count(*) FROM public.projects
    WHERE id IN (
      'eeeeeeee-eeee-4eee-8eee-000000000004'::uuid,
      'eeeeeeee-eeee-4eee-8eee-000000000021'::uuid
    )
    AND thumbnail_url IS NULL
  ) AS no_image_edge_count,
  (
    SELECT count(*) FROM public.platform_announcements
    WHERE id::text LIKE 'aaaaaaaa-aaaa-4aaa-8aaa-%'
      AND title NOT LIKE '[IA Seed]%'
      AND body NOT LIKE '[IA Seed]%'
  ) AS announcements_cleaned_count,
  0 AS immutable_table_updates;
