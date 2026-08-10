-- 092: consultation message email only on read→unread transition.
-- Staging already has 090/091 applied; do not edit those files.
-- In-app notification on every message is unchanged (coalesce_key handles spam).
-- Email enqueue remains best-effort and never rolls back the message write.
-- Send and mark-read take the same consultation row lock so concurrent
-- send/send and mark-read/send cannot double-enqueue or miss the transition.

BEGIN;

CREATE OR REPLACE FUNCTION public.send_collab_consultation_message(
  p_consultation_id uuid,
  p_body text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_message_id uuid;
  v_consultation public.collab_consultations%ROWTYPE;
  v_recipient_id uuid;
  v_project_id text;
  v_email text;
  v_recipient_already_unread boolean;
BEGIN
  IF v_uid IS NULL OR NOT public.auth_is_registered_user() THEN
    RAISE EXCEPTION 'Registered authentication required';
  END IF;
  IF char_length(trim(coalesce(p_body, ''))) NOT BETWEEN 1 AND 4000 THEN
    RAISE EXCEPTION 'Message must contain 1 to 4000 characters';
  END IF;

  -- Serialize read↔unread transitions for this consultation.
  SELECT * INTO v_consultation
  FROM public.collab_consultations c
  WHERE c.id = p_consultation_id
    AND c.status = 'open'
    AND v_uid IN (c.initiator_id, c.counterpart_id)
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Open participant consultation not found';
  END IF;

  v_recipient_id := CASE
    WHEN v_consultation.initiator_id = v_uid
      THEN v_consultation.counterpart_id
    ELSE v_consultation.initiator_id
  END;
  IF public.users_are_blocking(v_uid, v_recipient_id) THEN
    RAISE EXCEPTION 'Message unavailable because a participant has blocked the other';
  END IF;

  -- Catch-up check BEFORE inserting the new message:
  -- recipient already has unread mail from the other party ⇒ stay silent on email.
  SELECT EXISTS (
    SELECT 1
    FROM public.collab_consultation_messages m
    WHERE m.consultation_id = p_consultation_id
      AND m.sender_id IS DISTINCT FROM v_recipient_id
      AND (
        NOT EXISTS (
          SELECT 1
          FROM public.collab_consultation_reads r
          WHERE r.consultation_id = p_consultation_id
            AND r.user_id = v_recipient_id
        )
        OR m.created_at > (
          SELECT r.last_read_at
          FROM public.collab_consultation_reads r
          WHERE r.consultation_id = p_consultation_id
            AND r.user_id = v_recipient_id
        )
      )
  ) INTO v_recipient_already_unread;

  INSERT INTO public.collab_consultation_messages (
    consultation_id, sender_id, body
  )
  VALUES (p_consultation_id, v_uid, trim(p_body))
  RETURNING id INTO v_message_id;

  INSERT INTO public.collab_consultation_reads (
    consultation_id, user_id, last_read_at, last_read_message_id
  )
  VALUES (p_consultation_id, v_uid, now(), v_message_id)
  ON CONFLICT (consultation_id, user_id) DO UPDATE
  SET last_read_at = EXCLUDED.last_read_at,
      last_read_message_id = EXCLUDED.last_read_message_id;

  v_project_id := coalesce(
    v_consultation.counterpart_project_id::text,
    v_consultation.initiator_project_id::text
  );

  INSERT INTO public.user_notifications (
    user_id, type, project_id, message,
    requires_acknowledgement, coalesce_key, consultation_id
  )
  VALUES (
    v_recipient_id,
    'consultation_message',
    v_project_id,
    'コラボ相談に新しいメッセージが届きました',
    true,
    'consultation:' || p_consultation_id::text,
    p_consultation_id
  );

  -- Email only on read→unread (first unread after catch-up).
  IF NOT coalesce(v_recipient_already_unread, false) THEN
    BEGIN
      SELECT u.email INTO v_email
      FROM auth.users u
      WHERE u.id = v_recipient_id;
      IF nullif(trim(v_email), '') IS NOT NULL THEN
        PERFORM public.enqueue_transactional_email(
          v_recipient_id,
          v_email,
          'collab_consultation_message',
          jsonb_build_object(
            'consultation_id', p_consultation_id,
            'message_id', v_message_id,
            'sender_id', v_uid
          ),
          now()
        );
      END IF;
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;
  END IF;

  RETURN v_message_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.mark_collab_consultation_read(
  p_consultation_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_message_id uuid;
  v_message_at timestamptz;
BEGIN
  IF v_uid IS NULL OR NOT public.auth_is_registered_user() THEN
    RAISE EXCEPTION 'Registered authentication required';
  END IF;

  -- Same consultation lock as send_collab_consultation_message.
  PERFORM 1
  FROM public.collab_consultations c
  WHERE c.id = p_consultation_id
    AND v_uid IN (c.initiator_id, c.counterpart_id)
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Participant consultation not found';
  END IF;

  SELECT m.id, m.created_at
  INTO v_message_id, v_message_at
  FROM public.collab_consultation_messages m
  WHERE m.consultation_id = p_consultation_id
  ORDER BY m.created_at DESC, m.id DESC
  LIMIT 1;

  INSERT INTO public.collab_consultation_reads (
    consultation_id, user_id, last_read_at, last_read_message_id
  )
  VALUES (
    p_consultation_id, v_uid, coalesce(v_message_at, now()), v_message_id
  )
  ON CONFLICT (consultation_id, user_id) DO UPDATE
  SET last_read_at = EXCLUDED.last_read_at,
      last_read_message_id = EXCLUDED.last_read_message_id;
END;
$$;

REVOKE ALL ON FUNCTION public.send_collab_consultation_message(uuid, text)
  FROM PUBLIC;
REVOKE ALL ON FUNCTION public.mark_collab_consultation_read(uuid)
  FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.send_collab_consultation_message(uuid, text)
  TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_collab_consultation_read(uuid)
  TO authenticated;

COMMIT;
