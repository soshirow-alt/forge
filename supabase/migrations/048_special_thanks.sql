-- 048: platform Special Thanks + forge admin allowlist
-- Prerequisite: none beyond auth.users
-- Note: 047 is intentionally skipped (reserved / avoid confusion with archived OGP Storage 047 work).
-- Apply: Staging Dashboard first (owner GO). Production apply is a separate GO.
-- First admin: INSERT into forge_admin_users via Staging Dashboard (manual).

BEGIN;

-- Schema USAGE — Staging historically returned 401/42501 when REST lacked this.
-- Does not widen table write privileges by itself.
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- A. forge_admin_users (Dashboard / service_role only; not client-readable)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.forge_admin_users (
  user_id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.forge_admin_users IS
  'Forge operator allowlist. Manage via Dashboard / service_role only. Not exposed to anon/authenticated.';

ALTER TABLE public.forge_admin_users ENABLE ROW LEVEL SECURITY;

-- No policies for anon/authenticated → deny by default under RLS.
REVOKE ALL ON TABLE public.forge_admin_users FROM PUBLIC;
REVOKE ALL ON TABLE public.forge_admin_users FROM anon;
REVOKE ALL ON TABLE public.forge_admin_users FROM authenticated;
GRANT ALL ON TABLE public.forge_admin_users TO service_role;
GRANT ALL ON TABLE public.forge_admin_users TO postgres;

-- ---------------------------------------------------------------------------
-- B. is_forge_admin() — SECURITY DEFINER + fixed search_path
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.is_forge_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.forge_admin_users
    WHERE user_id = auth.uid()
  );
$$;

COMMENT ON FUNCTION public.is_forge_admin() IS
  'True when auth.uid() is listed in forge_admin_users. Used by RLS and app gates.';

REVOKE ALL ON FUNCTION public.is_forge_admin() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_forge_admin() FROM anon;
GRANT EXECUTE ON FUNCTION public.is_forge_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_forge_admin() TO service_role;

-- ---------------------------------------------------------------------------
-- C. special_thanks_entries
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.special_thanks_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  display_name text NOT NULL
    CHECK (char_length(btrim(display_name)) >= 1 AND char_length(display_name) <= 120),
  handle text NULL
    CHECK (handle IS NULL OR (char_length(btrim(handle)) >= 1 AND char_length(handle) <= 64)),
  role_label text NULL
    CHECK (role_label IS NULL OR char_length(role_label) <= 120),
  url text NULL
    CHECK (
      url IS NULL
      OR url ~* '^https?://[^\s]+$'
    ),
  note text NULL
    CHECK (note IS NULL OR char_length(note) <= 500),
  sort_order integer NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT false,
  created_by uuid NULL REFERENCES auth.users (id) ON DELETE SET NULL,
  updated_by uuid NULL REFERENCES auth.users (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS special_thanks_entries_published_sort_idx
  ON public.special_thanks_entries (is_published, sort_order ASC, created_at ASC)
  WHERE is_published = true;

CREATE INDEX IF NOT EXISTS special_thanks_entries_admin_sort_idx
  ON public.special_thanks_entries (sort_order ASC, created_at ASC);

COMMENT ON TABLE public.special_thanks_entries IS
  'Platform Special Thanks credits (Forge operators). Public reads published rows only.';
COMMENT ON COLUMN public.special_thanks_entries.handle IS
  'Optional X (Twitter) handle for display; store without leading @ preferred.';
COMMENT ON COLUMN public.special_thanks_entries.url IS
  'Optional http/https link only.';

CREATE OR REPLACE FUNCTION public.set_special_thanks_entries_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS special_thanks_entries_set_updated_at
  ON public.special_thanks_entries;
CREATE TRIGGER special_thanks_entries_set_updated_at
  BEFORE UPDATE ON public.special_thanks_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.set_special_thanks_entries_updated_at();

ALTER TABLE public.special_thanks_entries ENABLE ROW LEVEL SECURITY;

-- Explicit table grants (Staging historically hit GRANT gaps).
REVOKE ALL ON TABLE public.special_thanks_entries FROM PUBLIC;
GRANT SELECT ON TABLE public.special_thanks_entries TO anon;
GRANT SELECT, INSERT, UPDATE ON TABLE public.special_thanks_entries TO authenticated;
GRANT ALL ON TABLE public.special_thanks_entries TO service_role;
GRANT ALL ON TABLE public.special_thanks_entries TO postgres;
-- Physical DELETE is out of initial UI scope; no DELETE grant to authenticated.

DROP POLICY IF EXISTS "Public read published special thanks"
  ON public.special_thanks_entries;
CREATE POLICY "Public read published special thanks"
  ON public.special_thanks_entries
  FOR SELECT
  TO anon, authenticated
  USING (is_published = true);

DROP POLICY IF EXISTS "Admins read all special thanks"
  ON public.special_thanks_entries;
CREATE POLICY "Admins read all special thanks"
  ON public.special_thanks_entries
  FOR SELECT
  TO authenticated
  USING (public.is_forge_admin());

DROP POLICY IF EXISTS "Admins insert special thanks"
  ON public.special_thanks_entries;
CREATE POLICY "Admins insert special thanks"
  ON public.special_thanks_entries
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_forge_admin());

DROP POLICY IF EXISTS "Admins update special thanks"
  ON public.special_thanks_entries;
CREATE POLICY "Admins update special thanks"
  ON public.special_thanks_entries
  FOR UPDATE
  TO authenticated
  USING (public.is_forge_admin())
  WITH CHECK (public.is_forge_admin());

COMMIT;
