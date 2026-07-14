-- 066: Home featured hero — 4 independent slots (Staging-first)
--
-- New RPC get_home_featured_hero():
--   reaction      — 065 trending eligibility (FB or new watches, not play-alone)
--   rising_plays  — distinct players_7d − players_prev_7d > 0
--   newest        — first_published_at (same as newest shelf)
--   updated       — meaningful updates after first publish (same as updated shelf)
--
-- Within-hero: unique project_id; soft prefer different owner_id (do not drop
-- newest/updated meaning if only same-owner candidates remain).
-- Does not change shelf sections of get_home_discovery_feed (065 unchanged).
--
-- Apply: Staging (vuqpwvjvgyxffmvpfrxo) only until owner GO for Production.

BEGIN;

CREATE OR REPLACE FUNCTION public.get_home_featured_hero()
RETURNS TABLE (
  featured_type text,
  slot_rank integer,
  axis_rank integer,
  project_id uuid,
  owner_id uuid,
  title text,
  description text,
  playable_version text,
  thumbnail_url text,
  genre text,
  first_published_at timestamptz,
  meaningful_update_at timestamptz,
  update_kind text,
  feedback_users_7d bigint,
  watchers_7d bigint,
  players_7d bigint,
  players_prev_7d bigint,
  player_delta_7d bigint,
  last_play_at timestamptz,
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
DECLARE
  v_feed_limit integer := 12;
  v_window_start timestamptz := now() - interval '7 days';
  v_prev_window_start timestamptz := now() - interval '14 days';
  v_selected_ids uuid[] := ARRAY[]::uuid[];
  v_selected_owners uuid[] := ARRAY[]::uuid[];
  v_slot integer := 0;
  v_type text;
  v_axis_rank integer;
  v_project_id uuid;
  v_owner_id uuid;
  v_feedback_users_7d bigint;
  v_watchers_7d bigint;
  v_players_7d bigint;
  v_players_prev_7d bigint;
  v_player_delta_7d bigint;
  v_last_play_at timestamptz;
  v_last_engagement_at timestamptz;
  v_first_published_at timestamptz;
  v_meaningful_update_at timestamptz;
  v_update_kind text;
BEGIN
  DROP TABLE IF EXISTS tmp_featured_picked;
  DROP TABLE IF EXISTS tmp_featured_axis;

  CREATE TEMP TABLE tmp_featured_axis ON COMMIT DROP AS
  WITH
  public_projects AS (
    SELECT
      p.id AS project_id,
      p.owner_id AS owner_id,
      p.title AS title,
      p.description AS description,
      COALESCE(p.playable_version, '0.1') AS playable_version,
      CASE WHEN p.thumbnail_url ~* '^https?://' THEN p.thumbnail_url ELSE NULL END AS thumbnail_url,
      p.genre AS genre,
      p.first_published_at AS first_published_at
    FROM public.projects p
    WHERE p.visibility = 'public'
      AND p.first_published_at IS NOT NULL
  ),
  meaningful_events AS (
    SELECT
      d.project_id AS project_id_text,
      d.created_at AS event_at,
      'devlog'::text AS event_kind
    FROM public.project_devlogs d
    WHERE d.is_initial_publish = false
    UNION ALL
    SELECT
      e.project_id::text AS project_id_text,
      e.created_at AS event_at,
      'version'::text AS event_kind
    FROM public.project_release_events e
    WHERE e.event_type = 'released'
      AND e.source IS DISTINCT FROM 'onboarding'
  ),
  updated_agg AS (
    SELECT
      pp.project_id AS project_id,
      MAX(me.event_at) AS meaningful_update_at,
      (
        ARRAY_AGG(me.event_kind ORDER BY me.event_at DESC, me.event_kind ASC)
      )[1] AS update_kind
    FROM public_projects pp
    INNER JOIN meaningful_events me
      ON me.project_id_text = pp.project_id::text
    WHERE me.event_at > pp.first_published_at
    GROUP BY pp.project_id
  ),
  fb_7d AS (
    SELECT
      combined.project_id_text AS project_id_text,
      COUNT(DISTINCT combined.user_id)::bigint AS feedback_users_7d,
      MAX(combined.created_at) AS last_fb_at
    FROM (
      SELECT
        vr.project_id AS project_id_text,
        vr.user_id AS user_id,
        vr.created_at AS created_at
      FROM public.project_voice_responses vr
      WHERE vr.moderation_status = 'visible'
        AND vr.user_id IS NOT NULL
        AND vr.created_at >= v_window_start
      UNION ALL
      SELECT
        fb.project_id AS project_id_text,
        fb.user_id AS user_id,
        fb.created_at AS created_at
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
      AND s.user_id IS NOT NULL
    GROUP BY s.project_id
  ),
  play_prev_7d AS (
    SELECT
      s.project_id AS project_id_text,
      COUNT(DISTINCT s.user_id)::bigint AS players_prev_7d
    FROM public.project_play_sessions s
    WHERE s.played_at >= v_prev_window_start
      AND s.played_at < v_window_start
      AND s.user_id IS NOT NULL
    GROUP BY s.project_id
  ),
  reaction_ranked AS (
    SELECT
      pp.project_id,
      pp.owner_id,
      COALESCE(f.feedback_users_7d, 0)::bigint AS feedback_users_7d,
      COALESCE(w.watchers_7d, 0)::bigint AS watchers_7d,
      COALESCE(pl.players_7d, 0)::bigint AS players_7d,
      COALESCE(pp7.players_prev_7d, 0)::bigint AS players_prev_7d,
      (
        COALESCE(pl.players_7d, 0) - COALESCE(pp7.players_prev_7d, 0)
      )::bigint AS player_delta_7d,
      pl.last_play_at AS last_play_at,
      NULLIF(
        GREATEST(
          COALESCE(f.last_fb_at, '-infinity'::timestamptz),
          COALESCE(w.last_watch_at, '-infinity'::timestamptz),
          COALESCE(pl.last_play_at, '-infinity'::timestamptz)
        ),
        '-infinity'::timestamptz
      ) AS last_engagement_at,
      pp.first_published_at,
      NULL::timestamptz AS meaningful_update_at,
      NULL::text AS update_kind,
      ROW_NUMBER() OVER (
        ORDER BY
          COALESCE(f.feedback_users_7d, 0) DESC,
          COALESCE(w.watchers_7d, 0) DESC,
          COALESCE(pl.players_7d, 0) DESC,
          NULLIF(
            GREATEST(
              COALESCE(f.last_fb_at, '-infinity'::timestamptz),
              COALESCE(w.last_watch_at, '-infinity'::timestamptz),
              COALESCE(pl.last_play_at, '-infinity'::timestamptz)
            ),
            '-infinity'::timestamptz
          ) DESC NULLS LAST,
          pp.project_id ASC
      )::integer AS axis_rank
    FROM public_projects pp
    LEFT JOIN fb_7d f ON f.project_id_text = pp.project_id::text
    LEFT JOIN watch_7d w ON w.project_id_text = pp.project_id::text
    LEFT JOIN play_7d pl ON pl.project_id_text = pp.project_id::text
    LEFT JOIN play_prev_7d pp7 ON pp7.project_id_text = pp.project_id::text
    WHERE COALESCE(f.feedback_users_7d, 0) + COALESCE(w.watchers_7d, 0) > 0
  ),
  rising_ranked AS (
    SELECT
      pp.project_id,
      pp.owner_id,
      COALESCE(f.feedback_users_7d, 0)::bigint AS feedback_users_7d,
      COALESCE(w.watchers_7d, 0)::bigint AS watchers_7d,
      COALESCE(pl.players_7d, 0)::bigint AS players_7d,
      COALESCE(pp7.players_prev_7d, 0)::bigint AS players_prev_7d,
      (
        COALESCE(pl.players_7d, 0) - COALESCE(pp7.players_prev_7d, 0)
      )::bigint AS player_delta_7d,
      pl.last_play_at AS last_play_at,
      pl.last_play_at AS last_engagement_at,
      pp.first_published_at,
      NULL::timestamptz AS meaningful_update_at,
      NULL::text AS update_kind,
      ROW_NUMBER() OVER (
        ORDER BY
          (COALESCE(pl.players_7d, 0) - COALESCE(pp7.players_prev_7d, 0)) DESC,
          COALESCE(pl.players_7d, 0) DESC,
          COALESCE(f.feedback_users_7d, 0) DESC,
          pl.last_play_at DESC NULLS LAST,
          pp.project_id ASC
      )::integer AS axis_rank
    FROM public_projects pp
    INNER JOIN play_7d pl ON pl.project_id_text = pp.project_id::text
    LEFT JOIN play_prev_7d pp7 ON pp7.project_id_text = pp.project_id::text
    LEFT JOIN fb_7d f ON f.project_id_text = pp.project_id::text
    LEFT JOIN watch_7d w ON w.project_id_text = pp.project_id::text
    WHERE COALESCE(pl.players_7d, 0) >= 1
      AND (COALESCE(pl.players_7d, 0) - COALESCE(pp7.players_prev_7d, 0)) > 0
  ),
  newest_ranked AS (
    SELECT
      pp.project_id,
      pp.owner_id,
      0::bigint AS feedback_users_7d,
      0::bigint AS watchers_7d,
      0::bigint AS players_7d,
      0::bigint AS players_prev_7d,
      0::bigint AS player_delta_7d,
      NULL::timestamptz AS last_play_at,
      NULL::timestamptz AS last_engagement_at,
      pp.first_published_at,
      NULL::timestamptz AS meaningful_update_at,
      NULL::text AS update_kind,
      ROW_NUMBER() OVER (
        ORDER BY pp.first_published_at DESC, pp.project_id ASC
      )::integer AS axis_rank
    FROM public_projects pp
  ),
  updated_ranked AS (
    SELECT
      pp.project_id,
      pp.owner_id,
      0::bigint AS feedback_users_7d,
      0::bigint AS watchers_7d,
      0::bigint AS players_7d,
      0::bigint AS players_prev_7d,
      0::bigint AS player_delta_7d,
      NULL::timestamptz AS last_play_at,
      NULL::timestamptz AS last_engagement_at,
      pp.first_published_at,
      ua.meaningful_update_at,
      ua.update_kind,
      ROW_NUMBER() OVER (
        ORDER BY ua.meaningful_update_at DESC, pp.project_id ASC
      )::integer AS axis_rank
    FROM public_projects pp
    INNER JOIN updated_agg ua ON ua.project_id = pp.project_id
  ),
  axis_union AS (
    SELECT
      'reaction'::text AS featured_type,
      rr.*
    FROM reaction_ranked rr
    WHERE rr.axis_rank <= v_feed_limit
    UNION ALL
    SELECT
      'rising_plays'::text AS featured_type,
      ri.*
    FROM rising_ranked ri
    WHERE ri.axis_rank <= v_feed_limit
    UNION ALL
    SELECT
      'newest'::text AS featured_type,
      nr.*
    FROM newest_ranked nr
    WHERE nr.axis_rank <= v_feed_limit
    UNION ALL
    SELECT
      'updated'::text AS featured_type,
      ur.*
    FROM updated_ranked ur
    WHERE ur.axis_rank <= v_feed_limit
  )
  SELECT * FROM axis_union;

  CREATE TEMP TABLE tmp_featured_picked (
    featured_type text NOT NULL,
    slot_rank integer NOT NULL,
    axis_rank integer NOT NULL,
    project_id uuid NOT NULL,
    owner_id uuid,
    feedback_users_7d bigint,
    watchers_7d bigint,
    players_7d bigint,
    players_prev_7d bigint,
    player_delta_7d bigint,
    last_play_at timestamptz,
    last_engagement_at timestamptz,
    first_published_at timestamptz,
    meaningful_update_at timestamptz,
    update_kind text
  ) ON COMMIT DROP;

  FOREACH v_type IN ARRAY ARRAY[
    'reaction',
    'rising_plays',
    'newest',
    'updated'
  ]::text[]
  LOOP
    SELECT
      a.axis_rank,
      a.project_id,
      a.owner_id,
      a.feedback_users_7d,
      a.watchers_7d,
      a.players_7d,
      a.players_prev_7d,
      a.player_delta_7d,
      a.last_play_at,
      a.last_engagement_at,
      a.first_published_at,
      a.meaningful_update_at,
      a.update_kind
    INTO
      v_axis_rank,
      v_project_id,
      v_owner_id,
      v_feedback_users_7d,
      v_watchers_7d,
      v_players_7d,
      v_players_prev_7d,
      v_player_delta_7d,
      v_last_play_at,
      v_last_engagement_at,
      v_first_published_at,
      v_meaningful_update_at,
      v_update_kind
    FROM tmp_featured_axis a
    WHERE a.featured_type = v_type
      AND NOT (a.project_id = ANY (v_selected_ids))
    ORDER BY
      CASE
        WHEN a.owner_id IS NOT NULL AND a.owner_id = ANY (v_selected_owners) THEN 1
        ELSE 0
      END ASC,
      a.axis_rank ASC
    LIMIT 1;

    IF FOUND THEN
      v_slot := v_slot + 1;
      INSERT INTO tmp_featured_picked (
        featured_type,
        slot_rank,
        axis_rank,
        project_id,
        owner_id,
        feedback_users_7d,
        watchers_7d,
        players_7d,
        players_prev_7d,
        player_delta_7d,
        last_play_at,
        last_engagement_at,
        first_published_at,
        meaningful_update_at,
        update_kind
      )
      VALUES (
        v_type,
        v_slot,
        v_axis_rank,
        v_project_id,
        v_owner_id,
        v_feedback_users_7d,
        v_watchers_7d,
        v_players_7d,
        v_players_prev_7d,
        v_player_delta_7d,
        v_last_play_at,
        v_last_engagement_at,
        v_first_published_at,
        v_meaningful_update_at,
        v_update_kind
      );
      v_selected_ids := array_append(v_selected_ids, v_project_id);
      IF v_owner_id IS NOT NULL THEN
        v_selected_owners := array_append(v_selected_owners, v_owner_id);
      END IF;
    END IF;
  END LOOP;

  RETURN QUERY
  WITH stats AS (
    SELECT
      s.project_id AS project_id,
      s.feedback_participant_count AS feedback_participant_count,
      s.watch_count AS watch_count
    FROM public.get_public_project_stats(
      COALESCE(
        (SELECT array_agg(p.project_id) FROM tmp_featured_picked p),
        ARRAY[]::uuid[]
      )
    ) s
  )
  SELECT
    pick.featured_type,
    pick.slot_rank,
    pick.axis_rank,
    pp.id AS project_id,
    pp.owner_id AS owner_id,
    pp.title AS title,
    pp.description AS description,
    COALESCE(pp.playable_version, '0.1') AS playable_version,
    CASE WHEN pp.thumbnail_url ~* '^https?://' THEN pp.thumbnail_url ELSE NULL END AS thumbnail_url,
    pp.genre AS genre,
    pp.first_published_at AS first_published_at,
    pick.meaningful_update_at,
    pick.update_kind,
    pick.feedback_users_7d,
    pick.watchers_7d,
    pick.players_7d,
    pick.players_prev_7d,
    pick.player_delta_7d,
    pick.last_play_at,
    pick.last_engagement_at,
    CASE pick.featured_type
      WHEN 'newest' THEN pp.first_published_at
      WHEN 'updated' THEN pick.meaningful_update_at
      WHEN 'rising_plays' THEN COALESCE(pick.last_play_at, pick.last_engagement_at)
      ELSE COALESCE(pick.last_engagement_at, pp.first_published_at)
    END AS card_time_at,
    COALESCE(st.feedback_participant_count, 0)::bigint AS feedback_participant_count,
    COALESCE(st.watch_count, 0)::bigint AS watch_count
  FROM tmp_featured_picked pick
  INNER JOIN public.projects pp ON pp.id = pick.project_id
  LEFT JOIN stats st ON st.project_id = pick.project_id
  ORDER BY pick.slot_rank ASC;
END;
$$;

COMMENT ON FUNCTION public.get_home_featured_hero() IS
  'Home featured hero (066): up to 4 slots — reaction / rising_plays / newest / updated. Unique projects; soft owner diversity. Shelves unchanged (use get_home_discovery_feed).';

REVOKE ALL ON FUNCTION public.get_home_featured_hero() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_home_featured_hero() TO anon;
GRANT EXECUTE ON FUNCTION public.get_home_featured_hero() TO authenticated;

COMMIT;
