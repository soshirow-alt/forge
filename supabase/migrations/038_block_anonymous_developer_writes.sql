-- 038: Block anonymous (guest) users from developer / Studio write paths
-- Prerequisite: 001–037 applied
-- Purpose: Before enabling Supabase Anonymous Sign-ins, deny INSERT/UPDATE/DELETE
--          on Studio-related tables at RLS layer (not only app middleware).
-- Player tables (voice_responses, feedback, plays, bookmarks, watches, etc.) are
-- intentionally unchanged — Phase 1 guest play/FB will design those separately.
--
-- Apply: Supabase Dashboard SQL Editor (staging-first, then production when ready)
-- Do NOT enable Anonymous Sign-ins until this migration is applied on that environment.

BEGIN;

-- JWT claim `is_anonymous` is set by Supabase Auth for anonymous sessions.
-- Regular sessions omit the claim → treated as registered.
CREATE OR REPLACE FUNCTION public.auth_is_registered_user()
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT auth.uid() IS NOT NULL
    AND coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) = false;
$$;

COMMENT ON FUNCTION public.auth_is_registered_user() IS
  'RLS helper: true for non-anonymous authenticated users; false for anon JWT or no session.';

-- ---------------------------------------------------------------------------
-- developer_profiles
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can insert own developer profile"
  ON public.developer_profiles;
CREATE POLICY "Users can insert own developer profile"
  ON public.developer_profiles
  FOR INSERT
  WITH CHECK (
    public.auth_is_registered_user()
    AND auth.uid() = user_id
  );

DROP POLICY IF EXISTS "Users can update own developer profile"
  ON public.developer_profiles;
CREATE POLICY "Users can update own developer profile"
  ON public.developer_profiles
  FOR UPDATE
  USING (
    public.auth_is_registered_user()
    AND auth.uid() = user_id
  )
  WITH CHECK (
    public.auth_is_registered_user()
    AND auth.uid() = user_id
  );

DROP POLICY IF EXISTS "Users can delete own developer profile"
  ON public.developer_profiles;
CREATE POLICY "Users can delete own developer profile"
  ON public.developer_profiles
  FOR DELETE
  USING (
    public.auth_is_registered_user()
    AND auth.uid() = user_id
  );

-- ---------------------------------------------------------------------------
-- projects
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can insert own projects"
  ON public.projects;
CREATE POLICY "Users can insert own projects"
  ON public.projects
  FOR INSERT
  WITH CHECK (
    public.auth_is_registered_user()
    AND auth.uid() = owner_id
  );

DROP POLICY IF EXISTS "Users can update own projects"
  ON public.projects;
CREATE POLICY "Users can update own projects"
  ON public.projects
  FOR UPDATE
  USING (
    public.auth_is_registered_user()
    AND auth.uid() = owner_id
  )
  WITH CHECK (
    public.auth_is_registered_user()
    AND auth.uid() = owner_id
  );

DROP POLICY IF EXISTS "Users can delete own projects"
  ON public.projects;
CREATE POLICY "Users can delete own projects"
  ON public.projects
  FOR DELETE
  USING (
    public.auth_is_registered_user()
    AND auth.uid() = owner_id
  );

-- ---------------------------------------------------------------------------
-- project_devlogs
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Project owners insert devlogs"
  ON public.project_devlogs;
