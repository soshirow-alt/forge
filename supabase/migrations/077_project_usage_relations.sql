-- 077: Public "使用した" relations between published projects
-- Staging only from Cursor. Production: owner manual later.
-- Prerequisite: 076_player_ia_categories_attributes.sql

BEGIN;

CREATE TABLE IF NOT EXISTS public.project_usage_relations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_project_id uuid NOT NULL REFERENCES public.projects (id) ON DELETE CASCADE,
  target_project_id uuid NOT NULL REFERENCES public.projects (id) ON DELETE CASCADE,
  relation_type text NOT NULL DEFAULT 'used'
    CHECK (relation_type = 'used'),
  status text NOT NULL DEFAULT 'published'
    CHECK (status IN ('draft', 'published')),
  created_by uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT project_usage_relations_distinct CHECK (source_project_id <> target_project_id),
  CONSTRAINT project_usage_relations_unique_pair UNIQUE (source_project_id, target_project_id, relation_type)
);

COMMENT ON TABLE public.project_usage_relations IS
  'Public catalog "使用した" links between Forge projects. Registration UI comes later; published rows are readable.';

CREATE INDEX IF NOT EXISTS project_usage_relations_source_idx
  ON public.project_usage_relations (source_project_id)
  WHERE status = 'published';

CREATE INDEX IF NOT EXISTS project_usage_relations_target_idx
  ON public.project_usage_relations (target_project_id)
  WHERE status = 'published';

ALTER TABLE public.project_usage_relations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read published usage relations on public projects"
  ON public.project_usage_relations;
CREATE POLICY "Anyone can read published usage relations on public projects"
  ON public.project_usage_relations
  FOR SELECT
  TO anon, authenticated
  USING (
    status = 'published'
    AND EXISTS (
      SELECT 1 FROM public.projects s
      WHERE s.id = source_project_id AND s.visibility = 'public'
    )
    AND EXISTS (
      SELECT 1 FROM public.projects t
      WHERE t.id = target_project_id AND t.visibility = 'public'
    )
  );

-- No client INSERT/UPDATE/DELETE in this phase (registration UI is next).
REVOKE INSERT, UPDATE, DELETE ON public.project_usage_relations FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_public_project_usage_relations(
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
    s.title AS source_title,
    coalesce(s.category, 'game') AS source_category,
    s.thumbnail_url AS source_thumbnail_url,
    r.target_project_id,
    t.title AS target_title,
    coalesce(t.category, 'game') AS target_category,
    t.thumbnail_url AS target_thumbnail_url,
    r.relation_type,
    r.created_at
  FROM public.project_usage_relations r
  INNER JOIN public.projects s ON s.id = r.source_project_id
  INNER JOIN public.projects t ON t.id = r.target_project_id
  WHERE r.status = 'published'
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

REVOKE ALL ON FUNCTION public.get_public_project_usage_relations(uuid, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_project_usage_relations(uuid, integer)
  TO anon, authenticated, service_role;

COMMIT;
