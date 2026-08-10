/**
 * PGlite gate for reciprocity (093) + announcement window (094).
 * No remote DB. Focused fixtures only.
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { PGlite } from "@electric-sql/pglite";

const root = resolve(".");
function assert(condition, message) {
  if (!condition) throw new Error(message);
}
function readSql(rel) {
  const path = resolve(root, rel);
  assert(existsSync(path), `missing ${path}`);
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
async function one(db, sql) {
  const result = await db.query(sql);
  assert(result.rows.length === 1, `expected one row: ${sql}`);
  return result.rows[0];
}

const fixture = `
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN CREATE ROLE anon NOLOGIN; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN CREATE ROLE authenticated NOLOGIN; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN CREATE ROLE service_role NOLOGIN; END IF;
END $$;

CREATE SCHEMA IF NOT EXISTS auth;
CREATE TABLE auth.users (
  id uuid PRIMARY KEY,
  email text,
  raw_user_meta_data jsonb NOT NULL DEFAULT '{}'::jsonb
);
CREATE OR REPLACE FUNCTION auth.uid()
RETURNS uuid LANGUAGE sql STABLE AS $$
  SELECT nullif(current_setting('request.jwt.claim.sub', true), '')::uuid;
$$;
CREATE OR REPLACE FUNCTION auth.jwt()
RETURNS jsonb LANGUAGE sql STABLE AS $$
  SELECT coalesce(nullif(current_setting('request.jwt.claims', true), '')::jsonb, '{}'::jsonb);
$$;
GRANT USAGE ON SCHEMA public, auth TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION auth.uid(), auth.jwt() TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.auth_is_registered_user()
RETURNS boolean LANGUAGE sql STABLE SET search_path = public AS $$
  SELECT auth.uid() IS NOT NULL
    AND coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) = false;
$$;

CREATE TABLE public.projects (
  id uuid PRIMARY KEY,
  owner_id uuid NOT NULL,
  title text NOT NULL,
  visibility text NOT NULL DEFAULT 'public'
);
CREATE TABLE public.developer_profiles (
  user_id uuid PRIMARY KEY,
  creator_id text NOT NULL UNIQUE,
  public_name text NOT NULL,
  profile text NOT NULL DEFAULT ''
);
CREATE TABLE public.user_blocks (
  blocker_id uuid NOT NULL,
  blocked_id uuid NOT NULL,
  PRIMARY KEY (blocker_id, blocked_id)
);
CREATE OR REPLACE FUNCTION public.users_are_blocking(p_user_a uuid, p_user_b uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_blocks b
    WHERE (b.blocker_id = p_user_a AND b.blocked_id = p_user_b)
       OR (b.blocker_id = p_user_b AND b.blocked_id = p_user_a)
  );
$$;
CREATE TABLE public.user_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL,
  project_id text,
  message text NOT NULL,
  read_at timestamptz,
  seen_at timestamptz,
  acknowledged_at timestamptz,
  requires_acknowledgement boolean NOT NULL DEFAULT false,
  coalesce_key text,
  consultation_id uuid,
  usage_relation_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.transactional_email_outbox (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  to_email text NOT NULL,
  template_key text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'pending',
  attempts integer NOT NULL DEFAULT 0,
  last_error text,
  available_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz
);
CREATE OR REPLACE FUNCTION public.enqueue_transactional_email(
  p_user_id uuid, p_to_email text, p_template_key text,
  p_payload jsonb DEFAULT '{}'::jsonb, p_available_at timestamptz DEFAULT now()
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_id uuid;
BEGIN
  INSERT INTO public.transactional_email_outbox (user_id, to_email, template_key, payload, available_at)
  VALUES (p_user_id, p_to_email, p_template_key, coalesce(p_payload, '{}'::jsonb), coalesce(p_available_at, now()))
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;
CREATE TABLE public.platform_announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  body text NOT NULL,
  importance text NOT NULL DEFAULT 'normal'
    CHECK (importance IN ('normal', 'important')),
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'published')),
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT platform_announcements_published_at_check
    CHECK (status = 'draft' OR published_at IS NOT NULL)
);
GRANT SELECT, INSERT, UPDATE ON public.user_notifications TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE ON public.transactional_email_outbox TO authenticated, service_role;
GRANT SELECT ON public.projects, public.developer_profiles, public.user_blocks, auth.users TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE ON public.platform_announcements TO authenticated, service_role;
`;

async function main() {
  const db = new PGlite();
  await execSql(db, "fixture", fixture);
  await execSql(db, "093", readSql("supabase/migrations/093_feedback_reciprocity_notifications.sql"));
  await execSql(db, "094", readSql("supabase/migrations/094_platform_announcement_publish_window.sql"));
  await execSql(
    db,
    "grants after migrations",
    `
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO authenticated, service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated, service_role;
`,
  );

  const actor = "11111111-1111-4111-8111-111111111111";
  const owner = "22222222-2222-4222-8222-222222222222";
  const projectB = "33333333-3333-4333-8333-333333333333";
  const projectA = "44444444-4444-4444-8444-444444444444";

  await db.exec(`
    INSERT INTO auth.users (id, email) VALUES
      ('${actor}', 'a@example.com'),
      ('${owner}', 'b@example.com');
    INSERT INTO public.developer_profiles (user_id, creator_id, public_name)
    VALUES ('${actor}', 'actor', 'Actor A'), ('${owner}', 'owner', 'Owner B');
    INSERT INTO public.projects (id, owner_id, title, visibility) VALUES
      ('${projectB}', '${owner}', 'B Game', 'public'),
      ('${projectA}', '${actor}', 'A Game', 'public');
  `);

  await db.exec(`
    SET request.jwt.claim.sub = '${actor}';
    SET request.jwt.claims = '{"sub":"${actor}","is_anonymous":false}';
    SET ROLE authenticated;
  `);
  const first = await one(
    db,
    `SELECT public.consider_feedback_reciprocity('${projectB}')::text AS id`,
  );
  assert(Boolean(first.id), "first reciprocity missing");
  const counts1 = await one(
    db,
    `SELECT
       (SELECT count(*)::int FROM public.user_notifications
        WHERE user_id = '${owner}' AND type = 'feedback_reciprocity') AS n,
       (SELECT count(*)::int FROM public.transactional_email_outbox
        WHERE user_id = '${owner}' AND template_key = 'feedback_reciprocity') AS e`,
  );
  assert(Number(counts1.n) === 1 && Number(counts1.e) === 1, "coalesce/email first");

  const second = await one(
    db,
    `SELECT public.consider_feedback_reciprocity('${projectB}')::text AS id`,
  );
  assert(second.id === first.id, "open prompt must coalesce");
  const counts2 = await one(
    db,
    `SELECT count(*)::int AS e FROM public.transactional_email_outbox
     WHERE user_id = '${owner}' AND template_key = 'feedback_reciprocity'`,
  );
  assert(Number(counts2.e) === 1, "no duplicate email while open");

  await db.exec(
    `UPDATE public.user_notifications SET acknowledged_at = now() WHERE id = '${first.id}'`,
  );
  const third = await one(
    db,
    `SELECT public.consider_feedback_reciprocity('${projectB}')::text AS id`,
  );
  assert(third.id !== first.id, "after ack may create new notification");
  const emailAfterAck = await one(
    db,
    `SELECT count(*)::int AS e FROM public.transactional_email_outbox
     WHERE user_id = '${owner}' AND template_key = 'feedback_reciprocity'`,
  );
  assert(Number(emailAfterAck.e) === 2, "new email after ack");

  await db.exec(`
    INSERT INTO public.platform_announcements (slug, title, body, importance, status, published_at, starts_at, ends_at)
    VALUES
      ('active', 'Active', 'body', 'important', 'published', now(), now() - interval '1 hour', now() + interval '1 day'),
      ('draft', 'Draft', 'body', 'normal', 'draft', NULL, NULL, NULL),
      ('expired', 'Expired', 'body', 'normal', 'published', now() - interval '2 day', now() - interval '2 day', now() - interval '1 hour');
  `);
  const active = await one(
    db,
    `SELECT count(*)::int AS c FROM public.get_public_platform_announcements(20, 0)`,
  );
  assert(Number(active.c) === 1, "home list must hide draft/expired");
  const archive = await one(
    db,
    `SELECT count(*)::int AS c FROM public.get_public_platform_announcement_archive(20, 0)`,
  );
  assert(Number(archive.c) === 2, "archive includes expired published");

  console.log(JSON.stringify({ ok: true, reciprocity: true, announcements: true }, null, 2));
}

main().catch((error) => {
  console.error(JSON.stringify({ ok: false, error: String(error?.message || error) }, null, 2));
  process.exit(1);
});
