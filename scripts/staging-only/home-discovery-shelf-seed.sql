-- STAGING ONLY (vuqpwvjvgyxffmvpfrxo)
-- Home discovery shelf verification seed (projects C–F)
-- Does NOT mutate Smoke A / B.
-- DO NOT run on Production.
--
-- Apply: Staging Dashboard SQL Editor → Run
-- Rollback: see bottom of this file (or scripts/staging-only/home-discovery-shelf-seed.mjs --rollback)

BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.projects
    WHERE id = '41ff5a96-105c-42a2-87b4-787bcfeacb45'::uuid
      AND visibility = 'public'
  ) THEN
    RAISE EXCEPTION 'ABORT: Smoke A missing — wrong project?';
  END IF;
END $$;

-- Allow explicit first_published_at for label variety (re-enable after inserts).
ALTER TABLE public.projects DISABLE TRIGGER projects_set_first_published_at;

INSERT INTO public.projects (
  id, owner_id, owner_name, title, creator, genre, genres, description,
  overview_introduction, phase, status, looking_for_testers, section,
  thumbnail_url, thumbnail_urls, tags, play_url, visibility, playable_version,
  release_status, first_published_at
)
SELECT
  v.id::uuid,
  p.owner_id,
  COALESCE(p.owner_name, p.creator, 'Staging Owner'),
  v.title,
  COALESCE(p.creator, p.owner_name, 'Staging Owner'),
  v.genre,
  ARRAY[v.genre],
  '[home-discovery-shelf-seed] Staging-only shelf verification. Do not promote to production.',
  '[home-discovery-shelf-seed] ' || v.role,
  'アルファ', 'アルファ', false, 'new',
  '/images/landing/game-2.png',
  ARRAY['/images/landing/game-2.png'],
  ARRAY['staging', 'home-discovery-seed'],
  'https://example.com/forge-home-seed',
  'public', '0.1', 'in_development',
  v.first_published_at
FROM public.projects p
CROSS JOIN (
  VALUES
    ('cccccccc-cccc-4ccc-8ddd-000000000001', 'Home Seed C (newest-only)', 'アドベンチャー', 'newest_head', now() - interval '3 hours'),
    ('cccccccc-cccc-4ccc-8ddd-000000000002', 'Home Seed D (updated)', 'シミュレーション', 'updated_head', now() - interval '2 days'),
    ('cccccccc-cccc-4ccc-8ddd-000000000003', 'Home Seed E (trending)', 'RPG', 'trending_head', now() - interval '4 days'),
    ('cccccccc-cccc-4ccc-8ddd-000000000004', 'Home Seed F (shelf filler)', 'パズル', 'shelf_filler', now() - interval '1 days')
) AS v(id, title, genre, role, first_published_at)
WHERE p.id = '41ff5a96-105c-42a2-87b4-787bcfeacb45'::uuid
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  overview_introduction = EXCLUDED.overview_introduction,
  genre = EXCLUDED.genre,
  genres = EXCLUDED.genres,
  thumbnail_url = EXCLUDED.thumbnail_url,
  visibility = 'public';

ALTER TABLE public.projects ENABLE TRIGGER projects_set_first_published_at;

-- Meaningful updates (must be after first_published_at)
INSERT INTO public.project_devlogs (
  id, project_id, author_id, title, content, published_version,
  is_initial_publish, created_at, published_at
)
VALUES
  (
    'cccccccc-cccc-4ccc-8ddd-100000000002',
    'cccccccc-cccc-4ccc-8ddd-000000000002',
    '4bdc4a2f-2a39-4599-a14c-91303310ef56',
    '[home-discovery-shelf-seed] meaningful update D',
    'Non-initial update for updated shelf.',
    '0.1.1', false,
    now() - interval '6 hours',
    now() - interval '6 hours'
  ),
  (
    'cccccccc-cccc-4ccc-8ddd-100000000004',
    'cccccccc-cccc-4ccc-8ddd-000000000004',
    '4bdc4a2f-2a39-4599-a14c-91303310ef56',
    '[home-discovery-shelf-seed] meaningful update F',
    'Secondary update for updated shelf filler.',
    '0.1.1', false,
    now() - interval '20 hours',
    now() - interval '20 hours'
  )
