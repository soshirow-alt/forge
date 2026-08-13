-- READ-ONLY preflight before applying migration 103 (Staging or Production).
-- Expect 0 rows before UNIQUE index create (after app may have written coalesce keys).
-- If count > 0, migration 103 DELETE keeps newest per (user_id, coalesce_key).

SELECT
  user_id,
  coalesce_key,
  count(*) AS row_count
FROM public.user_notifications
WHERE coalesce_key LIKE 'watch-update:%'
GROUP BY user_id, coalesce_key
HAVING count(*) > 1
ORDER BY row_count DESC
LIMIT 100;

SELECT count(*) AS watch_update_coalesce_rows
FROM public.user_notifications
WHERE coalesce_key LIKE 'watch-update:%';
