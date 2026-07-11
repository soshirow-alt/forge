-- 055: fix get_home_discovery_feed PL/pgSQL variable/column clashes
-- After 054, anon still fails with: column reference "project_id" is ambiguous
-- Root cause: RETURNS TABLE column names become PL/pgSQL variables and clash
-- with CTE/SQL columns (project_id, title, section, ...).
-- Fix: #variable_conflict use_column so SQL column names win.
-- Staging-first. DO NOT apply to production without owner GO.

BEGIN;

CREATE OR REPLACE FUNCTION public.get_home_discovery_feed()
RETURNS TABLE (
  section text,
  rank integer,
  project_id uuid,
  title text,
  description text,
  playable_version text,
  thumbnail_url text,
  genre text,
  first_published_at timestamptz,
  meaningful_update_at timestamptz,
  feedback_users_7d bigint,
  watchers_7d bigint,
  players_7d bigint,
  last_engagement_at timestamptz,
  card_time_at timestamptz,
  feedback_participant_count bigint,
  watch_count bigint
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
#variable_conflict use_column
DECLARE
  v_limit integer := 12;
  v_window_start timestamptz := now() - interval '7 days';
BEGIN
  RETURN QUERY
  WITH
  public_projects AS (
    SELECT
      p.id,
      p.title,
      p.description,
      COALESCE(p.playable_version, '0.1') AS playable_version,
      p.thumbnail_url,
      p.genre,
      p.first_published_at
    FROM public.projects p
    WHERE p.visibility = 'public'
      AND p.first_published_at IS NOT NULL
  ),
  newest_ranked AS (
    SELECT
      pp.id AS project_id,
      ROW_NUMBER() OVER (
        ORDER BY pp.first_published_at DESC, pp.id ASC
      )::integer AS rn
    FROM public_projects pp
  ),
  meaningful_events AS (
    SELECT
      d.project_id AS project_id_text,
      d.created_at AS event_at
    FROM public.project_devlogs d
    WHERE d.is_initial_publish = false
    UNION ALL
    SELECT
      e.project_id::text AS project_id_text,
      e.created_at AS event_at
    FROM public.project_release_events e
    WHERE e.event_type = 'released'
      AND e.source IS DISTINCT FROM 'onboarding'
  ),
  updated_agg AS (
    SELECT
      pp.id AS project_id,
      MAX(me.event_at) AS meaningful_update_at
    FROM public_projects pp
    INNER JOIN meaningful_events me
      ON me.project_id_text = pp.id::text
    WHERE me.event_at > pp.first_published_at
    GROUP BY pp.id
  ),
  updated_ranked AS (
    SELECT
      ua.project_id,
      ua.meaningful_update_at,
      ROW_NUMBER() OVER (
        ORDER BY ua.meaningful_update_at DESC, ua.project_id ASC
      )::integer AS rn
    FROM updated_agg ua
  ),
  fb_7d AS (
    SELECT
      combined.project_id_text,
      COUNT(DISTINCT combined.user_id)::bigint AS feedback_users_7d,
      MAX(combined.created_at) AS last_fb_at
    FROM (
      SELECT
        vr.project_id AS project_id_text,
        vr.user_id,
        vr.created_at
      FROM public.project_voice_responses vr
      WHERE vr.moderation_status = 'visible'
        AND vr.user_id IS NOT NULL
        AND vr.created_at >= v_window_start
      UNION ALL
      SELECT
        fb.project_id AS project_id_text,
        fb.user_id,
        fb.created_at
      FROM public.project_feedback fb
      WHERE fb.moderation_status = 'visible'
        AND fb.user_id IS NOT NULL
        AND fb.created_at >= v_window_start
    ) combined
    GROUP BY combined.project_id_text
  ),
  watch_7d AS (
    SELECT
      w.project_id AS project_id_text,
      COUNT(*)::bigint AS watchers_7d,
      MAX(w.created_at) AS last_watch_at
    FROM public.project_watches w
    WHERE w.created_at >= v_window_start
    GROUP BY w.project_id
  ),
  play_7d AS (
    SELECT
      s.project_id AS project_id_text,
      COUNT(DISTINCT s.user_id)::bigint AS players_7d,
      MAX(s.played_at) AS last_play_at
    FROM public.project_play_sessions s
    WHERE s.played_at >= v_window_start
    GROUP BY s.project_id
  ),
  trending_base AS (
    SELECT
      pp.id AS project_id,
      COALESCE(f.feedback_users_7d, 0)::bigint AS feedback_users_7d,
      COALESCE(w.watchers_7d, 0)::bigint AS watchers_7d,
      COALESCE(pl.players_7d, 0)::bigint AS players_7d,
      NULLIF(
        GREATEST(
          COALESCE(f.last_fb_at, '-infinity'::timestamptz),
          COALESCE(w.last_watch_at, '-infinity'::timestamptz),
          COALESCE(pl.last_play_at, '-infinity'::timestamptz)
        ),
        '-infinity'::timestamptz
      ) AS last_engagement_at,
      pp.first_published_at
    FROM public_projects pp
    LEFT JOIN fb_7d f ON f.project_id_text = pp.id::text
    LEFT JOIN watch_7d w ON w.project_id_text = pp.id::text
    LEFT JOIN play_7d pl ON pl.project_id_text = pp.id::text
    WHERE COALESCE(f.feedback_users_7d, 0)
        + COALESCE(w.watchers_7d, 0)
        + COALESCE(pl.players_7d, 0) > 0
  ),
  trending_ranked AS (
    SELECT
      tb.project_id,
      tb.feedback_users_7d,
      tb.watchers_7d,
      tb.players_7d,
      tb.last_engagement_at,
      tb.first_published_at,
      ROW_NUMBER() OVER (
        ORDER BY
          tb.feedback_users_7d DESC,
          tb.watchers_7d DESC,
          tb.players_7d DESC,
          tb.last_engagement_at DESC NULLS LAST,
          tb.first_published_at DESC NULLS LAST,
          tb.project_id ASC
      )::integer AS rn
    FROM trending_base tb
  ),
  newest_limited AS (
    SELECT * FROM newest_ranked WHERE rn <= v_limit
  ),
  updated_limited AS (
    SELECT * FROM updated_ranked WHERE rn <= v_limit
  ),
  trending_limited AS (
    SELECT * FROM trending_ranked WHERE rn <= v_limit
  ),
  candidate_ids AS (
    SELECT ARRAY(
      SELECT DISTINCT x.project_id
      FROM (
        SELECT project_id FROM newest_limited
        UNION
        SELECT project_id FROM updated_limited
        UNION
        SELECT project_id FROM trending_limited
      ) x
    ) AS ids
  ),
  stats AS (
    SELECT s.*
    FROM candidate_ids c
    CROSS JOIN LATERAL public.get_public_project_stats(
      COALESCE(c.ids, ARRAY[]::uuid[])
    ) s
  ),
  newest_rows AS (
    SELECT
      'newest'::text AS section,
      n.rn,
      pp.id AS project_id,
      pp.title,
      pp.description,
      pp.playable_version,
      pp.thumbnail_url,
      pp.genre,
      pp.first_published_at,
      NULL::timestamptz AS meaningful_update_at,
      0::bigint AS feedback_users_7d,
      0::bigint AS watchers_7d,
      0::bigint AS players_7d,
      NULL::timestamptz AS last_engagement_at,
      pp.first_published_at AS card_time_at,
      COALESCE(st.feedback_participant_count, 0)::bigint AS feedback_participant_count,
      COALESCE(st.watch_count, 0)::bigint AS watch_count
    FROM newest_limited n
    INNER JOIN public_projects pp ON pp.id = n.project_id
    LEFT JOIN stats st ON st.project_id = n.project_id
  ),
  updated_rows AS (
    SELECT
      'updated'::text AS section,
      u.rn,
      pp.id AS project_id,
      pp.title,
      pp.description,
      pp.playable_version,
      pp.thumbnail_url,
      pp.genre,
      pp.first_published_at,
      u.meaningful_update_at,
      0::bigint AS feedback_users_7d,
      0::bigint AS watchers_7d,
      0::bigint AS players_7d,
      NULL::timestamptz AS last_engagement_at,
      u.meaningful_update_at AS card_time_at,
      COALESCE(st.feedback_participant_count, 0)::bigint AS feedback_participant_count,
      COALESCE(st.watch_count, 0)::bigint AS watch_count
    FROM updated_limited u
    INNER JOIN public_projects pp ON pp.id = u.project_id
    LEFT JOIN stats st ON st.project_id = u.project_id
  ),
  trending_rows AS (
    SELECT
      'trending'::text AS section,
      t.rn,
      pp.id AS project_id,
      pp.title,
      pp.description,
      pp.playable_version,
      pp.thumbnail_url,
      pp.genre,
      pp.first_published_at,
      NULL::timestamptz AS meaningful_update_at,
      t.feedback_users_7d,
      t.watchers_7d,
      t.players_7d,
      t.last_engagement_at,
      COALESCE(t.last_engagement_at, pp.first_published_at) AS card_time_at,
      COALESCE(st.feedback_participant_count, 0)::bigint AS feedback_participant_count,
      COALESCE(st.watch_count, 0)::bigint AS watch_count
    FROM trending_limited t
    INNER JOIN public_projects pp ON pp.id = t.project_id
    LEFT JOIN stats st ON st.project_id = t.project_id
  )
  SELECT
    feed.section,
    feed.rn,
    feed.project_id,
    feed.title,
    feed.description,
    feed.playable_version,
    feed.thumbnail_url,
    feed.genre,
    feed.first_published_at,
    feed.meaningful_update_at,
    feed.feedback_users_7d,
    feed.watchers_7d,
    feed.players_7d,
    feed.last_engagement_at,
    feed.card_time_at,
    feed.feedback_participant_count,
    feed.watch_count
  FROM (
    SELECT * FROM newest_rows
    UNION ALL
    SELECT * FROM updated_rows
    UNION ALL
    SELECT * FROM trending_rows
  ) AS feed
  ORDER BY feed.section, feed.rn;
END;
$$;

COMMENT ON FUNCTION public.get_home_discovery_feed() IS
  'Home discovery feed. #variable_conflict use_column avoids RETURNS TABLE '
  'name clashes with SQL columns (055).';

REVOKE ALL ON FUNCTION public.get_home_discovery_feed() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_home_discovery_feed() TO anon;
GRANT EXECUTE ON FUNCTION public.get_home_discovery_feed() TO authenticated;

COMMIT;
