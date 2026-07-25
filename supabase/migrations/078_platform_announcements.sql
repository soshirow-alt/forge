-- 078: Platform announcements (積み上げ型お知らせ)
-- Staging only from Cursor. Production: owner manual later.
-- Prerequisite: 001+

BEGIN;

CREATE TABLE IF NOT EXISTS public.platform_announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  body text NOT NULL,
  importance text NOT NULL DEFAULT 'normal'
    CHECK (importance IN ('normal', 'important')),
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'published')),
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT platform_announcements_published_at_check
    CHECK (status = 'draft' OR published_at IS NOT NULL)
);

COMMENT ON TABLE public.platform_announcements IS
  'Forge platform announcements. Only status=published rows are public.';

CREATE INDEX IF NOT EXISTS platform_announcements_published_idx
  ON public.platform_announcements (published_at DESC)
  WHERE status = 'published';

ALTER TABLE public.platform_announcements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read published announcements"
  ON public.platform_announcements;
CREATE POLICY "Anyone can read published announcements"
  ON public.platform_announcements
  FOR SELECT
  TO anon, authenticated
  USING (status = 'published');

REVOKE INSERT, UPDATE, DELETE ON public.platform_announcements FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_public_platform_announcements(
  p_limit integer DEFAULT 5,
  p_offset integer DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  slug text,
  title text,
  body text,
  importance text,
  published_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    a.id,
    a.slug,
    a.title,
    a.body,
    a.importance,
    a.published_at
  FROM public.platform_announcements a
  WHERE a.status = 'published'
  ORDER BY a.published_at DESC NULLS LAST
  LIMIT greatest(1, least(coalesce(p_limit, 5), 50))
  OFFSET greatest(0, coalesce(p_offset, 0));
$$;

CREATE OR REPLACE FUNCTION public.get_public_platform_announcement_by_slug(
  p_slug text
)
RETURNS TABLE (
  id uuid,
  slug text,
  title text,
  body text,
  importance text,
  published_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    a.id,
    a.slug,
    a.title,
    a.body,
    a.importance,
    a.published_at
  FROM public.platform_announcements a
  WHERE a.status = 'published'
    AND a.slug = p_slug
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_public_platform_announcements(integer, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_platform_announcements(integer, integer)
  TO anon, authenticated, service_role;

REVOKE ALL ON FUNCTION public.get_public_platform_announcement_by_slug(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_platform_announcement_by_slug(text)
  TO anon, authenticated, service_role;

COMMIT;
