-- STAGING ONLY: featured-hero visibility fixtures.
-- Target Supabase ref: vuqpwvjvgyxffmvpfrxo.
-- PRODUCTION HARD STOP: NEVER run on bpnisgzxuwdxelhnduuf.
-- This script requires the known Staging Smoke project and four existing
-- forge-ia-seed-v1 game projects; absence aborts the whole transaction.
--
-- Owner-applied only. Cursor must not apply this file to Staging or Production.
--
-- Why not UPDATE …000003.first_published_at:
--   Migration 050 trigger projects_set_first_published_at makes an existing
--   first_published_at immutable on UPDATE (NEW := OLD). ROW_COUNT can be 1
--   while the timestamp is unchanged — that is why the fixed Aug-1 bump still
--   failed on Staging with newest=…000028 (dev-tool) and expected pairs=3.
--   Local PGlite without that trigger was a false PASS.
--
-- Durable design (Staging-only):
--   reaction / rising_plays / updated still use shared games 001 / 002 / 004.
--   newest uses a dedicated game …000091 owned by Smoke A owner (not 0001/0002)
--   so soft owner diversity prefers it over …000028 even when axis_rank ties
--   are close. INSERT (not UPDATE) so trigger sets first_published_at = now().
--   Re-runs DELETE+INSERT the dedicated row so fpa refreshes without bypassing
--   the trigger. Never DISABLE TRIGGER / session_replication_role.
--
-- Fixed scope:
--   activity on projects eeeeeeee-eeee-4eee-8eee-000000000001..0004
--   dedicated newest project eeeeeeee-eeee-4eee-8eee-000000000091
--   activity ids 46464646-* / 47474747-* / 49494949-*
--   reaction FB reuses player-ia seed id 99999999-9999-4999-8999-000000000001
-- UPDATE allowlist (fixed fixture rows only):
--   project_watches.created_at
--   project_play_sessions.version_key, played_at, context
--   project_feedback.moderation_status, created_at, updated_at
--     (id 99999999-9999-4999-8999-000000000001 only; good_points body not rewritten)
--   project_devlogs.created_at
-- INSERT/DELETE allowlist:
--   projects id …000091 only (featured-dedicated newest game)
-- No shared project body / first_published_at / owner_id mutation.
-- No trigger, RLS, or constraint is bypassed.

BEGIN;

SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '60s';

DO $$
DECLARE
  v_project_count integer;
  v_user_count integer;
  v_smoke_owner uuid;
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.projects
    WHERE id = '41ff5a96-105c-42a2-87b4-787bcfeacb45'::uuid
      AND visibility = 'public'
  ) THEN
    RAISE EXCEPTION
      'ABORT featured hero seed: Staging Smoke fixture missing (wrong environment / Production?)';
  END IF;

  SELECT owner_id INTO v_smoke_owner
  FROM public.projects
  WHERE id = '41ff5a96-105c-42a2-87b4-787bcfeacb45'::uuid;
  IF v_smoke_owner IS NULL
     OR v_smoke_owner IN (
       'dddddddd-dddd-4ddd-8ddd-000000000001'::uuid,
       'dddddddd-dddd-4ddd-8ddd-000000000002'::uuid
     ) THEN
    RAISE EXCEPTION
      'ABORT featured hero seed: Smoke owner must be distinct from IA owners 0001/0002 (found %)',
      v_smoke_owner;
  END IF;

  SELECT count(*) INTO v_project_count
  FROM public.projects
  WHERE id IN (
    'eeeeeeee-eeee-4eee-8eee-000000000001'::uuid,
    'eeeeeeee-eeee-4eee-8eee-000000000002'::uuid,
    'eeeeeeee-eeee-4eee-8eee-000000000003'::uuid,
    'eeeeeeee-eeee-4eee-8eee-000000000004'::uuid
  )
    AND category = 'game'
    AND visibility = 'public'
    AND first_published_at IS NOT NULL
    AND 'forge-ia-seed-v1' = ANY (coalesce(tags, '{}'::text[]));
  IF v_project_count <> 4 THEN
    RAISE EXCEPTION
      'ABORT featured hero seed: expected 4 tagged public Staging games, found %',
      v_project_count;
  END IF;

  SELECT count(*) INTO v_user_count
  FROM auth.users
  WHERE id IN (
    'dddddddd-dddd-4ddd-8ddd-000000000101'::uuid,
    'dddddddd-dddd-4ddd-8ddd-000000000102'::uuid,
    'dddddddd-dddd-4ddd-8ddd-000000000103'::uuid,
    'dddddddd-dddd-4ddd-8ddd-000000000104'::uuid
  );
  IF v_user_count <> 4 THEN
    RAISE EXCEPTION
      'ABORT featured hero seed: expected 4 Staging player fixtures, found %',
      v_user_count;
  END IF;