ON CONFLICT (id) DO UPDATE SET
  created_at = EXCLUDED.created_at,
  published_at = EXCLUDED.published_at,
  is_initial_publish = false;

-- Engager: reuse existing Smoke A voice user (no new auth user required)
DO $$
DECLARE
  v_engager uuid;
BEGIN
  SELECT vr.user_id INTO v_engager
  FROM public.project_voice_responses vr
  WHERE vr.project_id = '41ff5a96-105c-42a2-87b4-787bcfeacb45'
    AND vr.user_id IS NOT NULL
  ORDER BY vr.created_at DESC
  LIMIT 1;

  IF v_engager IS NULL THEN
    RAISE EXCEPTION 'ABORT: no engager user_id found on Smoke A voices';
  END IF;

  INSERT INTO public.project_feedback (
    id, user_id, project_id, version_key, good_points,
    moderation_status, created_at, updated_at
  )
  VALUES
    (
      'cccccccc-cccc-4ccc-8ddd-200000000003',
      v_engager,
      'cccccccc-cccc-4ccc-8ddd-000000000003',
      '0.1',
      '[home-discovery-shelf-seed] trending feedback',
      'visible',
      now() - interval '30 hours',
      now() - interval '30 hours'
    ),
    (
      'cccccccc-cccc-4ccc-8ddd-200000000004',
      v_engager,
      'cccccccc-cccc-4ccc-8ddd-000000000004',
      '0.1',
      '[home-discovery-shelf-seed] filler feedback',
      'visible',
      now() - interval '40 hours',
      now() - interval '40 hours'
    )
  ON CONFLICT (id) DO UPDATE SET
    moderation_status = 'visible',
    created_at = EXCLUDED.created_at,
    updated_at = EXCLUDED.updated_at;

  DELETE FROM public.project_watches
  WHERE project_id IN (
    'cccccccc-cccc-4ccc-8ddd-000000000003',
    'cccccccc-cccc-4ccc-8ddd-000000000004'
  )
    AND user_id = v_engager;

  INSERT INTO public.project_watches (user_id, project_id, created_at)
  VALUES
    (v_engager, 'cccccccc-cccc-4ccc-8ddd-000000000003', now() - interval '28 hours'),
    (v_engager, 'cccccccc-cccc-4ccc-8ddd-000000000004', now() - interval '36 hours');
END $$;

COMMIT;

-- Quick check (run after):
-- SELECT section, rank, title FROM public.get_home_discovery_feed() ORDER BY section, rank;

-- ---------------------------------------------------------------------------
-- ROLLBACK (Staging only) — run separately when done verifying
-- ---------------------------------------------------------------------------
-- BEGIN;
-- DELETE FROM public.project_feedback WHERE project_id LIKE 'cccccccc-cccc-4ccc-8ddd-00000000000%';
-- DELETE FROM public.project_watches WHERE project_id LIKE 'cccccccc-cccc-4ccc-8ddd-00000000000%';
-- DELETE FROM public.project_voice_responses WHERE project_id LIKE 'cccccccc-cccc-4ccc-8ddd-00000000000%';
-- DELETE FROM public.project_devlogs WHERE project_id LIKE 'cccccccc-cccc-4ccc-8ddd-00000000000%';
-- DELETE FROM public.project_play_sessions WHERE project_id LIKE 'cccccccc-cccc-4ccc-8ddd-00000000000%';
-- DELETE FROM public.projects WHERE id IN (
--   'cccccccc-cccc-4ccc-8ddd-000000000001',
--   'cccccccc-cccc-4ccc-8ddd-000000000002',
--   'cccccccc-cccc-4ccc-8ddd-000000000003',
--   'cccccccc-cccc-4ccc-8ddd-000000000004'
-- );
-- COMMIT;
