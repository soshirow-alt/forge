-- 062: project thumbnails Storage bucket + HTTPS-only OGP image RPC
-- Staging first. Do NOT apply to Production until owner GO + backfill plan.
--
-- Bucket: project-thumbnails (public read)
-- Object path: {project_id}/{index}-{content_hash}.{ext}
-- OGP: get_public_project_og_image_url returns a short https URL only
--       (never returns data: / relative / http:).

-- ---------------------------------------------------------------------------
-- Storage bucket
-- ---------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'project-thumbnails',
  'project-thumbnails',
  true,
  2097152,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']::text[]
)
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Public read
DROP POLICY IF EXISTS "project_thumbnails_public_read" ON storage.objects;
CREATE POLICY "project_thumbnails_public_read"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'project-thumbnails');

-- Owner insert: first folder segment = project id owned by auth.uid()
DROP POLICY IF EXISTS "project_thumbnails_owner_insert" ON storage.objects;
CREATE POLICY "project_thumbnails_owner_insert"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'project-thumbnails'
  AND (storage.foldername(name))[1] IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM public.projects p
    WHERE p.id::text = (storage.foldername(name))[1]
      AND p.owner_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "project_thumbnails_owner_update" ON storage.objects;
CREATE POLICY "project_thumbnails_owner_update"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'project-thumbnails'
  AND EXISTS (
    SELECT 1
    FROM public.projects p
    WHERE p.id::text = (storage.foldername(name))[1]
      AND p.owner_id = auth.uid()
  )
)
WITH CHECK (
  bucket_id = 'project-thumbnails'
  AND EXISTS (
    SELECT 1
    FROM public.projects p
    WHERE p.id::text = (storage.foldername(name))[1]
      AND p.owner_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "project_thumbnails_owner_delete" ON storage.objects;
CREATE POLICY "project_thumbnails_owner_delete"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'project-thumbnails'
  AND EXISTS (
    SELECT 1
    FROM public.projects p
    WHERE p.id::text = (storage.foldername(name))[1]
      AND p.owner_id = auth.uid()
  )
);

-- ---------------------------------------------------------------------------
-- OGP: return one short https thumbnail URL for a public project
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_public_project_og_image_url(
  p_project_id uuid
)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  -- Only thumbnail_url (kept in sync as primary). Prefix check avoids adopting
  -- data: / relative values. Length cap keeps OGP payloads short.
  SELECT CASE
    WHEN p.visibility = 'public'
      AND p.thumbnail_url IS NOT NULL
      AND length(p.thumbnail_url) <= 2048
      AND substring(p.thumbnail_url from 1 for 8) = 'https://'
    THEN p.thumbnail_url
    ELSE NULL
  END
  FROM public.projects p
  WHERE p.id = p_project_id
  LIMIT 1;
$$;

COMMENT ON FUNCTION public.get_public_project_og_image_url(uuid) IS
  'Returns one short https:// thumbnail URL for OGP, or null. Skips data:/relative/http and oversized values.';

REVOKE ALL ON FUNCTION public.get_public_project_og_image_url(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_project_og_image_url(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.get_public_project_og_image_url(uuid) TO authenticated;
