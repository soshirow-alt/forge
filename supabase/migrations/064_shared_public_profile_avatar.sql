-- 064: Shared public profile fields on developer_profiles (player + developer)
-- Prerequisite: 001, 032
-- Purpose:
--   - Treat developer_profiles as the single public profile source of truth
--     (display name, bio/profile, avatar, X, website) for both player and studio UIs
--   - Add avatar_url (nullable); existing public_name/profile/x_account/website preserved
-- Apply: Staging first (owner or service). Production only with owner GO.

BEGIN;

ALTER TABLE public.developer_profiles
  ADD COLUMN IF NOT EXISTS avatar_url text NULL;

ALTER TABLE public.developer_profiles
  DROP CONSTRAINT IF EXISTS developer_profiles_avatar_url_len;
ALTER TABLE public.developer_profiles
  ADD CONSTRAINT developer_profiles_avatar_url_len
  CHECK (avatar_url IS NULL OR char_length(avatar_url) <= 20000);

COMMENT ON TABLE public.developer_profiles IS
  'Shared public profile per user (player + developer). public_name, profile (bio), avatar_url, x_account, website.';

COMMENT ON COLUMN public.developer_profiles.avatar_url IS
  'Public avatar URL or data-URI preset. Null = client default.';

COMMENT ON COLUMN public.developer_profiles.profile IS
  'Public bio / 自己紹介. Empty string means unset.';

COMMENT ON COLUMN public.developer_profiles.public_name IS
  'Public display name shared by player and developer surfaces.';

COMMIT;