END;
$$;

-- Dedicated newest game: DELETE+INSERT so 050 trigger assigns first_published_at=now().
-- Owner = Smoke A owner (≠ reaction/rising owners) → soft diversity penalty 0.
DELETE FROM public.project_release_events
WHERE project_id = 'eeeeeeee-eeee-4eee-8eee-000000000091'::uuid;

DELETE FROM public.project_devlogs
WHERE project_id = 'eeeeeeee-eeee-4eee-8eee-000000000091';

DELETE FROM public.project_watches
WHERE project_id = 'eeeeeeee-eeee-4eee-8eee-000000000091';

DELETE FROM public.project_play_sessions
WHERE project_id = 'eeeeeeee-eeee-4eee-8eee-000000000091';

DELETE FROM public.project_feedback
WHERE project_id = 'eeeeeeee-eeee-4eee-8eee-000000000091';

DELETE FROM public.projects
WHERE id = 'eeeeeeee-eeee-4eee-8eee-000000000091'::uuid
  AND 'forge-featured-hero-seed' = ANY (coalesce(tags, '{}'::text[]));

INSERT INTO public.projects (
  id, owner_id, owner_name, title, creator, genre, genres, description,
  overview_introduction, phase, status, looking_for_testers, tester_slots, section,
  thumbnail_url, thumbnail_urls, tags, play_url, visibility, playable_version,
  release_status, category, quick_try, usable_for_creation, stream_policy,
  stream_policy_note, asset_kinds, purpose_tags, category_attributes, player_counts,
  publish_destinations, estimated_play_time, play_access_type,
  official_url, github_url, discord_url, related_links
)
SELECT
  'eeeeeeee-eeee-4eee-8eee-000000000091'::uuid,
  smoke.owner_id,
  COALESCE(smoke.owner_name, smoke.creator, 'Featured Hero Seed Owner'),
  '[Featured Hero Seed] Newest game fixture',
  COALESCE(smoke.creator, smoke.owner_name, 'Featured Hero Seed Owner'),
  COALESCE(src.genre, 'アクション'),
  COALESCE(src.genres, ARRAY['アクション']::text[]),
  '[Featured Hero Seed] Staging-only dedicated newest slot. Not a Production fixture.',
  '[Featured Hero Seed] Dedicated newest carousel fixture for /home/game.',
  COALESCE(src.phase, smoke.phase, 'playable'),
  COALESCE(src.status, smoke.status, 'open'),
  false,
  NULL,
  COALESCE(src.section, smoke.section, 'new'),
  COALESCE(src.thumbnail_url, smoke.thumbnail_url),
  COALESCE(src.thumbnail_urls, smoke.thumbnail_urls, ARRAY[]::text[]),
  ARRAY['forge-featured-hero-seed', 'forge-ia-seed-v1', 'PC対応']::text[],
  COALESCE(src.play_url, smoke.play_url, 'https://example.com/forge-featured-hero/newest'),
  'public',
  COALESCE(src.playable_version, '0.1'),
  COALESCE(src.release_status, smoke.release_status, 'in_development'),
  'game',
  true,
  false,
  COALESCE(src.stream_policy, 'unset'),
  NULL,
  COALESCE(src.asset_kinds, ARRAY[]::text[]),
  COALESCE(src.purpose_tags, ARRAY[]::text[]),
  COALESCE(src.category_attributes, '{}'::jsonb),
  COALESCE(src.player_counts, ARRAY['1人']::text[]),
  COALESCE(src.publish_destinations, '[]'::jsonb),
  COALESCE(src.estimated_play_time, '5〜15分'),
  COALESCE(src.play_access_type, 'free'),
  NULL,
  NULL,
  NULL,
  '[]'::jsonb
FROM public.projects smoke
LEFT JOIN public.projects src
  ON src.id = 'eeeeeeee-eeee-4eee-8eee-000000000003'::uuid
WHERE smoke.id = '41ff5a96-105c-42a2-87b4-787bcfeacb45'::uuid;

