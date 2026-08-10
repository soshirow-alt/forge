-- =============================================================================
-- Production rollout APPLY 02 - collaboration / usage requests / seen-ack / email outbox+hooks (086-092)
-- Target: Production Supabase bpnisgzxuwdxelhnduuf
-- Apply via: Supabase Dashboard -> SQL Editor (OWNER MANUAL ONLY)
-- Pure SQL (no \i / \set / psql meta). One transaction for this file.
-- Source: canonical supabase/migrations/ (concatenated; originals untouched).
-- DO NOT apply Staging seed / beautify / fixture SQL with this package.
-- Forward-only: do not edit applied migrations; fix with a later migration.
-- =============================================================================

BEGIN;

-- === 086_developer_community_open_posting.sql ===
-- 086: developer-unit communities become public-readable open boards.
-- Membership/join rows remain available for optional community features, but
-- approved membership is no longer a gate for posting or replying.

ALTER TABLE public.developer_communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_replies ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.set_community_post_author_role()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.author_role := CASE
    WHEN EXISTS (
      SELECT 1
      FROM public.developer_communities dc
      WHERE dc.id = NEW.community_id
        AND dc.owner_id = NEW.author_id
    ) THEN 'developer'
    ELSE 'player'
  END;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.set_community_post_author_role() FROM PUBLIC;

DROP TRIGGER IF EXISTS community_posts_set_author_role
  ON public.community_posts;
CREATE TRIGGER community_posts_set_author_role
  BEFORE INSERT ON public.community_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.set_community_post_author_role();

DROP POLICY IF EXISTS "Communities are publicly readable"
  ON public.developer_communities;
CREATE POLICY "Communities are publicly readable"
  ON public.developer_communities
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Community posts readable by approved members"
  ON public.community_posts;
DROP POLICY IF EXISTS "Community posts are publicly readable"
  ON public.community_posts;
CREATE POLICY "Community posts are publicly readable"
  ON public.community_posts
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Community owners insert posts"
  ON public.community_posts;
DROP POLICY IF EXISTS "Registered users insert community posts"
  ON public.community_posts;
CREATE POLICY "Registered users insert community posts"
  ON public.community_posts
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.auth_is_registered_user()
    AND author_id = auth.uid()
  );

DROP POLICY IF EXISTS "Authors or community owners delete posts"
  ON public.community_posts;
