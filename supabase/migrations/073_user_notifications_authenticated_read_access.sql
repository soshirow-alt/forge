-- 073: authenticated minimum privilege for user_notifications (SELECT + read_at UPDATE)
-- Staging only until owner applies (vuqpwvjvgyxffmvpfrxo). Do not apply to Production from Cursor.
-- Prerequisite: 003 (table + RLS), 039 (registered update policy), 044 (owner insert policy), 070 (feedback_reply)
--
-- Problem (Staging 2026-07-16):
--   authenticated SELECT → 42501 permission denied (table GRANT missing).
--   GamesProvider → fetchUserNotifications cannot list notifications.
--
-- Design:
--   Recipients: SELECT own rows; UPDATE read_at only (column-level GRANT).
--   Non-owners cannot INSERT arbitrary rows (RLS "Project owners insert notifications").
--   feedback_reply / voice_received / project_watched: SECURITY DEFINER inserts (no client INSERT).
--   Studio owner broadcast (devlog / version_published / confirmation / follow): authenticated
--     client INSERT still requires table INSERT privilege — authorization is RLS policy, not GRANT.
--   service_role: no table GRANT (existing code does not depend on service_role DML for this table).
--   anon / PUBLIC: no access.
--
-- Tamper prevention:
--   RLS scopes rows to auth.uid() = user_id.
--   Column-level UPDATE (read_at) blocks message / type / project_id / user_id changes via REST.
--
-- After apply:
--   node --env-file=.env.local scripts/staging-only/verify-user-notifications-security.mjs
--   node --env-file=.env.local scripts/staging-only/verify-feedback-reply-notifications.mjs

BEGIN;

REVOKE ALL ON TABLE public.user_notifications FROM PUBLIC;
REVOKE ALL ON TABLE public.user_notifications FROM anon;

REVOKE ALL ON TABLE public.user_notifications FROM authenticated;
GRANT SELECT ON TABLE public.user_notifications TO authenticated;
GRANT UPDATE (read_at) ON TABLE public.user_notifications TO authenticated;

-- Owner-side broadcast inserts (games-provider + user-notifications-db insert* functions).
-- Non-owner INSERT attempts fail at RLS WITH CHECK even with this privilege.
GRANT INSERT ON TABLE public.user_notifications TO authenticated;

-- Harden SELECT: registered users read own inbox only.
DROP POLICY IF EXISTS "Users read own notifications" ON public.user_notifications;
CREATE POLICY "Users read own notifications"
  ON public.user_notifications
  FOR SELECT
  USING (
    public.auth_is_registered_user()
    AND auth.uid() = user_id
  );

-- UPDATE policy unchanged in intent; column GRANT enforces read_at-only client writes.
DROP POLICY IF EXISTS "Users update own notifications" ON public.user_notifications;
CREATE POLICY "Users update own notifications"
  ON public.user_notifications
  FOR UPDATE
  USING (
    public.auth_is_registered_user()
    AND auth.uid() = user_id
  )
  WITH CHECK (
    public.auth_is_registered_user()
    AND auth.uid() = user_id
  );

COMMENT ON TABLE public.user_notifications IS
  'In-app inbox. Recipients SELECT own rows; UPDATE read_at only. Inserts via SECURITY DEFINER (voice/reply/watch) or owner INSERT policy. No service_role table grant required.';

COMMIT;
