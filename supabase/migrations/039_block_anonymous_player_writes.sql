-- 039: Block anonymous (guest) users from player / general user write paths
-- Prerequisite: 001–038 applied (038 defines public.auth_is_registered_user())
-- Purpose: Phase 0 — no guest DB writes. Complements 038 (developer/studio writes).
-- Phase 1 will selectively re-allow anonymous INSERT on play / first-feedback tables.
--
-- Apply: Supabase Dashboard SQL Editor AFTER 038, BEFORE enabling Anonymous Sign-ins.
-- SELECT policies are intentionally unchanged.

BEGIN;

-- ---------------------------------------------------------------------------
-- project_voice_responses
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users insert own voice responses"
  ON public.project_voice_responses;
CREATE POLICY "Users insert own voice responses"
  ON public.project_voice_responses
  FOR INSERT
  WITH CHECK (
    public.auth_is_registered_user()
    AND auth.uid() = user_id
  );

DROP POLICY IF EXISTS "Users update own voice responses"
  ON public.project_voice_responses;
CREATE POLICY "Users update own voice responses"
  ON public.project_voice_responses
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
-- project_feedback
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users insert own feedback"
  ON public.project_feedback;
CREATE POLICY "Users insert own feedback"
  ON public.project_feedback
  FOR INSERT
  WITH CHECK (
    public.auth_is_registered_user()
    AND auth.uid() = user_id
  );

DROP POLICY IF EXISTS "Users update own feedback"
  ON public.project_feedback;
CREATE POLICY "Users update own feedback"
  ON public.project_feedback
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
-- project_plays
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users insert own plays"
  ON public.project_plays;
CREATE POLICY "Users insert own plays"
  ON public.project_plays
  FOR INSERT
  WITH CHECK (
    public.auth_is_registered_user()
    AND auth.uid() = user_id
  );

-- ---------------------------------------------------------------------------
-- project_play_sessions
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users insert own play sessions"
  ON public.project_play_sessions;
CREATE POLICY "Users insert own play sessions"
  ON public.project_play_sessions
  FOR INSERT
  WITH CHECK (
    public.auth_is_registered_user()
    AND auth.uid() = user_id
  );

-- ---------------------------------------------------------------------------
-- project_bookmarks
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users insert own bookmarks"
  ON public.project_bookmarks;
CREATE POLICY "Users insert own bookmarks"
  ON public.project_bookmarks
  FOR INSERT
  WITH CHECK (
    public.auth_is_registered_user()
    AND auth.uid() = user_id
  );

DROP POLICY IF EXISTS "Users delete own bookmarks"
  ON public.project_bookmarks;
CREATE POLICY "Users delete own bookmarks"
  ON public.project_bookmarks
  FOR DELETE
  USING (
    public.auth_is_registered_user()
    AND auth.uid() = user_id
  );

-- ---------------------------------------------------------------------------
-- project_watches
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users insert own watches"
  ON public.project_watches;
CREATE POLICY "Users insert own watches"
  ON public.project_watches
  FOR INSERT
  WITH CHECK (
    public.auth_is_registered_user()
    AND auth.uid() = user_id
  );

DROP POLICY IF EXISTS "Users delete own watches"
  ON public.project_watches;
CREATE POLICY "Users delete own watches"
  ON public.project_watches
  FOR DELETE
  USING (
    public.auth_is_registered_user()
    AND auth.uid() = user_id
  );

-- ---------------------------------------------------------------------------
-- project_supports
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users insert own project support"
  ON public.project_supports;
CREATE POLICY "Users insert own project support"
  ON public.project_supports
  FOR INSERT
  WITH CHECK (
    public.auth_is_registered_user()
    AND auth.uid() = user_id
  );

DROP POLICY IF EXISTS "Users delete own project support"
  ON public.project_supports;
CREATE POLICY "Users delete own project support"
  ON public.project_supports
  FOR DELETE
  USING (
    public.auth_is_registered_user()
    AND auth.uid() = user_id
  );

-- ---------------------------------------------------------------------------
-- community_memberships — player apply only (owner moderation in 038)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users apply to communities"
  ON public.community_memberships;
CREATE POLICY "Users apply to communities"
  ON public.community_memberships
  FOR INSERT
  WITH CHECK (
    public.auth_is_registered_user()
    AND user_id = auth.uid()
    AND status = 'pending'
  );

-- ---------------------------------------------------------------------------
-- community_replies
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Approved members insert replies"
  ON public.community_replies;
