-- READ ONLY — post-apply audit for seed-featured-hero-visibility.sql.
-- Intended for Staging ref vuqpwvjvgyxffmvpfrxo only.
-- Do not use this audit as authorization to apply any write on Production.

-- 1) Shared activity games + dedicated newest fixture.
SELECT
  p.id,
  p.title,
  p.category,
  p.visibility,
  p.owner_id,
  p.first_published_at,
  'forge-ia-seed-v1' = ANY (coalesce(p.tags, '{}'::text[])) AS has_ia_tag,
  'forge-featured-hero-seed' = ANY (coalesce(p.tags, '{}'::text[])) AS has_featured_tag
FROM public.projects p
WHERE p.id IN (
  'eeeeeeee-eeee-4eee-8eee-000000000001'::uuid,
  'eeeeeeee-eeee-4eee-8eee-000000000002'::uuid,
  'eeeeeeee-eeee-4eee-8eee-000000000003'::uuid,
  'eeeeeeee-eeee-4eee-8eee-000000000004'::uuid,
  'eeeeeeee-eeee-4eee-8eee-000000000091'::uuid,
  'eeeeeeee-eeee-4eee-8eee-000000000028'::uuid
)
ORDER BY p.id;

-- 2) Same 7-day metrics used by get_home_featured_hero for intended slots.
WITH seed_projects AS (
  SELECT p.id, p.first_published_at, p.owner_id
  FROM public.projects p
  WHERE p.id IN (
    'eeeeeeee-eeee-4eee-8eee-000000000001'::uuid,
    'eeeeeeee-eeee-4eee-8eee-000000000002'::uuid,
    'eeeeeeee-eeee-4eee-8eee-000000000004'::uuid,
    'eeeeeeee-eeee-4eee-8eee-000000000091'::uuid
  )
),
newest_ranks AS (
  SELECT
    p.id,
    row_number() OVER (
      ORDER BY p.first_published_at DESC, p.id ASC
    )::integer AS axis_rank
  FROM public.projects p
  WHERE p.visibility = 'public'
    AND p.first_published_at IS NOT NULL
),
feedback_7d AS (
  SELECT f.project_id, count(DISTINCT f.user_id)::bigint AS feedback_users_7d
  FROM public.project_feedback f
  WHERE f.moderation_status = 'visible'
    AND f.user_id IS NOT NULL
    AND f.created_at >= now() - interval '7 days'
  GROUP BY f.project_id
),
watches_7d AS (
  SELECT w.project_id, count(*)::bigint AS watchers_7d
  FROM public.project_watches w
  WHERE w.created_at >= now() - interval '7 days'
  GROUP BY w.project_id
),
players_7d AS (
  SELECT s.project_id, count(DISTINCT s.user_id)::bigint AS players_7d
  FROM public.project_play_sessions s
  WHERE s.user_id IS NOT NULL
    AND s.played_at >= now() - interval '7 days'
  GROUP BY s.project_id
),
players_prev_7d AS (
  SELECT s.project_id, count(DISTINCT s.user_id)::bigint AS players_prev_7d
  FROM public.project_play_sessions s
  WHERE s.user_id IS NOT NULL
    AND s.played_at >= now() - interval '14 days'
    AND s.played_at < now() - interval '7 days'
  GROUP BY s.project_id
),
meaningful_updates AS (
  SELECT d.project_id, max(d.created_at) AS meaningful_update_at
  FROM public.project_devlogs d
  INNER JOIN public.projects p ON p.id::text = d.project_id
  WHERE d.is_initial_publish = false
    AND d.created_at > p.first_published_at
  GROUP BY d.project_id
  UNION ALL
  SELECT e.project_id::text, max(e.created_at)
  FROM public.project_release_events e
  INNER JOIN public.projects p ON p.id = e.project_id
  WHERE e.event_type = 'released'
    AND e.source IS DISTINCT FROM 'onboarding'
    AND e.created_at > p.first_published_at
  GROUP BY e.project_id
)
SELECT
  sp.id AS project_id,
  sp.owner_id,
  coalesce(f.feedback_users_7d, 0) AS feedback_users_7d,
  coalesce(w.watchers_7d, 0) AS watchers_7d,
  coalesce(pl.players_7d, 0) AS players_7d,
  coalesce(pp.players_prev_7d, 0) AS players_prev_7d,
  coalesce(pl.players_7d, 0) - coalesce(pp.players_prev_7d, 0)
    AS player_delta_7d,
  nr.axis_rank AS newest_axis_rank,
  max(mu.meaningful_update_at) AS meaningful_update_at,
  CASE sp.id
    WHEN 'eeeeeeee-eeee-4eee-8eee-000000000001'::uuid
      THEN coalesce(f.feedback_users_7d, 0) + coalesce(w.watchers_7d, 0) > 0
    WHEN 'eeeeeeee-eeee-4eee-8eee-000000000002'::uuid
      THEN coalesce(pl.players_7d, 0) >= 1
        AND coalesce(pl.players_7d, 0) - coalesce(pp.players_prev_7d, 0) > 0
    WHEN 'eeeeeeee-eeee-4eee-8eee-000000000091'::uuid
      THEN nr.axis_rank <= 12
    WHEN 'eeeeeeee-eeee-4eee-8eee-000000000004'::uuid
      THEN max(mu.meaningful_update_at) IS NOT NULL
    ELSE false
  END AS intended_axis_candidate
