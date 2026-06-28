-- 029: Account anonymization (soft delete — content retained, PII scrubbed)
-- Prerequisite: 001, 002, 003, 023

BEGIN;

CREATE TABLE IF NOT EXISTS public.account_anonymizations (
  user_id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  anonymized_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.account_anonymizations IS
  'Tracks accounts anonymized via anonymize_own_account_data(). Auth user is banned separately.';

ALTER TABLE public.account_anonymizations ENABLE ROW LEVEL SECURITY;

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

REVOKE ALL ON FUNCTION public.anonymize_own_account_data() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.anonymize_own_account_data() TO authenticated;

COMMIT;
