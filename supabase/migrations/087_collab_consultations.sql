-- 087: private, purpose-bound collaboration consultations (not free-form DMs)
-- plus the canonical minimal user block relation.

BEGIN;

CREATE TABLE IF NOT EXISTS public.collab_consultations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  initiator_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  counterpart_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  purpose text NOT NULL CHECK (
    purpose IN ('use_their_work', 'offer_my_work', 'commission', 'collaborate', 'other')
  ),
  initiator_project_id uuid NULL REFERENCES public.projects (id) ON DELETE SET NULL,
  counterpart_project_id uuid NULL REFERENCES public.projects (id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'open' CHECK (
    status IN ('open', 'closed', 'hidden_by_initiator', 'hidden_by_counterpart')
  ),
  last_message_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT collab_consultations_distinct_participants
    CHECK (initiator_id <> counterpart_id)
);

CREATE TABLE IF NOT EXISTS public.collab_consultation_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  consultation_id uuid NOT NULL
    REFERENCES public.collab_consultations (id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  body text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 4000),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.collab_consultation_reads (
  consultation_id uuid NOT NULL
    REFERENCES public.collab_consultations (id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  last_read_at timestamptz NOT NULL DEFAULT now(),
  last_read_message_id uuid NULL
    REFERENCES public.collab_consultation_messages (id) ON DELETE SET NULL,
  PRIMARY KEY (consultation_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.user_blocks (
  blocker_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  blocked_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (blocker_id, blocked_id),
  CONSTRAINT user_blocks_distinct_users CHECK (blocker_id <> blocked_id)
);

CREATE INDEX IF NOT EXISTS collab_consultations_initiator_recent_idx
  ON public.collab_consultations (initiator_id, last_message_at DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS collab_consultations_counterpart_recent_idx
  ON public.collab_consultations (counterpart_id, last_message_at DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS collab_consultation_messages_recent_idx
  ON public.collab_consultation_messages (consultation_id, created_at DESC, id DESC);

COMMENT ON TABLE public.collab_consultations IS
  'Private, purpose-bound collaboration consultations. This is not a free-form DM surface.';
COMMENT ON TABLE public.collab_consultation_messages IS
  'Immutable v1 consultation messages. Reports preserve evidence through content_reports.';
COMMENT ON TABLE public.user_blocks IS
  'User-managed blocks. Consultation create/send rejects a block in either direction.';

ALTER TABLE public.content_reports
  DROP CONSTRAINT IF EXISTS content_reports_target_type_check;
ALTER TABLE public.content_reports
  ADD CONSTRAINT content_reports_target_type_check
  CHECK (
    target_type IN (
      'project',
      'community_post',
      'community_reply',
      'developer',
      'consultation_message'
    )
  );

DROP TRIGGER IF EXISTS collab_consultations_set_updated_at
  ON public.collab_consultations;
CREATE TRIGGER collab_consultations_set_updated_at
  BEFORE UPDATE ON public.collab_consultations
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.touch_collab_consultation_on_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.collab_consultations
  SET last_message_at = NEW.created_at
  WHERE id = NEW.consultation_id;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.touch_collab_consultation_on_message() FROM PUBLIC;

DROP TRIGGER IF EXISTS collab_consultation_messages_touch_parent
  ON public.collab_consultation_messages;
CREATE TRIGGER collab_consultation_messages_touch_parent
  AFTER INSERT ON public.collab_consultation_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_collab_consultation_on_message();

ALTER TABLE public.collab_consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collab_consultation_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collab_consultation_reads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_blocks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own blocks" ON public.user_blocks;
CREATE POLICY "Users read own blocks"
  ON public.user_blocks
  FOR SELECT
  TO authenticated
  USING (
    public.auth_is_registered_user()
    AND blocker_id = auth.uid()
  );

DROP POLICY IF EXISTS "Users create own blocks" ON public.user_blocks;
CREATE POLICY "Users create own blocks"
  ON public.user_blocks
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.auth_is_registered_user()
    AND blocker_id = auth.uid()
    AND blocked_id <> auth.uid()
  );

DROP POLICY IF EXISTS "Users delete own blocks" ON public.user_blocks;
CREATE POLICY "Users delete own blocks"
  ON public.user_blocks
  FOR DELETE
  TO authenticated
  USING (
    public.auth_is_registered_user()
    AND blocker_id = auth.uid()
  );

CREATE OR REPLACE FUNCTION public.users_are_blocking(
  p_user_a uuid,
  p_user_b uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_blocks b
    WHERE (b.blocker_id = p_user_a AND b.blocked_id = p_user_b)
       OR (b.blocker_id = p_user_b AND b.blocked_id = p_user_a)
  );
$$;

REVOKE ALL ON FUNCTION public.users_are_blocking(uuid, uuid)
  FROM PUBLIC, anon, authenticated;
-- RPC owner only: do not expose arbitrary users' block relationships to clients.

DROP POLICY IF EXISTS "Participants read consultations"
  ON public.collab_consultations;
CREATE POLICY "Participants read consultations"
  ON public.collab_consultations
  FOR SELECT
  TO authenticated
  USING (
    public.auth_is_registered_user()
    AND auth.uid() IN (initiator_id, counterpart_id)
  );

DROP POLICY IF EXISTS "Registered users create consultations"
  ON public.collab_consultations;

DROP POLICY IF EXISTS "Participants update consultation status"
  ON public.collab_consultations;
CREATE POLICY "Participants update consultation status"
  ON public.collab_consultations
  FOR UPDATE
  TO authenticated
  USING (
    public.auth_is_registered_user()
    AND auth.uid() IN (initiator_id, counterpart_id)
  )
  WITH CHECK (
    public.auth_is_registered_user()
    AND auth.uid() IN (initiator_id, counterpart_id)
  );

DROP POLICY IF EXISTS "Participants read consultation messages"
  ON public.collab_consultation_messages;
CREATE POLICY "Participants read consultation messages"
  ON public.collab_consultation_messages
  FOR SELECT
  TO authenticated
  USING (
    public.auth_is_registered_user()
    AND EXISTS (
      SELECT 1
      FROM public.collab_consultations c
      WHERE c.id = collab_consultation_messages.consultation_id
        AND auth.uid() IN (c.initiator_id, c.counterpart_id)
    )
  );

DROP POLICY IF EXISTS "Participants send consultation messages"
  ON public.collab_consultation_messages;

DROP POLICY IF EXISTS "Users read own consultation read state"
  ON public.collab_consultation_reads;
CREATE POLICY "Users read own consultation read state"
  ON public.collab_consultation_reads
  FOR SELECT
  TO authenticated
  USING (
    public.auth_is_registered_user()
    AND user_id = auth.uid()
  );

DROP POLICY IF EXISTS "Users insert own consultation read state"
  ON public.collab_consultation_reads;
CREATE POLICY "Users insert own consultation read state"
  ON public.collab_consultation_reads
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.auth_is_registered_user()
    AND user_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.collab_consultations c
      WHERE c.id = collab_consultation_reads.consultation_id
        AND auth.uid() IN (c.initiator_id, c.counterpart_id)
    )
    AND (
      last_read_message_id IS NULL
      OR EXISTS (
        SELECT 1
        FROM public.collab_consultation_messages m
        WHERE m.id = collab_consultation_reads.last_read_message_id
          AND m.consultation_id = collab_consultation_reads.consultation_id
      )
    )
  );

DROP POLICY IF EXISTS "Users update own consultation read state"
  ON public.collab_consultation_reads;
CREATE POLICY "Users update own consultation read state"
  ON public.collab_consultation_reads
  FOR UPDATE
  TO authenticated
  USING (
    public.auth_is_registered_user()
    AND user_id = auth.uid()
  )
  WITH CHECK (
    public.auth_is_registered_user()
    AND user_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.collab_consultations c
      WHERE c.id = collab_consultation_reads.consultation_id
        AND auth.uid() IN (c.initiator_id, c.counterpart_id)
    )
    AND (
      last_read_message_id IS NULL
      OR EXISTS (
        SELECT 1
        FROM public.collab_consultation_messages m
        WHERE m.id = collab_consultation_reads.last_read_message_id
          AND m.consultation_id = collab_consultation_reads.consultation_id
      )
    )
  );

REVOKE ALL ON TABLE public.collab_consultations FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.collab_consultation_messages FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.collab_consultation_reads FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.user_blocks FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.collab_consultations TO authenticated;
GRANT UPDATE (status) ON TABLE public.collab_consultations TO authenticated;
GRANT SELECT ON TABLE public.collab_consultation_messages TO authenticated;
GRANT SELECT, INSERT ON TABLE public.collab_consultation_reads TO authenticated;
GRANT UPDATE (last_read_at, last_read_message_id)
  ON TABLE public.collab_consultation_reads TO authenticated;
GRANT SELECT, INSERT, DELETE ON TABLE public.user_blocks TO authenticated;

DROP FUNCTION IF EXISTS public.create_collab_consultation(uuid, text, text, uuid, uuid);
CREATE FUNCTION public.create_collab_consultation(
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

  RETURN v_consultation_id;
END;
$$;

DROP FUNCTION IF EXISTS public.send_collab_consultation_message(uuid, text);
CREATE FUNCTION public.send_collab_consultation_message(
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
  v_counterpart_id uuid;
BEGIN
  IF v_uid IS NULL OR NOT public.auth_is_registered_user() THEN
    RAISE EXCEPTION 'Registered authentication required';
  END IF;
  IF char_length(trim(coalesce(p_body, ''))) NOT BETWEEN 1 AND 4000 THEN
    RAISE EXCEPTION 'Message must contain 1 to 4000 characters';
  END IF;
  SELECT CASE
    WHEN c.initiator_id = v_uid THEN c.counterpart_id
    ELSE c.initiator_id
  END
  INTO v_counterpart_id
  FROM public.collab_consultations c
  WHERE c.id = p_consultation_id
    AND c.status = 'open'
    AND v_uid IN (c.initiator_id, c.counterpart_id);
  IF v_counterpart_id IS NULL THEN
    RAISE EXCEPTION 'Open participant consultation not found';
  END IF;
  IF public.users_are_blocking(v_uid, v_counterpart_id) THEN
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

  RETURN v_message_id;
END;
$$;

DROP FUNCTION IF EXISTS public.mark_collab_consultation_read(uuid);
CREATE FUNCTION public.mark_collab_consultation_read(
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
  IF NOT EXISTS (
    SELECT 1 FROM public.collab_consultations c
    WHERE c.id = p_consultation_id
      AND v_uid IN (c.initiator_id, c.counterpart_id)
  ) THEN
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

DROP FUNCTION IF EXISTS public.list_my_collab_consultations();
CREATE FUNCTION public.list_my_collab_consultations()
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
  SELECT
    c.id,
    CASE
      WHEN c.initiator_id = auth.uid() THEN c.counterpart_id
      ELSE c.initiator_id
    END,
    c.purpose,
    c.initiator_project_id,
    c.counterpart_project_id,
    c.status,
    lm.body,
    lm.sender_id,
    c.last_message_at,
    (
      SELECT count(*)::bigint
      FROM public.collab_consultation_messages um
      WHERE um.consultation_id = c.id
        AND um.sender_id <> auth.uid()
        AND um.created_at > coalesce(cr.last_read_at, '-infinity'::timestamptz)
    ),
    c.created_at
  FROM public.collab_consultations c
  LEFT JOIN public.collab_consultation_reads cr
    ON cr.consultation_id = c.id AND cr.user_id = auth.uid()
  LEFT JOIN LATERAL (
    SELECT m.body, m.sender_id
    FROM public.collab_consultation_messages m
    WHERE m.consultation_id = c.id
    ORDER BY m.created_at DESC, m.id DESC
    LIMIT 1
  ) lm ON true
  WHERE public.auth_is_registered_user()
    AND auth.uid() IN (c.initiator_id, c.counterpart_id)
  ORDER BY c.last_message_at DESC NULLS LAST, c.created_at DESC;
$$;

REVOKE ALL ON FUNCTION public.create_collab_consultation(uuid, text, text, uuid, uuid)
  FROM PUBLIC;
REVOKE ALL ON FUNCTION public.send_collab_consultation_message(uuid, text)
  FROM PUBLIC;
REVOKE ALL ON FUNCTION public.mark_collab_consultation_read(uuid)
  FROM PUBLIC;
REVOKE ALL ON FUNCTION public.list_my_collab_consultations()
  FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_collab_consultation(uuid, text, text, uuid, uuid)
  TO authenticated;
GRANT EXECUTE ON FUNCTION public.send_collab_consultation_message(uuid, text)
  TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_collab_consultation_read(uuid)
  TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_my_collab_consultations()
  TO authenticated;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
  ) AND NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'collab_consultation_messages'
  ) THEN
    EXECUTE
      'ALTER PUBLICATION supabase_realtime ADD TABLE public.collab_consultation_messages';
  END IF;
END;
$$;

COMMIT;
