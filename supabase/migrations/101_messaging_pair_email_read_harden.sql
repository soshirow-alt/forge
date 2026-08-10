-- 101: pair-aware messaging email/read hardening
-- - mark_collab_consultation_read locks all pair consultations FOR UPDATE
-- - create_collab_consultation emails only when recipient has no pair-level unread
-- - send_collab_consultation_message unread check is pair-scoped (not segment-only)
-- Keeps 099/100 pair identity + context segments.

BEGIN;

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
  v_pair_a uuid;
  v_pair_b uuid;
  r record;
  v_message_id uuid;
  v_message_at timestamptz;
BEGIN
  IF v_uid IS NULL OR NOT public.auth_is_registered_user() THEN
    RAISE EXCEPTION 'Registered authentication required';
  END IF;

  SELECT
    LEAST(c.initiator_id, c.counterpart_id),
    GREATEST(c.initiator_id, c.counterpart_id)
  INTO v_pair_a, v_pair_b
  FROM public.collab_consultations c
  WHERE c.id = p_consultation_id
    AND v_uid IN (c.initiator_id, c.counterpart_id);
  IF v_pair_a IS NULL THEN
    RAISE EXCEPTION 'Participant consultation not found';
  END IF;

  -- Serialize with send/create on every consultation in the pair.
  PERFORM 1
  FROM public.collab_consultations c
  WHERE LEAST(c.initiator_id, c.counterpart_id) = v_pair_a
    AND GREATEST(c.initiator_id, c.counterpart_id) = v_pair_b
  FOR UPDATE;

  FOR r IN
    SELECT c.id
    FROM public.collab_consultations c
    WHERE LEAST(c.initiator_id, c.counterpart_id) = v_pair_a
      AND GREATEST(c.initiator_id, c.counterpart_id) = v_pair_b
  LOOP
    SELECT m.id, m.created_at
    INTO v_message_id, v_message_at
    FROM public.collab_consultation_messages m
    WHERE m.consultation_id = r.id
    ORDER BY m.created_at DESC, m.id DESC
    LIMIT 1;

    INSERT INTO public.collab_consultation_reads (
      consultation_id, user_id, last_read_at, last_read_message_id
    )
    VALUES (
      r.id, v_uid, coalesce(v_message_at, now()), v_message_id
    )
    ON CONFLICT (consultation_id, user_id) DO UPDATE
    SET last_read_at = EXCLUDED.last_read_at,
        last_read_message_id = EXCLUDED.last_read_message_id;
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_collab_consultation(
  p_counterpart_id uuid,
  p_purpose text,
  p_first_message text,
  p_initiator_project_id uuid DEFAULT NULL,
  p_counterpart_project_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_consultation_id uuid;
  v_message_id uuid;
  v_project_id text;
  v_email text;
  v_pair_existed boolean := false;
  v_recipient_already_unread boolean := false;
BEGIN
  IF v_uid IS NULL OR NOT public.auth_is_registered_user() THEN
    RAISE EXCEPTION 'Registered authentication required';
  END IF;
  IF p_counterpart_id IS NULL OR p_counterpart_id = v_uid
     OR NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = p_counterpart_id) THEN
    RAISE EXCEPTION 'Valid distinct counterpart required';
  END IF;
  IF public.users_are_blocking(v_uid, p_counterpart_id) THEN
    RAISE EXCEPTION 'Consultation unavailable because a participant has blocked the other';
  END IF;
  IF p_purpose NOT IN (
    'use_their_work', 'offer_my_work', 'commission', 'collaborate', 'other'
  ) THEN
    RAISE EXCEPTION 'Invalid consultation purpose';
  END IF;
  IF char_length(trim(coalesce(p_first_message, ''))) NOT BETWEEN 1 AND 4000 THEN
    RAISE EXCEPTION 'First message must contain 1 to 4000 characters';
  END IF;
  IF p_initiator_project_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = p_initiator_project_id AND p.owner_id = v_uid
  ) THEN
    RAISE EXCEPTION 'Initiator project must belong to the initiator';
  END IF;
  IF p_counterpart_project_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = p_counterpart_project_id
      AND p.owner_id = p_counterpart_id
      AND p.visibility = 'public'
  ) THEN
    RAISE EXCEPTION 'Counterpart project must be public and belong to the counterpart';
  END IF;

  -- Lock existing pair rows before soft-close + insert (double-click / concurrent create).
  PERFORM 1
  FROM public.collab_consultations c
  WHERE (
    (c.initiator_id = v_uid AND c.counterpart_id = p_counterpart_id)
    OR (c.initiator_id = p_counterpart_id AND c.counterpart_id = v_uid)
  )
  FOR UPDATE;

  SELECT EXISTS (
    SELECT 1
    FROM public.collab_consultations c
    WHERE (
      (c.initiator_id = v_uid AND c.counterpart_id = p_counterpart_id)
      OR (c.initiator_id = p_counterpart_id AND c.counterpart_id = v_uid)
    )
  ) INTO v_pair_existed;

  SELECT EXISTS (
    SELECT 1
    FROM public.collab_consultation_messages m
    JOIN public.collab_consultations c ON c.id = m.consultation_id
    WHERE (
      (c.initiator_id = v_uid AND c.counterpart_id = p_counterpart_id)
      OR (c.initiator_id = p_counterpart_id AND c.counterpart_id = v_uid)
    )
      AND m.sender_id IS DISTINCT FROM p_counterpart_id
      AND (
        NOT EXISTS (
          SELECT 1
          FROM public.collab_consultation_reads r
          WHERE r.consultation_id = c.id
            AND r.user_id = p_counterpart_id
        )
        OR m.created_at > (
          SELECT r.last_read_at
          FROM public.collab_consultation_reads r
          WHERE r.consultation_id = c.id
            AND r.user_id = p_counterpart_id
        )
      )
  ) INTO v_recipient_already_unread;

  UPDATE public.collab_consultations c
  SET status = 'closed',
      updated_at = now()
  WHERE c.status = 'open'
    AND (
      (c.initiator_id = v_uid AND c.counterpart_id = p_counterpart_id)
      OR (c.initiator_id = p_counterpart_id AND c.counterpart_id = v_uid)
    );

  INSERT INTO public.collab_consultations (
    initiator_id, counterpart_id, purpose,
    initiator_project_id, counterpart_project_id
  )
  VALUES (
    v_uid, p_counterpart_id, p_purpose,
    p_initiator_project_id, p_counterpart_project_id
  )
  RETURNING id INTO v_consultation_id;

  INSERT INTO public.collab_consultation_messages (
    consultation_id, sender_id, body
  )
  VALUES (v_consultation_id, v_uid, trim(p_first_message))
  RETURNING id INTO v_message_id;

  INSERT INTO public.collab_consultation_reads (
    consultation_id, user_id, last_read_at, last_read_message_id
  )
  VALUES (v_consultation_id, v_uid, now(), v_message_id);

  v_project_id := coalesce(
    p_counterpart_project_id::text,
    p_initiator_project_id::text
  );

  INSERT INTO public.user_notifications (
    user_id, type, project_id, message,
    requires_acknowledgement, coalesce_key, consultation_id
  )
  VALUES (
    p_counterpart_id,
    CASE WHEN v_pair_existed THEN 'consultation_message' ELSE 'consultation_new' END,
    v_project_id,
    '新しいメッセージが届きました',
    true,
    'consultation:' || v_consultation_id::text,
    v_consultation_id
  );

  IF NOT coalesce(v_recipient_already_unread, false) THEN
    BEGIN
      SELECT u.email INTO v_email
      FROM auth.users u
      WHERE u.id = p_counterpart_id;
      IF nullif(trim(v_email), '') IS NOT NULL THEN
        PERFORM public.enqueue_transactional_email(
          p_counterpart_id,
          v_email,
          CASE
            WHEN v_pair_existed THEN 'collab_consultation_message'
            ELSE 'collab_consultation_new'
          END,
          jsonb_build_object(
            'consultation_id', v_consultation_id,
            'initiator_id', v_uid,
            'purpose', p_purpose
          ),
          now()
        );
      END IF;
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;
  END IF;

  RETURN v_consultation_id;
