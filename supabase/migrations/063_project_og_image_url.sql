-- 063: dedicated OGP image URL (1200×630 derived), separate from gallery thumbnails
-- Staging first. Do NOT apply to Production until owner GO after Preview verify.
--
-- thumbnail_url / thumbnail_urls remain for in-app gallery.
-- get_public_project_og_image_url returns only public.og_image_url when https://.

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS og_image_url text;

COMMENT ON COLUMN public.projects.og_image_url IS
  'HTTPS URL of derived 1200×630 OGP image in project-thumbnails Storage. Null → default OG asset.';

CREATE OR REPLACE FUNCTION public.get_public_project_og_image_url(
  p_project_id uuid
)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN p.visibility = 'public'
      AND p.og_image_url IS NOT NULL
      AND length(p.og_image_url) <= 2048
      AND substring(p.og_image_url from 1 for 8) = 'https://'
    THEN p.og_image_url
    ELSE NULL
  END
  FROM public.projects p
  WHERE p.id = p_project_id
  LIMIT 1;
$$;

COMMENT ON FUNCTION public.get_public_project_og_image_url(uuid) IS
  'Returns public.og_image_url when it is a short https:// URL; otherwise null. Never returns thumbnail_url or data: URLs.';

REVOKE ALL ON FUNCTION public.get_public_project_og_image_url(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_project_og_image_url(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.get_public_project_og_image_url(uuid) TO authenticated;
