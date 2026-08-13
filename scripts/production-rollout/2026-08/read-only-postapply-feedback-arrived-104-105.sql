-- Production/Staging READ-ONLY post-check after 104+105
-- Expect: helper + advisory lock + unique recovery + soft-fail voice trigger + feedback trigger

SELECT
  position('pg_advisory_xact_lock' in pg_get_functiondef(
    'public.notify_owner_feedback_arrived(uuid,text,text)'::regprocedure
  )) > 0 AS has_advisory_lock,
  position('unique_violation' in pg_get_functiondef(
    'public.notify_owner_feedback_arrived(uuid,text,text)'::regprocedure
  )) > 0 AS has_unique_recovery,
  position('EXCEPTION WHEN OTHERS' in pg_get_functiondef(
    'public.notify_owner_on_voice_response()'::regprocedure
  )) > 0 AS voice_soft_fail,
  EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'project_feedback_notify_owner' AND NOT tgisinternal
  ) AS has_feedback_trigger;

SELECT user_id::text, project_id, version_key, count(*)::int AS unread_cnt
FROM public.user_notifications
WHERE type = 'voice_received' AND read_at IS NULL
GROUP BY user_id, project_id, version_key
HAVING count(*) > 1;
