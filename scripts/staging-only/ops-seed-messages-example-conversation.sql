-- Staging-only messaging example conversation (Preview QA).
-- Tag: forge-msg-fixture-v1
-- Uses existing Player IA seed users (no auth.users insert).
-- Production: DO NOT APPLY.

BEGIN;

SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '60s';

DO $$
DECLARE
  v_user_a uuid := 'dddddddd-dddd-4ddd-8ddd-000000000001';
  v_user_b uuid := 'dddddddd-dddd-4ddd-8ddd-000000000002';
  v_project_id uuid := 'eeeeeeee-eeee-4eee-8eee-000000000009';
  v_consultation_id uuid := 'cccccccc-cccc-4ccc-8ccc-0000000000c1';
  v_msg1 uuid := 'dddddddd-dddd-4ddd-8ddd-00000000a001';
  v_msg2 uuid := 'dddddddd-dddd-4ddd-8ddd-00000000a002';
  v_msg3 uuid := 'dddddddd-dddd-4ddd-8ddd-00000000a003';
  v_owner uuid;
BEGIN
  SELECT owner_id INTO v_owner FROM public.projects WHERE id = v_project_id;
  IF v_owner IS NULL OR v_owner <> v_user_b THEN
    RAISE EXCEPTION 'Expected audio project % owned by %', v_project_id, v_user_b;
  END IF;

  DELETE FROM public.collab_consultation_reads WHERE consultation_id = v_consultation_id;
  DELETE FROM public.collab_consultation_messages WHERE consultation_id = v_consultation_id;
  DELETE FROM public.collab_consultations WHERE id = v_consultation_id;

  UPDATE public.developer_profiles
  SET public_name = 'Lumen Audio',
      activity_tags = ARRAY['audio_creator'],
      profile = CASE
        WHEN btrim(coalesce(profile, '')) = ''
        THEN 'BGM / SE を制作する音楽クリエイター。利用条件の相談歓迎。'
        ELSE profile
      END
  WHERE user_id = v_user_b;

  UPDATE public.developer_profiles
  SET activity_tags = ARRAY['game_creator']
  WHERE user_id = v_user_a
    AND (activity_tags IS NULL OR cardinality(activity_tags) = 0);

  INSERT INTO public.collab_consultations (
    id, initiator_id, counterpart_id, purpose,
    counterpart_project_id, status, created_at, updated_at, last_message_at
  )
  VALUES (
    v_consultation_id,
    v_user_a,
    v_user_b,
    'use_their_work',
    v_project_id,
    'open',
    now() - interval '2 hours',
    now() - interval '30 minutes',
    now() - interval '30 minutes'
  );

  INSERT INTO public.collab_consultation_messages (
    id, consultation_id, sender_id, body, created_at
  ) VALUES
    (
      v_msg1, v_consultation_id, v_user_a,
      'こちらのBGMをゲーム内で使用したいのですが、利用条件について確認できますか？',
      now() - interval '2 hours'
    ),
    (
      v_msg2, v_consultation_id, v_user_b,
      'ありがとうございます。利用予定の用途を教えていただければ確認します。',
      now() - interval '90 minutes'
    ),
    (
      v_msg3, v_consultation_id, v_user_a,
      '個人制作のPCゲームで使用予定です。',
      now() - interval '30 minutes'
    );

  INSERT INTO public.collab_consultation_reads (
    consultation_id, user_id, last_read_at, last_read_message_id
  ) VALUES (
    v_consultation_id, v_user_a, now() - interval '30 minutes', v_msg3
  )
  ON CONFLICT (consultation_id, user_id) DO UPDATE
    SET last_read_at = EXCLUDED.last_read_at,
        last_read_message_id = EXCLUDED.last_read_message_id;

  DELETE FROM public.collab_consultation_reads
  WHERE consultation_id = v_consultation_id AND user_id = v_user_b;

  RAISE NOTICE 'forge-msg-fixture-v1 ok consultation=%', v_consultation_id;
END $$;

COMMIT;
