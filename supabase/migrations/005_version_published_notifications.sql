-- 005: version_published notification type for playable version bump
-- Prerequisite: 003 applied (user_notifications)
-- Apply before deploying code that sends version_published notifications.

BEGIN;

-- A. published_version on notifications (nullable; used for version_published type)
ALTER TABLE public.user_notifications
  ADD COLUMN IF NOT EXISTS published_version text NULL;

-- B. extend type check: devlog | version_published
ALTER TABLE public.user_notifications
  DROP CONSTRAINT IF EXISTS user_notifications_type_check;

ALTER TABLE public.user_notifications
  ADD CONSTRAINT user_notifications_type_check
  CHECK (type IN ('devlog', 'version_published'));

-- C. RLS: allow owners to insert both notification types
DROP POLICY IF EXISTS "Project owners insert devlog notifications"
  ON public.user_notifications;

CREATE POLICY "Project owners insert notifications"
  ON public.user_notifications FOR INSERT
  WITH CHECK (
    type IN ('devlog', 'version_published')
    AND EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id::text = project_id AND p.owner_id = auth.uid()
    )
  );

COMMIT;