CREATE POLICY "Approved members insert replies"
  ON public.community_replies
  FOR INSERT
  WITH CHECK (
    public.auth_is_registered_user()
    AND author_id = auth.uid()
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

-- ---------------------------------------------------------------------------
-- platform_feedback
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users insert own platform feedback"
  ON public.platform_feedback;
CREATE POLICY "Users insert own platform feedback"
  ON public.platform_feedback
  FOR INSERT
  WITH CHECK (
    public.auth_is_registered_user()
    AND user_id = auth.uid()
  );

-- ---------------------------------------------------------------------------
-- content_reports
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users insert own content reports"
  ON public.content_reports;
CREATE POLICY "Users insert own content reports"
  ON public.content_reports
  FOR INSERT
  WITH CHECK (
    public.auth_is_registered_user()
    AND reporter_id = auth.uid()
  );

-- ---------------------------------------------------------------------------
-- voice_adoption_disputes
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Players insert own disputes"
  ON public.voice_adoption_disputes;
CREATE POLICY "Players insert own disputes"
  ON public.voice_adoption_disputes
  FOR INSERT
  WITH CHECK (
    public.auth_is_registered_user()
    AND auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.voice_adoptions a
      WHERE a.id = adoption_id AND a.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- user_notifications — player read/update only (owner insert in 038)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users update own notifications"
  ON public.user_notifications;
CREATE POLICY "Users update own notifications"
  ON public.user_notifications
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
-- SECURITY DEFINER write paths — block anonymous callers
-- ---------------------------------------------------------------------------

-- Players call this before first voice answer; must stay registered-only until Phase 1.
CREATE OR REPLACE FUNCTION public.ensure_platform_default_prompt(
  p_project_id text,
  p_version_key text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
BEGIN
  IF NOT public.auth_is_registered_user() THEN
    RAISE EXCEPTION 'anonymous_not_allowed';
  END IF;

  SELECT id INTO v_id
  FROM public.project_version_prompts
  WHERE project_id = p_project_id
    AND version_key = p_version_key
    AND source = 'platform_default'
    AND archived_at IS NULL
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    RETURN v_id;
  END IF;

  INSERT INTO public.project_version_prompts (
    project_id,
    version_key,
    prompt_text,
    response_kind,
    options,
    sort_order,
    source
  ) VALUES (
    p_project_id,
    p_version_key,
    'もう一度遊びたい？',
    'replay_intent',
    '[{"id":"yes","label":"もう一度遊びたい"},{"id":"maybe","label":"更新次第また遊びたい"},{"id":"no","label":"今はもう遊ばない"}]'::jsonb,
    0,
    'platform_default'
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.ensure_platform_default_prompt(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.ensure_platform_default_prompt(text, text) TO authenticated;

-- Account deletion is registered-only.
CREATE OR REPLACE FUNCTION public.anonymize_own_account_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_label text := '退会済みユーザー';
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  IF NOT public.auth_is_registered_user() THEN
    RAISE EXCEPTION 'anonymous_not_allowed';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.account_anonymizations WHERE user_id = v_uid
  ) THEN
    RAISE EXCEPTION 'already_anonymized';
  END IF;

  UPDATE public.developer_profiles
  SET
    public_name = v_label,
    profile = '',
    x_account = NULL,
    website = NULL,
    updated_at = now()
  WHERE user_id = v_uid;

  UPDATE public.projects
  SET
    owner_name = v_label,
    creator = v_label,
    updated_at = now()
  WHERE owner_id = v_uid;

  DELETE FROM public.project_bookmarks WHERE user_id = v_uid;
  DELETE FROM public.project_watches WHERE user_id = v_uid;
  DELETE FROM public.project_supports WHERE user_id = v_uid;
  DELETE FROM public.project_plays WHERE user_id = v_uid;
  DELETE FROM public.project_play_sessions WHERE user_id = v_uid;
  DELETE FROM public.user_notifications WHERE user_id = v_uid;
  DELETE FROM public.developer_follows
  WHERE follower_id = v_uid OR developer_user_id = v_uid;

  INSERT INTO public.account_anonymizations (user_id)
  VALUES (v_uid);
END;
$$;

REVOKE ALL ON FUNCTION public.anonymize_own_account_data() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.anonymize_own_account_data() TO authenticated;

COMMIT;

-- Rollback (manual): re-run player write policies from 002, 004, 006, 012, 018, 024,
-- 026, 011, 003 without auth_is_registered_user(); restore ensure_platform_default_prompt
-- and anonymize_own_account_data from 006 / 029.
