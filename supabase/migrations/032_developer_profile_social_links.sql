-- 032: Developer profile Discord / YouTube (developer-wide social links)
-- Prerequisite: 001 (developer_profiles), 029 (anonymize RPC)

BEGIN;

ALTER TABLE public.developer_profiles
  ADD COLUMN IF NOT EXISTS discord_url text,
  ADD COLUMN IF NOT EXISTS youtube_url text;

COMMENT ON COLUMN public.developer_profiles.discord_url IS
  'Developer-wide Discord invite or server URL (shown on /creators/ and prefills new projects).';

COMMENT ON COLUMN public.developer_profiles.youtube_url IS
  'Developer-wide YouTube channel or video URL (shown on /creators/ and prefills new projects).';

CREATE OR REPLACE FUNCTION public.anonymize_own_account_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_label text := '退会済みユーザー';
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.account_anonymizations WHERE user_id = v_uid
  ) THEN
    RAISE EXCEPTION 'already_anonymized';
  END IF;

  UPDATE public.developer_profiles
  SET
    public_name = v_label,
    profile = '',
    x_account = NULL,
    website = NULL,
    discord_url = NULL,
    youtube_url = NULL,
    updated_at = now()
  WHERE user_id = v_uid;

  UPDATE public.projects
  SET
    owner_name = v_label,
    creator = v_label,
    updated_at = now()
  WHERE owner_id = v_uid;

  DELETE FROM public.project_bookmarks WHERE user_id = v_uid;
  DELETE FROM public.project_watches WHERE user_id = v_uid;
  DELETE FROM public.project_supports WHERE user_id = v_uid;
  DELETE FROM public.project_plays WHERE user_id = v_uid;
  DELETE FROM public.project_play_sessions WHERE user_id = v_uid;
  DELETE FROM public.user_notifications WHERE user_id = v_uid;
  DELETE FROM public.developer_follows
  WHERE follower_id = v_uid OR developer_user_id = v_uid;

  INSERT INTO public.account_anonymizations (user_id)
  VALUES (v_uid);
END;
$$;

COMMIT;
