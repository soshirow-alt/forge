-- 105: harden feedback-arrived notify against concurrent inserts.
-- Replaces body of notify_owner_feedback_arrived from 104 with advisory xact lock
-- + unique_violation recovery so voice INSERT cannot fail on race.
-- Does not change 104 file.
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

  -- Serialize unread coalesce for the same owner × project × version.
  PERFORM pg_advisory_xact_lock(
    hashtext('feedback-arrived-a:' || v_owner_id::text || ':' || v_project_key || ':' || v_version),
    hashtext('feedback-arrived-b:' || v_owner_id::text || ':' || v_project_key || ':' || v_version)
  );

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

  IF FOUND THEN
    RETURN;
  END IF;

  BEGIN
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
  EXCEPTION
    WHEN unique_violation THEN
      UPDATE public.user_notifications
      SET
        message = v_message,
        created_at = now()
      WHERE user_id = v_owner_id
        AND project_id = v_project_key
        AND version_key = v_version
        AND type = 'voice_received'
        AND read_at IS NULL;
  END;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_owner_on_voice_response()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  BEGIN
    PERFORM public.notify_owner_feedback_arrived(
      NEW.user_id,
      NEW.project_id::text,
      NEW.version_key::text
    );
  EXCEPTION WHEN OTHERS THEN
    NULL; -- never roll back the voice answer on notify failure
  END;
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.notify_owner_feedback_arrived(uuid, text, text) IS
  'Owner Feedback-arrived notify (voice and/or detailed). voice_received unread coalesce per owner×project×version; advisory lock + unique_violation recovery.';

COMMIT;
