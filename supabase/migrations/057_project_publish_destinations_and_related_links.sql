-- 057: structured publish destinations + related links (JSONB)
-- Additive, nullable. Legacy URL columns remain source of fallback / dual-write.

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS publish_destinations jsonb,
  ADD COLUMN IF NOT EXISTS related_links jsonb;

COMMENT ON COLUMN public.projects.publish_destinations IS
  'Array of {id, kind, url, usageMethod, isPrimary}. Play/download/store destinations. Null = derive from legacy URL columns.';

COMMENT ON COLUMN public.projects.related_links IS
  'Array of {id, kind, url, label}. note/blog, PV, official site, other. Null = derive from legacy URL columns.';
