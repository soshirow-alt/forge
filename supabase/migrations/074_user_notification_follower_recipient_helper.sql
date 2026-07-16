-- 074: followed_developer notification INSERT — SECURITY DEFINER follower check
-- Prerequisite: 073 applied (user_notifications INSERT policies)
-- Do not rewrite 073. Production apply after owner review.
--
-- Fixes: 073 policy read developer_follows directly, but RLS only allows follower_id = auth.uid().
--        Project owners cannot see their follower rows via direct SELECT.
--        Use boolean helper (no list, no follower_id table GRANT to authenticated).
--
-- After apply (+ Staging project_watches GRANT sync):
--   node --env-file=.env.local scripts/staging-only/verify-user-notifications-insert-attacks.mjs

BEGIN;

CREATE OR REPLACE FUNCTION public.developer_has_follower(p_follower_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    auth.uid() IS NOT NULL
    AND public.auth_is_registered_user()
    AND EXISTS (
      SELECT 1
      FROM public.developer_follows df
      WHERE df.developer_user_id = auth.uid()
        AND df.follower_id = p_follower_id
    );
$$;

REVOKE ALL ON FUNCTION public.developer_has_follower(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.developer_has_follower(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.developer_has_follower(uuid) TO authenticated;

COMMENT ON FUNCTION public.developer_has_follower(uuid) IS
  'True when p_follower_id follows auth.uid() as developer. Used by user_notifications followed_developer INSERT policy only.';

DROP POLICY IF EXISTS "Owners insert developer follower notifications"
  ON public.user_notifications;

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
    AND public.developer_has_follower(user_notifications.user_id)
  );

COMMIT;
