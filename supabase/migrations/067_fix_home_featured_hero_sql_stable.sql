-- 067: Staging repair — replace broken get_home_featured_hero with pure SQL STABLE
--
-- Why repair (not CREATE OR REPLACE alone):
--   Staging still has the 066 plpgsql body that uses DROP TABLE / temp tables.
--   Runtime: "DROP TABLE is not allowed in a non-volatile function" (0A000).
--   PostgreSQL cannot change LANGUAGE plpgsql → sql via CREATE OR REPLACE;
--   an explicit DROP of the known signature(s) is required, then recreate once.
--
-- Also fixed 42601 on an earlier sql draft:
--   reaction_pick used SELECT * … CROSS JOIN params, so UNION ALL with
--   rising/newest/updated (ri.* / nr.* / ur.*) had unequal column counts.
--   All slot CTEs now use one canonical explicit column list.
--
-- Canonical signature (066/067, no overloads shipped):
--   public.get_home_featured_hero()  -- zero-arg
--
-- Body: pure SQL / CTE only (no temp tables). Soft owner diversity.
-- Shelf RPC get_home_discovery_feed unchanged (065).
--
-- Apply: Staging Dashboard SQL Editor (vuqpwvjvgyxffmvpfrxo) only until owner GO.
-- Idempotent: safe to re-run (BEGIN…COMMIT; DROP IF EXISTS + recreate + GRANT).

BEGIN;

-- Exact broken 066 signature (and any same-name zero-arg remnant).
DROP FUNCTION IF EXISTS public.get_home_featured_hero();

-- Known historical / accidental overloads (none shipped, but drop if present).
-- Add more DROP lines here only if a future bad apply introduces another arg list.
DROP FUNCTION IF EXISTS public.get_home_featured_hero(integer);
DROP FUNCTION IF EXISTS public.get_home_featured_hero(integer, integer);

