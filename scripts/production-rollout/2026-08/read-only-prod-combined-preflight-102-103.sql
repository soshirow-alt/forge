-- Production READ-ONLY combined preflight for 102/103 (Owner Dashboard)
-- Project MUST be bpnisgzxuwdxelhnduuf. Cursor does not execute this against Production
-- when credentials are unavailable/redacted.
--
-- GO rule for 103: duplicate_groups = 0 AND rows_103_would_delete = 0
-- If either > 0 → BLOCK apply; report list to Owner.

-- A) Grants
SELECT grantee, privilege_type
FROM information_schema.table_privileges
WHERE table_schema = 'public'
  AND table_name = 'project_watches'
  AND grantee IN ('authenticated', 'anon')
ORDER BY 1, 2;

-- B) RLS enabled
SELECT c.relname, c.relrowsecurity AS rls_enabled, c.relforcerowsecurity AS rls_forced
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relname = 'project_watches';

-- C) Policies
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

-- D) Existing 103 index?
SELECT
  i.relname AS index_name,
  ix.indisunique,
  pg_get_expr(ix.indpred, ix.indrelid) AS predicate
FROM pg_index ix
JOIN pg_class i ON i.oid = ix.indexrelid
JOIN pg_class t ON t.oid = ix.indrelid
JOIN pg_namespace n ON n.oid = t.relnamespace
WHERE n.nspname = 'public'
  AND t.relname = 'user_notifications'
  AND i.relname = 'user_notifications_watch_update_coalesce_uidx';

-- E) Duplicate groups (103 DELETE targets rn>1 within each group)
SELECT
  user_id::text,
  coalesce_key,
  count(*)::int AS row_count,
  (count(*) - 1)::int AS rows_103_would_delete_in_group
FROM public.user_notifications
WHERE coalesce_key LIKE 'watch-update:%'
GROUP BY user_id, coalesce_key
HAVING count(*) > 1
ORDER BY row_count DESC
LIMIT 100;

-- F) Totals
SELECT
  (SELECT count(*)::int
   FROM public.user_notifications
   WHERE coalesce_key LIKE 'watch-update:%') AS watch_update_coalesce_rows,
  (SELECT coalesce(sum(cnt - 1), 0)::int
   FROM (
     SELECT count(*) AS cnt
     FROM public.user_notifications
     WHERE coalesce_key LIKE 'watch-update:%'
     GROUP BY user_id, coalesce_key
     HAVING count(*) > 1
   ) s) AS rows_103_would_delete_total,
  (SELECT count(*)::int
   FROM (
     SELECT 1
     FROM public.user_notifications
     WHERE coalesce_key LIKE 'watch-update:%'
     GROUP BY user_id, coalesce_key
     HAVING count(*) > 1
   ) g) AS duplicate_group_count;
