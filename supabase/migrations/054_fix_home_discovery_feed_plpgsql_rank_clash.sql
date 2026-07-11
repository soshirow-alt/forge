-- 054: get_home_discovery_feed definitive body (was plpgsql rank→rn patch)
-- Body is the definitive LANGUAGE sql definition (same as 055) so fresh
-- 050→055 and Staging (through 054) + 055 alone converge on one function.
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
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH
  params AS (
    SELECT
      12::integer AS feed_limit,
      (now() - interval '7 days') AS window_start
  ),
  public_projects AS (
    SELECT
      p.id AS project_id,
      p.title AS title,
      p.description AS description,
      COALESCE(p.playable_version, '0.1') AS playable_version,
      p.thumbnail_url AS thumbnail_url,
      p.genre AS genre,
      p.first_published_at AS first_published_at
    FROM public.projects p
    WHERE p.visibility = 'public'
      AND p.first_published_at IS NOT NULL
  ),
  newest_ranked AS (
    SELECT
      pp.project_id AS project_id,
      ROW_NUMBER() OVER (
        ORDER BY pp.first_published_at DESC, pp.project_id ASC
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
      pp.project_id AS project_id,
      MAX(me.event_at) AS meaningful_update_at
    FROM public_projects pp
    INNER JOIN meaningful_events me
      ON me.project_id_text = pp.project_id::text
    WHERE me.event_at > pp.first_published_at
    GROUP BY pp.project_id
  ),
  updated_ranked AS (
    SELECT
      ua.project_id AS project_id,
      ua.meaningful_update_at AS meaningful_update_at,
      ROW_NUMBER() OVER (
        ORDER BY ua.meaningful_update_at DESC, ua.project_id ASC
      )::integer AS rn
    FROM updated_agg ua
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
      CROSS JOIN params prm
      WHERE vr.moderation_status = 'visible'
        AND vr.user_id IS NOT NULL
        AND vr.created_at >= prm.window_start
      UNION ALL
      SELECT
        fb.project_id AS project_id_text,
        fb.user_id AS user_id,
        fb.created_at AS created_at
      FROM public.project_feedback fb
      CROSS JOIN params prm
      WHERE fb.moderation_status = 'visible'
        AND fb.user_id IS NOT NULL
        AND fb.created_at >= prm.window_start
    ) combined
    GROUP BY combined.project_id_text
  ),
  watch_7d AS (
    SELECT
      w.project_id AS project_id_text,
      COUNT(*)::bigint AS watchers_7d,
      MAX(w.created_at) AS last_watch_at
    FROM public.project_watches w
    CROSS JOIN params prm
    WHERE w.created_at >= prm.window_start
    GROUP BY w.project_id
  ),
  play_7d AS (
    SELECT
      s.project_id AS project_id_text,
      COUNT(DISTINCT s.user_id)::bigint AS players_7d,
      MAX(s.played_at) AS last_play_at
    FROM public.project_play_sessions s
    CROSS JOIN params prm
    WHERE s.played_at >= prm.window_start
    GROUP BY s.project_id
  ),
  trending_base AS (
    SELECT
      pp.project_id AS project_id,
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
      pp.first_published_at AS first_published_at
    FROM public_projects pp
    LEFT JOIN fb_7d f ON f.project_id_text = pp.project_id::text
    LEFT JOIN watch_7d w ON w.project_id_text = pp.project_id::text
    LEFT JOIN play_7d pl ON pl.project_id_text = pp.project_id::text
    WHERE COALESCE(f.feedback_users_7d, 0)
        + COALESCE(w.watchers_7d, 0)
        + COALESCE(pl.players_7d, 0) > 0
  ),
  trending_ranked AS (
    SELECT
      tb.project_id AS project_id,
      tb.feedback_users_7d AS feedback_users_7d,
      tb.watchers_7d AS watchers_7d,
      tb.players_7d AS players_7d,
      tb.last_engagement_at AS last_engagement_at,
      tb.first_published_at AS first_published_at,
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
    SELECT
      nr.project_id AS project_id,
      nr.rn AS rn
    FROM newest_ranked nr
    CROSS JOIN params prm
    WHERE nr.rn <= prm.feed_limit
  ),
  updated_limited AS (
    SELECT
      ur.project_id AS project_id,
      ur.meaningful_update_at AS meaningful_update_at,
      ur.rn AS rn
    FROM updated_ranked ur
    CROSS JOIN params prm
    WHERE ur.rn <= prm.feed_limit
  ),
  trending_limited AS (
    SELECT
      tr.project_id AS project_id,
      tr.feedback_users_7d AS feedback_users_7d,
      tr.watchers_7d AS watchers_7d,
      tr.players_7d AS players_7d,
      tr.last_engagement_at AS last_engagement_at,
      tr.first_published_at AS first_published_at,
      tr.rn AS rn
    FROM trending_ranked tr
    CROSS JOIN params prm
    WHERE tr.rn <= prm.feed_limit
  ),
  candidate_ids AS (
    SELECT ARRAY(
      SELECT DISTINCT ranked.project_id
      FROM (
        SELECT nl.project_id AS project_id FROM newest_limited nl
        UNION
        SELECT ul.project_id AS project_id FROM updated_limited ul
        UNION
        SELECT tl.project_id AS project_id FROM trending_limited tl
      ) ranked
    ) AS ids
  ),
  stats AS (
    SELECT
      s.project_id AS project_id,
      s.feedback_participant_count AS feedback_participant_count,
      s.watch_count AS watch_count
    FROM candidate_ids c
    CROSS JOIN LATERAL public.get_public_project_stats(
      COALESCE(c.ids, ARRAY[]::uuid[])
    ) s
  ),
  newest_rows AS (
    SELECT
      'newest'::text AS section,
      nl.rn AS rn,
      pp.project_id AS project_id,
      pp.title AS title,
      pp.description AS description,
      pp.playable_version AS playable_version,
      pp.thumbnail_url AS thumbnail_url,
      pp.genre AS genre,
      pp.first_published_at AS first_published_at,
      NULL::timestamptz AS meaningful_update_at,
      0::bigint AS feedback_users_7d,
      0::bigint AS watchers_7d,
      0::bigint AS players_7d,
      NULL::timestamptz AS last_engagement_at,
      pp.first_published_at AS card_time_at,
      COALESCE(st.feedback_participant_count, 0)::bigint AS feedback_participant_count,
      COALESCE(st.watch_count, 0)::bigint AS watch_count
    FROM newest_limited nl
    INNER JOIN public_projects pp ON pp.project_id = nl.project_id
    LEFT JOIN stats st ON st.project_id = nl.project_id
  ),
  updated_rows AS (
    SELECT
      'updated'::text AS section,
      ul.rn AS rn,
      pp.project_id AS project_id,
      pp.title AS title,
      pp.description AS description,
      pp.playable_version AS playable_version,
      pp.thumbnail_url AS thumbnail_url,
      pp.genre AS genre,
      pp.first_published_at AS first_published_at,
      ul.meaningful_update_at AS meaningful_update_at,
      0::bigint AS feedback_users_7d,
      0::bigint AS watchers_7d,
      0::bigint AS players_7d,
      NULL::timestamptz AS last_engagement_at,
      ul.meaningful_update_at AS card_time_at,
      COALESCE(st.feedback_participant_count, 0)::bigint AS feedback_participant_count,
      COALESCE(st.watch_count, 0)::bigint AS watch_count
    FROM updated_limited ul
    INNER JOIN public_projects pp ON pp.project_id = ul.project_id
    LEFT JOIN stats st ON st.project_id = ul.project_id
  ),
  trending_rows AS (
    SELECT
      'trending'::text AS section,
      tl.rn AS rn,
      pp.project_id AS project_id,
      pp.title AS title,
      pp.description AS description,
      pp.playable_version AS playable_version,
      pp.thumbnail_url AS thumbnail_url,
      pp.genre AS genre,
      pp.first_published_at AS first_published_at,
      NULL::timestamptz AS meaningful_update_at,
      tl.feedback_users_7d AS feedback_users_7d,
      tl.watchers_7d AS watchers_7d,
      tl.players_7d AS players_7d,
      tl.last_engagement_at AS last_engagement_at,
      COALESCE(tl.last_engagement_at, pp.first_published_at) AS card_time_at,
      COALESCE(st.feedback_participant_count, 0)::bigint AS feedback_participant_count,
      COALESCE(st.watch_count, 0)::bigint AS watch_count
    FROM trending_limited tl
    INNER JOIN public_projects pp ON pp.project_id = tl.project_id
    LEFT JOIN stats st ON st.project_id = tl.project_id
  ),
  feed AS (
    SELECT
      nr.section AS section,
      nr.rn AS rn,
      nr.project_id AS project_id,
      nr.title AS title,
      nr.description AS description,
      nr.playable_version AS playable_version,
      nr.thumbnail_url AS thumbnail_url,
      nr.genre AS genre,
      nr.first_published_at AS first_published_at,
      nr.meaningful_update_at AS meaningful_update_at,
      nr.feedback_users_7d AS feedback_users_7d,
      nr.watchers_7d AS watchers_7d,
      nr.players_7d AS players_7d,
      nr.last_engagement_at AS last_engagement_at,
      nr.card_time_at AS card_time_at,
      nr.feedback_participant_count AS feedback_participant_count,
      nr.watch_count AS watch_count
    FROM newest_rows nr
    UNION ALL
    SELECT
      ur.section AS section,
      ur.rn AS rn,
      ur.project_id AS project_id,
      ur.title AS title,
      ur.description AS description,
      ur.playable_version AS playable_version,
      ur.thumbnail_url AS thumbnail_url,
      ur.genre AS genre,
      ur.first_published_at AS first_published_at,
      ur.meaningful_update_at AS meaningful_update_at,
      ur.feedback_users_7d AS feedback_users_7d,
      ur.watchers_7d AS watchers_7d,
      ur.players_7d AS players_7d,
      ur.last_engagement_at AS last_engagement_at,
      ur.card_time_at AS card_time_at,
      ur.feedback_participant_count AS feedback_participant_count,
      ur.watch_count AS watch_count
    FROM updated_rows ur
    UNION ALL
    SELECT
      tr.section AS section,
      tr.rn AS rn,
      tr.project_id AS project_id,
      tr.title AS title,
      tr.description AS description,
      tr.playable_version AS playable_version,
      tr.thumbnail_url AS thumbnail_url,
      tr.genre AS genre,
      tr.first_published_at AS first_published_at,
      tr.meaningful_update_at AS meaningful_update_at,
      tr.feedback_users_7d AS feedback_users_7d,
      tr.watchers_7d AS watchers_7d,
      tr.players_7d AS players_7d,
      tr.last_engagement_at AS last_engagement_at,
      tr.card_time_at AS card_time_at,
      tr.feedback_participant_count AS feedback_participant_count,
      tr.watch_count AS watch_count
    FROM trending_rows tr
  )
  SELECT
    feed.section AS section,
    feed.rn AS rank,
    feed.project_id AS project_id,
    feed.title AS title,
    feed.description AS description,
    feed.playable_version AS playable_version,
    feed.thumbnail_url AS thumbnail_url,
    feed.genre AS genre,
    feed.first_published_at AS first_published_at,
    feed.meaningful_update_at AS meaningful_update_at,
    feed.feedback_users_7d AS feedback_users_7d,
    feed.watchers_7d AS watchers_7d,
    feed.players_7d AS players_7d,
    feed.last_engagement_at AS last_engagement_at,
    feed.card_time_at AS card_time_at,
    feed.feedback_participant_count AS feedback_participant_count,
    feed.watch_count AS watch_count
  FROM feed
  ORDER BY feed.section ASC, feed.rn ASC;
$$;

COMMENT ON FUNCTION public.get_home_discovery_feed() IS
  'Home discovery feed (newest/updated/trending). LANGUAGE sql definitive body '
  '(055): avoids RETURNS TABLE name clashes from plpgsql. 12 rows/section. '
  'Stats via get_public_project_stats once. text project_id joined via ::text.';

REVOKE ALL ON FUNCTION public.get_home_discovery_feed() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_home_discovery_feed() TO anon;
GRANT EXECUTE ON FUNCTION public.get_home_discovery_feed() TO authenticated;

COMMIT;