CREATE FUNCTION public.get_home_featured_hero()
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
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH
  params AS (
    SELECT
      12::integer AS feed_limit,
      (now() - interval '7 days') AS window_start,
      (now() - interval '14 days') AS prev_window_start
  ),
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
      AND s.user_id IS NOT NULL
    GROUP BY s.project_id
  ),
  play_prev_7d AS (
    SELECT
      s.project_id AS project_id_text,
      COUNT(DISTINCT s.user_id)::bigint AS players_prev_7d
    FROM public.project_play_sessions s
    CROSS JOIN params prm
    WHERE s.played_at >= prm.prev_window_start
      AND s.played_at < prm.window_start
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
        ORDER BY pp.first_published_at DESC, pp.project_id ASC
      )::integer AS axis_rank
    FROM public_projects pp
    LEFT JOIN fb_7d f ON f.project_id_text = pp.project_id::text
    LEFT JOIN watch_7d w ON w.project_id_text = pp.project_id::text
    LEFT JOIN play_7d pl ON pl.project_id_text = pp.project_id::text
    LEFT JOIN play_prev_7d pp7 ON pp7.project_id_text = pp.project_id::text
  ),
  updated_ranked AS (
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
          COALESCE(pl.last_play_at, '-infinity'::timestamptz),
          COALESCE(ua.meaningful_update_at, '-infinity'::timestamptz)
        ),
        '-infinity'::timestamptz
      ) AS last_engagement_at,
      pp.first_published_at,
      ua.meaningful_update_at,
      ua.update_kind,
      ROW_NUMBER() OVER (
        ORDER BY ua.meaningful_update_at DESC, pp.project_id ASC
      )::integer AS axis_rank
    FROM public_projects pp
    INNER JOIN updated_agg ua ON ua.project_id = pp.project_id
    LEFT JOIN fb_7d f ON f.project_id_text = pp.project_id::text
    LEFT JOIN watch_7d w ON w.project_id_text = pp.project_id::text
    LEFT JOIN play_7d pl ON pl.project_id_text = pp.project_id::text
    LEFT JOIN play_prev_7d pp7 ON pp7.project_id_text = pp.project_id::text
  ),
  -- Canonical slot columns (shared by *_ranked / *_pick / picked UNION):
  --   project_id, owner_id,
  --   feedback_users_7d, watchers_7d, players_7d, players_prev_7d, player_delta_7d,
  --   last_play_at, last_engagement_at, first_published_at,
  --   meaningful_update_at, update_kind, axis_rank
  -- Do NOT SELECT * with CROSS JOIN params (adds extra columns and breaks UNION).
  reaction_pick AS (
    SELECT
      rr.project_id,
      rr.owner_id,
      rr.feedback_users_7d,
      rr.watchers_7d,
      rr.players_7d,
      rr.players_prev_7d,
      rr.player_delta_7d,
      rr.last_play_at,
      rr.last_engagement_at,
      rr.first_published_at,
      rr.meaningful_update_at,
      rr.update_kind,
      rr.axis_rank
    FROM reaction_ranked rr
    CROSS JOIN params prm
    WHERE rr.axis_rank <= prm.feed_limit
    ORDER BY rr.axis_rank ASC
    LIMIT 1
  ),
  rising_pick AS (
    SELECT
      ri.project_id,
      ri.owner_id,
      ri.feedback_users_7d,
      ri.watchers_7d,
      ri.players_7d,
      ri.players_prev_7d,
      ri.player_delta_7d,
      ri.last_play_at,
      ri.last_engagement_at,
      ri.first_published_at,
      ri.meaningful_update_at,
      ri.update_kind,
      ri.axis_rank
    FROM rising_ranked ri
    CROSS JOIN params prm
    WHERE ri.axis_rank <= prm.feed_limit
      AND NOT EXISTS (
        SELECT 1 FROM reaction_pick rp WHERE rp.project_id = ri.project_id
      )
    ORDER BY
      CASE
        WHEN EXISTS (
          SELECT 1
          FROM reaction_pick rp
          WHERE rp.owner_id IS NOT NULL
            AND ri.owner_id IS NOT NULL
            AND rp.owner_id = ri.owner_id
        ) THEN 1
        ELSE 0
      END ASC,
      ri.axis_rank ASC
    LIMIT 1
  ),
  newest_pick AS (
    SELECT
      nr.project_id,
      nr.owner_id,
      nr.feedback_users_7d,
      nr.watchers_7d,
      nr.players_7d,
      nr.players_prev_7d,
      nr.player_delta_7d,
      nr.last_play_at,
      nr.last_engagement_at,
      nr.first_published_at,
      nr.meaningful_update_at,
      nr.update_kind,
      nr.axis_rank
    FROM newest_ranked nr
    CROSS JOIN params prm
    WHERE nr.axis_rank <= prm.feed_limit
      AND NOT EXISTS (
        SELECT 1 FROM reaction_pick rp WHERE rp.project_id = nr.project_id
      )
      AND NOT EXISTS (
        SELECT 1 FROM rising_pick ri WHERE ri.project_id = nr.project_id
      )
    ORDER BY
      CASE
        WHEN EXISTS (
          SELECT 1
          FROM (
            SELECT owner_id FROM reaction_pick
            UNION ALL
            SELECT owner_id FROM rising_pick
          ) owners
          WHERE owners.owner_id IS NOT NULL
            AND nr.owner_id IS NOT NULL
            AND owners.owner_id = nr.owner_id
        ) THEN 1
        ELSE 0
      END ASC,
      nr.axis_rank ASC
    LIMIT 1
  ),
  updated_pick AS (
    SELECT
      ur.project_id,
      ur.owner_id,
      ur.feedback_users_7d,
      ur.watchers_7d,
      ur.players_7d,
      ur.players_prev_7d,
      ur.player_delta_7d,
      ur.last_play_at,
      ur.last_engagement_at,
      ur.first_published_at,
      ur.meaningful_update_at,
      ur.update_kind,
      ur.axis_rank
    FROM updated_ranked ur
    CROSS JOIN params prm
    WHERE ur.axis_rank <= prm.feed_limit
      AND NOT EXISTS (
        SELECT 1 FROM reaction_pick rp WHERE rp.project_id = ur.project_id
      )
      AND NOT EXISTS (
        SELECT 1 FROM rising_pick ri WHERE ri.project_id = ur.project_id
      )
      AND NOT EXISTS (
        SELECT 1 FROM newest_pick np WHERE np.project_id = ur.project_id
      )
    ORDER BY
      CASE
        WHEN EXISTS (
          SELECT 1
          FROM (
            SELECT owner_id FROM reaction_pick
            UNION ALL
            SELECT owner_id FROM rising_pick
            UNION ALL
            SELECT owner_id FROM newest_pick
          ) owners
          WHERE owners.owner_id IS NOT NULL
            AND ur.owner_id IS NOT NULL
            AND owners.owner_id = ur.owner_id
        ) THEN 1
        ELSE 0
      END ASC,
      ur.axis_rank ASC
    LIMIT 1
  ),
  picked AS (
    SELECT
      'reaction'::text AS featured_type,
      1::integer AS desired_order,
      rp.project_id AS project_id,
      rp.owner_id AS owner_id,
      rp.feedback_users_7d AS feedback_users_7d,
      rp.watchers_7d AS watchers_7d,
      rp.players_7d AS players_7d,
      rp.players_prev_7d AS players_prev_7d,
      rp.player_delta_7d AS player_delta_7d,
      rp.last_play_at AS last_play_at,
      rp.last_engagement_at AS last_engagement_at,
      rp.first_published_at AS first_published_at,
      rp.meaningful_update_at AS meaningful_update_at,
      rp.update_kind AS update_kind,
      rp.axis_rank AS axis_rank
    FROM reaction_pick rp
    UNION ALL
    SELECT
      'rising_plays'::text AS featured_type,
      2::integer AS desired_order,
      ri.project_id AS project_id,
      ri.owner_id AS owner_id,
      ri.feedback_users_7d AS feedback_users_7d,
      ri.watchers_7d AS watchers_7d,
      ri.players_7d AS players_7d,
      ri.players_prev_7d AS players_prev_7d,
      ri.player_delta_7d AS player_delta_7d,
      ri.last_play_at AS last_play_at,
      ri.last_engagement_at AS last_engagement_at,
      ri.first_published_at AS first_published_at,
      ri.meaningful_update_at AS meaningful_update_at,
      ri.update_kind AS update_kind,
      ri.axis_rank AS axis_rank
    FROM rising_pick ri
    UNION ALL
    SELECT
      'newest'::text AS featured_type,
      3::integer AS desired_order,
      np.project_id AS project_id,
      np.owner_id AS owner_id,
      np.feedback_users_7d AS feedback_users_7d,
      np.watchers_7d AS watchers_7d,
      np.players_7d AS players_7d,
      np.players_prev_7d AS players_prev_7d,
      np.player_delta_7d AS player_delta_7d,
      np.last_play_at AS last_play_at,
      np.last_engagement_at AS last_engagement_at,
      np.first_published_at AS first_published_at,
      np.meaningful_update_at AS meaningful_update_at,
      np.update_kind AS update_kind,
      np.axis_rank AS axis_rank
    FROM newest_pick np
    UNION ALL
    SELECT
      'updated'::text AS featured_type,
      4::integer AS desired_order,
      up.project_id AS project_id,
      up.owner_id AS owner_id,
      up.feedback_users_7d AS feedback_users_7d,
      up.watchers_7d AS watchers_7d,
      up.players_7d AS players_7d,
      up.players_prev_7d AS players_prev_7d,
      up.player_delta_7d AS player_delta_7d,
      up.last_play_at AS last_play_at,
      up.last_engagement_at AS last_engagement_at,
      up.first_published_at AS first_published_at,
      up.meaningful_update_at AS meaningful_update_at,
      up.update_kind AS update_kind,
      up.axis_rank AS axis_rank
    FROM updated_pick up
  ),
  picked_ranked AS (
    SELECT
      p.featured_type,
      p.desired_order,
      p.project_id,
      p.owner_id,
      p.feedback_users_7d,
      p.watchers_7d,
      p.players_7d,
      p.players_prev_7d,
      p.player_delta_7d,
      p.last_play_at,
      p.last_engagement_at,
      p.first_published_at,
      p.meaningful_update_at,
      p.update_kind,
      p.axis_rank,
      ROW_NUMBER() OVER (ORDER BY p.desired_order ASC)::integer AS slot_rank
    FROM picked p
  ),
  stats AS (
    SELECT
      s.project_id AS project_id,
      s.feedback_participant_count AS feedback_participant_count,
      s.watch_count AS watch_count
    FROM public.get_public_project_stats(
      COALESCE(
        (SELECT array_agg(pr.project_id) FROM picked_ranked pr),
        ARRAY[]::uuid[]
      )
    ) s
  )
  SELECT
    pr.featured_type,
    pr.slot_rank,
    pr.axis_rank,
    pp.project_id,
    pp.owner_id,
    pp.title,
    pp.description,
    pp.playable_version,
    pp.thumbnail_url,
    pp.genre,
    pp.first_published_at,
    pr.meaningful_update_at,
    pr.update_kind,
    pr.feedback_users_7d,
    pr.watchers_7d,
    pr.players_7d,
    pr.players_prev_7d,
    pr.player_delta_7d,
    pr.last_play_at,
    pr.last_engagement_at,
    CASE pr.featured_type
      WHEN 'newest' THEN pp.first_published_at
      WHEN 'updated' THEN pr.meaningful_update_at
      WHEN 'rising_plays' THEN COALESCE(pr.last_play_at, pr.last_engagement_at)
      ELSE COALESCE(pr.last_engagement_at, pp.first_published_at)
    END AS card_time_at,
    COALESCE(st.feedback_participant_count, 0)::bigint AS feedback_participant_count,
    COALESCE(st.watch_count, 0)::bigint AS watch_count
  FROM picked_ranked pr
  INNER JOIN public_projects pp ON pp.project_id = pr.project_id
  LEFT JOIN stats st ON st.project_id = pr.project_id
  ORDER BY pr.slot_rank ASC;
$$;

COMMENT ON FUNCTION public.get_home_featured_hero() IS
  'Home featured hero (067): pure SQL STABLE — reaction / rising_plays / newest / updated. Unique projects; soft owner diversity. Shelves unchanged.';

REVOKE ALL ON FUNCTION public.get_home_featured_hero() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_home_featured_hero() TO anon;
GRANT EXECUTE ON FUNCTION public.get_home_featured_hero() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_home_featured_hero() TO service_role;

COMMIT;
