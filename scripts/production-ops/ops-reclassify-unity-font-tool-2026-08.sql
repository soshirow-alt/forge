-- =============================================================================
-- OWNER SQL EDITOR — Unity Font Tool 1件 recategorize (game → dev-tool)
-- Target: Production Supabase bpnisgzxuwdxelhnduuf
-- DO NOT run on Staging unless the same UUID is confirmed there.
-- DO NOT run 01–03. This file is a single-row data fix only.
-- Cursor has NOT executed this file.
-- =============================================================================
-- Target
--   id:    2d4c8cba-1e63-4f5f-927f-57c469f92d7c
--   title: Unity Font Tool v1.0.0
--   from:  game  (076 backfill default)
--   to:    dev-tool
--
-- Required row change: projects.category
-- Conditional cleanup (only when game leftover is present):
--   stream_policy / stream_policy_note  — game streaming fields
--   genres / genre                      — game catalog (genre is NOT NULL → '')
--   estimated_play_time / player_counts — game filters (085 leaks without category gate)
--   asset_kinds                         — asset-only
-- Left unchanged:
--   category_attributes  — expected '{}'; do not invent kinds/tools/features
--   quick_try / usable_for_creation — category-neutral 試し方
--   purpose_tags / tags  — not game-exclusive storage; do not wipe
-- =============================================================================

BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';

-- ---------------------------------------------------------------------------
-- 1. 実行前 SELECT（1行であること。0行/複数行ならここで止めて COMMIT しない）
-- ---------------------------------------------------------------------------
SELECT
  id,
  title,
  category,
  category_attributes,
  stream_policy,
  stream_policy_note,
  quick_try,
  usable_for_creation,
  asset_kinds,
  purpose_tags,
  genre,
  genres,
  estimated_play_time,
  player_counts,
  tags
FROM public.projects
WHERE id = '2d4c8cba-1e63-4f5f-927f-57c469f92d7c';

DO $$
DECLARE
  n integer;
  t text;
  c text;
BEGIN
  SELECT count(*), min(title), min(category)
    INTO n, t, c
  FROM public.projects
  WHERE id = '2d4c8cba-1e63-4f5f-927f-57c469f92d7c';

  IF n <> 1 THEN
    RAISE EXCEPTION 'precondition: expected exactly 1 row for Unity Font Tool id, got %', n;
  END IF;
  IF t IS DISTINCT FROM 'Unity Font Tool v1.0.0' THEN
    RAISE EXCEPTION 'precondition: title mismatch (got %)', t;
  END IF;
  IF c IS DISTINCT FROM 'game' THEN
    RAISE EXCEPTION 'precondition: category is %, not game — refuse (already recategorized?)', c;
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 2. UPDATE — id + title + category='game' の三重固定。他行に触れない
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  n integer;
BEGIN
  UPDATE public.projects
  SET
    category = 'dev-tool',
    stream_policy = CASE
      WHEN stream_policy IS DISTINCT FROM 'unset' THEN 'unset'
      ELSE stream_policy
    END,
    stream_policy_note = CASE
      WHEN stream_policy_note IS NOT NULL AND btrim(stream_policy_note) <> '' THEN NULL
      ELSE stream_policy_note
    END,
    genres = CASE
      WHEN cardinality(coalesce(genres, '{}')) > 0 THEN '{}'::text[]
      ELSE genres
    END,
    genre = CASE
      WHEN btrim(coalesce(genre, '')) <> '' THEN ''
      ELSE genre
    END,
    estimated_play_time = CASE
      WHEN estimated_play_time IS NOT NULL AND btrim(estimated_play_time) <> '' THEN NULL
      ELSE estimated_play_time
    END,
    player_counts = CASE
      WHEN cardinality(coalesce(player_counts, '{}')) > 0 THEN '{}'::text[]
      ELSE player_counts
    END,
    asset_kinds = CASE
      WHEN cardinality(coalesce(asset_kinds, '{}')) > 0 THEN '{}'::text[]
      ELSE asset_kinds
    END,
    updated_at = now()
  WHERE id = '2d4c8cba-1e63-4f5f-927f-57c469f92d7c'
    AND title = 'Unity Font Tool v1.0.0'
    AND category = 'game';

  GET DIAGNOSTICS n = ROW_COUNT;
  IF n <> 1 THEN
    RAISE EXCEPTION 'UPDATE affected % rows (expected 1) — rolling back', n;
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 3. 実行後 SELECT
-- ---------------------------------------------------------------------------
SELECT
  id,
  title,
  category,
  category_attributes,
  stream_policy,
  stream_policy_note,
  quick_try,
  usable_for_creation,
  asset_kinds,
  purpose_tags,
  genre,
  genres,
  estimated_play_time,
  player_counts,
  tags,
  updated_at
FROM public.projects
WHERE id = '2d4c8cba-1e63-4f5f-927f-57c469f92d7c';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.projects
    WHERE id = '2d4c8cba-1e63-4f5f-927f-57c469f92d7c'
      AND title = 'Unity Font Tool v1.0.0'
      AND category = 'dev-tool'
  ) THEN
    RAISE EXCEPTION 'postcondition failed: row is not dev-tool';
  END IF;
END $$;

COMMIT;
