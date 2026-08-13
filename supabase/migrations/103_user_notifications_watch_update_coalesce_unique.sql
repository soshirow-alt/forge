-- 103: Unique coalesce keys for watch-update fanout dedupe
-- App inserts coalesce_key = watch-update:{type}:{projectId}:{entityId}
-- 089 only added a non-unique index on (user_id, coalesce_key).
-- Before UNIQUE index: keep newest row per (user_id, coalesce_key) for watch-update keys.
-- Owner applies Staging + Production manually. Prefer apply 103 before shipping fanout bundle
-- that writes coalesce_key (or apply ASAP after). Cursor does not apply Production.

BEGIN;

-- Deterministic dedupe if any watch-update coalesce duplicates already exist.
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

COMMENT ON INDEX public.user_notifications_watch_update_coalesce_uidx IS
  'Dedupe watch-update / confirmation fanout retries per recipient + coalesce_key.';

COMMIT;