-- Reaction candidate: refresh the existing forge-ia-seed-v1 FB on game 1
-- (user 101 / project 001 / ver 0.2). Inserting a second row with a new id
-- collides with project_feedback_user_project_version_idx.
-- Body (good_points) is intentionally NOT rewritten.
INSERT INTO public.project_feedback (
  id, user_id, project_id, version_key, good_points,
  would_replay, moderation_status, created_at, updated_at
)
VALUES (
  '99999999-9999-4999-8999-000000000001'::uuid,
  'dddddddd-dddd-4ddd-8ddd-000000000101'::uuid,
  'eeeeeeee-eeee-4eee-8eee-000000000001',
  '0.2',
  '短文FB #1: テンポが良いです。',
  'yes',
  'visible',
  now() - interval '10 minutes',
  now() - interval '10 minutes'
)
ON CONFLICT (user_id, project_id, version_key) DO UPDATE SET
  moderation_status = 'visible',
  created_at = EXCLUDED.created_at,
  updated_at = EXCLUDED.updated_at
WHERE public.project_feedback.id =
  '99999999-9999-4999-8999-000000000001'::uuid;

INSERT INTO public.project_watches (user_id, project_id, created_at)
VALUES
  (
    'dddddddd-dddd-4ddd-8ddd-000000000101'::uuid,
    'eeeeeeee-eeee-4eee-8eee-000000000001',
    now() - interval '9 minutes'
  ),
  (
    'dddddddd-dddd-4ddd-8ddd-000000000102'::uuid,
    'eeeeeeee-eeee-4eee-8eee-000000000001',
    now() - interval '8 minutes'
  ),
  (
    'dddddddd-dddd-4ddd-8ddd-000000000103'::uuid,
    'eeeeeeee-eeee-4eee-8eee-000000000001',
    now() - interval '7 minutes'
  ),
  (
    'dddddddd-dddd-4ddd-8ddd-000000000104'::uuid,
    'eeeeeeee-eeee-4eee-8eee-000000000001',
    now() - interval '6 minutes'
  )
ON CONFLICT (user_id, project_id) DO UPDATE
SET created_at = EXCLUDED.created_at;

-- Rising candidate: game 2 has four current players.
INSERT INTO public.project_play_sessions (
  id, user_id, project_id, version_key, played_at, context, created_at
)
VALUES
  (
    '47474747-4747-4747-8747-000000000001'::uuid,
    'dddddddd-dddd-4ddd-8ddd-000000000101'::uuid,
    'eeeeeeee-eeee-4eee-8eee-000000000002',
    '0.3', now() - interval '5 minutes', 'general', now()
  ),
  (
    '47474747-4747-4747-8747-000000000002'::uuid,
    'dddddddd-dddd-4ddd-8ddd-000000000102'::uuid,
    'eeeeeeee-eeee-4eee-8eee-000000000002',
    '0.3', now() - interval '4 minutes', 'general', now()
  ),
  (
    '47474747-4747-4747-8747-000000000003'::uuid,
    'dddddddd-dddd-4ddd-8ddd-000000000103'::uuid,
    'eeeeeeee-eeee-4eee-8eee-000000000002',
    '0.3', now() - interval '3 minutes', 'general', now()
  ),
  (
    '47474747-4747-4747-8747-000000000004'::uuid,
    'dddddddd-dddd-4ddd-8ddd-000000000104'::uuid,
    'eeeeeeee-eeee-4eee-8eee-000000000002',
    '0.3', now() - interval '2 minutes', 'general', now()
  )
ON CONFLICT (id) DO UPDATE SET
  version_key = EXCLUDED.version_key,
  played_at = EXCLUDED.played_at,
  context = EXCLUDED.context;

-- Updated candidate: a non-initial devlog on game 4. Re-runs refresh only the
-- fixed fixture timestamp; title/content are never updated.
INSERT INTO public.project_devlogs (
  id, project_id, author_id, title, content,
  published_version, is_initial_publish, created_at, published_at
)
VALUES (
  '49494949-4949-4949-8949-000000000001'::uuid,
  'eeeeeeee-eeee-4eee-8eee-000000000004',
  (
    SELECT owner_id
    FROM public.projects
    WHERE id = 'eeeeeeee-eeee-4eee-8eee-000000000004'::uuid
  ),
  '[IA Seed] featured hero recent update',
  '[IA Seed] fixed Staging fixture; body is never mutated on re-run.',
  NULL,
  false,
  now() - interval '30 seconds',
  NULL
)
ON CONFLICT (id) DO UPDATE SET
  created_at = EXCLUDED.created_at;