FROM seed_projects sp
LEFT JOIN feedback_7d f ON f.project_id = sp.id::text
LEFT JOIN watches_7d w ON w.project_id = sp.id::text
LEFT JOIN players_7d pl ON pl.project_id = sp.id::text
LEFT JOIN players_prev_7d pp ON pp.project_id = sp.id::text
LEFT JOIN meaningful_updates mu ON mu.project_id = sp.id::text
LEFT JOIN newest_ranks nr ON nr.id = sp.id
GROUP BY
  sp.id,
  sp.owner_id,
  coalesce(f.feedback_users_7d, 0),
  coalesce(w.watchers_7d, 0),
  coalesce(pl.players_7d, 0),
  coalesce(pp.players_prev_7d, 0),
  nr.axis_rank
ORDER BY sp.id;

-- 3) Final RPC output: expect exact type/project pairs including dedicated newest.
SELECT
  h.featured_type,
  h.slot_rank,
  h.axis_rank,
  h.project_id,
  h.owner_id,
  h.title,
  h.feedback_users_7d,
  h.watchers_7d,
  h.players_7d,
  h.meaningful_update_at,
  h.update_kind,
  h.card_time_at,
  h.project_id IN (
    'eeeeeeee-eeee-4eee-8eee-000000000001'::uuid,
    'eeeeeeee-eeee-4eee-8eee-000000000002'::uuid,
    'eeeeeeee-eeee-4eee-8eee-000000000091'::uuid,
    'eeeeeeee-eeee-4eee-8eee-000000000004'::uuid
  ) AS is_fixed_seed_project
FROM public.get_home_featured_hero() h
ORDER BY h.slot_rank;

-- 4) Compact PASS/FAIL summary scoped to the four exact UUID/axis pairs.
WITH hero AS (
  SELECT * FROM public.get_home_featured_hero()
)
SELECT
  count(*) = 4 AS has_four_slots,
  count(*) FILTER (
    WHERE (featured_type = 'reaction'
        AND project_id = 'eeeeeeee-eeee-4eee-8eee-000000000001'::uuid)
       OR (featured_type = 'rising_plays'
        AND project_id = 'eeeeeeee-eeee-4eee-8eee-000000000002'::uuid)
       OR (featured_type = 'newest'
        AND project_id = 'eeeeeeee-eeee-4eee-8eee-000000000091'::uuid)
       OR (featured_type = 'updated'
        AND project_id = 'eeeeeeee-eeee-4eee-8eee-000000000004'::uuid)
  ) = 4 AS exact_seed_axis_pairs_pass,
  array_agg(featured_type ORDER BY slot_rank) AS slot_order
FROM hero;
