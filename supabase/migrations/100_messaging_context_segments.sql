-- 100: consultation context segments within pair identity
-- Same unordered participant pair stays one conversation (list/unread).
-- New create_collab_consultation appends a new open consultation row
-- (soft-closing prior open) so purpose/project history can render as
-- timeline context cards without overwriting prior segments.
-- Does not insert system messages into collab_consultation_messages.

BEGIN;

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

  SELECT EXISTS (
    SELECT 1
    FROM public.collab_consultations c
    WHERE (
      (c.initiator_id = v_uid AND c.counterpart_id = p_counterpart_id)
      OR (c.initiator_id = p_counterpart_id AND c.counterpart_id = v_uid)
    )
  ) INTO v_pair_existed;

  -- Keep at most one open row per pair: close prior open before inserting segment.
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

  RETURN v_consultation_id;
END;
$$;

REVOKE ALL ON FUNCTION public.create_collab_consultation(
  uuid, text, text, uuid, uuid
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_collab_consultation(
  uuid, text, text, uuid, uuid
) TO authenticated;

COMMIT;
