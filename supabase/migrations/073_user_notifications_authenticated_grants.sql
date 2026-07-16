-- 073: restore authenticated access to user_notifications (SELECT/UPDATE)
-- Staging only until owner applies (vuqpwvjvgyxffmvpfrxo). Do not apply to Production from Cursor.
-- Prerequisite: 003 (table + RLS), 070 (feedback_reply type)
--
-- Symptom (Staging 2026-07-16):
--   authenticated SELECT on public.user_notifications →
--   42501 permission denied … GRANT SELECT … TO authenticated
--   RLS policies ("Users read own notifications" / update) exist, but table GRANT is missing.
--   GamesProvider → fetchUserNotifications therefore cannot list feedback_reply (or any) notifs.
--
-- Scope:
--   - GRANT SELECT, UPDATE to authenticated (matches RLS: own rows only)
--   - GRANT SELECT/INSERT/UPDATE/DELETE to service_role for ops/verify cleanup
--   - Do NOT open INSERT to authenticated clients (inserts remain SECURITY DEFINER / owner policies)
--   - Do NOT change notification message copy or feedback_reply RPC logic
--
-- After apply: re-run
--   node --env-file=.env.local scripts/staging-only/verify-feedback-reply-notifications.mjs

BEGIN;

GRANT SELECT, UPDATE ON TABLE public.user_notifications TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.user_notifications TO service_role;

COMMENT ON TABLE public.user_notifications IS
  'In-app notifications. Recipients SELECT/UPDATE own rows; writes via SECURITY DEFINER RPCs / privileged insert policies.';

COMMIT;
