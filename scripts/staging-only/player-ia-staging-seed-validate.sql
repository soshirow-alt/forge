-- STAGING ONLY validate — Player IA seed (read-only)
-- Run after basic seed (+ optional auth seed). Expect non-zero seed counts.
-- After cleanup: all seed_* counts = 0.

SELECT 'projects_total' AS check, count(*)::text AS value
FROM public.projects WHERE 'forge-ia-seed-v1' = ANY (coalesce(tags, '{}'))
UNION ALL
SELECT 'projects_' || coalesce(category, '?'), count(*)::text
FROM public.projects WHERE 'forge-ia-seed-v1' = ANY (coalesce(tags, '{}'))
GROUP BY category
UNION ALL
SELECT 'usage_relations', count(*)::text
FROM public.project_usage_relations WHERE id::text LIKE 'ffffffff-ffff-4fff-8fff-%'
UNION ALL
SELECT 'feedback_registered', count(*)::text
FROM public.project_feedback WHERE id::text LIKE '99999999-9999-4999-8999-%'
UNION ALL
SELECT 'feedback_guest', count(*)::text
FROM public.project_guest_feedback WHERE id::text LIKE 'bbbbbbbb-bbbb-4bbb-8bbb-%'
UNION ALL
SELECT 'empathies', count(*)::text
FROM public.feedback_card_empathies WHERE id::text LIKE '88888888-8888-4888-8888-%'
UNION ALL
SELECT 'replies', count(*)::text
FROM public.feedback_card_replies WHERE id::text LIKE '77777777-7777-4777-8777-%'
UNION ALL
SELECT 'devlogs', count(*)::text
FROM public.project_devlogs WHERE id::text LIKE '66666666-6666-4666-8666-%'
UNION ALL
SELECT 'release_events', count(*)::text
FROM public.project_release_events WHERE id::text LIKE '55555555-5555-4555-8555-%'
UNION ALL
SELECT 'announcements_published', count(*)::text
FROM public.platform_announcements
WHERE slug LIKE 'ia-seed-%' AND status = 'published'
UNION ALL
SELECT 'announcements_draft', count(*)::text
FROM public.platform_announcements
WHERE slug LIKE 'ia-seed-%' AND status = 'draft'
UNION ALL
SELECT 'stream_ok', count(*)::text
FROM public.projects WHERE 'forge-ia-seed-v1' = ANY (tags) AND stream_policy = 'ok'
UNION ALL
SELECT 'stream_conditional', count(*)::text
FROM public.projects WHERE 'forge-ia-seed-v1' = ANY (tags) AND stream_policy = 'conditional'
UNION ALL
SELECT 'stream_no', count(*)::text
FROM public.projects WHERE 'forge-ia-seed-v1' = ANY (tags) AND stream_policy = 'no'
UNION ALL
SELECT 'stream_unset', count(*)::text
FROM public.projects WHERE 'forge-ia-seed-v1' = ANY (tags) AND stream_policy = 'unset'
UNION ALL
SELECT 'quick_try_true', count(*)::text
FROM public.projects WHERE 'forge-ia-seed-v1' = ANY (tags) AND quick_try = true
UNION ALL
SELECT 'looking_for_testers_true', count(*)::text
FROM public.projects WHERE 'forge-ia-seed-v1' = ANY (tags) AND looking_for_testers = true
UNION ALL
SELECT 'usable_for_creation_true', count(*)::text
FROM public.projects WHERE 'forge-ia-seed-v1' = ANY (tags) AND usable_for_creation = true
UNION ALL
SELECT 'auth_seed_profiles', count(*)::text
FROM public.developer_profiles
WHERE creator_id LIKE 'ia-seed-dev-%'
UNION ALL
SELECT 'auth_profiles_owning_seed_projects', count(DISTINCT d.user_id)::text
FROM public.developer_profiles d
INNER JOIN public.projects p ON p.owner_id = d.user_id
WHERE d.creator_id LIKE 'ia-seed-dev-%'
  AND 'forge-ia-seed-v1' = ANY (coalesce(p.tags, '{}'))
UNION ALL
SELECT 'seed_projects_owned_by_dedicated', count(*)::text
FROM public.projects p
WHERE 'forge-ia-seed-v1' = ANY (coalesce(p.tags, '{}'))
  AND p.owner_id::text LIKE 'a1a1a1a1-a1a1-41a1-81a1-%'
UNION ALL
SELECT 'seed_projects_owned_by_fallback_hero', count(*)::text
FROM public.projects p
WHERE 'forge-ia-seed-v1' = ANY (coalesce(p.tags, '{}'))
  AND p.owner_id IN ('dddddddd-dddd-4ddd-8ddd-000000000001'::uuid, 'dddddddd-dddd-4ddd-8ddd-000000000002'::uuid)
UNION ALL
SELECT 'multi_a_categories', coalesce(string_agg(DISTINCT p.category, ',' ORDER BY p.category), '')
FROM public.developer_profiles d
INNER JOIN public.projects p ON p.owner_id = d.user_id
WHERE d.creator_id = 'ia-seed-dev-16'
  AND 'forge-ia-seed-v1' = ANY (coalesce(p.tags, '{}'))
UNION ALL
SELECT 'multi_b_categories', coalesce(string_agg(DISTINCT p.category, ',' ORDER BY p.category), '')
FROM public.developer_profiles d
INNER JOIN public.projects p ON p.owner_id = d.user_id
WHERE d.creator_id = 'ia-seed-dev-17'
  AND 'forge-ia-seed-v1' = ANY (coalesce(p.tags, '{}'))
UNION ALL
SELECT 'protected_smoke_a', CASE WHEN count(*) = 1 THEN 'ok' ELSE 'FAIL' END
FROM public.projects
WHERE id = '41ff5a96-105c-42a2-87b4-787bcfeacb45'::uuid AND NOT ('forge-ia-seed-v1' = ANY (coalesce(tags, '{}')))
UNION ALL
SELECT 'protected_hero', CASE WHEN count(*) = 1 THEN 'ok' ELSE 'FAIL' END
FROM public.projects
WHERE id = 'dddddddd-dddd-4ddd-8ddd-000000000203'::uuid AND NOT ('forge-ia-seed-v1' = ANY (coalesce(tags, '{}')))
UNION ALL
SELECT 'zero_hit_search', (
  SELECT count(*)::text FROM public.search_public_catalog('zzz-ia-seed-nohit-999', 10)
)
UNION ALL
SELECT 'zero_hit_seed_nohit', (
  SELECT count(*)::text FROM public.search_public_catalog('seed nohit', 10)
)
UNION ALL
SELECT 'zero_hit_zzz_seed_999', (
  SELECT count(*)::text FROM public.search_public_catalog('zzz seed 999', 10)
)
UNION ALL
SELECT 'hit_tag_SE', (
  SELECT count(*)::text FROM public.search_public_catalog('SE', 10)
  WHERE result_kind = 'tag' AND title = 'SE'
)
UNION ALL
SELECT 'hit_tag_dot_partial', (
  SELECT count(*)::text FROM public.search_public_catalog('ドット', 10)
  WHERE result_kind = 'tag' AND title = 'ドット絵'
)
UNION ALL
SELECT 'no_internal_seed_tag', (
  SELECT count(*)::text FROM public.search_public_catalog('forge-ia-seed-v1', 10)
  WHERE result_kind = 'tag' AND title = 'forge-ia-seed-v1'
);
