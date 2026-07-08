-- 047: Public OGP cards + project thumbnails in Storage
-- Prerequisite: projects table (001+)
-- Owner applies via Supabase Dashboard before og_image_url backfill.

BEGIN;

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS og_image_url text;

COMMENT ON COLUMN public.projects.og_image_url IS
  'Public https URL of the 1200×630 OGP card (project-og bucket).';

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  (
    'project-og',
    'project-og',
    true,
    5242880,
    ARRAY['image/jpeg', 'image/png']::text[]
  ),
  (
    'project-thumbnails',
    'project-thumbnails',
    true,
    10485760,
    ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]
  )
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "project_og_public_read" ON storage.objects;
CREATE POLICY "project_og_public_read"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'project-og');

DROP POLICY IF EXISTS "project_thumbnails_public_read" ON storage.objects;
CREATE POLICY "project_thumbnails_public_read"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'project-thumbnails');

COMMIT;
