-- STAGING ONLY — UNUSED (2026-07-16 owner decision)
-- Guest FB is out of public Player scope (guest_feedback_disabled + p_include_guest:false).
-- Do NOT paste/apply this seed for the current engagement work.
-- Kept only as historical draft; prefer delete in a later cleanup if unused.
--
-- --- original draft below (do not run) ---

BEGIN;

-- Table currently has no PostgREST GRANTs even for service_role.
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.project_guest_voice_responses
  TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.project_version_prompts
  TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.feedback_card_empathies
  TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.feedback_card_replies
  TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.user_notifications
  TO service_role;

DO $$
DECLARE
  v_owner uuid := '4bdc4a2f-2a39-4599-a14c-91303310ef56';
  v_project uuid := 'b0710000-0000-4000-8000-000000000071';
  v_prompt uuid := 'b0710000-0000-4000-8000-000000000072';
  v_guest uuid := 'b0710000-0000-4000-8000-000000000073';
  v_submitter uuid := 'b0710000-0000-4000-8000-000000000074';
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = v_owner) THEN
    RAISE EXCEPTION 'staging verify owner % missing', v_owner;
  END IF;

  INSERT INTO public.projects (
    id, owner_id, owner_name, title, creator, genre, description,
    phase, status, visibility, playable_version, age_rating, section, tags
  )
  VALUES (
    v_project,
    v_owner,
    'Staging Dev',
    '[tmp-071] guest_voice engagement verify',
    'staging-dev',
    'アクション',
    'Staging-only verify fixture. Safe to delete.',
    '試作版',
    '試作版',
    'public',
    '0.1',
    'general',
    'new',
    '{}'::text[]
  )
  ON CONFLICT (id) DO UPDATE
  SET
    title = EXCLUDED.title,
    visibility = 'public',
    playable_version = '0.1',
    age_rating = 'general';

  INSERT INTO public.project_version_prompts (
    id, project_id, version_key, prompt_text, response_kind, options, sort_order, source
  )
  VALUES (
    v_prompt,
    v_project::text,
    '0.1',
    '[tmp-071] もう一度遊びたい？',
    'yes_no',
    '[{"value":"yes","label":"はい"},{"value":"no","label":"いいえ"}]'::jsonb,
    0,
    'custom'
  )
  ON CONFLICT (id) DO UPDATE
  SET
    prompt_text = EXCLUDED.prompt_text,
    response_kind = EXCLUDED.response_kind,
    options = EXCLUDED.options;

  INSERT INTO public.project_guest_voice_responses (
    id,
    project_id,
    version_key,
    prompt_id,
    submitter_key,
    answer_value,
    answer_label,
    optional_comment,
    include_in_public_aggregate,
    moderation_status
  )
  VALUES (
    v_guest,
    v_project::text,
    '0.1',
    v_prompt,
    v_submitter,
    'yes',
    'はい',
    rpad('g', 1000, 'x'),
    true,
    'visible'
  )
  ON CONFLICT (id) DO UPDATE
  SET
    answer_value = EXCLUDED.answer_value,
    answer_label = EXCLUDED.answer_label,
    optional_comment = EXCLUDED.optional_comment,
    include_in_public_aggregate = true,
    moderation_status = 'visible';
END $$;

COMMIT;

-- Fixed IDs:
-- project:    b0710000-0000-4000-8000-000000000071
-- prompt:     b0710000-0000-4000-8000-000000000072
-- guest row:  b0710000-0000-4000-8000-000000000073
-- submitter:  b0710000-0000-4000-8000-000000000074
--
-- ========== CLEANUP ==========
-- BEGIN;
-- DELETE FROM public.feedback_card_replies
--  WHERE project_id = 'b0710000-0000-4000-8000-000000000071';
-- DELETE FROM public.feedback_card_empathies
--  WHERE project_id = 'b0710000-0000-4000-8000-000000000071';
-- DELETE FROM public.user_notifications
--  WHERE project_id = 'b0710000-0000-4000-8000-000000000071';
-- DELETE FROM public.project_guest_voice_responses
--  WHERE project_id = 'b0710000-0000-4000-8000-000000000071';
-- DELETE FROM public.project_version_prompts
--  WHERE project_id = 'b0710000-0000-4000-8000-000000000071';
-- DELETE FROM public.projects
--  WHERE id = 'b0710000-0000-4000-8000-000000000071';
-- COMMIT;
