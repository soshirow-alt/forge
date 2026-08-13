-- Production READ-ONLY audit: project_watches privileges + RLS
-- Owner runs in Production SQL editor. Cursor must not write Production.
-- Expected for healthy watch toggle + owner fanout SELECT:
--   authenticated: SELECT, INSERT, DELETE
--   RLS: users manage own rows; owners can SELECT watches on owned projects

SELECT grantee, privilege_type
FROM information_schema.table_privileges
WHERE table_schema = 'public'
  AND table_name = 'project_watches'
ORDER BY 1, 2;

SELECT pol.polname,
       pol.polcmd,
       pg_get_expr(pol.polqual, pol.polrelid) AS using_expr,
       pg_get_expr(pol.polwithcheck, pol.polrelid) AS with_check
FROM pg_policy pol
JOIN pg_class c ON c.oid = pol.polrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname = 'project_watches'
ORDER BY pol.polname;
