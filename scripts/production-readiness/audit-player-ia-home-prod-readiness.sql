-- =============================================================================
-- Player IA Home v0 — Production READINESS audit (READ-ONLY)
-- =============================================================================
-- Project: Production only — ref bpnisgzxuwdxelhnduuf
-- Mode: SELECT / dynamic read-only EXECUTE. NO permanent DDL / no RPC create.
-- Runner: Owner in Supabase SQL Editor (Production).
-- Cursor/Codex must not apply writes. This file must succeed END-TO-END even when
-- migrations 076–083 are NOT yet applied (077/078 tables absent).
-- =============================================================================

-- 0) Identity
SELECT
  'env_identity' AS section,
  current_database() AS database_name,
  current_user AS db_user,
  'CONFIRM Owner: Production ref bpnisgzxuwdxelhnduuf' AS owner_check;

-- 1) Public projects
SELECT
  'public_projects' AS section,
  count(*) AS public_project_count
FROM public.projects
WHERE visibility = 'public';

-- 2) Category column presence (076)
SELECT
  'category_column' AS section,
  EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'projects'
      AND column_name = 'category'
  ) AS category_column_present;

-- If category_column_present, Owner may also run:
--   SELECT coalesce(category,'(null)') AS category, count(*) AS n
--   FROM public.projects WHERE visibility = 'public'
--   GROUP BY 1 ORDER BY n DESC;

-- 3) Feedback raw windows
SELECT
  'feedback_windows' AS section,
  (
    SELECT count(*) FROM public.project_voice_responses r
    INNER JOIN public.projects p ON p.id::text = r.project_id
    WHERE p.visibility = 'public' AND r.moderation_status = 'visible'
      AND r.created_at >= now() - interval '30 days'
  ) AS registered_voice_30d,
  (
    SELECT count(*) FROM public.project_voice_responses r
    INNER JOIN public.projects p ON p.id::text = r.project_id
    WHERE p.visibility = 'public' AND r.moderation_status = 'visible'
      AND r.created_at >= now() - interval '90 days'
  ) AS registered_voice_90d,
  (
    SELECT count(*) FROM public.project_guest_voice_responses g
    INNER JOIN public.projects p ON p.id::text = g.project_id
    WHERE p.visibility = 'public' AND g.moderation_status = 'visible'
      AND g.include_in_public_aggregate = true
      AND g.created_at >= now() - interval '30 days'
  ) AS guest_voice_30d,
  (
    SELECT count(*) FROM public.project_guest_feedback gf
    INNER JOIN public.projects p ON p.id::text = gf.project_id
    WHERE p.visibility = 'public' AND gf.moderation_status = 'visible'
      AND gf.include_in_public_aggregate = true
      AND gf.created_at >= now() - interval '30 days'
  ) AS guest_detailed_30d;

