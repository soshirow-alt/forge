-- 104: Owner body notification for registered Feedback (including detailed-only).
-- Reuses type voice_received + unique unread index (user_id, project_id, version_key)
-- so voice answers and project_feedback share one "feedback arrived" notification
-- per owner × project × version while unread. Reciprocity (093/095) stays separate.
-- Does not edit 009/031/093/095.
-- Apply via Owner Dashboard SQL Editor only (Staging and Production).
-- Cursor/Codex must not execute this against any remote DB.

BEGIN;

CREATE OR REPLACE FUNCTION public.notify_owner_feedback_arrived(
  p_actor_id uuid,
  p_project_id text,
  p_version_key text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner_id uuid;
  v_title text;
  v_message text;
  v_project_key text := nullif(btrim(p_project_id), '');
  v_version text := coalesce(nullif(btrim(p_version_key), ''), 'latest');
BEGIN
  IF p_actor_id IS NULL OR v_project_key IS NULL THEN
    RETURN;
  END IF;

  SELECT p.owner_id, p.title
  INTO v_owner_id, v_title
  FROM public.projects p
  WHERE p.id::text = v_project_key;

  IF v_owner_id IS NULL OR p_actor_id = v_owner_id THEN
    RETURN;
  END IF;

  v_message := format(
    '「%s」にフィードバックが届きました（v%s）',
    v_title,
    v_version
  );

  UPDATE public.user_notifications
  SET
    message = v_message,
    created_at = now()
  WHERE user_id = v_owner_id
    AND project_id = v_project_key
    AND version_key = v_version
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
      v_project_key,
      v_version,
      v_message
    );
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.notify_owner_feedback_arrived(uuid, text, text)
  FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.notify_owner_feedback_arrived(uuid, text, text)
  TO service_role;

CREATE OR REPLACE FUNCTION public.notify_owner_on_voice_response()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.notify_owner_feedback_arrived(
    NEW.user_id,
    NEW.project_id::text,
    NEW.version_key::text
  );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_notify_owner_on_project_feedback()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.user_id IS NULL THEN
    RETURN NEW;
  END IF;
  PERFORM public.notify_owner_feedback_arrived(
    NEW.user_id,
    NEW.project_id::text,
    NEW.version_key::text
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS project_feedback_notify_owner
  ON public.project_feedback;
CREATE TRIGGER project_feedback_notify_owner
  AFTER INSERT ON public.project_feedback
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_notify_owner_on_project_feedback();

REVOKE ALL ON FUNCTION public.trg_notify_owner_on_project_feedback()
  FROM PUBLIC;

COMMENT ON FUNCTION public.notify_owner_feedback_arrived(uuid, text, text) IS
  'Owner in-app body notification for registered Feedback (voice and/or detailed). Type voice_received; unread coalesced per owner×project×version.';

COMMIT;
