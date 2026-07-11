-- 050: projects.first_published_at — immutable first-public timestamp
-- Staging-first. Do NOT apply to production without owner GO.
--
-- IMPORTANT ORDER (do not reorder):
--   1) ADD COLUMN
--   2) backfill existing public rows from created_at (approximate)
--   3) verify backfill
--   4) CREATE immutable trigger function + trigger
--   5) CREATE INDEX
--
-- Backfill note: historical private→public transition times are NOT recoverable.
-- Existing public rows use created_at as an approximation only.

BEGIN;

-- 1) Column
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS first_published_at timestamptz NULL;

COMMENT ON COLUMN public.projects.first_published_at IS
  'Timestamp when the project first became public. Immutable after set. '
  'Backfill for pre-existing public rows uses created_at (approximate; '
  'historical private→public times cannot be restored).';

-- 2) Backfill BEFORE trigger (trigger would block/null this UPDATE)
UPDATE public.projects
SET first_published_at = created_at
WHERE visibility = 'public'
  AND first_published_at IS NULL;

-- 3) Verify backfill (abort transaction if incomplete)
DO $$
DECLARE
  v_public_null bigint;
  v_private_set bigint;
BEGIN
  SELECT COUNT(*) INTO v_public_null
  FROM public.projects
  WHERE visibility = 'public'
    AND first_published_at IS NULL;

  IF v_public_null <> 0 THEN
    RAISE EXCEPTION
      '050 backfill incomplete: % public row(s) still have first_published_at IS NULL',
      v_public_null;
  END IF;

  SELECT COUNT(*) INTO v_private_set
  FROM public.projects
  WHERE visibility IS DISTINCT FROM 'public'
    AND first_published_at IS NOT NULL;

  -- Private rows should remain NULL after this migration's backfill.
  -- (Future: if a project was public then private, first_published_at is kept by design —
  --  but at backfill time we only set public rows, so private should be NULL.)
  IF v_private_set <> 0 THEN
    RAISE NOTICE
      '050 note: % non-public row(s) already have first_published_at (kept; immutable history)',
      v_private_set;
  END IF;
END;
$$;

-- 4) Immutable trigger (after backfill only)
CREATE OR REPLACE FUNCTION public.set_project_first_published_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.visibility = 'public' THEN
      NEW.first_published_at := now();
    ELSE
      NEW.first_published_at := NULL;
    END IF;
    RETURN NEW;
  END IF;

  -- UPDATE: never allow client/app to change an existing value
  IF OLD.first_published_at IS NOT NULL THEN
    NEW.first_published_at := OLD.first_published_at;
    RETURN NEW;
  END IF;

  -- First transition to public only
  IF OLD.visibility IS DISTINCT FROM 'public'
     AND NEW.visibility = 'public'
     AND OLD.first_published_at IS NULL THEN
    NEW.first_published_at := now();
  ELSE
    -- Still never public (or already handled): keep NULL
    NEW.first_published_at := NULL;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS projects_set_first_published_at ON public.projects;

CREATE TRIGGER projects_set_first_published_at
  BEFORE INSERT OR UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.set_project_first_published_at();

-- 5) Index
CREATE INDEX IF NOT EXISTS projects_public_first_published_idx
  ON public.projects (first_published_at DESC, id)
  WHERE visibility = 'public'
    AND first_published_at IS NOT NULL;

COMMIT;

-- Rollback (manual, staging):
-- DROP TRIGGER IF EXISTS projects_set_first_published_at ON public.projects;
-- DROP FUNCTION IF EXISTS public.set_project_first_published_at();
-- DROP INDEX IF EXISTS public.projects_public_first_published_idx;
-- ALTER TABLE public.projects DROP COLUMN IF EXISTS first_published_at;
