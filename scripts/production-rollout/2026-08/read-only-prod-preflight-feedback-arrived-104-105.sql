-- Production READ-ONLY preflight for 104/105 (bpnisgzxuwdxelhnduuf)
-- Do not apply 104/105 until Owner GO. Cursor never writes Production.

-- A) Helper / trigger presence (expect absent before apply)
SELECT proname
FROM pg_proc
WHERE pronamespace = 'public'::regnamespace
  AND proname IN (
    'notify_owner_feedback_arrived',
    'trg_notify_owner_on_project_feedback'
  )
ORDER BY 1;

SELECT tgname
FROM pg_trigger
WHERE tgname = 'project_feedback_notify_owner'
  AND NOT tgisinternal;

-- B) voice_received unique unread index (required for coalesce)
SELECT indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'user_notifications'
  AND indexname = 'user_notifications_voice_unread_unique';

-- C) Current unread voice_received duplicate groups (should be 0)
SELECT user_id::text, project_id, version_key, count(*)::int AS unread_cnt
FROM public.user_notifications
WHERE type = 'voice_received'
  AND read_at IS NULL
GROUP BY user_id, project_id, version_key
HAVING count(*) > 1
ORDER BY unread_cnt DESC
LIMIT 50;

SELECT coalesce(sum(cnt - 1), 0)::int AS unread_voice_received_extra_rows
FROM (
  SELECT count(*) AS cnt
  FROM public.user_notifications
  WHERE type = 'voice_received' AND read_at IS NULL
  GROUP BY user_id, project_id, version_key
  HAVING count(*) > 1
) s;
