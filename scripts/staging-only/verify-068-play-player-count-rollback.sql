-- Staging-only: verify get_public_project_stats.play_player_count vs raw project_plays
-- Paste into Supabase Staging Dashboard → SQL Editor as role **postgres**.
-- ONE transaction: BEGIN … ROLLBACK — no leftover rows.
-- Does NOT DELETE/UPDATE unrelated existing data; only INSERTs that roll back.
--
-- Fixtures (confirmed via Staging service_role read on 2026-07-15):
--   project: Staging Smoke A (thumbnail) = 41ff5a96-105c-42a2-87b4-787bcfeacb45 (public)
--   user A:  hc-u01@forge-st-hero-carousel.local = dddddddd-dddd-4ddd-8ddd-000000000101
--   user B:  hc-u02@forge-st-hero-carousel.local = dddddddd-dddd-4ddd-8ddd-000000000102
--
-- PK note: project_plays PRIMARY KEY (user_id, project_id) = one row per registered
-- player. "Multiple plays" for the same user = upsert/touch that one row; COUNT(DISTINCT
-- user_id) stays 1 for that user. There is no play_count column.

BEGIN;

DO $$
DECLARE
  v_project_id text := '41ff5a96-105c-42a2-87b4-787bcfeacb45';
  v_user_a uuid := 'dddddddd-dddd-4ddd-8ddd-000000000101';
  v_user_b uuid := 'dddddddd-dddd-4ddd-8ddd-000000000102';
  v_project_uuid uuid := '41ff5a96-105c-42a2-87b4-787bcfeacb45';
  v_proj_ok boolean;
  v_user_a_ok boolean;
  v_user_b_ok boolean;
  v_snap_distinct bigint;
  v_raw_distinct bigint;
  v_rpc_play bigint;
  v_rows_user_a bigint;
  v_rpc_row record;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM public.projects p
    WHERE p.id = v_project_uuid
      AND p.visibility = 'public'
  )
  INTO v_proj_ok;

  IF NOT v_proj_ok THEN
    RAISE EXCEPTION 'ABORT: Smoke A missing or not public (%). Fill TODO / pick another Staging smoke fixture.', v_project_id;
  END IF;

  SELECT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = v_user_a) INTO v_user_a_ok;
  SELECT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = v_user_b) INTO v_user_b_ok;

  IF NOT v_user_a_ok OR NOT v_user_b_ok THEN
    RAISE EXCEPTION
      'ABORT: fixture users missing (A=% ok=% ; B=% ok=%). Replace with two existing Staging test users.',
      v_user_a, v_user_a_ok, v_user_b, v_user_b_ok;
  END IF;

  -- 3) Snapshot original distinct player count for this project (read-only baseline)
  SELECT COUNT(DISTINCT pp.user_id)::bigint
  INTO v_snap_distinct
  FROM public.project_plays pp
  WHERE pp.project_id = v_project_id
    AND pp.user_id IS NOT NULL;

  RAISE NOTICE 'snapshot play_player distinct=% project=%', v_snap_distinct, v_project_id;

  -- 4) User A "multi-play": upsert then bump (same PK → still one row)
  INSERT INTO public.project_plays (user_id, project_id)
  VALUES (v_user_a, v_project_id)
  ON CONFLICT (user_id, project_id) DO UPDATE
    SET created_at = EXCLUDED.created_at;

  INSERT INTO public.project_plays (user_id, project_id)
  VALUES (v_user_a, v_project_id)
  ON CONFLICT (user_id, project_id) DO UPDATE
    SET created_at = now();

  INSERT INTO public.project_plays (user_id, project_id)
  VALUES (v_user_a, v_project_id)
  ON CONFLICT (user_id, project_id) DO UPDATE
    SET created_at = now();

  -- 5) User B: one play row
  INSERT INTO public.project_plays (user_id, project_id)
  VALUES (v_user_b, v_project_id)
  ON CONFLICT (user_id, project_id) DO UPDATE
    SET created_at = EXCLUDED.created_at;

  -- 6) Raw COUNT(DISTINCT user_id)
  SELECT COUNT(DISTINCT pp.user_id)::bigint
  INTO v_raw_distinct
  FROM public.project_plays pp
  WHERE pp.project_id = v_project_id
    AND pp.user_id IS NOT NULL;

  -- 7) RPC
  SELECT s.*
  INTO v_rpc_row
  FROM public.get_public_project_stats(ARRAY[v_project_uuid]::uuid[]) s
  WHERE s.project_id = v_project_uuid;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'ABORT: get_public_project_stats returned no row for Smoke A (068 missing or project filtered?)';
  END IF;

  v_rpc_play := v_rpc_row.play_player_count;

  -- 8) Assert raw = RPC
  IF v_raw_distinct IS DISTINCT FROM v_rpc_play THEN
    RAISE EXCEPTION
      'FAIL: raw COUNT(DISTINCT user_id)=% <> RPC play_player_count=%',
      v_raw_distinct, v_rpc_play;
  END IF;

  -- 9) Same user A multi-play still one row / counts as 1
  SELECT COUNT(*)::bigint
  INTO v_rows_user_a
  FROM public.project_plays pp
  WHERE pp.project_id = v_project_id
    AND pp.user_id = v_user_a;

  IF v_rows_user_a <> 1 THEN
    RAISE EXCEPTION 'FAIL: user A should have exactly 1 project_plays row after multi-upsert, got %', v_rows_user_a;
  END IF;

  RAISE NOTICE
    'PASS: snap=% raw=% rpc_play_player_count=% user_a_rows=1 (multi-play still counts as 1 player) fb=% watch=% witness=%',
    v_snap_distinct,
    v_raw_distinct,
    v_rpc_play,
    v_rpc_row.feedback_participant_count,
    v_rpc_row.watch_count,
    v_rpc_row.witness_grant_count;
END $$;

ROLLBACK;
