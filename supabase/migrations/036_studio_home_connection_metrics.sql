-- 036: Studio home — account-wide player connection metrics (6 months)
-- Prerequisite: 001–035 applied
-- Owner reads aggregated play sessions via SECURITY DEFINER (012 RLS blocks direct owner SELECT)
--
-- 見届けている人: project_watches ベース（各月末時点の累積ユニーク数）
-- project_witness_grants / 見届け人バッジは本 RPC では未使用
--
-- developer_communities.owner_id は UNIQUE（018）— 開発者あたりコミュニティ1つ
--
-- Apply: Supabase Dashboard (staging-first). Do NOT apply without owner review.

BEGIN;

CREATE OR REPLACE FUNCTION public.get_studio_home_connection_metrics()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner uuid := auth.uid();
  v_result jsonb;
BEGIN
  IF v_owner IS NULL THEN
    RETURN jsonb_build_object(
      'months', '[]'::jsonb,
      'playDepth', '[]'::jsonb,
      'voiceFunnel', '[]'::jsonb,
      'witnessCommunity', '[]'::jsonb
    );
  END IF;

  WITH month_series AS (
    SELECT
      gs::date AS month_start,
      to_char(gs, 'YYYY-MM') AS month_key,
      (gs + interval '1 month' - interval '1 day')::date AS month_end
    FROM generate_series(
      date_trunc(
        'month',
        ((now() AT TIME ZONE 'Asia/Tokyo')::date - interval '5 months')
      )::date,
      date_trunc('month', (now() AT TIME ZONE 'Asia/Tokyo')::date)::date,
      interval '1 month'
    ) AS gs
  ),
  window_bounds AS (
    SELECT
      MIN(month_start) AS range_start_date,
      MAX(month_end) AS range_end_date
    FROM month_series
  ),
  owner_public_projects AS (
    SELECT p.id::text AS project_id
    FROM public.projects p
    WHERE p.owner_id = v_owner
      AND p.visibility = 'public'
  ),
  monthly_plays AS (
    SELECT
      date_trunc('month', (s.played_at AT TIME ZONE 'Asia/Tokyo'))::date AS month_start,
      s.user_id,
      COUNT(*)::int AS play_count
    FROM public.project_play_sessions s
    INNER JOIN owner_public_projects opp ON opp.project_id = s.project_id
    CROSS JOIN window_bounds wb
    WHERE s.user_id IS NOT NULL
      AND s.played_at >= (wb.range_start_date::timestamp AT TIME ZONE 'Asia/Tokyo')
      AND s.played_at < ((wb.range_end_date + interval '1 day')::timestamp AT TIME ZONE 'Asia/Tokyo')
    GROUP BY 1, 2
  ),
  play_depth AS (
    SELECT
      ms.month_start,
      ms.month_key,
      COALESCE(COUNT(mp.user_id) FILTER (WHERE mp.play_count = 1), 0)::int AS once,
      COALESCE(COUNT(mp.user_id) FILTER (WHERE mp.play_count = 2), 0)::int AS twice,
      COALESCE(COUNT(mp.user_id) FILTER (WHERE mp.play_count >= 3), 0)::int AS thrice_plus,
      COALESCE(COUNT(mp.user_id), 0)::int AS total
    FROM month_series ms
    LEFT JOIN monthly_plays mp ON mp.month_start = ms.month_start
    GROUP BY ms.month_start, ms.month_key
    ORDER BY ms.month_start
  ),
  voiced_users AS (
    SELECT DISTINCT
      mp.month_start,
      mp.user_id
    FROM monthly_plays mp
    INNER JOIN public.project_voice_responses vr
      ON vr.user_id = mp.user_id
    INNER JOIN owner_public_projects opp ON opp.project_id = vr.project_id
    CROSS JOIN window_bounds wb
    WHERE vr.user_id IS NOT NULL
      AND vr.created_at >= (wb.range_start_date::timestamp AT TIME ZONE 'Asia/Tokyo')
      AND vr.created_at < ((wb.range_end_date + interval '1 day')::timestamp AT TIME ZONE 'Asia/Tokyo')
      AND date_trunc('month', (vr.created_at AT TIME ZONE 'Asia/Tokyo'))::date = mp.month_start
  ),
  deep_users AS (
    SELECT DISTINCT
      vu.month_start,
      vu.user_id
    FROM voiced_users vu
    INNER JOIN public.project_feedback pf
      ON pf.user_id = vu.user_id
    INNER JOIN owner_public_projects opp ON opp.project_id = pf.project_id
    CROSS JOIN window_bounds wb
    WHERE pf.user_id IS NOT NULL
      AND pf.created_at >= (wb.range_start_date::timestamp AT TIME ZONE 'Asia/Tokyo')
      AND pf.created_at < ((wb.range_end_date + interval '1 day')::timestamp AT TIME ZONE 'Asia/Tokyo')
      AND date_trunc('month', (pf.created_at AT TIME ZONE 'Asia/Tokyo'))::date = vu.month_start
  ),
  voice_funnel AS (
    SELECT
      pd.month_start,
      pd.month_key,
      pd.total AS played,
      COALESCE((SELECT COUNT(*)::int FROM voiced_users vu WHERE vu.month_start = pd.month_start), 0) AS voiced,
      COALESCE((SELECT COUNT(*)::int FROM deep_users du WHERE du.month_start = pd.month_start), 0) AS deep
    FROM play_depth pd
    ORDER BY pd.month_start
  ),
  owner_community AS (
    SELECT dc.id AS community_id
    FROM public.developer_communities dc
    WHERE dc.owner_id = v_owner
  ),
  witness_community AS (
    -- 見届け・参加者は月末累積（各月の東京時間末日 24:00 = 翌月1日 00:00 JST 未満）
    -- created_at / joined_at は timestamptz — 月次フロー指標と同じ JST 境界を使用
    SELECT
      ms.month_start,
      ms.month_key,
      COALESCE((
        SELECT COUNT(DISTINCT w.user_id)::int
        FROM public.project_watches w
        INNER JOIN owner_public_projects opp ON opp.project_id = w.project_id
        WHERE w.user_id IS NOT NULL
          AND w.created_at < ((ms.month_end + interval '1 day')::timestamp AT TIME ZONE 'Asia/Tokyo')
      ), 0) AS watching,
      COALESCE((
        SELECT COUNT(DISTINCT cm.user_id)::int
        FROM public.community_memberships cm
        INNER JOIN owner_community oc ON oc.community_id = cm.community_id
        WHERE cm.user_id IS NOT NULL
          AND cm.status = 'approved'
          AND cm.joined_at < ((ms.month_end + interval '1 day')::timestamp AT TIME ZONE 'Asia/Tokyo')
      ), 0) AS community_members
    FROM month_series ms
    ORDER BY ms.month_start
  )
  SELECT jsonb_build_object(
    'months', COALESCE((SELECT jsonb_agg(month_key ORDER BY month_start) FROM play_depth), '[]'::jsonb),
    'playDepth', COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'once', once,
          'twice', twice,
          'thricePlus', thrice_plus,
          'total', total
        )
        ORDER BY month_start
      )
      FROM play_depth
    ), '[]'::jsonb),
    'voiceFunnel', COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'played', played,
          'voiced', voiced,
          'deep', deep
        )
        ORDER BY month_start
      )
      FROM voice_funnel
    ), '[]'::jsonb),
    'witnessCommunity', COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'watching', watching,
          'communityMembers', community_members
        )
        ORDER BY month_start
      )
      FROM witness_community
    ), '[]'::jsonb)
  )
  INTO v_result;

  RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION public.get_studio_home_connection_metrics() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_studio_home_connection_metrics() TO authenticated;

COMMIT;
