-- 075: Project-owner public feedback unread watermark (Studio)
-- Prerequisite: 041/070/071 public feedback cards (registered short_text / voice_supplement / detailed)
-- Purpose:
--   - project_feedback_owner_reads (project_id, owner_id, last_seen_at)
--   - list_owned_public_feedback_unread_counts() — batch unread per owned project
--   - mark_project_public_feedback_seen(project_id) — upsert last_seen_at = now()
-- Unread = registered public FB cards with created_at > last_seen_at (replies excluded; guests excluded)
-- Seed: existing owned projects start caught-up (last_seen_at = now()) so badges show only new FB

BEGIN;

CREATE TABLE IF NOT EXISTS public.project_feedback_owner_reads (
  project_id text NOT NULL,
  owner_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (project_id, owner_id)
);

CREATE INDEX IF NOT EXISTS project_feedback_owner_reads_owner_idx
  ON public.project_feedback_owner_reads (owner_id);

COMMENT ON TABLE public.project_feedback_owner_reads IS
  'Owner watermark for unread public FB cards on Studio. Unread = registered public cards created after last_seen_at.';

ALTER TABLE public.project_feedback_owner_reads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owners read own feedback owner reads"
  ON public.project_feedback_owner_reads;
CREATE POLICY "Owners read own feedback owner reads"
  ON public.project_feedback_owner_reads FOR SELECT
  USING (
    auth.uid() = owner_id
    AND EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id::text = project_id AND p.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Owners insert own feedback owner reads"
  ON public.project_feedback_owner_reads;
CREATE POLICY "Owners insert own feedback owner reads"
  ON public.project_feedback_owner_reads FOR INSERT
  WITH CHECK (
    auth.uid() = owner_id
    AND EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id::text = project_id AND p.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Owners update own feedback owner reads"
  ON public.project_feedback_owner_reads;
CREATE POLICY "Owners update own feedback owner reads"
  ON public.project_feedback_owner_reads FOR UPDATE
  USING (
    auth.uid() = owner_id
    AND EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id::text = project_id AND p.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    auth.uid() = owner_id
    AND EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id::text = project_id AND p.owner_id = auth.uid()
    )
  );

-- Bootstrap: catch up existing projects so launch does not flood「新着」badges
INSERT INTO public.project_feedback_owner_reads (project_id, owner_id, last_seen_at)
SELECT p.id::text, p.owner_id, now()
FROM public.projects p
WHERE p.owner_id IS NOT NULL
ON CONFLICT (project_id, owner_id) DO NOTHING;

-- Registered public card rows for a project (same predicates as get_public_feedback_cards registered union)
CREATE OR REPLACE FUNCTION public.registered_public_feedback_card_created_ats(
  p_project_id text
)
RETURNS TABLE (created_at timestamptz)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT r.created_at
  FROM public.project_voice_responses r
  INNER JOIN public.project_version_prompts vp ON vp.id = r.prompt_id
  WHERE r.project_id = p_project_id
    AND r.moderation_status = 'visible'
    AND (
      (vp.response_kind = 'short_text' AND NULLIF(btrim(r.answer_value), '') IS NOT NULL)
      OR NULLIF(btrim(coalesce(r.optional_comment, '')), '') IS NOT NULL
    )
  UNION ALL
  SELECT f.created_at
  FROM public.project_feedback f
  WHERE f.project_id = p_project_id
    AND f.moderation_status = 'visible'
    AND (
      NULLIF(btrim(coalesce(f.good_points, '')), '') IS NOT NULL
      OR NULLIF(btrim(coalesce(f.concerns, '')), '') IS NOT NULL
      OR NULLIF(btrim(coalesce(f.bugs, '')), '') IS NOT NULL
      OR NULLIF(btrim(coalesce(f.other_notes, '')), '') IS NOT NULL
    );
$$;

REVOKE ALL ON FUNCTION public.registered_public_feedback_card_created_ats(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.registered_public_feedback_card_created_ats(text) FROM anon;
REVOKE ALL ON FUNCTION public.registered_public_feedback_card_created_ats(text) FROM authenticated;

CREATE OR REPLACE FUNCTION public.list_owned_public_feedback_unread_counts()
RETURNS TABLE (
  project_id text,
  unread_count bigint
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL OR NOT public.auth_is_registered_user() THEN
    RETURN;
  END IF;

  RETURN QUERY
  WITH owned AS (
    SELECT p.id::text AS project_id
    FROM public.projects p
    WHERE p.owner_id = v_uid
  ),
  reads AS (
    SELECT r.project_id, r.last_seen_at
    FROM public.project_feedback_owner_reads r
    WHERE r.owner_id = v_uid
  ),
  card_times AS (
    SELECT
      o.project_id,
      c.created_at
    FROM owned o
    CROSS JOIN LATERAL public.registered_public_feedback_card_created_ats(o.project_id) c
  )
  SELECT
    o.project_id,
    count(ct.created_at)::bigint AS unread_count
  FROM owned o
  LEFT JOIN reads rd ON rd.project_id = o.project_id
  LEFT JOIN card_times ct
    ON ct.project_id = o.project_id
    AND ct.created_at > coalesce(rd.last_seen_at, '-infinity'::timestamptz)
  GROUP BY o.project_id;
END;
$$;

COMMENT ON FUNCTION public.list_owned_public_feedback_unread_counts() IS
  'Batch unread public FB card counts for auth owner across all owned projects. No N+1.';

REVOKE ALL ON FUNCTION public.list_owned_public_feedback_unread_counts() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.list_owned_public_feedback_unread_counts() FROM anon;
GRANT EXECUTE ON FUNCTION public.list_owned_public_feedback_unread_counts() TO authenticated;

CREATE OR REPLACE FUNCTION public.mark_project_public_feedback_seen(
  p_project_id text
)
RETURNS timestamptz
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_seen timestamptz := now();
BEGIN
  IF v_uid IS NULL OR NOT public.auth_is_registered_user() THEN
    RAISE EXCEPTION 'authentication required';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id::text = p_project_id AND p.owner_id = v_uid
  ) THEN
    RAISE EXCEPTION 'owner only';
  END IF;

  INSERT INTO public.project_feedback_owner_reads (project_id, owner_id, last_seen_at)
  VALUES (p_project_id, v_uid, v_seen)
  ON CONFLICT (project_id, owner_id)
  DO UPDATE SET last_seen_at = excluded.last_seen_at;

  RETURN v_seen;
END;
$$;

COMMENT ON FUNCTION public.mark_project_public_feedback_seen(text) IS
  'Owner-only: set last_seen_at = now() after みんなのフィードバック cards fetch succeeds.';

REVOKE ALL ON FUNCTION public.mark_project_public_feedback_seen(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.mark_project_public_feedback_seen(text) FROM anon;
GRANT EXECUTE ON FUNCTION public.mark_project_public_feedback_seen(text) TO authenticated;

COMMIT;
