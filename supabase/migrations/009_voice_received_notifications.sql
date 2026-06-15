-- 009: voice_received notifications for project owners
-- Prerequisite: 003 + 005 applied
-- Player voice INSERT → notify project owner via SECURITY DEFINER trigger (not client INSERT)

BEGIN;

ALTER TABLE public.user_notifications
  ADD COLUMN IF NOT EXISTS version_key text NULL;

ALTER TABLE public.user_notifications
  DROP CONSTRAINT IF EXISTS user_notifications_type_check;

ALTER TABLE public.user_notifications
  ADD CONSTRAINT user_notifications_type_check
  CHECK (type IN ('devlog', 'version_published', 'voice_received'));

CREATE UNIQUE INDEX IF NOT EXISTS user_notifications_voice_unread_unique
  ON public.user_notifications (user_id, project_id, version_key)
  WHERE type = 'voice_received' AND read_at IS NULL;

CREATE OR REPLACE FUNCTION public.notify_owner_on_voice_response()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner_id uuid;
  v_title text;
  v_message text;
BEGIN
  SELECT p.owner_id, p.title
  INTO v_owner_id, v_title
  FROM public.projects p
  WHERE p.id::text = NEW.project_id;

  IF v_owner_id IS NULL OR NEW.user_id = v_owner_id THEN
    RETURN NEW;
  END IF;

  v_message := format(
    '「%s」にプレイヤーの回答が届きました（v%s）',
    v_title,
    NEW.version_key
  );

  UPDATE public.user_notifications
  SET
    message = v_message,
    created_at = now()
  WHERE user_id = v_owner_id
    AND project_id = NEW.project_id
    AND version_key = NEW.version_key
    AND type = 'voice_received'
    AND read_at IS NULL;

  IF NOT FOUND THEN
    INSERT INTO public.user_notifications (
      user_id,
      type,
      project_id,
      version_key,
      message
    )
    VALUES (
      v_owner_id,
      'voice_received',
      NEW.project_id,
      NEW.version_key,
      v_message
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS project_voice_responses_notify_owner
  ON public.project_voice_responses;

CREATE TRIGGER project_voice_responses_notify_owner
  AFTER INSERT ON public.project_voice_responses
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_owner_on_voice_response();

COMMIT;
