-- 091: add in-app notifications and best-effort transactional email enqueue
-- to consultation and usage-relation RPCs after 089/090 exist.
-- In-app writes are authoritative; email enqueue failures are caught so they
-- never roll back the consultation/relation or its notification.

BEGIN;

ALTER TABLE public.user_notifications
  ALTER COLUMN project_id DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS consultation_id uuid NULL
    REFERENCES public.collab_consultations (id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS usage_relation_id uuid NULL
    REFERENCES public.project_usage_relations (id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS user_notifications_consultation_idx
  ON public.user_notifications (user_id, consultation_id, created_at DESC)
  WHERE consultation_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS user_notifications_usage_relation_idx
  ON public.user_notifications (user_id, usage_relation_id, created_at DESC)
  WHERE usage_relation_id IS NOT NULL;

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
    'consultation_new',
    v_project_id,
    '新しいコラボ相談が届きました',
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
        'collab_consultation_new',
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
    AND v_uid IN (c.initiator_id, c.counterpart_id);
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

  RETURN v_message_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.request_project_usage_relation(
  p_source_id uuid,
  p_target_id uuid,
  p_note text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_source_owner uuid;
  v_target_owner uuid;
  v_recipient_id uuid;
  v_status text;
  v_relation_id uuid;
  v_email text;
BEGIN
  IF v_uid IS NULL OR NOT public.auth_is_registered_user() THEN
    RAISE EXCEPTION 'Registered authentication required';
  END IF;
  IF p_source_id IS NULL OR p_target_id IS NULL OR p_source_id = p_target_id THEN
    RAISE EXCEPTION 'Distinct source and target projects are required';
  END IF;

  SELECT p.owner_id INTO v_source_owner
  FROM public.projects p WHERE p.id = p_source_id;
  SELECT p.owner_id INTO v_target_owner
  FROM public.projects p WHERE p.id = p_target_id;
  IF v_source_owner IS NULL OR v_target_owner IS NULL THEN
    RAISE EXCEPTION 'Source or target project not found';
  END IF;
  IF v_uid NOT IN (v_source_owner, v_target_owner) THEN
    RAISE EXCEPTION 'Requester must own the source or target project';
  END IF;
  IF EXISTS (
    SELECT 1
    FROM public.project_usage_relations r
    WHERE r.source_project_id = p_source_id
      AND r.target_project_id = p_target_id
      AND r.relation_type = 'used'
      AND r.status IN ('pending', 'accepted')
  ) THEN
    RAISE EXCEPTION 'An active usage relation already exists';
  END IF;

  v_status := CASE
    WHEN v_source_owner = v_uid AND v_target_owner = v_uid THEN 'accepted'
    ELSE 'pending'
  END;
  v_recipient_id := CASE
    WHEN v_uid = v_source_owner THEN v_target_owner
    ELSE v_source_owner
  END;

  INSERT INTO public.project_usage_relations (
    source_project_id, target_project_id, relation_type, status,
    created_by, requested_by, decided_by, decided_at, request_note
  )
  VALUES (
    p_source_id, p_target_id, 'used', v_status,
    v_uid, v_uid,
    CASE WHEN v_status = 'accepted' THEN v_uid ELSE NULL END,
    CASE WHEN v_status = 'accepted' THEN now() ELSE NULL END,
    nullif(trim(p_note), '')
  )
  RETURNING id INTO v_relation_id;

  IF v_status = 'pending' THEN
    INSERT INTO public.user_notifications (
      user_id, type, project_id, message,
      requires_acknowledgement, coalesce_key, usage_relation_id
    )
    VALUES (
      v_recipient_id,
      'usage_relation_request',
      p_source_id::text,
      '作品の使用関係について確認依頼が届きました',
      true,
      'usage-relation:' || v_relation_id::text,
      v_relation_id
    );

    BEGIN
      SELECT u.email INTO v_email
      FROM auth.users u
      WHERE u.id = v_recipient_id;
      IF nullif(trim(v_email), '') IS NOT NULL THEN
        PERFORM public.enqueue_transactional_email(
          v_recipient_id,
          v_email,
          'usage_relation_request',
          jsonb_build_object(
            'relation_id', v_relation_id,
            'source_project_id', p_source_id,
            'target_project_id', p_target_id,
            'requested_by', v_uid
          ),
          now()
        );
      END IF;
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;
  END IF;

  RETURN v_relation_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.decide_project_usage_relation(
  p_relation_id uuid,
  p_decision text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_relation public.project_usage_relations%ROWTYPE;
  v_source_owner uuid;
  v_target_owner uuid;
  v_expected_decider uuid;
  v_email text;
BEGIN
  IF v_uid IS NULL OR NOT public.auth_is_registered_user() THEN
    RAISE EXCEPTION 'Registered authentication required';
  END IF;
  IF p_decision NOT IN ('accepted', 'rejected') THEN
    RAISE EXCEPTION 'Decision must be accepted or rejected';
  END IF;

  SELECT * INTO v_relation
  FROM public.project_usage_relations
  WHERE id = p_relation_id
  FOR UPDATE;
  IF NOT FOUND OR v_relation.status <> 'pending' THEN
    RAISE EXCEPTION 'Pending usage relation not found';
  END IF;

  SELECT owner_id INTO v_source_owner
  FROM public.projects WHERE id = v_relation.source_project_id;
  SELECT owner_id INTO v_target_owner
  FROM public.projects WHERE id = v_relation.target_project_id;
  v_expected_decider := CASE
    WHEN v_relation.requested_by = v_source_owner THEN v_target_owner
    WHEN v_relation.requested_by = v_target_owner THEN v_source_owner
    ELSE NULL
  END;
  IF v_uid IS DISTINCT FROM v_expected_decider THEN
    RAISE EXCEPTION 'Only the counterpart project owner may decide';
  END IF;

  UPDATE public.project_usage_relations
  SET status = p_decision,
      decided_by = v_uid,
      decided_at = now(),
      updated_at = now()
  WHERE id = p_relation_id;

  UPDATE public.user_notifications
  SET acknowledged_at = coalesce(acknowledged_at, now()),
      seen_at = coalesce(seen_at, now()),
      read_at = coalesce(read_at, now())
  WHERE user_id = v_uid
    AND type = 'usage_relation_request'
    AND coalesce_key = 'usage-relation:' || p_relation_id::text;

  INSERT INTO public.user_notifications (
    user_id, type, project_id, message,
    requires_acknowledgement, coalesce_key, usage_relation_id
  )
  VALUES (
    v_relation.requested_by,
    CASE
      WHEN p_decision = 'accepted'
        THEN 'usage_relation_accepted'
      ELSE 'usage_relation_rejected'
    END,
    v_relation.source_project_id::text,
    CASE
      WHEN p_decision = 'accepted'
        THEN '作品の使用関係が承認されました'
      ELSE '作品の使用関係が承認されませんでした'
    END,
    true,
    'usage-relation:' || p_relation_id::text,
    p_relation_id
  );

  BEGIN
    SELECT u.email INTO v_email
    FROM auth.users u
    WHERE u.id = v_relation.requested_by;
    IF nullif(trim(v_email), '') IS NOT NULL THEN
      PERFORM public.enqueue_transactional_email(
        v_relation.requested_by,
        v_email,
        CASE
          WHEN p_decision = 'accepted'
            THEN 'usage_relation_accepted'
          ELSE 'usage_relation_rejected'
        END,
        jsonb_build_object(
          'relation_id', p_relation_id,
          'decision', p_decision,
          'decided_by', v_uid
        ),
        now()
      );
    END IF;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
END;
$$;

REVOKE ALL ON FUNCTION public.create_collab_consultation(uuid, text, text, uuid, uuid)
  FROM PUBLIC;
REVOKE ALL ON FUNCTION public.send_collab_consultation_message(uuid, text)
  FROM PUBLIC;
REVOKE ALL ON FUNCTION public.request_project_usage_relation(uuid, uuid, text)
  FROM PUBLIC;
REVOKE ALL ON FUNCTION public.decide_project_usage_relation(uuid, text)
  FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_collab_consultation(uuid, text, text, uuid, uuid)
  TO authenticated;
GRANT EXECUTE ON FUNCTION public.send_collab_consultation_message(uuid, text)
  TO authenticated;
GRANT EXECUTE ON FUNCTION public.request_project_usage_relation(uuid, uuid, text)
  TO authenticated;
GRANT EXECUTE ON FUNCTION public.decide_project_usage_relation(uuid, text)
  TO authenticated;

COMMIT;