-- 4) FB-gathering candidates matching 083 logic:
--    qualify = distinct_authors >= 2 OR feedback_count >= 3
--    window = 30d; if qualifying projects < 4, use 90d
WITH
params AS (
  SELECT 30 AS days_primary, 90 AS days_fallback, 4 AS min_qualifying
),
events_30 AS (
  SELECT p.id AS project_id, ('r:' || r.user_id::text) AS author_key
  FROM public.project_voice_responses r
  INNER JOIN public.projects p ON p.id::text = r.project_id
  WHERE p.visibility = 'public' AND r.moderation_status = 'visible'
    AND r.created_at >= now() - interval '30 days'
  UNION ALL
  SELECT p.id, ('g:' || g.submitter_key::text)
  FROM public.project_guest_voice_responses g
  INNER JOIN public.projects p ON p.id::text = g.project_id
  WHERE p.visibility = 'public' AND g.moderation_status = 'visible'
    AND g.include_in_public_aggregate = true
    AND g.created_at >= now() - interval '30 days'
  UNION ALL
  SELECT p.id, ('r:' || f.user_id::text)
  FROM public.project_feedback f
  INNER JOIN public.projects p ON p.id::text = f.project_id
  WHERE p.visibility = 'public' AND f.moderation_status = 'visible'
    AND f.created_at >= now() - interval '30 days'
  UNION ALL
  SELECT p.id, ('g:' || gf.submitter_key::text)
  FROM public.project_guest_feedback gf
  INNER JOIN public.projects p ON p.id::text = gf.project_id
  WHERE p.visibility = 'public' AND gf.moderation_status = 'visible'
    AND gf.include_in_public_aggregate = true
    AND gf.created_at >= now() - interval '30 days'
),
agg_30 AS (
  SELECT project_id,
         count(*) AS feedback_count,
         count(DISTINCT author_key) AS distinct_authors
  FROM events_30
  GROUP BY project_id
),
qual_30 AS (
  SELECT count(*) AS n
  FROM agg_30
  WHERE distinct_authors >= 2 OR feedback_count >= 3
),
chosen AS (
  SELECT CASE
           WHEN (SELECT n FROM qual_30) < 4 THEN 90
           ELSE 30
         END AS window_days
),
events_w AS (
  SELECT p.id AS project_id, ('r:' || r.user_id::text) AS author_key
  FROM public.project_voice_responses r
  INNER JOIN public.projects p ON p.id::text = r.project_id
  CROSS JOIN chosen c
  WHERE p.visibility = 'public' AND r.moderation_status = 'visible'
    AND r.created_at >= now() - make_interval(days => c.window_days)
  UNION ALL
  SELECT p.id, ('g:' || g.submitter_key::text)
  FROM public.project_guest_voice_responses g
  INNER JOIN public.projects p ON p.id::text = g.project_id
  CROSS JOIN chosen c
  WHERE p.visibility = 'public' AND g.moderation_status = 'visible'
    AND g.include_in_public_aggregate = true
    AND g.created_at >= now() - make_interval(days => c.window_days)
  UNION ALL
  SELECT p.id, ('r:' || f.user_id::text)
  FROM public.project_feedback f
  INNER JOIN public.projects p ON p.id::text = f.project_id
  CROSS JOIN chosen c
  WHERE p.visibility = 'public' AND f.moderation_status = 'visible'
    AND f.created_at >= now() - make_interval(days => c.window_days)
  UNION ALL
  SELECT p.id, ('g:' || gf.submitter_key::text)
  FROM public.project_guest_feedback gf
  INNER JOIN public.projects p ON p.id::text = gf.project_id
  CROSS JOIN chosen c
  WHERE p.visibility = 'public' AND gf.moderation_status = 'visible'
    AND gf.include_in_public_aggregate = true
    AND gf.created_at >= now() - make_interval(days => c.window_days)
),
agg_w AS (
  SELECT project_id,
         count(*) AS feedback_count,
         count(DISTINCT author_key) AS distinct_authors
  FROM events_w
  GROUP BY project_id
)
SELECT
  'feedback_gathering_approx' AS section,
  (SELECT window_days FROM chosen) AS effective_window_days,
  (SELECT n FROM qual_30) AS qualifying_projects_30d,
  count(*) FILTER (
    WHERE distinct_authors >= 2 OR feedback_count >= 3
  ) AS approx_shelf_candidates_effective_window
FROM agg_w;

-- 5) Meaningful update candidates (aligned with 083 WHERE)
-- release: event_type='released' AND source IS DISTINCT FROM 'onboarding'
-- devlog: not initial publish; coalesce(published_at, created_at) IS NOT NULL
SELECT
  'meaningful_updates_shelf_candidates' AS section,
  (
    SELECT count(DISTINCT project_id) FROM (
      SELECT p.id AS project_id
      FROM public.project_release_events e
      INNER JOIN public.projects p ON p.id = e.project_id
      WHERE p.visibility = 'public'
        AND e.event_type = 'released'
        AND e.source IS DISTINCT FROM 'onboarding'
      UNION
      SELECT p.id
      FROM public.project_devlogs d
      INNER JOIN public.projects p ON p.id::text = d.project_id
      WHERE p.visibility = 'public'
        AND coalesce(d.is_initial_publish, false) = false
        AND coalesce(d.published_at, d.created_at) IS NOT NULL
    ) u
  ) AS approx_meaningful_update_projects,
  (
    SELECT count(DISTINCT p.id)
    FROM public.projects p
    INNER JOIN public.project_release_events e ON p.id = e.project_id
    WHERE p.visibility = 'public'
      AND e.event_type = 'released'
      AND e.source IS DISTINCT FROM 'onboarding'
  ) AS release_shelf_eligible_projects,
  (
    SELECT count(DISTINCT p.id)
    FROM public.projects p
    INNER JOIN public.project_devlogs d ON d.project_id = p.id::text
    WHERE p.visibility = 'public'
      AND coalesce(d.is_initial_publish, false) = false
      AND coalesce(d.published_at, d.created_at) IS NOT NULL
  ) AS non_initial_devlog_shelf_eligible_projects;

