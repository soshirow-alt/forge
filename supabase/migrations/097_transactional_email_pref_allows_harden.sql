-- 097: harden transactional_email_pref_allows against malformed notify_email JSON

BEGIN;

CREATE OR REPLACE FUNCTION public.transactional_email_pref_allows(
  p_user_id uuid,
  p_template_key text
)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_category text;
  v_prefs jsonb;
  v_master boolean;
  v_category_on boolean;
  v_raw text;
BEGIN
  v_category := public.transactional_email_category_for_template(p_template_key);
  IF v_category IS NULL THEN
    RETURN false;
  END IF;

  SELECT us.notify_email
    INTO v_prefs
  FROM public.user_settings us
  WHERE us.user_id = p_user_id;

  IF v_prefs IS NULL THEN
    RETURN true;
  END IF;

  BEGIN
    v_raw := v_prefs ->> 'master';
    IF v_raw IS NULL THEN
      v_master := true;
    ELSIF lower(v_raw) IN ('true', 't', '1') THEN
      v_master := true;
    ELSIF lower(v_raw) IN ('false', 'f', '0') THEN
      v_master := false;
    ELSE
      -- Malformed → fail closed for this recipient only.
      RETURN false;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RETURN false;
  END;

  IF NOT v_master THEN
    RETURN false;
  END IF;

  BEGIN
    v_raw := v_prefs ->> v_category;
    IF v_raw IS NULL THEN
      v_category_on := true;
    ELSIF lower(v_raw) IN ('true', 't', '1') THEN
      v_category_on := true;
    ELSIF lower(v_raw) IN ('false', 'f', '0') THEN
      v_category_on := false;
    ELSE
      RETURN false;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RETURN false;
  END;

  RETURN v_category_on;
END;
$$;

REVOKE ALL ON FUNCTION public.transactional_email_pref_allows(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.transactional_email_pref_allows(uuid, text)
  TO service_role;

COMMIT;
