-- Owner APPLY: watch-update coalesce unique index (+ safe dedupe)
-- Same as supabase/migrations/103_user_notifications_watch_update_coalesce_unique.sql
-- Order: run read-only-preflight-watch-update-coalesce.sql → apply this → then deploy app bundle
--        that writes watch-update coalesce_key (or apply ASAP after Preview deploy).
-- Do NOT run from Cursor against Production.

BEGIN;

WITH ranked AS (
  SELECT
    id,
    row_number() OVER (
      PARTITION BY user_id, coalesce_key
      ORDER BY created_at DESC NULLS LAST, id DESC
    ) AS rn
  FROM public.user_notifications
  WHERE coalesce_key LIKE 'watch-update:%'
)
DELETE FROM public.user_notifications AS n
USING ranked AS r
WHERE n.id = r.id
  AND r.rn > 1;

CREATE UNIQUE INDEX IF NOT EXISTS user_notifications_watch_update_coalesce_uidx
  ON public.user_notifications (user_id, coalesce_key)
  WHERE coalesce_key LIKE 'watch-update:%';

COMMIT;
