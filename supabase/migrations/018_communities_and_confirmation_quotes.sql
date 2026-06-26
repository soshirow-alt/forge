-- 018: developer communities, memberships, posts (confirmation quote), targeting update
-- Prerequisite: 001, 015, 017
-- Design: docs/change-check-confirmation-loop.md Step 7

BEGIN;

CREATE TABLE IF NOT EXISTS public.developer_communities (
  id text PRIMARY KEY,
  owner_id uuid NOT NULL UNIQUE REFERENCES auth.users (id) ON DELETE CASCADE,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  avatar_url text NULL,
  handle text NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS developer_communities_owner_idx
  ON public.developer_communities (owner_id);

CREATE TABLE IF NOT EXISTS public.community_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id text NOT NULL REFERENCES public.developer_communities (id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (community_id, user_id)
);

CREATE INDEX IF NOT EXISTS community_memberships_community_idx
  ON public.community_memberships (community_id, status);

CREATE INDEX IF NOT EXISTS community_memberships_user_idx
  ON public.community_memberships (user_id, status);

CREATE TABLE IF NOT EXISTS public.community_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id text NOT NULL REFERENCES public.developer_communities (id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  author_role text NOT NULL CHECK (author_role IN ('developer', 'player')),
  body text NOT NULL,
  audience_label text NOT NULL DEFAULT 'コミュニティ全員',
  devlog_id uuid NULL REFERENCES public.project_devlogs (id) ON DELETE SET NULL,
  confirmation_request_id uuid NULL REFERENCES public.confirmation_requests (id) ON DELETE SET NULL,
  devlog_quote jsonb NULL,
  confirmation_quote jsonb NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS community_posts_community_idx
  ON public.community_posts (community_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.community_replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.community_posts (id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS community_replies_post_idx
  ON public.community_replies (post_id, created_at ASC);

ALTER TABLE public.developer_communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_replies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Communities are publicly readable"
  ON public.developer_communities FOR SELECT
  USING (true);

CREATE POLICY "Owners manage own community"
  ON public.developer_communities FOR INSERT
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Owners update own community"
  ON public.developer_communities FOR UPDATE
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users read own memberships"
  ON public.community_memberships FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Community owners read memberships"
  ON public.community_memberships FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.developer_communities dc
      WHERE dc.id = community_id
        AND dc.owner_id = auth.uid()
    )
  );

CREATE POLICY "Approved members read memberships in same community"
  ON public.community_memberships FOR SELECT
  USING (
    status = 'approved'
    AND EXISTS (
      SELECT 1
      FROM public.community_memberships mine
      WHERE mine.community_id = community_memberships.community_id
        AND mine.user_id = auth.uid()
        AND mine.status = 'approved'
    )
  );

CREATE POLICY "Users apply to communities"
  ON public.community_memberships FOR INSERT
  WITH CHECK (user_id = auth.uid() AND status = 'pending');

CREATE POLICY "Community owners update membership status"
  ON public.community_memberships FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM public.developer_communities dc
      WHERE dc.id = community_id
        AND dc.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.developer_communities dc
      WHERE dc.id = community_id
        AND dc.owner_id = auth.uid()
    )
  );

CREATE POLICY "Community posts readable by approved members"
  ON public.community_posts FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.community_memberships m
      WHERE m.community_id = community_posts.community_id
        AND m.user_id = auth.uid()
        AND m.status = 'approved'
    )
    OR EXISTS (
      SELECT 1
      FROM public.developer_communities dc
      WHERE dc.id = community_posts.community_id
        AND dc.owner_id = auth.uid()
    )
  );

CREATE POLICY "Community owners insert posts"
  ON public.community_posts FOR INSERT
  WITH CHECK (
    author_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.developer_communities dc
      WHERE dc.id = community_id
        AND dc.owner_id = auth.uid()
    )
  );

CREATE POLICY "Approved members insert replies"
  ON public.community_replies FOR INSERT
  WITH CHECK (
    author_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.community_posts p
      INNER JOIN public.community_memberships m
        ON m.community_id = p.community_id
      WHERE p.id = post_id
        AND m.user_id = auth.uid()
        AND m.status = 'approved'
    )
  );

CREATE POLICY "Community replies readable with post access"
  ON public.community_replies FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.community_posts p
      WHERE p.id = community_replies.post_id
    )
  );

