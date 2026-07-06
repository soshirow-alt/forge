-- 044: project_watched + developer-follow release notifications
-- Prerequisite: 017 (notification types), 030 (user_settings), 038 (owner insert policy)
--
-- Adds notification types:
--   project_watched                  — owner notified when someone watches their project
--   followed_developer_new_project   — followers notified on new public project (app insert)
--   followed_developer_released_project — followers notified on official release (app insert)
--
-- Apply via Supabase Dashboard SQL (owner manual). Do not auto-apply to production.

BEGIN;

ALTER TABLE public.user_notifications
  DROP CONSTRAINT IF EXISTS user_notifications_type_check;

ALTER TABLE public.user_notifications
  ADD CONSTRAINT user_notifications_type_check
  CHECK (
    type IN (
      'devlog',
      'version_published',
      'voice_received',
      'confirmation_request',
      'project_watched',
      'followed_developer_new_project',
      'followed_developer_released_project'
    )
  );

DROP POLICY IF EXISTS "Project owners insert notifications"
  ON public.user_notifications;

CREATE POLICY "Project owners insert notifications"
  ON public.user_notifications
  FOR INSERT
  WITH CHECK (
    public.auth_is_registered_user()
    AND type IN (
      'devlog',
      'version_published',
      'confirmation_request',
      'followed_developer_new_project',
      'followed_developer_released_project'
    )
    AND EXISTS (
      SELECT 1
      FROM public.projects p
      WHERE p.id::text = project_id
        AND p.owner_id = auth.uid()
    )
  );

CREATE OR REPLACE FUNCTION public.filter_users_by_studio_notification_pref(
  p_user_ids uuid[],
  p_pref_key text
)
RETURNS uuid[]
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(array_agg(ids.uid), '{}'::uuid[])
  FROM unnest(p_user_ids) AS ids(uid)
  WHERE COALESCE(
    (
      SELECT (notify_studio ->> p_pref_key)::boolean
      FROM public.user_settings
      WHERE user_id = ids.uid
    ),
    true
  );
$$;

REVOKE ALL ON FUNCTION public.filter_users_by_studio_notification_pref(uuid[], text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.filter_users_by_studio_notification_pref(uuid[], text) TO authenticated;

CREATE OR REPLACE FUNCTION public.notify_owner_on_project_watch()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner_id uuid;
  v_title text;
  v_witness_enabled boolean;
  v_message text;
BEGIN
  SELECT p.owner_id, p.title
  INTO v_owner_id, v_title
  FROM public.projects p
  WHERE p.id::text = NEW.project_id;

  IF v_owner_id IS NULL OR NEW.user_id = v_owner_id THEN
    RETURN NEW;
  END IF;

  SELECT COALESCE((notify_studio ->> 'witness')::boolean, true)
  INTO v_witness_enabled
  FROM public.user_settings
  WHERE user_id = v_owner_id;

  IF v_witness_enabled IS FALSE THEN
    RETURN NEW;
  END IF;

  v_message := format('誰かが「%s」を追い始めました', v_title);

  INSERT INTO public.user_notifications (
    user_id,
    type,
    project_id,
    message
  )
  VALUES (
    v_owner_id,
    'project_watched',
    NEW.project_id,
    v_message
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS project_watches_notify_owner ON public.project_watches;

CREATE TRIGGER project_watches_notify_owner
  AFTER INSERT ON public.project_watches
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_owner_on_project_watch();

COMMIT;
