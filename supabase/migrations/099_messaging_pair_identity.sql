-- 099: messaging pair identity — 1 unordered participant pair = 1 open thread
-- - Soft-close duplicate open consultations (keep latest by last_message_at)
-- - Partial UNIQUE on open unordered pairs
-- - create_collab_consultation finds-or-reuses open (or reopens latest) pair thread
-- - list_my_collab_consultations aggregates 1 row per counterpart
-- - mark_collab_consultation_read marks all consultations in the pair
-- Non-destructive: historical consultation/message rows are kept.

BEGIN;

-- 1) Soft-close duplicate open pairs (keep one canonical open row per unordered pair)
WITH ranked AS (
  SELECT
    c.id,
    row_number() OVER (
      PARTITION BY LEAST(c.initiator_id, c.counterpart_id),
                   GREATEST(c.initiator_id, c.counterpart_id)
      ORDER BY c.last_message_at DESC NULLS LAST, c.created_at DESC, c.id DESC
    ) AS rn
  FROM public.collab_consultations c
  WHERE c.status = 'open'
)
UPDATE public.collab_consultations c
SET status = 'closed',
    updated_at = now()
FROM ranked r
WHERE c.id = r.id
  AND r.rn > 1
  AND c.status = 'open';

-- 2) Enforce at most one open thread per unordered pair
CREATE UNIQUE INDEX IF NOT EXISTS collab_consultations_one_open_pair_uidx
  ON public.collab_consultations (
    LEAST(initiator_id, counterpart_id),
    GREATEST(initiator_id, counterpart_id)
  )
  WHERE status = 'open';

-- 3) create: find-or-reuse pair thread (purpose/project = context only)
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
  v_reused boolean := false;
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

  -- Prefer existing open thread for this unordered pair.
  SELECT c.id INTO v_consultation_id
  FROM public.collab_consultations c
  WHERE c.status = 'open'
    AND (
      (c.initiator_id = v_uid AND c.counterpart_id = p_counterpart_id)
      OR (c.initiator_id = p_counterpart_id AND c.counterpart_id = v_uid)
    )
  ORDER BY c.last_message_at DESC NULLS LAST, c.created_at DESC
  LIMIT 1;

  IF v_consultation_id IS NULL THEN
    -- Else reuse latest historical thread (reopen) rather than spawn a second identity.
    SELECT c.id INTO v_consultation_id
    FROM public.collab_consultations c
    WHERE (
      (c.initiator_id = v_uid AND c.counterpart_id = p_counterpart_id)
      OR (c.initiator_id = p_counterpart_id AND c.counterpart_id = v_uid)
    )
    ORDER BY c.last_message_at DESC NULLS LAST, c.created_at DESC
    LIMIT 1;
  END IF;

  IF v_consultation_id IS NOT NULL THEN
    v_reused := true;
    UPDATE public.collab_consultations
    SET purpose = p_purpose,
        initiator_project_id = coalesce(p_initiator_project_id, initiator_project_id),
        counterpart_project_id = coalesce(p_counterpart_project_id, counterpart_project_id),
        status = 'open',
        updated_at = now()
    WHERE id = v_consultation_id;

    INSERT INTO public.collab_consultation_messages (
      consultation_id, sender_id, body
    )
    VALUES (v_consultation_id, v_uid, trim(p_first_message))
    RETURNING id INTO v_message_id;

    INSERT INTO public.collab_consultation_reads (
      consultation_id, user_id, last_read_at, last_read_message_id
    )
    VALUES (v_consultation_id, v_uid, now(), v_message_id)
    ON CONFLICT (consultation_id, user_id) DO UPDATE
    SET last_read_at = EXCLUDED.last_read_at,
        last_read_message_id = EXCLUDED.last_read_message_id;

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
      'consultation_message',
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
          'collab_consultation_message',
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
  END IF;

  -- Brand-new pair: create once.
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

-- 4) list: one row per counterpart (canonical = latest activity consultation)
CREATE OR REPLACE FUNCTION public.list_my_collab_consultations()
RETURNS TABLE (
  consultation_id uuid,
  counterpart_id uuid,
  purpose text,
  initiator_project_id uuid,
  counterpart_project_id uuid,
  status text,
  last_message_body text,
  last_message_sender_id uuid,
  last_message_at timestamptz,
  unread_count bigint,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH mine AS (
    SELECT
      c.*,
      CASE
        WHEN c.initiator_id = auth.uid() THEN c.counterpart_id
        ELSE c.initiator_id
      END AS peer_id,
      LEAST(c.initiator_id, c.counterpart_id) AS pair_a,
      GREATEST(c.initiator_id, c.counterpart_id) AS pair_b
    FROM public.collab_consultations c
    WHERE public.auth_is_registered_user()
      AND auth.uid() IN (c.initiator_id, c.counterpart_id)
  ),
  canonical AS (
    SELECT DISTINCT ON (m.pair_a, m.pair_b)
      m.*
    FROM mine m
    ORDER BY
      m.pair_a,
      m.pair_b,
      m.last_message_at DESC NULLS LAST,
      m.created_at DESC,
      m.id DESC
  )
  SELECT
    c.id,
    c.peer_id,
    c.purpose,
    c.initiator_project_id,
    c.counterpart_project_id,
    c.status,
    lm.body,
    lm.sender_id,
    lm.created_at,
    (
      SELECT count(*)::bigint
      FROM public.collab_consultation_messages um
      JOIN public.collab_consultations uc ON uc.id = um.consultation_id
      LEFT JOIN public.collab_consultation_reads ur
        ON ur.consultation_id = uc.id AND ur.user_id = auth.uid()
      WHERE LEAST(uc.initiator_id, uc.counterpart_id) = c.pair_a
        AND GREATEST(uc.initiator_id, uc.counterpart_id) = c.pair_b
        AND um.sender_id <> auth.uid()
        AND um.created_at > coalesce(ur.last_read_at, '-infinity'::timestamptz)
    ),
    c.created_at
  FROM canonical c
  LEFT JOIN LATERAL (
    SELECT m.body, m.sender_id, m.created_at
    FROM public.collab_consultation_messages m
    JOIN public.collab_consultations xc ON xc.id = m.consultation_id
    WHERE LEAST(xc.initiator_id, xc.counterpart_id) = c.pair_a
      AND GREATEST(xc.initiator_id, xc.counterpart_id) = c.pair_b
    ORDER BY m.created_at DESC, m.id DESC
    LIMIT 1
  ) lm ON true
  ORDER BY lm.created_at DESC NULLS LAST, c.created_at DESC;
$$;

-- 5) mark read across the whole pair (so aggregated unread clears)
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

REVOKE ALL ON FUNCTION public.create_collab_consultation(uuid, text, text, uuid, uuid)
  FROM PUBLIC;
REVOKE ALL ON FUNCTION public.list_my_collab_consultations() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.mark_collab_consultation_read(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_collab_consultation(uuid, text, text, uuid, uuid)
  TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_my_collab_consultations() TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_collab_consultation_read(uuid) TO authenticated;

COMMIT;
