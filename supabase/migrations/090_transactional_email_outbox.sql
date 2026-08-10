-- 090: transactional email outbox for trusted workers and SECURITY DEFINER RPCs.
-- Clients have no table or enqueue-function access.

BEGIN;

CREATE TABLE IF NOT EXISTS public.transactional_email_outbox (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  to_email text NOT NULL CHECK (char_length(trim(to_email)) > 0),
  template_key text NOT NULL CHECK (char_length(trim(template_key)) > 0),
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'sent', 'failed', 'dead')),
  attempts integer NOT NULL DEFAULT 0 CHECK (attempts BETWEEN 0 AND 5),
  last_error text NULL,
  available_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz NULL
);

CREATE INDEX IF NOT EXISTS transactional_email_outbox_status_available_idx
  ON public.transactional_email_outbox (status, available_at);

COMMENT ON TABLE public.transactional_email_outbox IS
  'Trusted transactional email queue. Five attempts maximum; exhausted rows become dead.';

-- Attempt counter may reach 5 while status stays pending/failed so the final
-- delivery can still run. Dead is only forced after a failed delivery at max
-- attempts (status='failed' with attempts>=5), never on claim alone.
CREATE OR REPLACE FUNCTION public.enforce_transactional_email_attempt_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.attempts > 5 THEN
    RAISE EXCEPTION 'transactional_email_outbox attempts cannot exceed 5';
  END IF;
  IF NEW.status = 'failed' AND NEW.attempts >= 5 THEN
    NEW.status := 'dead';
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.enforce_transactional_email_attempt_limit()
  FROM PUBLIC;

DROP TRIGGER IF EXISTS transactional_email_outbox_attempt_limit
  ON public.transactional_email_outbox;
CREATE TRIGGER transactional_email_outbox_attempt_limit
  BEFORE INSERT OR UPDATE OF attempts, status
  ON public.transactional_email_outbox
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_transactional_email_attempt_limit();

ALTER TABLE public.transactional_email_outbox ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.transactional_email_outbox FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE
  ON TABLE public.transactional_email_outbox TO service_role;

DROP FUNCTION IF EXISTS public.enqueue_transactional_email(uuid, text, text, jsonb, timestamptz);
CREATE FUNCTION public.enqueue_transactional_email(
  p_user_id uuid,
  p_to_email text,
  p_template_key text,
  p_payload jsonb DEFAULT '{}'::jsonb,
  p_available_at timestamptz DEFAULT now()
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
BEGIN
  IF p_user_id IS NULL
     OR NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = p_user_id) THEN
    RAISE EXCEPTION 'Valid recipient user is required';
  END IF;
  IF nullif(trim(p_to_email), '') IS NULL THEN
    RAISE EXCEPTION 'Recipient email is required';
  END IF;
  IF nullif(trim(p_template_key), '') IS NULL THEN
    RAISE EXCEPTION 'Template key is required';
  END IF;

  INSERT INTO public.transactional_email_outbox (
    user_id, to_email, template_key, payload, available_at
  )
  VALUES (
    p_user_id,
    trim(p_to_email),
    trim(p_template_key),
    coalesce(p_payload, '{}'::jsonb),
    coalesce(p_available_at, now())
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.enqueue_transactional_email(
  uuid, text, text, jsonb, timestamptz
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.enqueue_transactional_email(
  uuid, text, text, jsonb, timestamptz
) TO service_role;

COMMIT;
