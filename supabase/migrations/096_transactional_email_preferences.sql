-- 096: transactional email preference (notify_email) + enqueue/send-time gates
-- Staging apply OK. Production apply is owner-manual later (not this task).

BEGIN;

-- ---------------------------------------------------------------------------
-- 1) user_settings.notify_email
-- ---------------------------------------------------------------------------
ALTER TABLE public.user_settings
  ADD COLUMN IF NOT EXISTS notify_email jsonb NOT NULL DEFAULT '{
    "master": true,
    "messages_collab": true,
    "usage_relation": true,
    "feedback_reciprocity": true
  }'::jsonb;

COMMENT ON COLUMN public.user_settings.notify_email IS
  'Optional transactional email prefs. Missing row/keys default ON for important templates only.';

-- ---------------------------------------------------------------------------
-- 2) outbox: suppressed status (preference OFF at send-time; not "sent")
-- ---------------------------------------------------------------------------
ALTER TABLE public.transactional_email_outbox
  DROP CONSTRAINT IF EXISTS transactional_email_outbox_status_check;

ALTER TABLE public.transactional_email_outbox
  ADD CONSTRAINT transactional_email_outbox_status_check
  CHECK (status = ANY (ARRAY[
    'pending'::text,
    'sent'::text,
    'failed'::text,
    'dead'::text,
    'suppressed'::text
  ]));

-- ---------------------------------------------------------------------------
-- 3) category mapping + allow helper (missing prefs = ON)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.transactional_email_category_for_template(
  p_template_key text
)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE trim(p_template_key)
    WHEN 'collab_consultation_new' THEN 'messages_collab'
    WHEN 'collab_consultation_message' THEN 'messages_collab'
    WHEN 'usage_relation_request' THEN 'usage_relation'
    WHEN 'usage_relation_accepted' THEN 'usage_relation'
    WHEN 'usage_relation_rejected' THEN 'usage_relation'
    WHEN 'feedback_reciprocity' THEN 'feedback_reciprocity'
    ELSE NULL
  END;
$$;

