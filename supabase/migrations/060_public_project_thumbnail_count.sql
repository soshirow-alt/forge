-- 060: lightweight public thumbnail count (no blob payload)
-- Staging-first, then Production. Does not modify project rows.
-- Used so /games/[id] can build N image API paths without select(thumbnail_urls).

BEGIN;

CREATE OR REPLACE FUNCTION public.get_public_project_thumbnail_count(
  p_project_id uuid
)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN p.id IS NULL THEN NULL
    WHEN p.thumbnail_urls IS NOT NULL
      AND cardinality(p.thumbnail_urls) > 0
      THEN cardinality(p.thumbnail_urls)
    WHEN p.thumbnail_url IS NOT NULL
      AND btrim(p.thumbnail_url) <> ''
      THEN 1
    ELSE 0
  END
  FROM public.projects p
  WHERE p.id = p_project_id
    AND p.visibility = 'public';
$$;

COMMENT ON FUNCTION public.get_public_project_thumbnail_count(uuid) IS
  'Returns gallery image count for a public project without returning thumbnail blobs.';

REVOKE ALL ON FUNCTION public.get_public_project_thumbnail_count(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_project_thumbnail_count(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.get_public_project_thumbnail_count(uuid) TO authenticated;

COMMIT;
