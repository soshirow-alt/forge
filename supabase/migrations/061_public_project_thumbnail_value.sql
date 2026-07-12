-- 061: single public thumbnail value by index (no full array payload)
-- Staging-first, then Production. Does not modify project rows.
-- Callable only by service_role (server image API). Not granted to anon/authenticated.

BEGIN;

CREATE OR REPLACE FUNCTION public.get_public_project_thumbnail_value(
  p_project_id uuid,
  p_index integer
)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN p_index IS NULL OR p_index < 0 THEN NULL
    WHEN p.thumbnail_urls IS NOT NULL
      AND cardinality(p.thumbnail_urls) > p_index
      AND COALESCE(btrim(p.thumbnail_urls[p_index + 1]), '') <> ''
      THEN p.thumbnail_urls[p_index + 1]
    WHEN p_index = 0
      AND p.thumbnail_url IS NOT NULL
      AND btrim(p.thumbnail_url) <> ''
      THEN p.thumbnail_url
    ELSE NULL
  END
  FROM public.projects p
  WHERE p.id = p_project_id
    AND p.visibility = 'public';
$$;

COMMENT ON FUNCTION public.get_public_project_thumbnail_value(uuid, integer) IS
  'Returns one public project thumbnail string by 0-based index without returning the full thumbnail_urls array.';

REVOKE ALL ON FUNCTION public.get_public_project_thumbnail_value(uuid, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_project_thumbnail_value(uuid, integer) TO service_role;

COMMIT;