CREATE POLICY "Project owners insert devlogs"
  ON public.project_devlogs
  FOR INSERT
  WITH CHECK (
    public.auth_is_registered_user()
    AND author_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id::text = project_id AND p.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Project owners update own devlogs"
  ON public.project_devlogs;
CREATE POLICY "Project owners update own devlogs"
  ON public.project_devlogs
  FOR UPDATE
  USING (
    public.auth_is_registered_user()
    AND author_id = auth.uid()
  )
  WITH CHECK (
    public.auth_is_registered_user()
    AND author_id = auth.uid()
  );

DROP POLICY IF EXISTS "Project owners delete own devlogs"
  ON public.project_devlogs;
CREATE POLICY "Project owners delete own devlogs"
  ON public.project_devlogs
  FOR DELETE
  USING (
    public.auth_is_registered_user()
    AND author_id = auth.uid()
  );

-- ---------------------------------------------------------------------------
-- project_version_prompts
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Project owners manage version prompts"
  ON public.project_version_prompts;
CREATE POLICY "Project owners manage version prompts"
  ON public.project_version_prompts
  FOR ALL
  USING (
    public.auth_is_registered_user()
    AND EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id::text = project_id AND p.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    public.auth_is_registered_user()
    AND EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id::text = project_id AND p.owner_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- confirmation_requests
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Project owners insert confirmation requests"
  ON public.confirmation_requests;
CREATE POLICY "Project owners insert confirmation requests"
  ON public.confirmation_requests
  FOR INSERT
  WITH CHECK (
    public.auth_is_registered_user()
    AND EXISTS (
      SELECT 1
      FROM public.project_devlogs d
      INNER JOIN public.projects p ON p.id::text = d.project_id
      WHERE d.id = devlog_id
        AND d.project_id = confirmation_requests.project_id
        AND d.author_id = auth.uid()
        AND p.owner_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- project_release_events
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Project owners insert release events"
  ON public.project_release_events;
CREATE POLICY "Project owners insert release events"
  ON public.project_release_events
  FOR INSERT
  WITH CHECK (
    public.auth_is_registered_user()
    AND actor_user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_id AND p.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Project owners delete release events for own projects"
  ON public.project_release_events;
CREATE POLICY "Project owners delete release events for own projects"
  ON public.project_release_events
  FOR DELETE
  USING (
    public.auth_is_registered_user()
    AND EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_id AND p.owner_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- project_witness_grants (owner delete on project removal)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Project owners delete witness grants for own projects"
  ON public.project_witness_grants;
CREATE POLICY "Project owners delete witness grants for own projects"
  ON public.project_witness_grants
  FOR DELETE
  USING (
    public.auth_is_registered_user()
    AND EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_id AND p.owner_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- developer_feedback_helpful_marks
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Project owners insert helpful marks"
  ON public.developer_feedback_helpful_marks;
CREATE POLICY "Project owners insert helpful marks"
  ON public.developer_feedback_helpful_marks
  FOR INSERT
  WITH CHECK (
    public.auth_is_registered_user()
    AND developer_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id::text = project_id AND p.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Project owners delete own helpful marks"
  ON public.developer_feedback_helpful_marks;
CREATE POLICY "Project owners delete own helpful marks"
  ON public.developer_feedback_helpful_marks
  FOR DELETE
  USING (
    public.auth_is_registered_user()
    AND developer_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id::text = project_id AND p.owner_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- project_voice_reads (studio read-state)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Owners insert own voice reads"
  ON public.project_voice_reads;
CREATE POLICY "Owners insert own voice reads"
  ON public.project_voice_reads
  FOR INSERT
  WITH CHECK (
    public.auth_is_registered_user()
    AND auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id::text = project_id AND p.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Owners update own voice reads"
  ON public.project_voice_reads;
CREATE POLICY "Owners update own voice reads"
  ON public.project_voice_reads
  FOR UPDATE
  USING (
    public.auth_is_registered_user()
    AND auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id::text = project_id AND p.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    public.auth_is_registered_user()
    AND auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id::text = project_id AND p.owner_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- user_notifications — owner-side inserts only (player read/update unchanged)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Project owners insert notifications"
  ON public.user_notifications;
CREATE POLICY "Project owners insert notifications"
  ON public.user_notifications
  FOR INSERT
  WITH CHECK (
    public.auth_is_registered_user()
    AND type IN ('devlog', 'version_published', 'confirmation_request')
    AND EXISTS (
      SELECT 1
      FROM public.projects p
      WHERE p.id::text = project_id
        AND p.owner_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- developer_communities
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Owners manage own community"
  ON public.developer_communities;
CREATE POLICY "Owners manage own community"
  ON public.developer_communities
  FOR INSERT
  WITH CHECK (
    public.auth_is_registered_user()
    AND owner_id = auth.uid()
  );

DROP POLICY IF EXISTS "Owners update own community"
  ON public.developer_communities;
CREATE POLICY "Owners update own community"
  ON public.developer_communities
  FOR UPDATE
  USING (
    public.auth_is_registered_user()
    AND owner_id = auth.uid()
  )
  WITH CHECK (
    public.auth_is_registered_user()
    AND owner_id = auth.uid()
  );

-- ---------------------------------------------------------------------------
-- community_memberships — owner moderation only (player apply unchanged)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Community owners update membership status"
  ON public.community_memberships;
CREATE POLICY "Community owners update membership status"
  ON public.community_memberships
  FOR UPDATE
  USING (
    public.auth_is_registered_user()
    AND EXISTS (
      SELECT 1
      FROM public.developer_communities dc
      WHERE dc.id = community_id
        AND dc.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    public.auth_is_registered_user()
    AND EXISTS (
      SELECT 1
      FROM public.developer_communities dc
      WHERE dc.id = community_id
        AND dc.owner_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- community_posts — developer posts only
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Community owners insert posts"
  ON public.community_posts;
CREATE POLICY "Community owners insert posts"
  ON public.community_posts
  FOR INSERT
  WITH CHECK (
    public.auth_is_registered_user()
    AND author_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.developer_communities dc
      WHERE dc.id = community_id
        AND dc.owner_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- user_settings (registered accounts only — guest has no /settings)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users insert own settings"
  ON public.user_settings;
CREATE POLICY "Users insert own settings"
  ON public.user_settings
  FOR INSERT
  WITH CHECK (
    public.auth_is_registered_user()
    AND auth.uid() = user_id
  );

DROP POLICY IF EXISTS "Users update own settings"
  ON public.user_settings;
CREATE POLICY "Users update own settings"
  ON public.user_settings
  FOR UPDATE
  USING (
    public.auth_is_registered_user()
    AND auth.uid() = user_id
  )
  WITH CHECK (
    public.auth_is_registered_user()
    AND auth.uid() = user_id
  );

-- ---------------------------------------------------------------------------
-- developer_follows (registered only — guest cannot follow)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can follow developers"
  ON public.developer_follows;
CREATE POLICY "Users can follow developers"
  ON public.developer_follows
  FOR INSERT
  WITH CHECK (
    public.auth_is_registered_user()
    AND auth.uid() = follower_id
  );

DROP POLICY IF EXISTS "Users can unfollow developers"
  ON public.developer_follows;
CREATE POLICY "Users can unfollow developers"
  ON public.developer_follows
  FOR DELETE
  USING (
    public.auth_is_registered_user()
    AND auth.uid() = follower_id
  );

-- ---------------------------------------------------------------------------
-- SECURITY DEFINER: confirmation notify recipients (owner-only RPC)
-- ---------------------------------------------------------------------------
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
  v_use_all boolean;
BEGIN
  IF NOT public.auth_is_registered_user() THEN
    RETURN;
  END IF;

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
  ) AS recipients
  WHERE recipients.user_id <> v_owner_id;
END;
$$;

COMMIT;

-- Rollback (manual): re-run policy definitions from migrations 001, 003, 005, 006,
-- 010, 013, 015, 016, 017, 018, 023 fixup, 027, 030 without auth_is_registered_user().
