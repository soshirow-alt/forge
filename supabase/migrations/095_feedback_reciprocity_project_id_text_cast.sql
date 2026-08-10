-- 095: fix reciprocity triggers for real project_id text columns.
-- 093 defined consider_feedback_reciprocity(uuid, uuid) and trigger helpers that
-- passed NEW.project_id directly. On Staging/Production, project_feedback and
-- project_voice_responses store project_id as text, so the call resolves to
-- (uuid, text) and fails with 42883. The trigger EXCEPTION handlers swallowed
-- that error, so reciprocity never fired on real INSERT paths.
-- Do not edit 093. Cast via text→uuid so both text and uuid column shapes work.

BEGIN;

CREATE OR REPLACE FUNCTION public.trg_consider_feedback_reciprocity_from_feedback()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_project_id uuid;
BEGIN
  BEGIN
    v_project_id := nullif(btrim(NEW.project_id::text), '')::uuid;
  EXCEPTION
    WHEN invalid_text_representation THEN
      RETURN NEW;
  END;
  IF NEW.user_id IS NULL OR v_project_id IS NULL THEN
    RETURN NEW;
  END IF;

  PERFORM public.consider_feedback_reciprocity(NEW.user_id, v_project_id);
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_consider_feedback_reciprocity_from_voice()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_project_id uuid;
BEGIN
  BEGIN
    v_project_id := nullif(btrim(NEW.project_id::text), '')::uuid;
  EXCEPTION
    WHEN invalid_text_representation THEN
      RETURN NEW;
  END;
  IF NEW.user_id IS NULL OR v_project_id IS NULL THEN
    RETURN NEW;
  END IF;

  PERFORM public.consider_feedback_reciprocity(NEW.user_id, v_project_id);
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.trg_consider_feedback_reciprocity_from_feedback()
  FROM PUBLIC;
REVOKE ALL ON FUNCTION public.trg_consider_feedback_reciprocity_from_voice()
  FROM PUBLIC;

COMMIT;
