-- STAGING ONLY — beautify Player IA seed public display (titles / announcements / thumbnails)
-- Target ref: vuqpwvjvgyxffmvpfrxo
-- DO NOT run on Production (bpnisgzxuwdxelhnduuf).
--
-- Scope:
--   - forge-ia-seed-v1 tagged projects OR fixed UUID prefix eeeeeeee-eeee-4eee-8eee-*
--   - forge-ia-seed announcements aaaaaaaa-aaaa-4aaa-8aaa-*
-- Does NOT:
--   - change owner_id / profiles
--   - touch Smoke / hero projects
--   - remove seed tags or fixed UUIDs (cleanup remains possible)
--   - assign images to the 2 noImage edge-case projects
-- Idempotent: safe to re-run.

BEGIN;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.projects
    WHERE id = '41ff5a96-105c-42a2-87b4-787bcfeacb45'::uuid
      AND visibility = 'public'
  ) IS FALSE THEN
    RAISE EXCEPTION
      'ABORT beautify-player-ia-seed-display: Staging Smoke A missing — refuse (wrong project / Production?)';
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- A. Strip public "[IA Seed] " prefix from seed project titles / copy
--    Keep tags including forge-ia-seed-v1 and fixed UUIDs.
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
WHERE (
    p.id::text LIKE 'eeeeeeee-eeee-4eee-8eee-%'
    OR 'forge-ia-seed-v1' = ANY (coalesce(p.tags, '{}'::text[]))
  )
  AND (
    p.title LIKE '[IA Seed]%'
    OR coalesce(p.description, '') LIKE '[IA Seed]%'
    OR coalesce(p.overview_introduction, '') LIKE '[IA Seed]%'
  );

-- ---------------------------------------------------------------------------
-- B. Strip "[IA Seed]" from published announcement title/body (public copy)
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

-- Seed meaningful-update copy (devlog / release note) — public shelf summaries
UPDATE public.project_devlogs d
SET
  title = regexp_replace(d.title, '^\[IA Seed\]\s*', ''),
  content = regexp_replace(d.content, '^\[IA Seed\]\s*', '')
WHERE d.id::text LIKE '66666666-6666-4666-8666-%'
  AND (
    d.title LIKE '[IA Seed]%'
    OR d.content LIKE '[IA Seed]%'
  );

UPDATE public.project_release_events e
SET
  note = regexp_replace(e.note, '^\[IA Seed\]\s*', '')
WHERE e.id::text LIKE '55555555-5555-4555-8555-%'
  AND coalesce(e.note, '') LIKE '[IA Seed]%';

