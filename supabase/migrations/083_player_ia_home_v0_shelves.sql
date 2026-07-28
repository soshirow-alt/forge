-- 083: Player IA home v0 shelves — FB gathering projects + meaningful update summary
-- Schema / RPC only (no column adds). Staging first; Production later via owner Dashboard.
-- Prerequisite: 080_player_ia_home_feed.sql, 070/071 feedback replies, 076–078
--
-- Adds:
--   get_home_feedback_gathering_projects — project-level FB aggregation (30d → 90d fallback)
--   get_home_meaningful_updates — DROP+CREATE to include summary / version / label
--   get_home_newest_projects — DROP+CREATE to include description
-- Keeps get_home_review_highlights (legacy) untouched.
--
-- 42P13 note: Postgres cannot CREATE OR REPLACE a function when OUT / RETURNS TABLE
-- columns change. Existing 080 signatures must be DROPped first (exact arg types only).

BEGIN;

-- ---------------------------------------------------------------------------
-- A. Feedback-gathering projects (works with activity, not review body quotes)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_home_feedback_gathering_projects(
  p_limit integer DEFAULT 16
)
RETURNS TABLE (
  project_id uuid,
  title text,
  category text,
  description text,
  thumbnail_url text,
  window_days integer,
  distinct_author_count bigint,
  feedback_count bigint,
  has_creator_reply boolean,
  last_feedback_at timestamptz,
  empathy_count bigint
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_limit integer := greatest(1, least(coalesce(p_limit, 16), 40));
  v_window_days integer := 30;
  v_qualifying integer := 0;
BEGIN
  -- Count qualifying projects in 30d; fall back to 90d when fewer than 4.
  WITH fb_events AS (
    SELECT
      p.id AS project_id,
      ('r:' || r.user_id::text) AS author_key,
      r.created_at,
      (
        SELECT count(*)::bigint FROM public.feedback_card_empathies e
        WHERE e.target_source = 'registered_voice' AND e.target_id = r.id
      ) AS empathy_count
    FROM public.project_voice_responses r
    INNER JOIN public.projects p ON p.id::text = r.project_id
    WHERE p.visibility = 'public'
      AND r.moderation_status = 'visible'
      AND r.created_at >= now() - interval '30 days'
    UNION ALL
    SELECT
      p.id,
      ('g:' || g.submitter_key::text),
      g.created_at,
      (
        SELECT count(*)::bigint FROM public.feedback_card_empathies e
        WHERE e.target_source = 'guest_voice' AND e.target_id = g.id
      )
    FROM public.project_guest_voice_responses g
    INNER JOIN public.projects p ON p.id::text = g.project_id
    WHERE p.visibility = 'public'
      AND g.include_in_public_aggregate = true
      AND g.moderation_status = 'visible'
      AND g.created_at >= now() - interval '30 days'
    UNION ALL
    SELECT
      p.id,
      ('r:' || f.user_id::text),
      f.created_at,
      (
        SELECT count(*)::bigint FROM public.feedback_card_empathies e
        WHERE e.target_source = 'registered_detailed' AND e.target_id = f.id
      )
    FROM public.project_feedback f
    INNER JOIN public.projects p ON p.id::text = f.project_id
    WHERE p.visibility = 'public'
      AND f.moderation_status = 'visible'
      AND f.created_at >= now() - interval '30 days'
    UNION ALL
    SELECT
      p.id,
      ('g:' || gf.submitter_key::text),
      gf.created_at,
      (
        SELECT count(*)::bigint FROM public.feedback_card_empathies e
        WHERE e.target_source = 'guest_detailed' AND e.target_id = gf.id
      )
    FROM public.project_guest_feedback gf
    INNER JOIN public.projects p ON p.id::text = gf.project_id
    WHERE p.visibility = 'public'
      AND gf.include_in_public_aggregate = true
      AND gf.moderation_status = 'visible'
      AND gf.created_at >= now() - interval '30 days'
  ),
  agg AS (
    SELECT
      e.project_id,
      count(DISTINCT e.author_key)::bigint AS distinct_author_count,
      count(*)::bigint AS feedback_count
    FROM fb_events e
    GROUP BY e.project_id
  )
  SELECT count(*)::integer INTO v_qualifying
  FROM agg a
  WHERE a.distinct_author_count >= 2 OR a.feedback_count >= 3;

  IF v_qualifying < 4 THEN
    v_window_days := 90;
  END IF;

  RETURN QUERY
  WITH fb_events AS (
    SELECT
      p.id AS project_id,
      ('r:' || r.user_id::text) AS author_key,
      r.created_at,
      (
        SELECT count(*)::bigint FROM public.feedback_card_empathies e
        WHERE e.target_source = 'registered_voice' AND e.target_id = r.id
      ) AS empathy_count
    FROM public.project_voice_responses r
    INNER JOIN public.projects p ON p.id::text = r.project_id
    WHERE p.visibility = 'public'
      AND r.moderation_status = 'visible'
      AND r.created_at >= now() - make_interval(days => v_window_days)
    UNION ALL
    SELECT
      p.id,
      ('g:' || g.submitter_key::text),
      g.created_at,
      (
        SELECT count(*)::bigint FROM public.feedback_card_empathies e
        WHERE e.target_source = 'guest_voice' AND e.target_id = g.id
      )
    FROM public.project_guest_voice_responses g
    INNER JOIN public.projects p ON p.id::text = g.project_id
    WHERE p.visibility = 'public'
      AND g.include_in_public_aggregate = true
      AND g.moderation_status = 'visible'
      AND g.created_at >= now() - make_interval(days => v_window_days)
    UNION ALL
    SELECT
      p.id,
      ('r:' || f.user_id::text),
      f.created_at,
      (
        SELECT count(*)::bigint FROM public.feedback_card_empathies e
        WHERE e.target_source = 'registered_detailed' AND e.target_id = f.id
      )
    FROM public.project_feedback f
    INNER JOIN public.projects p ON p.id::text = f.project_id
    WHERE p.visibility = 'public'
      AND f.moderation_status = 'visible'
      AND f.created_at >= now() - make_interval(days => v_window_days)
    UNION ALL
    SELECT
      p.id,
      ('g:' || gf.submitter_key::text),
      gf.created_at,
      (
        SELECT count(*)::bigint FROM public.feedback_card_empathies e
        WHERE e.target_source = 'guest_detailed' AND e.target_id = gf.id
      )
    FROM public.project_guest_feedback gf
    INNER JOIN public.projects p ON p.id::text = gf.project_id
    WHERE p.visibility = 'public'
      AND gf.include_in_public_aggregate = true
      AND gf.moderation_status = 'visible'
      AND gf.created_at >= now() - make_interval(days => v_window_days)
  ),
  agg AS (
    SELECT
      e.project_id,
      count(DISTINCT e.author_key)::bigint AS distinct_author_count,
      count(*)::bigint AS feedback_count,
      max(e.created_at) AS last_feedback_at,
      coalesce(sum(e.empathy_count), 0)::bigint AS empathy_count
    FROM fb_events e
    GROUP BY e.project_id
  ),
  ranked AS (
    SELECT
      p.id AS project_id,
      p.title,
      coalesce(p.category, 'game') AS category,
      coalesce(p.description, '') AS description,
      p.thumbnail_url,
      v_window_days AS window_days,
      a.distinct_author_count,
      a.feedback_count,
      EXISTS (
        SELECT 1
        FROM public.feedback_card_replies rep
        WHERE rep.project_id = p.id::text
          AND rep.author_id = p.owner_id
      ) AS has_creator_reply,
      a.last_feedback_at,
      a.empathy_count
    FROM agg a
    INNER JOIN public.projects p ON p.id = a.project_id
    WHERE p.visibility = 'public'
      AND (a.distinct_author_count >= 2 OR a.feedback_count >= 3)
  )
  SELECT
    r.project_id,
    r.title,
    r.category,
    r.description,
    r.thumbnail_url,
    r.window_days,
    r.distinct_author_count,
    r.feedback_count,
    r.has_creator_reply,
    r.last_feedback_at,
    r.empathy_count
  FROM ranked r
  ORDER BY
    r.distinct_author_count DESC,
    r.feedback_count DESC,
    r.has_creator_reply DESC,
    r.last_feedback_at DESC,
    r.empathy_count DESC,
    r.project_id ASC
  LIMIT v_limit;
END;
$$;

REVOKE ALL ON FUNCTION public.get_home_feedback_gathering_projects(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_home_feedback_gathering_projects(integer)
  TO anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- B. Meaningful updates — add summary / version / label (same event rules)
-- 080 OUT columns differ (no update_label / update_summary / published_version).
-- ---------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.get_home_meaningful_updates(integer);

CREATE OR REPLACE FUNCTION public.get_home_meaningful_updates(
  p_limit integer DEFAULT 16
)
RETURNS TABLE (
  project_id uuid,
  title text,
  category text,
  thumbnail_url text,
  update_kind text,
  update_label text,
  update_summary text,
  published_version text,
  meaningful_update_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH events AS (
    SELECT
      p.id AS project_id,
      p.title,
      coalesce(p.category, 'game') AS category,
      p.thumbnail_url,
      'release'::text AS update_kind,
      'リリース'::text AS update_label,
      coalesce(
        nullif(btrim(e.note), ''),
        '正式版を公開しました'
      ) AS update_summary,
      nullif(btrim(p.playable_version), '') AS published_version,
      e.created_at AS meaningful_update_at
    FROM public.project_release_events e
    INNER JOIN public.projects p ON p.id = e.project_id
    WHERE p.visibility = 'public'
      AND e.event_type = 'released'
      AND e.source IS DISTINCT FROM 'onboarding'
    UNION ALL
    SELECT
      p.id,
      p.title,
      coalesce(p.category, 'game'),
      p.thumbnail_url,
      'devlog'::text,
      '開発ログ'::text,
      coalesce(
        nullif(btrim(d.title), ''),
        left(nullif(btrim(d.content), ''), 120),
        '開発ログを更新しました'
      ),
      nullif(btrim(d.published_version), ''),
      coalesce(d.published_at, d.created_at)
    FROM public.project_devlogs d
    INNER JOIN public.projects p ON p.id::text = d.project_id
    WHERE p.visibility = 'public'
      AND coalesce(d.is_initial_publish, false) = false
      AND coalesce(d.published_at, d.created_at) IS NOT NULL
  ),
  best AS (
    SELECT DISTINCT ON (project_id)
      project_id,
      title,
      category,
      thumbnail_url,
      update_kind,
      update_label,
      update_summary,
      published_version,
      meaningful_update_at
    FROM events
    ORDER BY project_id, meaningful_update_at DESC
  )
  SELECT *
  FROM best
  ORDER BY meaningful_update_at DESC
  LIMIT greatest(1, least(coalesce(p_limit, 16), 40));
$$;

REVOKE ALL ON FUNCTION public.get_home_meaningful_updates(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_home_meaningful_updates(integer)
  TO anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- C. Newest — include description for short overview cards
-- 080 OUT columns differ (no description).
-- ---------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.get_home_newest_projects(integer, text);

CREATE OR REPLACE FUNCTION public.get_home_newest_projects(
  p_limit integer DEFAULT 16,
  p_category text DEFAULT NULL
)
RETURNS TABLE (
  project_id uuid,
  title text,
  category text,
  description text,
  thumbnail_url text,
  first_published_at timestamptz,
  creator text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.id AS project_id,
    p.title,
    coalesce(p.category, 'game') AS category,
    coalesce(p.description, '') AS description,
    p.thumbnail_url,
    coalesce(p.first_published_at, p.created_at) AS first_published_at,
    coalesce(nullif(btrim(p.creator), ''), p.owner_name) AS creator
  FROM public.projects p
  WHERE p.visibility = 'public'
    AND (
      p_category IS NULL
      OR p_category = ''
      OR p_category = 'all'
      OR coalesce(p.category, 'game') = p_category
    )
  ORDER BY coalesce(p.first_published_at, p.created_at) DESC NULLS LAST
  LIMIT greatest(1, least(coalesce(p_limit, 16), 40));
$$;

REVOKE ALL ON FUNCTION public.get_home_newest_projects(integer, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_home_newest_projects(integer, text)
  TO anon, authenticated, service_role;

COMMIT;
