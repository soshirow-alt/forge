-- Read-only: fetch live INSERT policy on Staging user_notifications
SELECT
  pol.polname AS policy_name,
  CASE pol.polcmd
    WHEN 'r' THEN 'SELECT'
    WHEN 'a' THEN 'INSERT'
    WHEN 'w' THEN 'UPDATE'
    WHEN 'd' THEN 'DELETE'
    WHEN '*' THEN 'ALL'
  END AS command,
  pol.polpermissive AS permissive,
  (
    SELECT coalesce(array_agg(rol.rolname ORDER BY rol.rolname), ARRAY[]::name[])
    FROM pg_catalog.pg_roles rol
    WHERE rol.oid = ANY (pol.polroles)
  ) AS roles,
  pg_catalog.pg_get_expr(pol.polqual, pol.polrelid) AS using_expression,
  pg_catalog.pg_get_expr(pol.polwithcheck, pol.polrelid) AS with_check_expression
FROM pg_catalog.pg_policy pol
JOIN pg_catalog.pg_class cls ON cls.oid = pol.polrelid
JOIN pg_catalog.pg_namespace nsp ON nsp.oid = cls.relnamespace
WHERE nsp.nspname = 'public'
  AND cls.relname = 'user_notifications'
  AND pol.polcmd = 'a'
ORDER BY pol.polname;