-- Data-quality (NOT shelf candidates): first_published_at filled
SELECT
  'newest_data_quality' AS section,
  count(*) FILTER (WHERE first_published_at IS NOT NULL) AS public_with_first_published_at,
  count(*) FILTER (WHERE first_published_at IS NULL) AS public_with_null_first_published_at
FROM public.projects
WHERE visibility = 'public';

-- Newest shelf candidates (083): all public projects ordered by coalesce(first_published_at, created_at)
SELECT
  'newest_shelf_candidates' AS section,
  count(*) AS public_projects_eligible_for_newest_shelf
FROM public.projects
WHERE visibility = 'public';

-- 6) Object presence only (safe when 077/078 absent — no static table refs)
SELECT
  'object_presence' AS section,
  to_regclass('public.project_usage_relations') IS NOT NULL AS has_usage_table,
  to_regclass('public.platform_announcements') IS NOT NULL AS has_announcements_table,
  to_regprocedure('public.get_home_feedback_gathering_projects(integer, text)') IS NOT NULL AS has_fb_gathering_rpc,
  to_regprocedure('public.get_home_meaningful_updates(integer, text)') IS NOT NULL AS has_meaningful_updates_rpc,
  to_regprocedure('public.get_home_newest_projects(integer,text)') IS NOT NULL AS has_newest_rpc,
  to_regprocedure('public.get_public_project_usage_relations(uuid,integer)') IS NOT NULL AS has_usage_rpc,
  to_regprocedure('public.get_public_platform_announcements(integer,integer)') IS NOT NULL AS has_announcements_rpc;

-- 7) Optional counts via dynamic SQL (skips cleanly when tables absent)
DO $$
DECLARE
  v_usage bigint;
  v_ann_pub bigint;
  v_ann_draft bigint;
BEGIN
  IF to_regclass('public.project_usage_relations') IS NOT NULL THEN
    EXECUTE $q$
      SELECT count(*) FROM public.project_usage_relations
      WHERE relation_type = 'used' AND status = 'published'
    $q$ INTO v_usage;
    RAISE NOTICE 'usage_published_used_count=%', v_usage;
  ELSE
    RAISE NOTICE 'usage_published_used_count=NOT_APPLIED';
  END IF;

  IF to_regclass('public.platform_announcements') IS NOT NULL THEN
    EXECUTE $q$
      SELECT count(*) FROM public.platform_announcements WHERE status = 'published'
    $q$ INTO v_ann_pub;
    EXECUTE $q$
      SELECT count(*) FROM public.platform_announcements WHERE status = 'draft'
    $q$ INTO v_ann_draft;
    RAISE NOTICE 'announcements_published=% announcements_draft=%', v_ann_pub, v_ann_draft;
  ELSE
    RAISE NOTICE 'announcements_published=NOT_APPLIED announcements_draft=NOT_APPLIED';
  END IF;
END $$;

-- 8) Thumbnails
SELECT
  'thumbnails' AS section,
  count(*) FILTER (
    WHERE thumbnail_url IS NOT NULL AND btrim(thumbnail_url) <> ''
  ) AS with_thumbnail_url,
  count(*) FILTER (
    WHERE thumbnail_url IS NULL OR btrim(coalesce(thumbnail_url, '')) = ''
  ) AS no_thumbnail_url
FROM public.projects
WHERE visibility = 'public';

-- 9) Judgment helper
SELECT
  'judgment_notes' AS section,
  'Empty shelves hide in UI; Features CTA always shows' AS empty_shelf_ui,
  'Do NOT seed Staging data into Production' AS seed_policy,
  'NOTICE lines above hold usage/announcement counts when tables exist' AS notice_counts,
  'If approx_shelf_candidates_effective_window < 1, Owner decides soft-launch vs wait' AS owner_decision;
