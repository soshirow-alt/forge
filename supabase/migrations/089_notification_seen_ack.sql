-- 089: separate notification seen state from explicit acknowledgement.
-- Badge semantics:
--   (requires_acknowledgement AND acknowledged_at IS NULL)
--   OR (NOT requires_acknowledgement AND seen_at IS NULL)

BEGIN;

ALTER TABLE public.user_notifications
  ADD COLUMN IF NOT EXISTS seen_at timestamptz NULL,
  ADD COLUMN IF NOT EXISTS acknowledged_at timestamptz NULL,
  ADD COLUMN IF NOT EXISTS requires_acknowledgement boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS coalesce_key text NULL;

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
      'followed_developer_released_project',
      'feedback_reply',
      'consultation_new',
      'consultation_message',
      'usage_relation_request',
      'usage_relation_accepted',
      'usage_relation_rejected'
    )
  );

UPDATE public.user_notifications
SET seen_at = read_at
WHERE read_at IS NOT NULL
  AND seen_at IS NULL;

CREATE INDEX IF NOT EXISTS user_notifications_badge_idx
  ON public.user_notifications (user_id, created_at DESC)
  WHERE (
    (requires_acknowledgement AND acknowledged_at IS NULL)
    OR (NOT requires_acknowledgement AND seen_at IS NULL)
  );
CREATE INDEX IF NOT EXISTS user_notifications_coalesce_idx
  ON public.user_notifications (user_id, coalesce_key)
  WHERE coalesce_key IS NOT NULL;

COMMENT ON COLUMN public.user_notifications.seen_at IS
  'Set when surfaced/opened; does not imply explicit acknowledgement.';
COMMENT ON COLUMN public.user_notifications.acknowledged_at IS
  'Explicit acknowledgement for important notifications.';
COMMENT ON COLUMN public.user_notifications.coalesce_key IS
  'Conversation-level key used to acknowledge related notifications together.';
COMMENT ON COLUMN public.user_notifications.requires_acknowledgement IS
  'Badge remains active until acknowledged_at when true; otherwise until seen_at.';

REVOKE UPDATE ON TABLE public.user_notifications FROM authenticated;
GRANT UPDATE (read_at, seen_at, acknowledged_at)
  ON TABLE public.user_notifications TO authenticated;

DROP FUNCTION IF EXISTS public.mark_notifications_seen();
CREATE FUNCTION public.mark_notifications_seen()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
BEGIN
  IF auth.uid() IS NULL OR NOT public.auth_is_registered_user() THEN
    RAISE EXCEPTION 'Registered authentication required';
  END IF;

  UPDATE public.user_notifications
  SET seen_at = now()
  WHERE user_id = auth.uid()
    AND seen_at IS NULL;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

DROP FUNCTION IF EXISTS public.acknowledge_notification(uuid);
CREATE FUNCTION public.acknowledge_notification(
  p_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT public.auth_is_registered_user() THEN
    RAISE EXCEPTION 'Registered authentication required';
  END IF;

  UPDATE public.user_notifications
  SET acknowledged_at = coalesce(acknowledged_at, now()),
      seen_at = coalesce(seen_at, now()),
      read_at = coalesce(read_at, now())
  WHERE id = p_id
    AND user_id = auth.uid();
  RETURN FOUND;
END;
$$;

DROP FUNCTION IF EXISTS public.acknowledge_notifications_by_coalesce_key(text);
CREATE FUNCTION public.acknowledge_notifications_by_coalesce_key(
  p_key text
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
BEGIN
  IF auth.uid() IS NULL OR NOT public.auth_is_registered_user() THEN
    RAISE EXCEPTION 'Registered authentication required';
  END IF;
  IF nullif(trim(p_key), '') IS NULL THEN
    RAISE EXCEPTION 'Coalesce key is required';
  END IF;

  UPDATE public.user_notifications
  SET acknowledged_at = coalesce(acknowledged_at, now()),
      seen_at = coalesce(seen_at, now()),
      read_at = coalesce(read_at, now())
  WHERE user_id = auth.uid()
    AND coalesce_key = p_key;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION public.mark_notifications_seen() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.acknowledge_notification(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.acknowledge_notifications_by_coalesce_key(text)
  FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.mark_notifications_seen() TO authenticated;
GRANT EXECUTE ON FUNCTION public.acknowledge_notification(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.acknowledge_notifications_by_coalesce_key(text)
  TO authenticated;

COMMIT;
