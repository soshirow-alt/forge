/**
 * Isolated SQL handoff gate for Forge collaboration migrations 086–091.
 *
 * Uses in-memory PGlite only. It never reads environment credentials and never
 * connects to Staging or Production.
 *
 * Coverage:
 *  - creates focused prerequisites matching the columns/constraints referenced
 *    by 086–091
 *  - executes every migration file in full, in order, then re-runs all six
 *  - asserts tables, RLS, policies, functions, and RPC grants
 *  - exercises registered community posting and the two-owner usage request /
 *    decision flow, including decision notification acknowledgement
 *  - verifies unauthorized decisions and failed transactions leave state intact
 *
 * PGlite is Postgres-compatible but is not a complete Supabase clone. Passing
 * this gate does not apply or authorize either remote database migration.
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { PGlite } from "@electric-sql/pglite";

const root = resolve(".");
const migrationNumbers = ["086", "087", "088", "089", "090", "091"];
const migrationPaths = migrationNumbers.map((number) => {
  const names = {
    "086": "086_developer_community_open_posting.sql",
    "087": "087_collab_consultations.sql",
    "088": "088_usage_relation_requests.sql",
    "089": "089_notification_seen_ack.sql",
    "090": "090_transactional_email_outbox.sql",
    "091": "091_collab_notification_email_hooks.sql",
  };
  return resolve(root, "supabase", "migrations", names[number]);
});

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function readSql(path) {
  assert(existsSync(path), `missing migration: ${path}`);
  return readFileSync(path, "utf8");
}

async function execSql(db, label, sql) {
  try {
    await db.exec(sql);
    console.log(`OK  ${label}`);
  } catch (error) {
    console.error(`FAIL ${label}`);
    throw error;
  }
}

async function expectFailure(db, label, sql, expected) {
  try {
    await db.exec(sql);
    throw new Error(`expected ${label} to fail`);
  } catch (error) {
    const message = String(error?.message || error);
    if (message.startsWith("expected ")) throw error;
    try {
      await db.exec("ROLLBACK;");
    } catch {
      // A failed statement outside an explicit transaction needs no rollback.
    }
    assert(expected.test(message), `${label}: unexpected error: ${message}`);
    console.log(`OK  ${label} (expected failure)`);
  }
}

async function one(db, sql) {
  const result = await db.query(sql);
  assert(result.rows.length === 1, `expected one row for query: ${sql}`);
  return result.rows[0];
}

const prerequisiteFixture = `
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    CREATE ROLE anon NOLOGIN;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    CREATE ROLE authenticated NOLOGIN;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
    CREATE ROLE service_role NOLOGIN;
  END IF;
END $$;

CREATE SCHEMA IF NOT EXISTS auth;

CREATE TABLE auth.users (
  id uuid PRIMARY KEY,
  email text,
  raw_user_meta_data jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE OR REPLACE FUNCTION auth.uid()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT nullif(current_setting('request.jwt.claim.sub', true), '')::uuid;
$$;

CREATE OR REPLACE FUNCTION auth.jwt()
RETURNS jsonb
LANGUAGE sql
STABLE
AS $$
  SELECT coalesce(
    nullif(current_setting('request.jwt.claims', true), '')::jsonb,
    '{}'::jsonb
  );
$$;

GRANT USAGE ON SCHEMA public, auth TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION auth.uid(), auth.jwt() TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.auth_is_registered_user()
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT auth.uid() IS NOT NULL
    AND coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) = false;
$$;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TABLE public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  title text NOT NULL,
  category text,
  thumbnail_url text,
  visibility text NOT NULL DEFAULT 'public'
    CHECK (visibility IN ('public', 'private')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.content_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  target_type text NOT NULL,
  target_id text NOT NULL,
  CONSTRAINT content_reports_target_type_check CHECK (
    target_type IN ('project', 'community_post', 'community_reply', 'developer')
  )
);

CREATE TABLE public.developer_communities (
  id text PRIMARY KEY,
  owner_id uuid NOT NULL UNIQUE REFERENCES auth.users (id) ON DELETE CASCADE,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  avatar_url text,
  handle text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.community_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id text NOT NULL
    REFERENCES public.developer_communities (id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected')),
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (community_id, user_id)
);

CREATE TABLE public.community_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id text NOT NULL
    REFERENCES public.developer_communities (id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  author_role text NOT NULL CHECK (author_role IN ('developer', 'player')),
  title text NOT NULL DEFAULT '',
  body text NOT NULL,
  audience_label text NOT NULL DEFAULT 'コミュニティ全員',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.community_replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.community_posts (id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.project_usage_relations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_project_id uuid NOT NULL
    REFERENCES public.projects (id) ON DELETE CASCADE,
  target_project_id uuid NOT NULL
    REFERENCES public.projects (id) ON DELETE CASCADE,
  relation_type text NOT NULL DEFAULT 'used' CHECK (relation_type = 'used'),
  status text NOT NULL DEFAULT 'published'
    CONSTRAINT project_usage_relations_status_check
    CHECK (status IN ('draft', 'published')),
  created_by uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT project_usage_relations_distinct
    CHECK (source_project_id <> target_project_id),
  CONSTRAINT project_usage_relations_unique_pair
    UNIQUE (source_project_id, target_project_id, relation_type)
);
CREATE INDEX project_usage_relations_source_idx
  ON public.project_usage_relations (source_project_id)
  WHERE status = 'published';
CREATE INDEX project_usage_relations_target_idx
  ON public.project_usage_relations (target_project_id)
  WHERE status = 'published';
ALTER TABLE public.project_usage_relations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read published usage relations on public projects"
  ON public.project_usage_relations FOR SELECT TO anon, authenticated
  USING (status = 'published');

CREATE TABLE public.user_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  type text NOT NULL
    CONSTRAINT user_notifications_type_check
    CHECK (type IN (
      'devlog', 'version_published', 'voice_received',
      'confirmation_request', 'project_watched',
      'followed_developer_new_project',
      'followed_developer_released_project', 'feedback_reply'
    )),
  project_id text NOT NULL,
  devlog_id uuid,
  published_version text,
  version_key text,
  confirmation_request_id uuid,
  message text NOT NULL,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own notifications"
  ON public.user_notifications FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "Users update own notifications"
  ON public.user_notifications FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
GRANT SELECT ON TABLE public.user_notifications TO authenticated;
GRANT UPDATE (read_at) ON TABLE public.user_notifications TO authenticated;
`;

const ownerA = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const ownerB = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const ownerC = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const projectA1 = "aaaaaaaa-0000-4000-8000-000000000001";
const projectA2 = "aaaaaaaa-0000-4000-8000-000000000002";
const projectB = "bbbbbbbb-0000-4000-8000-000000000001";
const projectBPrivate = "bbbbbbbb-0000-4000-8000-000000000002";
const projectC = "cccccccc-0000-4000-8000-000000000001";

const identityFixture = `
INSERT INTO auth.users (id, email) VALUES
  ('${ownerA}', 'owner-a@example.invalid'),
  ('${ownerB}', 'owner-b@example.invalid'),
  ('${ownerC}', 'owner-c@example.invalid');

INSERT INTO public.projects (id, owner_id, title, category, visibility) VALUES
  ('${projectA1}', '${ownerA}', 'Owner A Game', 'game', 'public'),
  ('${projectA2}', '${ownerA}', 'Owner A Tool', 'dev-tool', 'public'),
  ('${projectB}', '${ownerB}', 'Owner B Asset', 'asset', 'public'),
  ('${projectBPrivate}', '${ownerB}', 'Owner B Private', 'asset', 'private'),
  ('${projectC}', '${ownerC}', 'Owner C Game', 'game', 'public');
`;

const communityFixture = `
INSERT INTO public.developer_communities (
  id, owner_id, name, description, handle
) VALUES (
  'owner-a-community', '${ownerA}', 'Owner A Community', '', 'owner-a'
);
`;

async function setRegisteredRole(db, userId) {
  await db.exec(`
    SET request.jwt.claim.sub = '${userId}';
    SET request.jwt.claims = '{"sub":"${userId}","is_anonymous":false}';
    SET ROLE authenticated;
  `);
}

async function resetRole(db) {
  await db.exec(`
    RESET ROLE;
    RESET request.jwt.claim.sub;
    RESET request.jwt.claims;
  `);
}

async function main() {
  const db = new PGlite();
  const migrations = migrationPaths.map((path) => readSql(path));

  await execSql(db, "focused prerequisite fixture", prerequisiteFixture);
  await execSql(db, "identity and project fixture", identityFixture);
  await execSql(db, "086 first apply", migrations[0]);
  await execSql(db, "087 first apply", migrations[1]);
  await execSql(
    db,
    "legacy usage rows before 088",
    `INSERT INTO public.project_usage_relations (
       id, source_project_id, target_project_id, relation_type, status, created_by
     ) VALUES
       (
         '88888888-8888-4888-8888-000000000001',
         '${projectB}', '${projectA1}', 'used', 'published', '${ownerB}'
       ),
       (
         '88888888-8888-4888-8888-000000000002',
         '${projectC}', '${projectA2}', 'used', 'draft', '${ownerC}'
       );`,
  );
  const rollbackMigration = migrations[2].replace(
    /\nCOMMIT;\s*$/i,
    () =>
      "\nDO $$ BEGIN RAISE EXCEPTION 'intentional 088 rollback'; END $$;\nCOMMIT;",
  );
  await expectFailure(
    db,
    "088 intentional end-of-migration rollback",
    rollbackMigration,
    /intentional 088 rollback/i,
  );
  const rollbackState = await one(
    db,
    `SELECT
       (SELECT string_agg(status, ',' ORDER BY id)
        FROM public.project_usage_relations
        WHERE id IN (
          '88888888-8888-4888-8888-000000000001',
          '88888888-8888-4888-8888-000000000002'
        )) AS statuses,
       NOT EXISTS (
         SELECT 1 FROM information_schema.columns
         WHERE table_schema = 'public'
           AND table_name = 'project_usage_relations'
           AND column_name = 'requested_by'
       ) AS columns_rolled_back`,
  );
  assert(
    rollbackState.statuses === "published,draft" &&
      rollbackState.columns_rolled_back,
    "failed 088 migration left partial schema or data conversion",
  );
  for (let i = 2; i < migrations.length; i += 1) {
    await execSql(db, `${migrationNumbers[i]} first apply`, migrations[i]);
  }
  const legacyConverted = await one(
    db,
    `SELECT
       count(*) FILTER (WHERE id = '88888888-8888-4888-8888-000000000001'
         AND status = 'accepted')::int AS published_to_accepted,
       count(*) FILTER (WHERE id = '88888888-8888-4888-8888-000000000002'
         AND status = 'pending')::int AS draft_to_pending
     FROM public.project_usage_relations`,
  );
  assert(
    Number(legacyConverted.published_to_accepted) === 1 &&
      Number(legacyConverted.draft_to_pending) === 1,
    "088 did not convert legacy published/draft statuses",
  );
  for (let i = 0; i < migrations.length; i += 1) {
    await execSql(db, `${migrationNumbers[i]} safe re-run`, migrations[i]);
  }

  const objects = await one(
    db,
    `SELECT
      to_regclass('public.collab_consultations') IS NOT NULL AS consultations,
      to_regclass('public.collab_consultation_messages') IS NOT NULL AS messages,
      to_regclass('public.user_blocks') IS NOT NULL AS blocks,
      to_regclass('public.transactional_email_outbox') IS NOT NULL AS outbox,
      to_regprocedure('public.create_collab_consultation(uuid,text,text,uuid,uuid)')
        IS NOT NULL AS create_consultation,
      to_regprocedure('public.decide_project_usage_relation(uuid,text)')
        IS NOT NULL AS decide_usage,
      to_regprocedure('public.acknowledge_notifications_by_coalesce_key(text)')
        IS NOT NULL AS acknowledge`,
  );
  assert(Object.values(objects).every(Boolean), "required tables/functions are missing");

  const rls = await db.query(`
    SELECT relname, relrowsecurity
    FROM pg_class
    WHERE relname IN (
      'developer_communities', 'community_posts', 'community_replies',
      'collab_consultations', 'collab_consultation_messages',
      'collab_consultation_reads', 'user_blocks',
      'project_usage_relations', 'user_notifications',
      'transactional_email_outbox'
    )
  `);
  assert(rls.rows.length === 10, `expected 10 RLS tables, got ${rls.rows.length}`);
  assert(rls.rows.every((row) => row.relrowsecurity), "RLS is not enabled on every table");

  const policies = await one(
    db,
    `SELECT count(*)::int AS count
     FROM pg_policies
     WHERE schemaname = 'public'
       AND tablename IN (
         'community_posts', 'community_replies', 'collab_consultations',
         'collab_consultation_messages', 'project_usage_relations'
       )`,
  );
  assert(Number(policies.count) >= 8, `expected at least 8 relevant policies, got ${policies.count}`);

  const grants = await one(
    db,
    `SELECT
      has_function_privilege(
        'authenticated',
        'public.create_collab_consultation(uuid,text,text,uuid,uuid)',
        'EXECUTE'
      ) AS consultation,
      has_function_privilege(
        'authenticated',
        'public.decide_project_usage_relation(uuid,text)',
        'EXECUTE'
      ) AS decide_usage,
      has_function_privilege(
        'authenticated',
        'public.acknowledge_notifications_by_coalesce_key(text)',
        'EXECUTE'
      ) AS acknowledge,
      has_function_privilege(
        'service_role',
        'public.enqueue_transactional_email(uuid,text,text,jsonb,timestamptz)',
        'EXECUTE'
      ) AS enqueue`,
  );
  assert(Object.values(grants).every(Boolean), "required RPC grant is missing");

  await execSql(db, "community scenario seed", communityFixture);

  await setRegisteredRole(db, ownerA);
  const ownerPost = await one(
    db,
    `INSERT INTO public.community_posts (
       community_id, author_id, author_role, title, body, audience_label
     ) VALUES (
       'owner-a-community', '${ownerA}', 'player', 'Owner post', 'Hello', '公開'
     )
     RETURNING id::text, author_role`,
  );
  assert(ownerPost.author_role === "developer", "community author-role trigger did not derive owner");

  const consultation = await one(
    db,
    `SELECT public.create_collab_consultation(
       '${ownerB}', 'collaborate', 'First consultation message',
       '${projectA1}', '${projectB}'
     )::text AS id`,
  );
  await resetRole(db);
  const consultationCreated = await one(
    db,
    `SELECT
       (SELECT count(*)::int FROM public.collab_consultation_messages
        WHERE consultation_id = '${consultation.id}') AS messages,
       (SELECT count(*)::int FROM public.user_notifications
        WHERE consultation_id = '${consultation.id}'
          AND user_id = '${ownerB}'
          AND type = 'consultation_new') AS notifications,
       (SELECT count(*)::int FROM public.transactional_email_outbox
        WHERE user_id = '${ownerB}'
          AND template_key = 'collab_consultation_new') AS outbox`,
  );
  assert(
    Number(consultationCreated.messages) === 1 &&
      Number(consultationCreated.notifications) === 1 &&
      Number(consultationCreated.outbox) === 1,
    "consultation create did not persist message, notification, and outbox row",
  );

  await setRegisteredRole(db, ownerB);
  const sent = await one(
    db,
    `SELECT public.send_collab_consultation_message(
       '${consultation.id}', 'Counterpart reply'
     )::text AS id`,
  );
  assert(Boolean(sent.id), "counterpart message RPC returned no id");
  await resetRole(db);

  await setRegisteredRole(db, ownerC);
  const thirdPartyRows = await one(
    db,
    `SELECT
       (SELECT count(*)::int FROM public.collab_consultations
        WHERE id = '${consultation.id}') AS consultations,
       (SELECT count(*)::int FROM public.collab_consultation_messages
        WHERE consultation_id = '${consultation.id}') AS messages`,
  );
  assert(
    Number(thirdPartyRows.consultations) === 0 &&
      Number(thirdPartyRows.messages) === 0,
    "third user could read a private consultation or its messages",
  );
  await resetRole(db);

  await setRegisteredRole(db, ownerA);
  await expectFailure(
    db,
    "initiator project ownership validation",
    `SELECT public.create_collab_consultation(
       '${ownerB}', 'collaborate', 'wrong owner',
       '${projectB}', '${projectB}'
     );`,
    /Initiator project must belong to the initiator/i,
  );
  await expectFailure(
    db,
    "private counterpart project validation",
    `SELECT public.create_collab_consultation(
       '${ownerB}', 'collaborate', 'private counterpart',
       '${projectA1}', '${projectBPrivate}'
     );`,
    /Counterpart project must be public and belong to the counterpart/i,
  );
  await db.exec(
    `INSERT INTO public.user_blocks (blocker_id, blocked_id)
     VALUES ('${ownerA}', '${ownerB}');`,
  );
  await expectFailure(
    db,
    "blocker cannot create consultation",
    `SELECT public.create_collab_consultation(
       '${ownerB}', 'other', 'blocked create', NULL, NULL
     );`,
    /has blocked the other/i,
  );
  await expectFailure(
    db,
    "blocker cannot send consultation message",
    `SELECT public.send_collab_consultation_message(
       '${consultation.id}', 'blocked send'
     );`,
    /has blocked the other/i,
  );
  await resetRole(db);
  await setRegisteredRole(db, ownerB);
  await expectFailure(
    db,
    "blocked user cannot create reverse consultation",
    `SELECT public.create_collab_consultation(
       '${ownerA}', 'other', 'reverse blocked create', NULL, NULL
     );`,
    /has blocked the other/i,
  );
  await expectFailure(
    db,
    "blocked user cannot send reverse consultation message",
    `SELECT public.send_collab_consultation_message(
       '${consultation.id}', 'reverse blocked send'
     );`,
    /has blocked the other/i,
  );
  await resetRole(db);
  await setRegisteredRole(db, ownerA);
  await db.exec(
    `DELETE FROM public.user_blocks
     WHERE blocker_id = '${ownerA}' AND blocked_id = '${ownerB}';`,
  );
  await resetRole(db);

  const outboxBeforeFailure = await one(
    db,
    "SELECT count(*)::int AS count FROM public.transactional_email_outbox",
  );
  await execSql(
    db,
    "temporarily break email enqueue",
    `CREATE OR REPLACE FUNCTION public.enqueue_transactional_email(
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
     BEGIN
       RAISE EXCEPTION 'intentional enqueue failure';
     END;
     $$;`,
  );
  await setRegisteredRole(db, ownerA);
  const noEmailConsultation = await one(
    db,
    `SELECT public.create_collab_consultation(
       '${ownerC}', 'other', 'in-app survives enqueue failure',
       '${projectA2}', '${projectC}'
     )::text AS id`,
  );
  await resetRole(db);
  const failureIsolation = await one(
    db,
    `SELECT
       (SELECT count(*)::int FROM public.user_notifications
        WHERE consultation_id = '${noEmailConsultation.id}'
          AND user_id = '${ownerC}'
          AND type = 'consultation_new') AS notifications,
       (SELECT count(*)::int FROM public.transactional_email_outbox) AS outbox_count`,
  );
  assert(
    Number(failureIsolation.notifications) === 1 &&
      Number(failureIsolation.outbox_count) === Number(outboxBeforeFailure.count),
    "email enqueue failure rolled back or duplicated authoritative in-app state",
  );
  await execSql(db, "restore email enqueue function", migrations[4]);

  await setRegisteredRole(db, ownerA);
  const relationOne = await one(
    db,
    `SELECT public.request_project_usage_relation(
       '${projectA1}', '${projectB}', 'fixture request'
     )::text AS id`,
  );
  await resetRole(db);

  const requestNotification = await one(
    db,
    `SELECT user_id::text, acknowledged_at, seen_at, read_at
     FROM public.user_notifications
     WHERE coalesce_key = 'usage-relation:${relationOne.id}'
       AND type = 'usage_relation_request'`,
  );
  assert(requestNotification.user_id === ownerB, "usage request notified the wrong owner");
  assert(requestNotification.acknowledged_at === null, "request started acknowledged");

  await setRegisteredRole(db, ownerB);
  await db.query(
    `SELECT public.decide_project_usage_relation('${relationOne.id}', 'accepted')`,
  );
  await resetRole(db);

  const decided = await one(
    db,
    `SELECT
       r.status,
       req.acknowledged_at IS NOT NULL AS request_ack,
       req.seen_at IS NOT NULL AS request_seen,
       req.read_at IS NOT NULL AS request_read,
       result.user_id::text AS result_recipient
     FROM public.project_usage_relations r
     INNER JOIN public.user_notifications req
       ON req.usage_relation_id = r.id
      AND req.type = 'usage_relation_request'
     INNER JOIN public.user_notifications result
       ON result.usage_relation_id = r.id
      AND result.type = 'usage_relation_accepted'
     WHERE r.id = '${relationOne.id}'`,
  );
  assert(decided.status === "accepted", "counterpart decision was not saved");
  assert(
    decided.request_ack && decided.request_seen && decided.request_read,
    "decision-maker request notification was not fully acknowledged",
  );
  assert(decided.result_recipient === ownerA, "decision result notified the wrong owner");

  await setRegisteredRole(db, ownerA);
  const relationTwo = await one(
    db,
    `SELECT public.request_project_usage_relation(
       '${projectA2}', '${projectB}', 'unauthorized decision fixture'
     )::text AS id`,
  );
  await expectFailure(
    db,
    "requester cannot decide own usage request",
    `SELECT public.decide_project_usage_relation('${relationTwo.id}', 'rejected');`,
    /Only the counterpart project owner may decide/i,
  );
  await resetRole(db);
  const pendingAfterDenied = await one(
    db,
    `SELECT status FROM public.project_usage_relations WHERE id = '${relationTwo.id}'`,
  );
  assert(pendingAfterDenied.status === "pending", "denied decision changed relation state");

  const consultationCountBefore = await one(
    db,
    "SELECT count(*)::int AS count FROM public.collab_consultations",
  );
  await expectFailure(
    db,
    "failed consultation transaction rolls back",
    `BEGIN;
     INSERT INTO public.collab_consultations (
       initiator_id, counterpart_id, purpose
     ) VALUES ('${ownerA}', '${ownerA}', 'collaborate');
     COMMIT;`,
    /collab_consultations_distinct_participants|check constraint/i,
  );
  const consultationCountAfter = await one(
    db,
    "SELECT count(*)::int AS count FROM public.collab_consultations",
  );
  assert(
    consultationCountAfter.count === consultationCountBefore.count,
    "failed transaction left a consultation row",
  );

  // --- Outbox final-attempt: claim stays sendable; dead only after failed delivery ---
  const outboxFinalOk = await one(
    db,
    `INSERT INTO public.transactional_email_outbox (
       user_id, to_email, template_key, payload, status, attempts
     ) VALUES (
       '${ownerA}', 'owner-a@example.invalid', 'collab_consultation_new',
       '{}'::jsonb, 'pending', 4
     ) RETURNING id::text AS id`,
  );
  await db.exec(`
    UPDATE public.transactional_email_outbox
    SET attempts = 5, available_at = now() + interval '1 minute'
    WHERE id = '${outboxFinalOk.id}'
      AND attempts = 4
      AND status IN ('pending', 'failed')
  `);
  const afterFinalClaim = await one(
    db,
    `SELECT status, attempts
     FROM public.transactional_email_outbox
     WHERE id = '${outboxFinalOk.id}'`,
  );
  assert(
    afterFinalClaim.status === "pending" && Number(afterFinalClaim.attempts) === 5,
    "final attempt claim must stay pending (not dead before send)",
  );
  await db.exec(`
    UPDATE public.transactional_email_outbox
    SET status = 'sent', sent_at = now(), last_error = NULL
    WHERE id = '${outboxFinalOk.id}'
      AND attempts = 5
      AND status IN ('pending', 'failed')
  `);
  const afterFinalSent = await one(
    db,
    `SELECT status FROM public.transactional_email_outbox WHERE id = '${outboxFinalOk.id}'`,
  );
  assert(afterFinalSent.status === "sent", "final allowed attempt success must become sent");

  const outboxFinalFail = await one(
    db,
    `INSERT INTO public.transactional_email_outbox (
       user_id, to_email, template_key, payload, status, attempts
     ) VALUES (
       '${ownerA}', 'owner-a@example.invalid', 'collab_consultation_new',
       '{}'::jsonb, 'pending', 4
     ) RETURNING id::text AS id`,
  );
  await db.exec(`
    UPDATE public.transactional_email_outbox
    SET attempts = 5, available_at = now() + interval '1 minute'
    WHERE id = '${outboxFinalFail.id}' AND attempts = 4 AND status IN ('pending', 'failed')
  `);
  await db.exec(`
    UPDATE public.transactional_email_outbox
    SET status = 'failed', last_error = 'provider boom'
    WHERE id = '${outboxFinalFail.id}' AND attempts = 5 AND status IN ('pending', 'failed')
  `);
  const afterFinalDead = await one(
    db,
    `SELECT status, attempts
     FROM public.transactional_email_outbox
     WHERE id = '${outboxFinalFail.id}'`,
  );
  assert(
    afterFinalDead.status === "dead" && Number(afterFinalDead.attempts) === 5,
    "final allowed attempt failure must become dead",
  );

  const outboxStale = await one(
    db,
    `INSERT INTO public.transactional_email_outbox (
       user_id, to_email, template_key, payload, status, attempts
     ) VALUES (
       '${ownerA}', 'owner-a@example.invalid', 'collab_consultation_new',
       '{}'::jsonb, 'pending', 0
     ) RETURNING id::text AS id`,
  );
  await db.exec(`
    UPDATE public.transactional_email_outbox
    SET attempts = 1, available_at = now() + interval '1 minute'
    WHERE id = '${outboxStale.id}' AND attempts = 0 AND status IN ('pending', 'failed')
  `);
  await db.exec(`
    UPDATE public.transactional_email_outbox
    SET attempts = 2, available_at = now() + interval '1 minute'
    WHERE id = '${outboxStale.id}' AND attempts = 1 AND status IN ('pending', 'failed')
  `);
  await db.exec(`
    UPDATE public.transactional_email_outbox
    SET status = 'sent', sent_at = now(), last_error = NULL
    WHERE id = '${outboxStale.id}' AND attempts = 2 AND status IN ('pending', 'failed')
  `);
  const staleMark = await db.query(`
    UPDATE public.transactional_email_outbox
    SET status = 'sent', sent_at = now(), last_error = NULL
    WHERE id = '${outboxStale.id}' AND attempts = 1 AND status IN ('pending', 'failed')
    RETURNING id
  `);
  assert(staleMark.rows.length === 0, "stale markSent must affect 0 rows");
  const staleStatus = await one(
    db,
    `SELECT status, attempts FROM public.transactional_email_outbox WHERE id = '${outboxStale.id}'`,
  );
  assert(
    staleStatus.status === "sent" && Number(staleStatus.attempts) === 2,
    "stale worker must not alter newer sent row",
  );

  const outboxClaimRace = await one(
    db,
    `INSERT INTO public.transactional_email_outbox (
       user_id, to_email, template_key, payload, status, attempts
     ) VALUES (
       '${ownerA}', 'owner-a@example.invalid', 'collab_consultation_new',
       '{}'::jsonb, 'pending', 0
     ) RETURNING id::text AS id`,
  );
  const claimA = await db.query(`
    UPDATE public.transactional_email_outbox
    SET attempts = 1, available_at = now() + interval '1 minute'
    WHERE id = '${outboxClaimRace.id}' AND attempts = 0 AND status IN ('pending', 'failed')
    RETURNING id
  `);
  const claimB = await db.query(`
    UPDATE public.transactional_email_outbox
    SET attempts = 1, available_at = now() + interval '1 minute'
    WHERE id = '${outboxClaimRace.id}' AND attempts = 0 AND status IN ('pending', 'failed')
    RETURNING id
  `);
  assert(claimA.rows.length === 1, "first concurrent claim must win");
  assert(claimB.rows.length === 0, "duplicate worker claim must miss");

  console.log(
    JSON.stringify(
      {
        ok: true,
        environment: "in-memory PGlite (no remote connection)",
        migrations: "086–091 full apply + full safe re-run",
        assertions: {
          requiredObjects: true,
          rlsTables: 10,
          rpcGrants: true,
          communityAuthorRole: true,
          legacyUsageStatusesConverted: true,
          migrationRollbackClean: true,
          consultationRpcRoundTrip: true,
          consultationThirdPartyRlsDenied: true,
          bidirectionalBlockEnforced: true,
          relatedProjectOwnershipEnforced: true,
          consultationNotificationCreated: true,
          inAppSurvivesEmailEnqueueFailure: true,
          usageCounterpartDecision: true,
          usageRequestAcknowledged: true,
          unauthorizedDecisionBlocked: true,
          failedTransactionRolledBack: true,
          outboxFinalAttemptSuccessSent: true,
          outboxFinalAttemptFailureDead: true,
          outboxStaleMarkSentNoop: true,
          outboxConcurrentClaimSingleWinner: true,
        },
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(
    JSON.stringify({ ok: false, error: String(error?.message || error) }, null, 2),
  );
  process.exit(1);
});
