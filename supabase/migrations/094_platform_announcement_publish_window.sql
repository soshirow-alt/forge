-- 094: platform announcement publish window + optional CTA fields.
-- Does not edit 078. Public RPCs filter by active window.

BEGIN;

ALTER TABLE public.platform_announcements
  ADD COLUMN IF NOT EXISTS starts_at timestamptz NULL,
  ADD COLUMN IF NOT EXISTS ends_at timestamptz NULL,
  ADD COLUMN IF NOT EXISTS cta_label text NULL,
  ADD COLUMN IF NOT EXISTS cta_url text NULL;

ALTER TABLE public.platform_announcements
  DROP CONSTRAINT IF EXISTS platform_announcements_window_check;
ALTER TABLE public.platform_announcements
  ADD CONSTRAINT platform_announcements_window_check
  CHECK (
    ends_at IS NULL
    OR starts_at IS NULL
    OR ends_at >= starts_at
  );

COMMENT ON COLUMN public.platform_announcements.starts_at IS
  'Optional publish window start. NULL means immediately after published_at.';
COMMENT ON COLUMN public.platform_announcements.ends_at IS
  'Optional publish window end. NULL means no expiry.';
COMMENT ON COLUMN public.platform_announcements.cta_label IS
  'Optional public CTA label. Empty/null means no CTA chip.';
COMMENT ON COLUMN public.platform_announcements.cta_url IS
  'Optional public CTA URL (http/https or site-relative path).';

-- Backfill: published rows without starts_at use published_at as start.
UPDATE public.platform_announcements
SET starts_at = published_at
WHERE status = 'published'
  AND starts_at IS NULL
  AND published_at IS NOT NULL;

DROP FUNCTION IF EXISTS public.get_public_platform_announcements(integer, integer);
CREATE FUNCTION public.get_public_platform_announcements(
  p_limit integer DEFAULT 5,
  p_offset integer DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  slug text,
  title text,
  body text,
  importance text,
  published_at timestamptz,
  starts_at timestamptz,
  ends_at timestamptz,
  cta_label text,
  cta_url text
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
    a.published_at,
    a.starts_at,
    a.ends_at,
    a.cta_label,
    a.cta_url
  FROM public.platform_announcements a
  WHERE a.status = 'published'
    AND coalesce(a.starts_at, a.published_at, '-infinity'::timestamptz) <= now()
    AND (a.ends_at IS NULL OR a.ends_at > now())
  ORDER BY a.published_at DESC NULLS LAST
  LIMIT greatest(1, least(coalesce(p_limit, 5), 50))
  OFFSET greatest(0, coalesce(p_offset, 0));
$$;

DROP FUNCTION IF EXISTS public.get_public_platform_announcement_by_slug(text);
CREATE FUNCTION public.get_public_platform_announcement_by_slug(
  p_slug text
)
RETURNS TABLE (
  id uuid,
  slug text,
  title text,
  body text,
  importance text,
  published_at timestamptz,
  starts_at timestamptz,
  ends_at timestamptz,
  cta_label text,
  cta_url text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  -- Published history detail (including expired). Drafts never returned.
  SELECT
    a.id,
    a.slug,
    a.title,
    a.body,
    a.importance,
    a.published_at,
    a.starts_at,
    a.ends_at,
    a.cta_label,
    a.cta_url
  FROM public.platform_announcements a
  WHERE a.status = 'published'
    AND a.slug = p_slug
  LIMIT 1;
$$;

-- Archive: published history including expired (still not drafts).
DROP FUNCTION IF EXISTS public.get_public_platform_announcement_archive(integer, integer);
CREATE FUNCTION public.get_public_platform_announcement_archive(
  p_limit integer DEFAULT 50,
  p_offset integer DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  slug text,
  title text,
  body text,
  importance text,
  published_at timestamptz,
  starts_at timestamptz,
  ends_at timestamptz,
  cta_label text,
  cta_url text,
  is_active boolean
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
    a.published_at,
    a.starts_at,
    a.ends_at,
    a.cta_label,
    a.cta_url,
    (
      coalesce(a.starts_at, a.published_at, '-infinity'::timestamptz) <= now()
      AND (a.ends_at IS NULL OR a.ends_at > now())
    ) AS is_active
  FROM public.platform_announcements a
  WHERE a.status = 'published'
  ORDER BY a.published_at DESC NULLS LAST
  LIMIT greatest(1, least(coalesce(p_limit, 50), 100))
  OFFSET greatest(0, coalesce(p_offset, 0));
$$;

REVOKE ALL ON FUNCTION public.get_public_platform_announcements(integer, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_platform_announcements(integer, integer)
  TO anon, authenticated, service_role;

REVOKE ALL ON FUNCTION public.get_public_platform_announcement_by_slug(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_platform_announcement_by_slug(text)
  TO anon, authenticated, service_role;

REVOKE ALL ON FUNCTION public.get_public_platform_announcement_archive(integer, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_platform_announcement_archive(integer, integer)
  TO anon, authenticated, service_role;

COMMIT;