CREATE POLICY "Authors or community owners delete posts"
  ON public.community_posts
  FOR DELETE
  TO authenticated
  USING (
    public.auth_is_registered_user()
    AND (
      author_id = auth.uid()
      OR EXISTS (
        SELECT 1
        FROM public.developer_communities dc
        WHERE dc.id = community_posts.community_id
          AND dc.owner_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "Community replies readable with post access"
  ON public.community_replies;
DROP POLICY IF EXISTS "Community replies are publicly readable"
  ON public.community_replies;
CREATE POLICY "Community replies are publicly readable"
  ON public.community_replies
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Approved members insert replies"
  ON public.community_replies;
DROP POLICY IF EXISTS "Registered users insert community replies"
  ON public.community_replies;
CREATE POLICY "Registered users insert community replies"
  ON public.community_replies
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.auth_is_registered_user()
    AND author_id = auth.uid()
  );

DROP POLICY IF EXISTS "Authors or community owners delete replies"
  ON public.community_replies;
CREATE POLICY "Authors or community owners delete replies"
  ON public.community_replies
  FOR DELETE
  TO authenticated
  USING (
    public.auth_is_registered_user()
    AND (
      author_id = auth.uid()
      OR EXISTS (
        SELECT 1
        FROM public.community_posts cp
        INNER JOIN public.developer_communities dc
          ON dc.id = cp.community_id
        WHERE cp.id = community_replies.post_id
          AND dc.owner_id = auth.uid()
      )
    )
  );

COMMENT ON TABLE public.community_memberships IS
  'Optional community membership/join state. It is not a post or reply authorization gate.';
COMMENT ON COLUMN public.community_posts.author_role IS
  'developer | player. A BEFORE INSERT trigger derives this from community ownership and ignores client input.';

GRANT SELECT ON TABLE public.developer_communities TO anon, authenticated;
GRANT SELECT ON TABLE public.community_posts TO anon, authenticated;
GRANT SELECT ON TABLE public.community_replies TO anon, authenticated;
GRANT INSERT, DELETE ON TABLE public.community_posts TO authenticated;
GRANT INSERT, DELETE ON TABLE public.community_replies TO authenticated;

-- === end 086_developer_community_open_posting.sql ===

-- === 087_collab_consultations.sql ===
-- 087: private, purpose-bound collaboration consultations (not free-form DMs)
-- plus the canonical minimal user block relation.

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

-- === end 087_collab_consultations.sql ===

-- === 088_usage_relation_requests.sql ===
-- 088: formal request/approval lifecycle for project usage relations.
-- Existing public rows become accepted; historical draft rows become pending so
-- the final status constraint is valid without deleting data.

ALTER TABLE public.project_usage_relations
  ADD COLUMN IF NOT EXISTS requested_by uuid NULL
    REFERENCES auth.users (id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS decided_by uuid NULL
    REFERENCES auth.users (id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS decided_at timestamptz NULL,
  ADD COLUMN IF NOT EXISTS request_note text NULL;

ALTER TABLE public.project_usage_relations
  DROP CONSTRAINT IF EXISTS project_usage_relations_status_check;

UPDATE public.project_usage_relations
SET
  status = CASE status
    WHEN 'published' THEN 'accepted'
    WHEN 'draft' THEN 'pending'
    ELSE status
  END,
  requested_by = coalesce(requested_by, created_by),
  decided_by = CASE
    WHEN status = 'published' THEN coalesce(decided_by, created_by)
    ELSE decided_by
  END,
  decided_at = CASE
    WHEN status = 'published' THEN coalesce(decided_at, updated_at, created_at)
    ELSE decided_at
  END
WHERE status IN ('published', 'draft')
   OR requested_by IS NULL;

ALTER TABLE public.project_usage_relations
  ALTER COLUMN status SET DEFAULT 'pending';

ALTER TABLE public.project_usage_relations
  ADD CONSTRAINT project_usage_relations_status_check
  CHECK (status IN ('pending', 'accepted', 'rejected', 'withdrawn', 'removed'));

ALTER TABLE public.project_usage_relations
  DROP CONSTRAINT IF EXISTS project_usage_relations_unique_pair;
DROP INDEX IF EXISTS public.project_usage_relations_unique_pair;

CREATE UNIQUE INDEX IF NOT EXISTS project_usage_relations_active_pair_idx
  ON public.project_usage_relations (
    source_project_id, target_project_id, relation_type
  )
  WHERE status IN ('pending', 'accepted');

DROP INDEX IF EXISTS public.project_usage_relations_source_idx;
DROP INDEX IF EXISTS public.project_usage_relations_target_idx;
CREATE INDEX IF NOT EXISTS project_usage_relations_source_idx
  ON public.project_usage_relations (source_project_id, created_at DESC)
  WHERE status = 'accepted';
CREATE INDEX IF NOT EXISTS project_usage_relations_target_idx
  ON public.project_usage_relations (target_project_id, created_at DESC)
  WHERE status = 'accepted';
CREATE INDEX IF NOT EXISTS project_usage_relations_requester_idx
  ON public.project_usage_relations (requested_by, created_at DESC);

COMMENT ON TABLE public.project_usage_relations IS
  'Formal project usage requests. accepted rows are public when both projects are public.';

ALTER TABLE public.project_usage_relations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read published usage relations on public projects"
  ON public.project_usage_relations;
DROP POLICY IF EXISTS "Public accepted relations and participants read requests"
  ON public.project_usage_relations;
CREATE POLICY "Public accepted relations and participants read requests"
  ON public.project_usage_relations
  FOR SELECT
  TO anon, authenticated
  USING (
    (
      status = 'accepted'
      AND EXISTS (
        SELECT 1 FROM public.projects s
        WHERE s.id = source_project_id AND s.visibility = 'public'
      )
      AND EXISTS (
        SELECT 1 FROM public.projects t
        WHERE t.id = target_project_id AND t.visibility = 'public'
      )
    )
    OR (
      auth.uid() IS NOT NULL
      AND (
        requested_by = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.projects s
          WHERE s.id = source_project_id AND s.owner_id = auth.uid()
        )
        OR EXISTS (
          SELECT 1 FROM public.projects t
          WHERE t.id = target_project_id AND t.owner_id = auth.uid()
        )
      )
    )
  );

GRANT SELECT ON TABLE public.project_usage_relations TO anon, authenticated;
REVOKE INSERT, UPDATE, DELETE
  ON TABLE public.project_usage_relations FROM anon, authenticated;

DROP FUNCTION IF EXISTS public.request_project_usage_relation(uuid, uuid, text);
CREATE FUNCTION public.request_project_usage_relation(
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
  v_status text;
  v_relation_id uuid;
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

  RETURN v_relation_id;
END;
$$;

DROP FUNCTION IF EXISTS public.decide_project_usage_relation(uuid, text);
CREATE FUNCTION public.decide_project_usage_relation(
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
END;
$$;

DROP FUNCTION IF EXISTS public.withdraw_project_usage_relation(uuid);
CREATE FUNCTION public.withdraw_project_usage_relation(
  p_relation_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL OR NOT public.auth_is_registered_user() THEN
    RAISE EXCEPTION 'Registered authentication required';
  END IF;

  UPDATE public.project_usage_relations
  SET status = 'withdrawn', updated_at = now()
  WHERE id = p_relation_id
    AND status = 'pending'
    AND requested_by = v_uid;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Requester-owned pending usage relation not found';
  END IF;
END;
$$;

DROP FUNCTION IF EXISTS public.remove_project_usage_relation(uuid);
CREATE FUNCTION public.remove_project_usage_relation(
  p_relation_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL OR NOT public.auth_is_registered_user() THEN
    RAISE EXCEPTION 'Registered authentication required';
  END IF;

  UPDATE public.project_usage_relations r
  SET status = 'removed',
      decided_by = v_uid,
      decided_at = now(),
      updated_at = now()
  WHERE r.id = p_relation_id
    AND r.status = 'accepted'
    AND (
      EXISTS (
        SELECT 1 FROM public.projects s
        WHERE s.id = r.source_project_id AND s.owner_id = v_uid
      )
      OR EXISTS (
        SELECT 1 FROM public.projects t
        WHERE t.id = r.target_project_id AND t.owner_id = v_uid
      )
    );
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Owner-visible accepted usage relation not found';
  END IF;
END;
$$;

-- Preserve the shipped public RPC signature and return shape exactly.
DROP FUNCTION IF EXISTS public.get_public_project_usage_relations(uuid, integer);
CREATE FUNCTION public.get_public_project_usage_relations(
  p_project_id uuid DEFAULT NULL,
  p_limit integer DEFAULT 20
)
RETURNS TABLE (
  id uuid,
  source_project_id uuid,
  source_title text,
  source_category text,
  source_thumbnail_url text,
  target_project_id uuid,
  target_title text,
  target_category text,
  target_thumbnail_url text,
  relation_type text,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    r.id,
    r.source_project_id,
    s.title,
    coalesce(s.category, 'game'),
    s.thumbnail_url,
    r.target_project_id,
    t.title,
    coalesce(t.category, 'game'),
    t.thumbnail_url,
    r.relation_type,
    r.created_at
  FROM public.project_usage_relations r
  INNER JOIN public.projects s ON s.id = r.source_project_id
  INNER JOIN public.projects t ON t.id = r.target_project_id
  WHERE r.status = 'accepted'
    AND r.relation_type = 'used'
    AND s.visibility = 'public'
    AND t.visibility = 'public'
    AND (
      p_project_id IS NULL
      OR r.source_project_id = p_project_id
      OR r.target_project_id = p_project_id
    )
  ORDER BY r.created_at DESC
  LIMIT greatest(1, least(coalesce(p_limit, 20), 50));
$$;

REVOKE ALL ON FUNCTION public.request_project_usage_relation(uuid, uuid, text)
  FROM PUBLIC;
REVOKE ALL ON FUNCTION public.decide_project_usage_relation(uuid, text)
  FROM PUBLIC;
REVOKE ALL ON FUNCTION public.withdraw_project_usage_relation(uuid)
  FROM PUBLIC;
REVOKE ALL ON FUNCTION public.remove_project_usage_relation(uuid)
  FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_public_project_usage_relations(uuid, integer)
  FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.request_project_usage_relation(uuid, uuid, text)
  TO authenticated;
GRANT EXECUTE ON FUNCTION public.decide_project_usage_relation(uuid, text)
  TO authenticated;
GRANT EXECUTE ON FUNCTION public.withdraw_project_usage_relation(uuid)
  TO authenticated;
GRANT EXECUTE ON FUNCTION public.remove_project_usage_relation(uuid)
  TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_project_usage_relations(uuid, integer)
  TO anon, authenticated, service_role;

-- === end 088_usage_relation_requests.sql ===

-- === 089_notification_seen_ack.sql ===
-- 089: separate notification seen state from explicit acknowledgement.
-- Badge semantics:
--   (requires_acknowledgement AND acknowledged_at IS NULL)
--   OR (NOT requires_acknowledgement AND seen_at IS NULL)

ALTER TABLE public.user_notifications
  ADD COLUMN IF NOT EXISTS seen_at timestamptz NULL,
  ADD COLUMN IF NOT EXISTS acknowledged_at timestamptz NULL,
  ADD COLUMN IF NOT EXISTS requires_acknowledgement boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS coalesce_key text NULL;

ALTER TABLE public.user_notifications
  DROP CONSTRAINT IF EXISTS user_notifications_type_check;
ALTER TABLE public.user_notifications
  ADD CONSTRAINT user_notifications_type_check
  CHECK (
    type IN (
      'devlog',
      'version_published',
      'voice_received',
      'confirmation_request',
      'project_watched',
      'followed_developer_new_project',
      'followed_developer_released_project',
      'feedback_reply',
      'consultation_new',
      'consultation_message',
      'usage_relation_request',
      'usage_relation_accepted',
      'usage_relation_rejected'
    )
  );

UPDATE public.user_notifications
SET seen_at = read_at
WHERE read_at IS NOT NULL
  AND seen_at IS NULL;

CREATE INDEX IF NOT EXISTS user_notifications_badge_idx
  ON public.user_notifications (user_id, created_at DESC)
  WHERE (
    (requires_acknowledgement AND acknowledged_at IS NULL)
    OR (NOT requires_acknowledgement AND seen_at IS NULL)
  );
CREATE INDEX IF NOT EXISTS user_notifications_coalesce_idx
  ON public.user_notifications (user_id, coalesce_key)
  WHERE coalesce_key IS NOT NULL;

COMMENT ON COLUMN public.user_notifications.seen_at IS
  'Set when surfaced/opened; does not imply explicit acknowledgement.';
COMMENT ON COLUMN public.user_notifications.acknowledged_at IS
  'Explicit acknowledgement for important notifications.';
COMMENT ON COLUMN public.user_notifications.coalesce_key IS
  'Conversation-level key used to acknowledge related notifications together.';
COMMENT ON COLUMN public.user_notifications.requires_acknowledgement IS
  'Badge remains active until acknowledged_at when true; otherwise until seen_at.';

REVOKE UPDATE ON TABLE public.user_notifications FROM authenticated;
GRANT UPDATE (read_at, seen_at, acknowledged_at)
  ON TABLE public.user_notifications TO authenticated;

DROP FUNCTION IF EXISTS public.mark_notifications_seen();
CREATE FUNCTION public.mark_notifications_seen()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
BEGIN
  IF auth.uid() IS NULL OR NOT public.auth_is_registered_user() THEN
    RAISE EXCEPTION 'Registered authentication required';
  END IF;

  UPDATE public.user_notifications
  SET seen_at = now()
  WHERE user_id = auth.uid()
    AND seen_at IS NULL;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

DROP FUNCTION IF EXISTS public.acknowledge_notification(uuid);
CREATE FUNCTION public.acknowledge_notification(
  p_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT public.auth_is_registered_user() THEN
    RAISE EXCEPTION 'Registered authentication required';
  END IF;

  UPDATE public.user_notifications
  SET acknowledged_at = coalesce(acknowledged_at, now()),
      seen_at = coalesce(seen_at, now()),
      read_at = coalesce(read_at, now())
  WHERE id = p_id
    AND user_id = auth.uid();
  RETURN FOUND;
END;
$$;

DROP FUNCTION IF EXISTS public.acknowledge_notifications_by_coalesce_key(text);
CREATE FUNCTION public.acknowledge_notifications_by_coalesce_key(
  p_key text
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
BEGIN
  IF auth.uid() IS NULL OR NOT public.auth_is_registered_user() THEN
    RAISE EXCEPTION 'Registered authentication required';
  END IF;
  IF nullif(trim(p_key), '') IS NULL THEN
    RAISE EXCEPTION 'Coalesce key is required';
  END IF;

  UPDATE public.user_notifications
  SET acknowledged_at = coalesce(acknowledged_at, now()),
      seen_at = coalesce(seen_at, now()),
      read_at = coalesce(read_at, now())
  WHERE user_id = auth.uid()
    AND coalesce_key = p_key;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION public.mark_notifications_seen() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.acknowledge_notification(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.acknowledge_notifications_by_coalesce_key(text)
  FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.mark_notifications_seen() TO authenticated;
GRANT EXECUTE ON FUNCTION public.acknowledge_notification(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.acknowledge_notifications_by_coalesce_key(text)
  TO authenticated;

-- === end 089_notification_seen_ack.sql ===

-- === 090_transactional_email_outbox.sql ===
-- 090: transactional email outbox for trusted workers and SECURITY DEFINER RPCs.
-- Clients have no table or enqueue-function access.

CREATE TABLE IF NOT EXISTS public.transactional_email_outbox (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  to_email text NOT NULL CHECK (char_length(trim(to_email)) > 0),
  template_key text NOT NULL CHECK (char_length(trim(template_key)) > 0),
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'sent', 'failed', 'dead')),
  attempts integer NOT NULL DEFAULT 0 CHECK (attempts BETWEEN 0 AND 5),
  last_error text NULL,
  available_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz NULL
);

CREATE INDEX IF NOT EXISTS transactional_email_outbox_status_available_idx
  ON public.transactional_email_outbox (status, available_at);

COMMENT ON TABLE public.transactional_email_outbox IS
  'Trusted transactional email queue. Five attempts maximum; exhausted rows become dead.';

-- Attempt counter may reach 5 while status stays pending/failed so the final
-- delivery can still run. Dead is only forced after a failed delivery at max
-- attempts (status='failed' with attempts>=5), never on claim alone.
CREATE OR REPLACE FUNCTION public.enforce_transactional_email_attempt_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.attempts > 5 THEN
    RAISE EXCEPTION 'transactional_email_outbox attempts cannot exceed 5';
  END IF;
  IF NEW.status = 'failed' AND NEW.attempts >= 5 THEN
    NEW.status := 'dead';
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.enforce_transactional_email_attempt_limit()
  FROM PUBLIC;

DROP TRIGGER IF EXISTS transactional_email_outbox_attempt_limit
  ON public.transactional_email_outbox;
CREATE TRIGGER transactional_email_outbox_attempt_limit
  BEFORE INSERT OR UPDATE OF attempts, status
  ON public.transactional_email_outbox
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_transactional_email_attempt_limit();

ALTER TABLE public.transactional_email_outbox ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.transactional_email_outbox FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE
  ON TABLE public.transactional_email_outbox TO service_role;

DROP FUNCTION IF EXISTS public.enqueue_transactional_email(uuid, text, text, jsonb, timestamptz);
CREATE FUNCTION public.enqueue_transactional_email(
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
BEGIN
  IF p_user_id IS NULL
     OR NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = p_user_id) THEN
    RAISE EXCEPTION 'Valid recipient user is required';
  END IF;
  IF nullif(trim(p_to_email), '') IS NULL THEN
    RAISE EXCEPTION 'Recipient email is required';
  END IF;
  IF nullif(trim(p_template_key), '') IS NULL THEN
    RAISE EXCEPTION 'Template key is required';
  END IF;

  INSERT INTO public.transactional_email_outbox (
    user_id, to_email, template_key, payload, available_at
  )
  VALUES (
    p_user_id,
    trim(p_to_email),
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

-- === end 090_transactional_email_outbox.sql ===

-- === 091_collab_notification_email_hooks.sql ===
-- 091: add in-app notifications and best-effort transactional email enqueue
-- to consultation and usage-relation RPCs after 089/090 exist.
-- In-app writes are authoritative; email enqueue failures are caught so they
-- never roll back the consultation/relation or its notification.

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

-- === end 091_collab_notification_email_hooks.sql ===

-- === 092_consultation_message_email_read_to_unread.sql ===
-- 092: consultation message email only on read→unread transition.
-- Staging already has 090/091 applied; do not edit those files.
-- In-app notification on every message is unchanged (coalesce_key handles spam).
-- Email enqueue remains best-effort and never rolls back the message write.
-- Send and mark-read take the same consultation row lock so concurrent
-- send/send and mark-read/send cannot double-enqueue or miss the transition.

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

-- === end 092_consultation_message_email_read_to_unread.sql ===

COMMIT;