REVOKE ALL ON FUNCTION public.transactional_email_category_for_template(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.transactional_email_category_for_template(text)
  TO service_role;

CREATE OR REPLACE FUNCTION public.transactional_email_pref_allows(
  p_user_id uuid,
  p_template_key text
)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_category text;
  v_prefs jsonb;
  v_master boolean;
  v_category_on boolean;
BEGIN
  v_category := public.transactional_email_category_for_template(p_template_key);
  IF v_category IS NULL THEN
    -- Unknown template: do not send via this preference path.
    RETURN false;
  END IF;

  SELECT us.notify_email
    INTO v_prefs
  FROM public.user_settings us
  WHERE us.user_id = p_user_id;

  -- No row ⇒ defaults ON for important transactional templates.
  IF v_prefs IS NULL THEN
    RETURN true;
  END IF;

  v_master := coalesce((v_prefs ->> 'master')::boolean, true);
  IF NOT v_master THEN
    RETURN false;
  END IF;

  v_category_on := coalesce((v_prefs ->> v_category)::boolean, true);
  RETURN v_category_on;
END;
$$;

REVOKE ALL ON FUNCTION public.transactional_email_pref_allows(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.transactional_email_pref_allows(uuid, text)
  TO service_role;

-- ---------------------------------------------------------------------------
-- 4) enqueue: resolve current Auth email + preference gate (NULL = skipped)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.enqueue_transactional_email(
  p_user_id uuid,
  p_to_email text,
  p_template_key text,
  p_payload jsonb DEFAULT '{}'::jsonb,
  p_available_at timestamptz DEFAULT now()
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
  v_email text;
BEGIN
  IF p_user_id IS NULL
     OR NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = p_user_id) THEN
    RAISE EXCEPTION 'Valid recipient user is required';
  END IF;
  IF nullif(trim(p_template_key), '') IS NULL THEN
    RAISE EXCEPTION 'Template key is required';
  END IF;

  -- Current registered Auth email is canonical (ignore stale p_to_email).
  SELECT nullif(trim(u.email), '')
    INTO v_email
  FROM auth.users u
  WHERE u.id = p_user_id;

  IF v_email IS NULL THEN
    RETURN NULL;
  END IF;

  -- Caller may pass a hint; still require Auth email match for safety.
  IF nullif(trim(p_to_email), '') IS NOT NULL
     AND lower(trim(p_to_email)) <> lower(v_email) THEN
    -- Prefer Auth email; do not enqueue to a different address.
    NULL;
  END IF;

  IF NOT public.transactional_email_pref_allows(p_user_id, trim(p_template_key)) THEN
    RETURN NULL;
  END IF;

  INSERT INTO public.transactional_email_outbox (
    user_id, to_email, template_key, payload, available_at
  )
  VALUES (
    p_user_id,
    v_email,
    trim(p_template_key),
    coalesce(p_payload, '{}'::jsonb),
    coalesce(p_available_at, now())
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.enqueue_transactional_email(
  uuid, text, text, jsonb, timestamptz
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.enqueue_transactional_email(
  uuid, text, text, jsonb, timestamptz
) TO service_role;

-- ---------------------------------------------------------------------------
-- 5) send-time evaluate: refresh email + prefer suppress over send
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.evaluate_transactional_email_outbox_row(
  p_outbox_id uuid
)
RETURNS TABLE (
  allowed boolean,
  to_email text,
  suppress_reason text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.transactional_email_outbox%ROWTYPE;
  v_auth_email text;
BEGIN
  SELECT *
    INTO v_row
  FROM public.transactional_email_outbox
  WHERE id = p_outbox_id
  FOR UPDATE;

  IF NOT FOUND THEN
    allowed := false;
    to_email := NULL;
    suppress_reason := 'missing_row';
    RETURN NEXT;
    RETURN;
  END IF;

  IF v_row.status = 'sent' OR v_row.status = 'suppressed' OR v_row.status = 'dead' THEN
    allowed := false;
    to_email := v_row.to_email;
    suppress_reason := 'already_final:' || v_row.status;
    RETURN NEXT;
    RETURN;
  END IF;

  SELECT nullif(trim(u.email), '')
    INTO v_auth_email
  FROM auth.users u
  WHERE u.id = v_row.user_id;

  IF v_auth_email IS NULL THEN
    UPDATE public.transactional_email_outbox
    SET status = 'suppressed',
        last_error = 'suppressed:missing_auth_email',
        available_at = now()
    WHERE id = p_outbox_id;

    allowed := false;
    to_email := NULL;
    suppress_reason := 'missing_auth_email';
    RETURN NEXT;
    RETURN;
  END IF;

  IF NOT public.transactional_email_pref_allows(v_row.user_id, v_row.template_key) THEN
    UPDATE public.transactional_email_outbox
    SET status = 'suppressed',
        last_error = 'suppressed:preference_off',
        to_email = v_auth_email,
        available_at = now()
    WHERE id = p_outbox_id;

    allowed := false;
    to_email := v_auth_email;
    suppress_reason := 'preference_off';
    RETURN NEXT;
    RETURN;
  END IF;

  -- Keep to_email aligned with current Auth email.
  IF v_row.to_email IS DISTINCT FROM v_auth_email THEN
    UPDATE public.transactional_email_outbox
    SET to_email = v_auth_email
    WHERE id = p_outbox_id;
  END IF;

  allowed := true;
  to_email := v_auth_email;
  suppress_reason := NULL;
  RETURN NEXT;
END;
$$;

REVOKE ALL ON FUNCTION public.evaluate_transactional_email_outbox_row(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.evaluate_transactional_email_outbox_row(uuid)
  TO service_role;

-- ---------------------------------------------------------------------------
-- 6) In-app notification copy: 相談 → メッセージ (existing + future inserts)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.normalize_user_notification_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.type IN ('consultation_new', 'consultation_message')
     AND NEW.message IS NOT NULL
     AND position('コラボ相談' in NEW.message) > 0 THEN
    NEW.message := replace(NEW.message, 'コラボ相談', 'メッセージ');
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.normalize_user_notification_message() FROM PUBLIC;

DROP TRIGGER IF EXISTS user_notifications_normalize_message
  ON public.user_notifications;
CREATE TRIGGER user_notifications_normalize_message
  BEFORE INSERT OR UPDATE OF message, type
  ON public.user_notifications
  FOR EACH ROW
  EXECUTE FUNCTION public.normalize_user_notification_message();

UPDATE public.user_notifications
SET message = replace(message, 'コラボ相談', 'メッセージ')
WHERE type IN ('consultation_new', 'consultation_message')
  AND message LIKE '%コラボ相談%';

-- Table grants (policies alone are insufficient after PUBLIC revoke patterns)
GRANT SELECT, INSERT, UPDATE ON TABLE public.user_settings TO authenticated;
GRANT SELECT ON TABLE public.user_settings TO service_role;

COMMIT;