-- Keep a fixed immutable release event as a second meaningful-event path.
INSERT INTO public.project_release_events (
  id, project_id, event_type, actor_user_id, note, source, created_at
)
VALUES (
  '46464646-4646-4646-8646-000000000001'::uuid,
  'eeeeeeee-eeee-4eee-8eee-000000000004'::uuid,
  'released',
  (
    SELECT owner_id
    FROM public.projects
    WHERE id = 'eeeeeeee-eeee-4eee-8eee-000000000004'::uuid
  ),
  '[IA Seed] featured hero meaningful update fixture',
  'studio',
  now()
)
ON CONFLICT (id) DO NOTHING;

DO $$
DECLARE
  v_watch_count integer;
  v_play_count integer;
  v_feedback_count integer;
  v_feedback_body text;
  v_release_count integer;
  v_updated_count integer;
  v_rising_delta integer;
  v_newest_axis_rank integer;
  v_newest_owner uuid;
  v_reaction_owner uuid;
  v_rising_owner uuid;
  v_dedicated_fpa timestamptz;
  v_peer_028_fpa timestamptz;
  v_slot_count integer;
  v_expected_slot_count integer;
BEGIN
  SELECT count(*) INTO v_watch_count
  FROM public.project_watches
  WHERE project_id = 'eeeeeeee-eeee-4eee-8eee-000000000001'
    AND user_id IN (
      'dddddddd-dddd-4ddd-8ddd-000000000101'::uuid,
      'dddddddd-dddd-4ddd-8ddd-000000000102'::uuid,
      'dddddddd-dddd-4ddd-8ddd-000000000103'::uuid,
      'dddddddd-dddd-4ddd-8ddd-000000000104'::uuid
    )
    AND created_at >= now() - interval '7 days';
  IF v_watch_count <> 4 THEN
    RAISE EXCEPTION 'Expected 4 fresh fixed-scope watches, found %', v_watch_count;
  END IF;

  SELECT count(*) INTO v_play_count
  FROM public.project_play_sessions
  WHERE id IN (
    '47474747-4747-4747-8747-000000000001'::uuid,
    '47474747-4747-4747-8747-000000000002'::uuid,
    '47474747-4747-4747-8747-000000000003'::uuid,
    '47474747-4747-4747-8747-000000000004'::uuid
  )
    AND played_at >= now() - interval '7 days';
  IF v_play_count <> 4 THEN
    RAISE EXCEPTION 'Expected 4 fresh fixed-scope plays, found %', v_play_count;
  END IF;

  SELECT count(*), max(good_points)
    INTO v_feedback_count, v_feedback_body
  FROM public.project_feedback
  WHERE id = '99999999-9999-4999-8999-000000000001'::uuid
    AND user_id = 'dddddddd-dddd-4ddd-8ddd-000000000101'::uuid
    AND project_id = 'eeeeeeee-eeee-4eee-8eee-000000000001'
    AND version_key = '0.2'
    AND moderation_status = 'visible'
    AND created_at >= now() - interval '7 days';
  IF v_feedback_count <> 1 THEN
    RAISE EXCEPTION 'Expected 1 fresh visible player-ia-reused FB row, found %',
      v_feedback_count;
  END IF;
  IF v_feedback_body IS DISTINCT FROM '短文FB #1: テンポが良いです。' THEN
    RAISE EXCEPTION 'Reaction FB body was rewritten unexpectedly: %', v_feedback_body;
  END IF;

  SELECT count(*) INTO v_release_count
  FROM public.project_release_events e
  INNER JOIN public.projects p ON p.id = e.project_id
  WHERE e.id = '46464646-4646-4646-8646-000000000001'::uuid
    AND e.event_type = 'released'
    AND e.source IS DISTINCT FROM 'onboarding'
    AND e.created_at > p.first_published_at;
  IF v_release_count <> 1 THEN
    RAISE EXCEPTION 'Expected 1 post-publish meaningful release event, found %',
      v_release_count;
  END IF;

  IF v_feedback_count + v_watch_count <= 0 THEN
    RAISE EXCEPTION 'Game 1 is not a reaction candidate';
  END IF;

  SELECT
    count(DISTINCT s.user_id) FILTER (
      WHERE s.played_at >= now() - interval '7 days'
    )::integer
    -
    count(DISTINCT s.user_id) FILTER (
      WHERE s.played_at >= now() - interval '14 days'
        AND s.played_at < now() - interval '7 days'
    )::integer
  INTO v_rising_delta
  FROM public.project_play_sessions s
  WHERE s.project_id = 'eeeeeeee-eeee-4eee-8eee-000000000002'
    AND s.user_id IS NOT NULL;
  IF v_rising_delta <= 0 THEN
    RAISE EXCEPTION 'Game 2 is not a rising candidate (delta %)', v_rising_delta;
  END IF;

  SELECT p.first_published_at, p.owner_id
    INTO v_dedicated_fpa, v_newest_owner
  FROM public.projects p
  WHERE p.id = 'eeeeeeee-eeee-4eee-8eee-000000000091'::uuid
    AND p.category = 'game'
    AND p.visibility = 'public'
    AND 'forge-featured-hero-seed' = ANY (coalesce(p.tags, '{}'::text[]));
  IF v_dedicated_fpa IS NULL THEN
    RAISE EXCEPTION 'Dedicated newest fixture …000091 missing or not public game';
  END IF;

  SELECT owner_id INTO v_reaction_owner
  FROM public.projects
  WHERE id = 'eeeeeeee-eeee-4eee-8eee-000000000001'::uuid;
  SELECT owner_id INTO v_rising_owner
  FROM public.projects
  WHERE id = 'eeeeeeee-eeee-4eee-8eee-000000000002'::uuid;
  IF v_newest_owner IS NULL
     OR v_newest_owner = v_reaction_owner
     OR v_newest_owner = v_rising_owner THEN
    RAISE EXCEPTION
      'Dedicated newest owner must differ from reaction/rising owners (newest %, reaction %, rising %)',
      v_newest_owner, v_reaction_owner, v_rising_owner;
  END IF;

  SELECT first_published_at INTO v_peer_028_fpa
  FROM public.projects
  WHERE id = 'eeeeeeee-eeee-4eee-8eee-000000000028'::uuid;
  IF v_peer_028_fpa IS NOT NULL AND v_dedicated_fpa < v_peer_028_fpa THEN
    RAISE EXCEPTION
      'Dedicated newest fpa % is older than peer …000028 % (INSERT trigger failed?)',
      v_dedicated_fpa, v_peer_028_fpa;
  END IF;

  SELECT ranked.axis_rank INTO v_newest_axis_rank
  FROM (
    SELECT
      p.id,
      row_number() OVER (
        ORDER BY p.first_published_at DESC, p.id ASC
      )::integer AS axis_rank
    FROM public.projects p
    WHERE p.visibility = 'public'
      AND p.first_published_at IS NOT NULL
  ) ranked
  WHERE ranked.id = 'eeeeeeee-eeee-4eee-8eee-000000000091'::uuid;
  IF v_newest_axis_rank IS NULL OR v_newest_axis_rank > 12 THEN
    RAISE EXCEPTION 'Dedicated newest is not a top-12 candidate (rank %)',
      v_newest_axis_rank;
  END IF;

  SELECT count(*) INTO v_updated_count
  FROM public.project_devlogs d
  INNER JOIN public.projects p ON p.id::text = d.project_id
  WHERE d.id = '49494949-4949-4949-8949-000000000001'::uuid
    AND d.is_initial_publish = false
    AND d.created_at > p.first_published_at
    AND d.created_at >= now() - interval '7 days';
  IF v_updated_count <> 1 THEN
    RAISE EXCEPTION 'Game 4 is not a fresh updated candidate';
  END IF;

  SELECT count(*) INTO v_slot_count
  FROM public.get_home_featured_hero();
  SELECT count(*) INTO v_expected_slot_count
  FROM public.get_home_featured_hero() h
  WHERE (h.featured_type = 'reaction'
      AND h.project_id = 'eeeeeeee-eeee-4eee-8eee-000000000001'::uuid)
     OR (h.featured_type = 'rising_plays'
      AND h.project_id = 'eeeeeeee-eeee-4eee-8eee-000000000002'::uuid)
     OR (h.featured_type = 'newest'
      AND h.project_id = 'eeeeeeee-eeee-4eee-8eee-000000000091'::uuid)
     OR (h.featured_type = 'updated'
      AND h.project_id = 'eeeeeeee-eeee-4eee-8eee-000000000004'::uuid);
  IF v_slot_count <> 4 OR v_expected_slot_count <> 4 THEN
    RAISE EXCEPTION
      'Featured hero is not scoped to the 4 intended seed games (rows %, expected pairs %). Soft owner diversity + immutable first_published_at require dedicated newest …000091 (not shared …000003 timestamp bumps).',
      v_slot_count, v_expected_slot_count;
  END IF;
END;
$$;

COMMIT;
