-- 088: formal request/approval lifecycle for project usage relations.
-- Existing public rows become accepted; historical draft rows become pending so
-- the final status constraint is valid without deleting data.

BEGIN;

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

COMMIT;
