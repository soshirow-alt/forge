-- 073: authenticated minimum privilege for user_notifications (SELECT + read_at UPDATE)
-- Staging only until owner applies (vuqpwvjvgyxffmvpfrxo). Do not apply to Production from Cursor.
-- Prerequisite: 003, 039, 044, 070
--
-- Grants: authenticated SELECT + UPDATE(read_at) + INSERT (owner broadcast only via RLS).
-- Hardens INSERT policies: recipient relationship validated per notification type.
-- service_role: no table GRANT.
--
-- After apply:
--   node --env-file=.env.local scripts/staging-only/verify-user-notifications-security.mjs
--   node --env-file=.env.local scripts/staging-only/verify-user-notifications-insert-attacks.mjs
--   node --env-file=.env.local scripts/staging-only/verify-feedback-reply-notifications.mjs

BEGIN;

REVOKE ALL ON TABLE public.user_notifications FROM PUBLIC;
REVOKE ALL ON TABLE public.user_notifications FROM anon;

REVOKE ALL ON TABLE public.user_notifications FROM authenticated;
GRANT SELECT ON TABLE public.user_notifications TO authenticated;
GRANT UPDATE (read_at) ON TABLE public.user_notifications TO authenticated;
GRANT INSERT ON TABLE public.user_notifications TO authenticated;

DROP POLICY IF EXISTS "Users read own notifications" ON public.user_notifications;
CREATE POLICY "Users read own notifications"
  ON public.user_notifications
  FOR SELECT
  USING (
    public.auth_is_registered_user()
    AND auth.uid() = user_id
  );

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

-- Replace single owner INSERT policy (044) with type-specific recipient checks.
DROP POLICY IF EXISTS "Project owners insert notifications" ON public.user_notifications;

CREATE POLICY "Owners insert watcher devlog notifications"
  ON public.user_notifications
  FOR INSERT
  WITH CHECK (
    public.auth_is_registered_user()
    AND type IN ('devlog', 'version_published')
    AND user_id IS DISTINCT FROM auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.projects p
      WHERE p.id::text = project_id
        AND p.owner_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1
      FROM public.project_watches pw
      WHERE pw.project_id = user_notifications.project_id
        AND pw.user_id = user_notifications.user_id
    )
  );

CREATE POLICY "Owners insert confirmation notifications"
  ON public.user_notifications
  FOR INSERT
  WITH CHECK (
    public.auth_is_registered_user()
    AND type = 'confirmation_request'
    AND confirmation_request_id IS NOT NULL
    AND user_id IS DISTINCT FROM auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.projects p
      WHERE p.id::text = project_id
        AND p.owner_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1
      FROM public.confirmation_requests cr
      WHERE cr.id = confirmation_request_id
        AND cr.project_id = user_notifications.project_id
    )
    AND EXISTS (
      SELECT 1
      FROM public.get_confirmation_notify_recipients(
        user_notifications.project_id,
        (
          SELECT cr.notify_audience
          FROM public.confirmation_requests cr
          WHERE cr.id = confirmation_request_id
        ),
        coalesce(user_notifications.published_version, user_notifications.version_key),
        (
          SELECT cr.linked_priorities
          FROM public.confirmation_requests cr
          WHERE cr.id = confirmation_request_id
        )
      ) AS recipient_id
      WHERE recipient_id = user_notifications.user_id
    )
  );

CREATE POLICY "Owners insert developer follower notifications"
  ON public.user_notifications
  FOR INSERT
  WITH CHECK (
    public.auth_is_registered_user()
    AND type IN (
      'followed_developer_new_project',
      'followed_developer_released_project'
    )
    AND user_id IS DISTINCT FROM auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.projects p
      WHERE p.id::text = project_id
        AND p.owner_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1
      FROM public.developer_follows df
      WHERE df.developer_user_id = auth.uid()
        AND df.follower_id = user_notifications.user_id
    )
  );

COMMENT ON TABLE public.user_notifications IS
  'In-app inbox. Recipients SELECT own rows; UPDATE read_at only. Inserts: owner broadcast via type-specific RLS; voice/reply/watch via SECURITY DEFINER.';

COMMIT;
