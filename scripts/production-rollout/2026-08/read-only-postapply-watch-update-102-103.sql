-- Post-apply READ-ONLY audit after migrations 102 + 103
-- Owner runs on Staging then Production. Expect:
--   authenticated: SELECT, INSERT, DELETE on project_watches
--   anon: no INSERT/UPDATE/DELETE
--   RLS policies for own select/insert/delete + owner read
--   index user_notifications_watch_update_coalesce_uidx exists, unique, predicate watch-update:%
--   zero duplicate (user_id, coalesce_key) for watch-update keys

-- 1) project_watches grants
SELECT grantee, privilege_type
FROM information_schema.table_privileges
WHERE table_schema = 'public'
  AND table_name = 'project_watches'
  AND grantee IN ('authenticated', 'anon')
ORDER BY 1, 2;

-- 2b) RLS enabled?
SELECT c.relname, c.relrowsecurity AS rls_enabled, c.relforcerowsecurity AS rls_forced
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relname = 'project_watches';

-- 2) RLS policy expressions
SELECT
  pol.polname,
  pol.polcmd,
  pg_get_expr(pol.polqual, pol.polrelid) AS using_expr,
  pg_get_expr(pol.polwithcheck, pol.polrelid) AS with_check
FROM pg_policy pol
JOIN pg_class c ON c.oid = pol.polrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname = 'project_watches'
ORDER BY pol.polname;

-- 2c) policy roles
SELECT pol.polname, r.rolname AS role_name, pol.polpermissive
FROM pg_policy pol
JOIN pg_class c ON c.oid = pol.polrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
LEFT JOIN LATERAL unnest(pol.polroles) AS pr(oid) ON true
LEFT JOIN pg_roles r ON r.oid = pr.oid
WHERE n.nspname = 'public' AND c.relname = 'project_watches'
ORDER BY 1, 2;

-- 3) watch-update unique index shape
SELECT
  i.relname AS index_name,
  ix.indisunique,
  pg_get_indexdef(ix.indexrelid) AS indexdef,
  pg_get_expr(ix.indpred, ix.indrelid) AS predicate
FROM pg_index ix
JOIN pg_class i ON i.oid = ix.indexrelid
JOIN pg_class t ON t.oid = ix.indrelid
JOIN pg_namespace n ON n.oid = t.relnamespace
WHERE n.nspname = 'public'
  AND t.relname = 'user_notifications'
  AND i.relname = 'user_notifications_watch_update_coalesce_uidx';

-- 4) remaining duplicates must be 0
SELECT
  user_id,
  coalesce_key,
  count(*) AS row_count
FROM public.user_notifications
WHERE coalesce_key LIKE 'watch-update:%'
GROUP BY user_id, coalesce_key
HAVING count(*) > 1;