-- ---------------------------------------------------------------------------
-- C. Assign Staging-only local thumbnails (diverse by category)
--    Paths are served by public thumbnail API for /images/staging-only/** only.
--    Keep noImage edge cases NULL:
--      eeee…0004 (カード構築デュエル)
--      eeee…0021 (テクスチャ＆マテリアル)
-- ---------------------------------------------------------------------------
WITH assignments (project_id, image_path) AS (
  VALUES
    -- game (skip 004)
    ('eeeeeeee-eeee-4eee-8eee-000000000001'::uuid, '/images/staging-only/player-ia/hero-wind-memory.webp'),
    ('eeeeeeee-eeee-4eee-8eee-000000000002'::uuid, '/images/staging-only/player-ia/dungeon-depths.webp'),
    ('eeeeeeee-eeee-4eee-8eee-000000000003'::uuid, '/images/staging-only/player-ia/neon-city.webp'),
    ('eeeeeeee-eeee-4eee-8eee-000000000005'::uuid, '/images/staging-only/player-ia/sea-voyage.webp'),
    ('eeeeeeee-eeee-4eee-8eee-000000000006'::uuid, '/images/staging-only/player-ia/village-story.webp'),
    ('eeeeeeee-eeee-4eee-8eee-000000000007'::uuid, '/images/staging-only/player-ia/witch-workshop.webp'),
    ('eeeeeeee-eeee-4eee-8eee-000000000008'::uuid, '/images/staging-only/player-ia/light-ruins.webp'),
    -- audio
    ('eeeeeeee-eeee-4eee-8eee-000000000009'::uuid, '/images/staging-only/player-ia/lofi-beats.webp'),
    ('eeeeeeee-eeee-4eee-8eee-000000000010'::uuid, '/images/staging-only/player-ia/orchestra.webp'),
    ('eeeeeeee-eeee-4eee-8eee-000000000011'::uuid, '/images/staging-only/player-ia/dungeon-bgm.webp'),
    ('eeeeeeee-eeee-4eee-8eee-000000000012'::uuid, '/images/staging-only/player-ia/ambient-forest.webp'),
    ('eeeeeeee-eeee-4eee-8eee-000000000013'::uuid, '/images/staging-only/player-ia/lofi-beats.webp'),
    ('eeeeeeee-eeee-4eee-8eee-000000000014'::uuid, '/images/staging-only/player-ia/orchestra.webp'),
    ('eeeeeeee-eeee-4eee-8eee-000000000015'::uuid, '/images/staging-only/player-ia/dungeon-bgm.webp'),
    ('eeeeeeee-eeee-4eee-8eee-000000000016'::uuid, '/images/staging-only/player-ia/ambient-forest.webp'),
    -- asset (skip 021)
    ('eeeeeeee-eeee-4eee-8eee-000000000017'::uuid, '/images/staging-only/player-ia/forest-tileset.webp'),
    ('eeeeeeee-eeee-4eee-8eee-000000000018'::uuid, '/images/staging-only/player-ia/village-tileset.webp'),
    ('eeeeeeee-eeee-4eee-8eee-000000000019'::uuid, '/images/staging-only/player-ia/fantasy-furniture.webp'),
    ('eeeeeeee-eeee-4eee-8eee-000000000020'::uuid, '/images/staging-only/player-ia/ui-animation-kit.webp'),
    ('eeeeeeee-eeee-4eee-8eee-000000000022'::uuid, '/images/staging-only/player-ia/japanese-arch.webp'),
    ('eeeeeeee-eeee-4eee-8eee-000000000023'::uuid, '/images/staging-only/player-ia/forest-tileset.webp'),
    ('eeeeeeee-eeee-4eee-8eee-000000000024'::uuid, '/images/staging-only/player-ia/ui-animation-kit.webp'),
    -- dev-tool
    ('eeeeeeee-eeee-4eee-8eee-000000000025'::uuid, '/images/staging-only/player-ia/auth-sdk.webp'),
    ('eeeeeeee-eeee-4eee-8eee-000000000026'::uuid, '/images/staging-only/player-ia/savedata-plugin.webp'),
    ('eeeeeeee-eeee-4eee-8eee-000000000027'::uuid, '/images/staging-only/player-ia/logviewer.webp'),
    ('eeeeeeee-eeee-4eee-8eee-000000000028'::uuid, '/images/staging-only/player-ia/realtime-db.webp'),
    ('eeeeeeee-eeee-4eee-8eee-000000000029'::uuid, '/images/staging-only/player-ia/auth-sdk.webp'),
    ('eeeeeeee-eeee-4eee-8eee-000000000030'::uuid, '/images/staging-only/player-ia/savedata-plugin.webp'),
    ('eeeeeeee-eeee-4eee-8eee-000000000031'::uuid, '/images/staging-only/player-ia/logviewer.webp'),
    ('eeeeeeee-eeee-4eee-8eee-000000000032'::uuid, '/images/staging-only/player-ia/realtime-db.webp'),
    -- service-app
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
  AND (
    p.thumbnail_url IS DISTINCT FROM a.image_path
    OR coalesce(p.thumbnail_urls, '{}'::text[]) IS DISTINCT FROM ARRAY[a.image_path]::text[]
  );

-- Explicitly keep noImage edge cases NULL (idempotent).
UPDATE public.projects
SET
  thumbnail_url = NULL,
  thumbnail_urls = NULL,
  updated_at = now()
WHERE id IN (
  'eeeeeeee-eeee-4eee-8eee-000000000004'::uuid,
  'eeeeeeee-eeee-4eee-8eee-000000000021'::uuid
)
AND (
  thumbnail_url IS NOT NULL
  OR thumbnail_urls IS NOT NULL
);

COMMIT;

SELECT
  'beautify-player-ia-seed-display OK' AS status,
  (SELECT count(*) FROM public.projects
     WHERE id::text LIKE 'eeeeeeee-eeee-4eee-8eee-%'
       AND title NOT LIKE '[IA Seed]%') AS seed_titles_clean,
  (SELECT count(*) FROM public.projects
     WHERE id::text LIKE 'eeeeeeee-eeee-4eee-8eee-%'
       AND thumbnail_url LIKE '/images/staging-only/player-ia/%') AS seed_local_thumbs,
  (SELECT count(*) FROM public.projects
     WHERE id IN (
       'eeeeeeee-eeee-4eee-8eee-000000000004'::uuid,
       'eeeeeeee-eeee-4eee-8eee-000000000021'::uuid
     )
     AND thumbnail_url IS NULL) AS no_image_edge_ok;
