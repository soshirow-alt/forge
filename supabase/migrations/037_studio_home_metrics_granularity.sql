-- 037: Studio home metrics — day / week / month granularity
-- Prerequisite: 036 applied
-- Extends get_studio_home_connection_metrics(p_granularity) — day=直近6日, week=直近6週, month=直近6か月
-- Apply: Supabase Dashboard (staging-first). Owner review required.

BEGIN;

DROP FUNCTION IF EXISTS public.get_studio_home_connection_metrics();

CREATE OR REPLACE FUNCTION public.get_studio_home_connection_metrics(
  p_granularity text DEFAULT 'month'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner uuid := auth.uid();
  v_gran text;
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

  v_gran := CASE
    WHEN p_granularity IN ('day', 'week', 'month') THEN p_granularity
    ELSE 'month'
  END;

  WITH bounds AS (
    SELECT
      CASE v_gran
        WHEN 'day' THEN ((now() AT TIME ZONE 'Asia/Tokyo')::date - interval '5 days')::date
        WHEN 'week' THEN date_trunc('week', (now() AT TIME ZONE 'Asia/Tokyo')::date - interval '5 weeks')::date
        ELSE date_trunc('month', (now() AT TIME ZONE 'Asia/Tokyo')::date - interval '5 months')::date
      END AS range_start_date,
      CASE v_gran
        WHEN 'day' THEN (now() AT TIME ZONE 'Asia/Tokyo')::date
        WHEN 'week' THEN date_trunc('week', (now() AT TIME ZONE 'Asia/Tokyo')::date)::date
        ELSE date_trunc('month', (now() AT TIME ZONE 'Asia/Tokyo')::date)::date
      END AS series_anchor,
      CASE v_gran
        WHEN 'day' THEN interval '1 day'
        WHEN 'week' THEN interval '1 week'
        ELSE interval '1 month'
      END AS step_interval,
      v_gran AS gran
  ),
  period_series AS (
    SELECT
      gs::date AS period_start,
      CASE b.gran
        WHEN 'day' THEN to_char(gs, 'YYYY-MM-DD')
        WHEN 'week' THEN to_char(gs, 'YYYY-MM-DD')
        ELSE to_char(gs, 'YYYY-MM')
      END AS period_key,
      CASE b.gran
        WHEN 'day' THEN gs::date
        WHEN 'week' THEN (gs + interval '6 days')::date
        ELSE (gs + interval '1 month' - interval '1 day')::date
      END AS period_end
    FROM bounds b
    CROSS JOIN LATERAL generate_series(
      b.range_start_date,
      b.series_anchor,
      b.step_interval
    ) AS gs
  ),
  window_bounds AS (
    SELECT
      MIN(period_start) AS range_start_date,
      MAX(period_end) AS range_end_date
    FROM period_series
  ),
  owner_public_projects AS (
    SELECT p.id::text AS project_id
    FROM public.projects p
    WHERE p.owner_id = v_owner
      AND p.visibility = 'public'
  ),
  period_plays AS (
    SELECT
      CASE b.gran
        WHEN 'day' THEN date_trunc('day', (s.played_at AT TIME ZONE 'Asia/Tokyo'))::date
        WHEN 'week' THEN date_trunc('week', (s.played_at AT TIME ZONE 'Asia/Tokyo'))::date
        ELSE date_trunc('month', (s.played_at AT TIME ZONE 'Asia/Tokyo'))::date
      END AS period_start,
      s.user_id,
      COUNT(*)::int AS play_count
    FROM public.project_play_sessions s
    INNER JOIN owner_public_projects opp ON opp.project_id = s.project_id
    CROSS JOIN bounds b
    CROSS JOIN window_bounds wb
    WHERE s.user_id IS NOT NULL
      AND s.played_at >= (wb.range_start_date::timestamp AT TIME ZONE 'Asia/Tokyo')
      AND s.played_at < ((wb.range_end_date + interval '1 day')::timestamp AT TIME ZONE 'Asia/Tokyo')
    GROUP BY 1, 2
  ),
  play_depth AS (
    SELECT
      ps.period_start,
      ps.period_key,
      COALESCE(COUNT(pp.user_id) FILTER (WHERE pp.play_count = 1), 0)::int AS once,
      COALESCE(COUNT(pp.user_id) FILTER (WHERE pp.play_count = 2), 0)::int AS twice,
      COALESCE(COUNT(pp.user_id) FILTER (WHERE pp.play_count >= 3), 0)::int AS thrice_plus,
      COALESCE(COUNT(pp.user_id), 0)::int AS total
    FROM period_series ps
    LEFT JOIN period_plays pp ON pp.period_start = ps.period_start
    GROUP BY ps.period_start, ps.period_key
    ORDER BY ps.period_start
  ),
  voiced_users AS (
    SELECT DISTINCT
      pp.period_start,
      pp.user_id
    FROM period_plays pp
    INNER JOIN public.project_voice_responses vr ON vr.user_id = pp.user_id
    INNER JOIN owner_public_projects opp ON opp.project_id = vr.project_id
    CROSS JOIN bounds b
    CROSS JOIN window_bounds wb
    WHERE vr.user_id IS NOT NULL
      AND vr.created_at >= (wb.range_start_date::timestamp AT TIME ZONE 'Asia/Tokyo')
      AND vr.created_at < ((wb.range_end_date + interval '1 day')::timestamp AT TIME ZONE 'Asia/Tokyo')
      AND (
        CASE b.gran
          WHEN 'day' THEN date_trunc('day', (vr.created_at AT TIME ZONE 'Asia/Tokyo'))::date
          WHEN 'week' THEN date_trunc('week', (vr.created_at AT TIME ZONE 'Asia/Tokyo'))::date
          ELSE date_trunc('month', (vr.created_at AT TIME ZONE 'Asia/Tokyo'))::date
        END
      ) = pp.period_start
  ),
  deep_users AS (
    SELECT DISTINCT
      vu.period_start,
      vu.user_id
    FROM voiced_users vu
    INNER JOIN public.project_feedback pf ON pf.user_id = vu.user_id
    INNER JOIN owner_public_projects opp ON opp.project_id = pf.project_id
    CROSS JOIN bounds b
    CROSS JOIN window_bounds wb
    WHERE pf.user_id IS NOT NULL
      AND pf.created_at >= (wb.range_start_date::timestamp AT TIME ZONE 'Asia/Tokyo')
      AND pf.created_at < ((wb.range_end_date + interval '1 day')::timestamp AT TIME ZONE 'Asia/Tokyo')
      AND (
        CASE b.gran
          WHEN 'day' THEN date_trunc('day', (pf.created_at AT TIME ZONE 'Asia/Tokyo'))::date
          WHEN 'week' THEN date_trunc('week', (pf.created_at AT TIME ZONE 'Asia/Tokyo'))::date
          ELSE date_trunc('month', (pf.created_at AT TIME ZONE 'Asia/Tokyo'))::date
        END
      ) = vu.period_start
  ),
  voice_funnel AS (
    SELECT
      pd.period_start,
      pd.period_key,
      pd.total AS played,
      COALESCE((SELECT COUNT(*)::int FROM voiced_users vu WHERE vu.period_start = pd.period_start), 0) AS voiced,
      COALESCE((SELECT COUNT(*)::int FROM deep_users du WHERE du.period_start = pd.period_start), 0) AS deep
    FROM play_depth pd
    ORDER BY pd.period_start
  ),
  owner_community AS (
    SELECT dc.id AS community_id
    FROM public.developer_communities dc
    WHERE dc.owner_id = v_owner
  ),
  witness_community AS (
    SELECT
      ps.period_start,
      ps.period_key,
      COALESCE((
        SELECT COUNT(DISTINCT w.user_id)::int
        FROM public.project_watches w
        INNER JOIN owner_public_projects opp ON opp.project_id = w.project_id
        WHERE w.user_id IS NOT NULL
          AND w.created_at < ((ps.period_end + interval '1 day')::timestamp AT TIME ZONE 'Asia/Tokyo')
      ), 0) AS watching,
      COALESCE((
        SELECT COUNT(DISTINCT cm.user_id)::int
        FROM public.community_memberships cm
        INNER JOIN owner_community oc ON oc.community_id = cm.community_id
        WHERE cm.user_id IS NOT NULL
          AND cm.status = 'approved'
          AND cm.joined_at < ((ps.period_end + interval '1 day')::timestamp AT TIME ZONE 'Asia/Tokyo')
      ), 0) AS community_members
    FROM period_series ps
    ORDER BY ps.period_start
  )
  SELECT jsonb_build_object(
    'months', COALESCE((SELECT jsonb_agg(period_key ORDER BY period_start) FROM play_depth), '[]'::jsonb),
    'playDepth', COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'once', once,
          'twice', twice,
          'thricePlus', thrice_plus,
          'total', total
        )
        ORDER BY period_start
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
        ORDER BY period_start
      )
      FROM voice_funnel
    ), '[]'::jsonb),
    'witnessCommunity', COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'watching', watching,
          'communityMembers', community_members
        )
        ORDER BY period_start
      )
      FROM witness_community
    ), '[]'::jsonb)
  )
  INTO v_result;

  RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION public.get_studio_home_connection_metrics(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_studio_home_connection_metrics(text) TO authenticated;

COMMIT;
