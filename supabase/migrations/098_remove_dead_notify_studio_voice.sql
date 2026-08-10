-- 098: remove dead notify_studio.voice preference key
-- Product: voice_received notifications remain always-on (031).
-- The "voice" key in notify_studio default/JSON was a remnant after 031
-- removed the preference gate from notify_owner_on_voice_response().
-- Do not reintroduce a Settings toggle; do not disable voice_received inserts.

BEGIN;

ALTER TABLE public.user_settings
  ALTER COLUMN notify_studio SET DEFAULT '{
    "witness": true,
    "version-play": true,
    "community": true
  }'::jsonb;

-- Strip remnant key from existing rows (idempotent).
UPDATE public.user_settings
SET notify_studio = coalesce(notify_studio, '{}'::jsonb) - 'voice'
WHERE notify_studio ? 'voice';

COMMENT ON COLUMN public.user_settings.notify_studio IS
  'Studio in-app notification prefs (witness, version-play, community). voice key removed; voice_received is always-on (031).';

COMMIT;
