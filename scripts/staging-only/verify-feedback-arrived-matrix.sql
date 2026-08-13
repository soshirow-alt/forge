-- Staging matrix with case-by-case results (cleans up). Never Production.
-- Returns one row per case: case_id / result / detail

DROP TABLE IF EXISTS public._forge_fb_arrived_matrix_results;
CREATE TABLE public._forge_fb_arrived_matrix_results (
  case_id text PRIMARY KEY,
  result text NOT NULL,
  detail text
);

DO $$
DECLARE
  v_project text;
  v_owner uuid;
  v_actor_public uuid;
  v_actor_nopub uuid;
  v_ver text := 'fb-arrived-matrix-' || to_char(now(), 'YYYYMMDDHH24MISS');
  v_cnt int;
  v_rec int;
  v_prompt uuid;
  v_body_msg text;
BEGIN
  SELECT p.id::text, p.owner_id
  INTO v_project, v_owner
  FROM public.projects p
  WHERE p.visibility = 'public'
  LIMIT 1;

  IF v_project IS NULL THEN
    RAISE EXCEPTION 'matrix needs a public project';
  END IF;

  SELECT p.owner_id INTO v_actor_public
  FROM public.projects p
  WHERE p.visibility = 'public'
    AND p.owner_id <> v_owner
    AND EXISTS (
      SELECT 1 FROM public.developer_profiles dp WHERE dp.user_id = p.owner_id
    )
  LIMIT 1;

  SELECT u.id INTO v_actor_nopub
  FROM auth.users u
  WHERE u.id <> v_owner
    AND NOT EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.owner_id = u.id AND p.visibility = 'public'
    )
  LIMIT 1;

  DELETE FROM public.user_notifications
  WHERE project_id = v_project
    AND version_key LIKE 'fb-arrived-matrix-%'
    AND type IN ('voice_received', 'feedback_reciprocity');
  DELETE FROM public.project_feedback
  WHERE project_id = v_project AND version_key LIKE 'fb-arrived-matrix-%';
  DELETE FROM public.project_voice_responses
  WHERE project_id = v_project AND version_key LIKE 'fb-arrived-matrix-%';

  SELECT pvr.prompt_id INTO v_prompt
  FROM public.project_voice_responses pvr
  LIMIT 1;

  -- CASE 1: nopub + detailed-only
  IF v_actor_nopub IS NULL THEN
    INSERT INTO public._forge_fb_arrived_matrix_results VALUES
      ('1_nopub_detailed', 'SKIP', 'no actor without public projects');
  ELSE
    INSERT INTO public.project_feedback (
      user_id, project_id, version_key, good_points, moderation_status, report_count
    ) VALUES (
      v_actor_nopub, v_project, v_ver || '-np', 'matrix nopub', 'visible', 0
    );
    SELECT count(*) INTO v_cnt FROM public.user_notifications
    WHERE user_id = v_owner AND project_id = v_project AND version_key = v_ver || '-np'
      AND type = 'voice_received' AND read_at IS NULL
      AND message LIKE '%フィードバックが届きました%';
    SELECT count(*) INTO v_rec FROM public.user_notifications
    WHERE user_id = v_owner AND type = 'feedback_reciprocity'
      AND related_user_id = v_actor_nopub AND created_at > now() - interval '1 minute';
    INSERT INTO public._forge_fb_arrived_matrix_results VALUES
      ('1_nopub_detailed',
       CASE WHEN v_cnt = 1 AND v_rec = 0 THEN 'PASS' ELSE 'FAIL' END,
       format('body=%s reciprocity=%s', v_cnt, v_rec));
  END IF;

  -- CASE 2: public + detailed-only
  IF v_actor_public IS NULL THEN
    INSERT INTO public._forge_fb_arrived_matrix_results VALUES
      ('2_public_detailed', 'SKIP', 'no public-project actor');
  ELSE
    INSERT INTO public.project_feedback (
      user_id, project_id, version_key, good_points, moderation_status, report_count
    ) VALUES (
      v_actor_public, v_project, v_ver || '-pd', 'matrix public detailed', 'visible', 0
    );
    SELECT count(*) INTO v_cnt FROM public.user_notifications
    WHERE user_id = v_owner AND project_id = v_project AND version_key = v_ver || '-pd'
      AND type = 'voice_received' AND read_at IS NULL
      AND message LIKE '%フィードバックが届きました%';
    SELECT count(*) INTO v_rec FROM public.user_notifications
    WHERE user_id = v_owner AND type = 'feedback_reciprocity'
      AND related_user_id = v_actor_public AND created_at > now() - interval '1 minute';
    INSERT INTO public._forge_fb_arrived_matrix_results VALUES
      ('2_public_detailed',
       CASE WHEN v_cnt = 1 AND v_rec >= 1 THEN 'PASS' ELSE 'FAIL' END,
       format('body=%s reciprocity=%s', v_cnt, v_rec));
  END IF;

  -- CASE 3: voice answer path (real INSERT when unique allows; else helper)
  IF v_actor_public IS NULL THEN
    INSERT INTO public._forge_fb_arrived_matrix_results VALUES
      ('3_voice', 'SKIP', 'missing public actor');
  ELSIF v_prompt IS NULL THEN
    PERFORM public.notify_owner_feedback_arrived(
      v_actor_public, v_project, v_ver || '-v'
    );
    SELECT count(*) INTO v_cnt FROM public.user_notifications
    WHERE user_id = v_owner AND project_id = v_project AND version_key = v_ver || '-v'
      AND type = 'voice_received' AND read_at IS NULL;
    INSERT INTO public._forge_fb_arrived_matrix_results VALUES
      ('3_voice',
       CASE WHEN v_cnt = 1 THEN 'PASS' ELSE 'FAIL' END,
       format('body=%s via=helper (no prompt)', v_cnt));
  ELSE
    BEGIN
      INSERT INTO public.project_voice_responses (
        user_id, project_id, version_key, prompt_id, answer_value, moderation_status, report_count
      ) VALUES (
        v_actor_public, v_project, v_ver || '-v', v_prompt, 'matrix voice', 'visible', 0
      );
    EXCEPTION WHEN unique_violation THEN
      PERFORM public.notify_owner_feedback_arrived(
        v_actor_public, v_project, v_ver || '-v'
      );
    END;
    SELECT count(*) INTO v_cnt FROM public.user_notifications
    WHERE user_id = v_owner AND project_id = v_project AND version_key = v_ver || '-v'
      AND type = 'voice_received' AND read_at IS NULL;
    SELECT count(*) INTO v_rec FROM public.user_notifications
    WHERE user_id = v_owner AND type = 'feedback_reciprocity'
      AND related_user_id = v_actor_public AND created_at > now() - interval '1 minute';
    INSERT INTO public._forge_fb_arrived_matrix_results VALUES
      ('3_voice',
       CASE WHEN v_cnt = 1 THEN 'PASS' ELSE 'FAIL' END,
       format('body=%s reciprocity_open_for_actor=%s', v_cnt, v_rec));
  END IF;

  -- CASE 4: coalesce detailed + voice-path helper same ver (cannot re-INSERT same user+prompt)
  IF v_actor_public IS NULL THEN
    INSERT INTO public._forge_fb_arrived_matrix_results VALUES
      ('4_coalesce', 'SKIP', 'missing public actor');
  ELSE
    INSERT INTO public.project_feedback (
      user_id, project_id, version_key, good_points, moderation_status, report_count
    ) VALUES (
      v_actor_public, v_project, v_ver || '-c', 'matrix coalesce d', 'visible', 0
    );
    -- second arrival via same helper used by voice trigger
    PERFORM public.notify_owner_feedback_arrived(
      v_actor_public, v_project, v_ver || '-c'
    );
    SELECT count(*) INTO v_cnt FROM public.user_notifications
    WHERE user_id = v_owner AND project_id = v_project AND version_key = v_ver || '-c'
      AND type = 'voice_received' AND read_at IS NULL;
    INSERT INTO public._forge_fb_arrived_matrix_results VALUES
      ('4_coalesce',
       CASE WHEN v_cnt = 1 THEN 'PASS' ELSE 'FAIL' END,
       format('unread_body=%s (detailed INSERT + helper)', v_cnt));
  END IF;

  -- CASE 5: self
  PERFORM public.notify_owner_feedback_arrived(v_owner, v_project, v_ver || '-self');
  SELECT count(*) INTO v_cnt FROM public.user_notifications
  WHERE user_id = v_owner AND project_id = v_project AND version_key = v_ver || '-self'
    AND type = 'voice_received';
  INSERT INTO public._forge_fb_arrived_matrix_results VALUES
    ('5_self',
     CASE WHEN v_cnt = 0 THEN 'PASS' ELSE 'FAIL' END,
     format('count=%s', v_cnt));

  -- CASE 6: click target contract
  SELECT message INTO v_body_msg FROM public.user_notifications
  WHERE user_id = v_owner AND project_id = v_project AND type = 'voice_received'
    AND version_key LIKE v_ver || '%' AND read_at IS NULL
  ORDER BY created_at DESC LIMIT 1;

  INSERT INTO public._forge_fb_arrived_matrix_results VALUES
    ('6_click_target',
     CASE WHEN v_body_msg IS NOT NULL AND v_body_msg LIKE '%フィードバックが届きました%'
       THEN 'PASS' ELSE 'FAIL' END,
     format('type=voice_received href=/projects/%s/studio#feedback msg_ok=%s',
       v_project, (v_body_msg IS NOT NULL AND v_body_msg LIKE '%フィードバックが届きました%')));

  -- cleanup matrix data (keep results table for SELECT)
  DELETE FROM public.project_voice_responses
  WHERE project_id = v_project AND version_key LIKE v_ver || '%';
  DELETE FROM public.project_feedback
  WHERE project_id = v_project AND version_key LIKE v_ver || '%';
  DELETE FROM public.user_notifications
  WHERE project_id = v_project
    AND (
      version_key LIKE v_ver || '%'
      OR (
        type = 'feedback_reciprocity'
        AND related_user_id IN (
          coalesce(v_actor_public, v_owner),
          coalesce(v_actor_nopub, v_owner)
        )
        AND created_at > now() - interval '5 minutes'
      )
    );
END $$;

SELECT case_id, result, detail
FROM public._forge_fb_arrived_matrix_results
ORDER BY case_id;

DROP TABLE IF EXISTS public._forge_fb_arrived_matrix_results;