END;
$$;

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
  v_pair_a uuid;
  v_pair_b uuid;
BEGIN
  IF v_uid IS NULL OR NOT public.auth_is_registered_user() THEN
    RAISE EXCEPTION 'Registered authentication required';
  END IF;
  IF char_length(trim(coalesce(p_body, ''))) NOT BETWEEN 1 AND 4000 THEN
    RAISE EXCEPTION 'Message must contain 1 to 4000 characters';
  END IF;

  SELECT * INTO v_consultation
  FROM public.collab_consultations c
  WHERE c.id = p_consultation_id
    AND c.status = 'open'
    AND v_uid IN (c.initiator_id, c.counterpart_id)
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Open participant consultation not found';
  END IF;

  v_pair_a := LEAST(v_consultation.initiator_id, v_consultation.counterpart_id);
  v_pair_b := GREATEST(v_consultation.initiator_id, v_consultation.counterpart_id);

  -- Also lock sibling segments so mark_read/create cannot race the unread gate.
  PERFORM 1
  FROM public.collab_consultations c
  WHERE LEAST(c.initiator_id, c.counterpart_id) = v_pair_a
    AND GREATEST(c.initiator_id, c.counterpart_id) = v_pair_b
    AND c.id <> p_consultation_id
  FOR UPDATE;

  v_recipient_id := CASE
    WHEN v_consultation.initiator_id = v_uid
      THEN v_consultation.counterpart_id
    ELSE v_consultation.initiator_id
  END;
  IF public.users_are_blocking(v_uid, v_recipient_id) THEN
    RAISE EXCEPTION 'Message unavailable because a participant has blocked the other';
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM public.collab_consultation_messages m
    JOIN public.collab_consultations c ON c.id = m.consultation_id
    WHERE LEAST(c.initiator_id, c.counterpart_id) = v_pair_a
      AND GREATEST(c.initiator_id, c.counterpart_id) = v_pair_b
      AND m.sender_id IS DISTINCT FROM v_recipient_id
      AND (
        NOT EXISTS (
          SELECT 1
          FROM public.collab_consultation_reads r
          WHERE r.consultation_id = c.id
            AND r.user_id = v_recipient_id
        )
        OR m.created_at > (
          SELECT r.last_read_at
          FROM public.collab_consultation_reads r
          WHERE r.consultation_id = c.id
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
    '新しいメッセージが届きました',
    true,
    'consultation:' || p_consultation_id::text,
    p_consultation_id
  );

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

REVOKE ALL ON FUNCTION public.mark_collab_consultation_read(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.create_collab_consultation(uuid, text, text, uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.send_collab_consultation_message(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.mark_collab_consultation_read(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_collab_consultation(uuid, text, text, uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.send_collab_consultation_message(uuid, text) TO authenticated;

COMMIT;