-- Extend confirmation notify recipients with community members
CREATE OR REPLACE FUNCTION public.get_confirmation_notify_recipients(
  p_project_id text,
  p_audience jsonb DEFAULT '[]'::jsonb,
  p_version_key text DEFAULT NULL,
  p_linked_priority_ids jsonb DEFAULT '[]'::jsonb
)
RETURNS SETOF uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner_id uuid;
  v_audience text[];
  v_priority_ids text[];
  v_use_prior boolean;
  v_use_watchers boolean;
  v_use_bookmarks boolean;
  v_use_feedback boolean;
  v_use_community boolean;
  v_use_all boolean;
BEGIN
  SELECT p.owner_id
  INTO v_owner_id
  FROM public.projects p
  WHERE p.id::text = p_project_id;

  IF v_owner_id IS NULL OR auth.uid() IS DISTINCT FROM v_owner_id THEN
    RETURN;
  END IF;

  SELECT coalesce(array_agg(elem::text), ARRAY[]::text[])
  INTO v_audience
  FROM jsonb_array_elements_text(coalesce(p_audience, '[]'::jsonb)) AS elem;

  IF coalesce(array_length(v_audience, 1), 0) = 0 THEN
    v_audience := ARRAY['prior_players', 'watchers'];
  END IF;

  SELECT coalesce(array_agg(elem::text), ARRAY[]::text[])
  INTO v_priority_ids
  FROM jsonb_array_elements_text(coalesce(p_linked_priority_ids, '[]'::jsonb)) AS elem;

  v_use_all := 'all' = ANY (v_audience);
  v_use_prior := v_use_all OR 'prior_players' = ANY (v_audience);
  v_use_watchers := v_use_all OR 'watchers' = ANY (v_audience);
  v_use_bookmarks := v_use_all OR 'bookmarks' = ANY (v_audience);
  v_use_feedback := v_use_all OR 'related_feedback' = ANY (v_audience);
  v_use_community := v_use_all OR 'community_members' = ANY (v_audience);

  RETURN QUERY
  SELECT DISTINCT recipients.user_id
  FROM (
    SELECT pp.user_id
    FROM public.project_plays pp
    WHERE v_use_prior
      AND pp.project_id = p_project_id

    UNION

    SELECT ps.user_id
    FROM public.project_play_sessions ps
    WHERE v_use_prior
      AND ps.project_id = p_project_id

    UNION

    SELECT pw.user_id
    FROM public.project_watches pw
    WHERE v_use_watchers
      AND pw.project_id = p_project_id

    UNION

    SELECT pb.user_id
    FROM public.project_bookmarks pb
    WHERE v_use_bookmarks
      AND pb.project_id = p_project_id

    UNION

    SELECT pf.user_id
    FROM public.project_feedback pf
    WHERE v_use_feedback
      AND pf.project_id = p_project_id
      AND (
        coalesce(array_length(v_priority_ids, 1), 0) = 0
        OR (
          ('bug-summary' = ANY (v_priority_ids) AND nullif(trim(pf.bugs), '') IS NOT NULL)
          OR ('concern-summary' = ANY (v_priority_ids) AND nullif(trim(pf.concerns), '') IS NOT NULL)
        )
      )

    UNION

    SELECT vr.user_id
    FROM public.project_voice_responses vr
    WHERE v_use_feedback
      AND vr.project_id = p_project_id
      AND (
        coalesce(array_length(v_priority_ids, 1), 0) = 0
        OR EXISTS (
          SELECT 1
          FROM unnest(v_priority_ids) AS pid
          WHERE pid LIKE 'voice-%'
            AND vr.prompt_id::text = regexp_replace(pid, '^voice-(no|scale|split)-', '')
        )
      )

    UNION

    SELECT cm.user_id
    FROM public.developer_communities dc
    INNER JOIN public.community_memberships cm
      ON cm.community_id = dc.id
      AND cm.status = 'approved'
    WHERE v_use_community
      AND dc.owner_id = v_owner_id
  ) AS recipients
  WHERE recipients.user_id <> v_owner_id;
END;
$$;

REVOKE ALL ON FUNCTION public.get_confirmation_notify_recipients(text, jsonb, text, jsonb)
  FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_confirmation_notify_recipients(text, jsonb, text, jsonb)
  TO authenticated;

COMMIT;
