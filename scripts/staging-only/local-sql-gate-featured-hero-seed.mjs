/**
 * PGlite execution gate for seed-featured-hero-visibility.sql.
 * Includes migration 050 first_published_at immutability trigger (Staging-real).
 * This is isolated and never connects to Staging or Production.
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { PGlite } from "@electric-sql/pglite";

const root = resolve(".");
const seedPath = resolve(
  root,
  "scripts/staging-only/seed-featured-hero-visibility.sql",
);
const migrationPath = resolve(
  root,
  "supabase/migrations/067_fix_home_featured_hero_sql_stable.sql",
);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function readSql(path) {
  assert(existsSync(path), `missing SQL file: ${path}`);
  return readFileSync(path, "utf8");
}

async function execSql(db, label, sql) {
  await db.exec(sql);
  console.log(`OK  ${label}`);
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
      // The seed owns its transaction; a failed batch may already be rolled back.
    }
    assert(expected.test(message), `${label}: unexpected error: ${message}`);
    console.log(`OK  ${label} (expected failure)`);
  }
}

const fixtureSchema = `
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

CREATE SCHEMA auth;
CREATE TABLE auth.users (
  id uuid PRIMARY KEY,
  email text
);

CREATE TABLE public.projects (
  id uuid PRIMARY KEY,
  owner_id uuid NOT NULL REFERENCES auth.users(id),
  owner_name text,
  title text NOT NULL,
  creator text,
  genre text,
  genres text[] NOT NULL DEFAULT '{}',
  description text,
  overview_introduction text,
  phase text,
  status text,
  looking_for_testers boolean NOT NULL DEFAULT false,
  tester_slots integer,
  section text NOT NULL DEFAULT 'new',
  playable_version text,
  thumbnail_url text,
  thumbnail_urls text[] NOT NULL DEFAULT '{}',
  tags text[] NOT NULL DEFAULT '{}',
  play_url text,
  official_url text,
  github_url text,
  discord_url text,
  related_links jsonb NOT NULL DEFAULT '[]'::jsonb,
  publish_destinations jsonb,
  estimated_play_time text,
  play_access_type text,
  release_status text,
  category text,
  quick_try boolean,
  usable_for_creation boolean,
  stream_policy text,
  stream_policy_note text,
  asset_kinds text[] NOT NULL DEFAULT '{}',
  purpose_tags text[] NOT NULL DEFAULT '{}',
  category_attributes jsonb NOT NULL DEFAULT '{}'::jsonb,
  player_counts text[] NOT NULL DEFAULT '{}',
  visibility text NOT NULL,
  first_published_at timestamptz
);

-- Staging-real: existing first_published_at is immutable on UPDATE (050).
CREATE OR REPLACE FUNCTION public.set_project_first_published_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.visibility = 'public' THEN
      NEW.first_published_at := now();
    ELSE
      NEW.first_published_at := NULL;
    END IF;
    RETURN NEW;
  END IF;
  IF OLD.first_published_at IS NOT NULL THEN
    NEW.first_published_at := OLD.first_published_at;
    RETURN NEW;
  END IF;
  IF OLD.visibility IS DISTINCT FROM 'public'
     AND NEW.visibility = 'public'
     AND OLD.first_published_at IS NULL THEN
    NEW.first_published_at := now();
  ELSE
    NEW.first_published_at := NULL;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER projects_set_first_published_at
  BEFORE INSERT OR UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.set_project_first_published_at();

CREATE TABLE public.project_voice_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id text NOT NULL,
  user_id uuid,
  moderation_status text NOT NULL DEFAULT 'visible',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.project_feedback (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id),
  project_id text NOT NULL,
  version_key text,
  good_points text,
  would_replay text,
  moderation_status text NOT NULL DEFAULT 'visible',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX project_feedback_user_project_version_idx
  ON public.project_feedback (user_id, project_id, version_key);

CREATE TABLE public.project_watches (
  user_id uuid NOT NULL REFERENCES auth.users(id),
  project_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, project_id)
);

CREATE TABLE public.project_play_sessions (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id),
  project_id text NOT NULL,
  version_key text,
  played_at timestamptz NOT NULL,
  context text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.project_devlogs (
  id uuid PRIMARY KEY,
  project_id text NOT NULL,
  author_id uuid REFERENCES auth.users(id),
  title text NOT NULL,
  content text NOT NULL,
  published_version text,
  is_initial_publish boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  published_at timestamptz
);

CREATE TABLE public.project_release_events (
  id uuid PRIMARY KEY,
  project_id uuid NOT NULL REFERENCES public.projects(id),
  event_type text NOT NULL,
  actor_user_id uuid REFERENCES auth.users(id),
  note text,
  source text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE FUNCTION public.get_public_project_stats(p_project_ids uuid[])
RETURNS TABLE (
  project_id uuid,
  feedback_participant_count bigint,
  watch_count bigint
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    p.id,
    (
      SELECT count(DISTINCT f.user_id)::bigint
      FROM public.project_feedback f
      WHERE f.project_id = p.id::text
    ),
    (
      SELECT count(*)::bigint
      FROM public.project_watches w
      WHERE w.project_id = p.id::text
    )
  FROM public.projects p
  WHERE p.id = ANY (p_project_ids);
$$;
`;

const fixtureData = `
INSERT INTO auth.users (id, email) VALUES
  ('dddddddd-dddd-4ddd-8ddd-000000000001', 'owner-1@example.invalid'),
  ('dddddddd-dddd-4ddd-8ddd-000000000002', 'owner-2@example.invalid'),
  ('40d59480-5eb5-489f-8538-d0ba2464b0db', 'smoke-a@example.invalid'),
  ('dddddddd-dddd-4ddd-8ddd-000000000101', 'player-1@example.invalid'),
  ('dddddddd-dddd-4ddd-8ddd-000000000102', 'player-2@example.invalid'),
  ('dddddddd-dddd-4ddd-8ddd-000000000103', 'player-3@example.invalid'),
  ('dddddddd-dddd-4ddd-8ddd-000000000104', 'player-4@example.invalid');

-- Disable trigger only while loading historical fixture timestamps
-- (seed under test must not disable triggers).
ALTER TABLE public.projects DISABLE TRIGGER projects_set_first_published_at;

INSERT INTO public.projects (
  id, owner_id, owner_name, title, creator, genre, genres, description,
  overview_introduction, phase, status, section, playable_version,
  thumbnail_url, thumbnail_urls, category, visibility, tags, play_url,
  release_status, first_published_at
) VALUES
  (
    '41ff5a96-105c-42a2-87b4-787bcfeacb45',
    '40d59480-5eb5-489f-8538-d0ba2464b0db',
    'Smoke A', 'Staging Smoke A (thumbnail)', 'Smoke A', 'other', ARRAY['other'],
    'guard', 'guard', 'playable', 'open', 'new', '1.0',
    'https://example.invalid/smoke.png', ARRAY['https://example.invalid/smoke.png'],
    'game', 'public', ARRAY['smoke'], 'https://example.invalid/smoke',
    'in_development', timestamptz '2026-07-09 13:29:49+00'
  ),
  (
    'eeeeeeee-eeee-4eee-8eee-000000000001',
    'dddddddd-dddd-4ddd-8ddd-000000000001',
    'IA A', 'Reaction', 'IA A', 'action', ARRAY['action'], 'reaction', 'reaction',
    'playable', 'open', 'testers', '0.2',
    'https://example.invalid/1.png', ARRAY['https://example.invalid/1.png'],
    'game', 'public', ARRAY['forge-ia-seed-v1'], 'https://example.invalid/1',
    'in_development', timestamptz '2026-07-24 13:59:03+00'
  ),
  (
    'eeeeeeee-eeee-4eee-8eee-000000000002',
    'dddddddd-dddd-4ddd-8ddd-000000000002',
    'IA B', 'Rising', 'IA B', 'action', ARRAY['action'], 'rising', 'rising',
    'playable', 'open', 'new', '0.3',
    'https://example.invalid/2.png', ARRAY['https://example.invalid/2.png'],
    'game', 'public', ARRAY['forge-ia-seed-v1'], 'https://example.invalid/2',
    'in_development', timestamptz '2026-07-23 13:59:03+00'
  ),
  (
    -- Staging-real: older than …000028; same owner as reaction.
    'eeeeeeee-eeee-4eee-8eee-000000000003',
    'dddddddd-dddd-4ddd-8ddd-000000000001',
    'IA A', 'Shared Newest Candidate', 'IA A', 'puzzle', ARRAY['puzzle'], 'newest', 'newest',
    'playable', 'open', 'new', '0.4',
    'https://example.invalid/3.png', ARRAY['https://example.invalid/3.png'],
    'game', 'public', ARRAY['forge-ia-seed-v1'], 'https://example.invalid/3',
    'in_development', timestamptz '2026-07-22 13:59:03+00'
  ),
  (
    'eeeeeeee-eeee-4eee-8eee-000000000004',
    'dddddddd-dddd-4ddd-8ddd-000000000002',
    'IA B', 'Updated', 'IA B', 'rpg', ARRAY['rpg'], 'updated', 'updated',
    'playable', 'open', 'new', '0.5',
    'https://example.invalid/4.png', ARRAY['https://example.invalid/4.png'],
    'game', 'public', ARRAY['forge-ia-seed-v1'], 'https://example.invalid/4',
    'in_development', timestamptz '2026-07-21 13:59:03+00'
  ),
  (
    'eeeeeeee-eeee-4eee-8eee-000000000028',
    'dddddddd-dddd-4ddd-8ddd-000000000001',
    'IA A', 'Competitor SDK', 'IA A', 'sdk', ARRAY['sdk'], 'devtool', 'devtool',
    'playable', 'open', 'new', '0.4',
    'https://example.invalid/28.png', ARRAY['https://example.invalid/28.png'],
    'dev-tool', 'public', ARRAY['forge-ia-seed-v1'], 'https://example.invalid/28',
    'in_development', timestamptz '2026-07-25 13:59:03+00'
  ),
  (
    'eeeeeeee-eeee-4eee-8eee-000000000029',
    'dddddddd-dddd-4ddd-8ddd-000000000002',
    'IA B', 'Competitor Lib', 'IA B', 'lib', ARRAY['lib'], 'devtool', 'devtool',
    'playable', 'open', 'new', '0.4',
    'https://example.invalid/29.png', ARRAY['https://example.invalid/29.png'],
    'dev-tool', 'public', ARRAY['forge-ia-seed-v1'], 'https://example.invalid/29',
    'in_development', timestamptz '2026-07-24 13:59:03+00'
  );

ALTER TABLE public.projects ENABLE TRIGGER projects_set_first_published_at;

-- Prove 050 immutability: UPDATE cannot change existing first_published_at.
UPDATE public.projects
SET first_published_at = timestamptz '2026-08-01 00:00:00+00'
WHERE id = 'eeeeeeee-eeee-4eee-8eee-000000000003';

-- Pre-existing forge-ia-seed-v1 FB (same natural key the featured seed must reuse).
INSERT INTO public.project_feedback (
  id, user_id, project_id, version_key, good_points,
  would_replay, moderation_status, created_at, updated_at
) VALUES (
  '99999999-9999-4999-8999-000000000001',
  'dddddddd-dddd-4ddd-8ddd-000000000101',
  'eeeeeeee-eeee-4eee-8eee-000000000001',
  '0.2',
  '短文FB #1: テンポが良いです。',
  'yes',
  'visible',
  now() - interval '20 days',
  now() - interval '20 days'
);
`;

async function assertExactPairs(db) {
  const result = await db.query(`
    SELECT featured_type, project_id::text AS project_id
    FROM public.get_home_featured_hero()
    ORDER BY slot_rank
  `);
  const actual = result.rows.map((row) => [
    row.featured_type,
    row.project_id,
  ]);
  const expected = [
    ["reaction", "eeeeeeee-eeee-4eee-8eee-000000000001"],
    ["rising_plays", "eeeeeeee-eeee-4eee-8eee-000000000002"],
    ["newest", "eeeeeeee-eeee-4eee-8eee-000000000091"],
    ["updated", "eeeeeeee-eeee-4eee-8eee-000000000004"],
  ];
  assert(
    JSON.stringify(actual) === JSON.stringify(expected),
    `featured hero pairs mismatch: ${JSON.stringify(actual)}`,
  );
}

async function main() {
  const db = new PGlite();
  const seedSql = readSql(seedPath);
  const featuredHeroMigration = readSql(migrationPath);

  await execSql(db, "featured hero fixture schema", fixtureSchema);
  await execSql(db, "featured hero fixture data", fixtureData);

  const immutable = await db.query(`
    SELECT first_published_at = timestamptz '2026-07-22 13:59:03+00' AS kept
    FROM public.projects
    WHERE id = 'eeeeeeee-eeee-4eee-8eee-000000000003'
  `);
  assert(
    immutable.rows[0]?.kept === true,
    "050 trigger must block first_published_at UPDATE (Staging-real)",
  );
  console.log("OK  050 first_published_at immutability");

  await execSql(db, "067 featured hero function", featuredHeroMigration);
  await execSql(db, "featured hero seed first apply", seedSql);
  await assertExactPairs(db);
  const bodyAfterFirst = await db.query(`
    SELECT good_points
    FROM public.project_feedback
    WHERE id = '99999999-9999-4999-8999-000000000001'
  `);
  assert(
    bodyAfterFirst.rows[0]?.good_points === "短文FB #1: テンポが良いです。",
    "first apply rewrote player-ia FB body",
  );

  const p003 = await db.query(`
    SELECT first_published_at = timestamptz '2026-07-22 13:59:03+00' AS kept,
           owner_id::text AS owner_id
    FROM public.projects
    WHERE id = 'eeeeeeee-eeee-4eee-8eee-000000000003'
  `);
  assert(
    p003.rows[0]?.kept === true &&
      p003.rows[0]?.owner_id === "dddddddd-dddd-4ddd-8ddd-000000000001",
    "shared …000003 timestamp/owner must stay untouched",
  );

  await execSql(db, "featured hero seed safe re-run", seedSql);
  await assertExactPairs(db);
  const bodyAfterRerun = await db.query(`
    SELECT good_points, created_at > now() - interval '1 day' AS fresh
    FROM public.project_feedback
    WHERE id = '99999999-9999-4999-8999-000000000001'
  `);
  assert(
    bodyAfterRerun.rows[0]?.good_points === "短文FB #1: テンポが良いです。" &&
      bodyAfterRerun.rows[0]?.fresh === true,
    "re-run lost freshness or rewrote FB body",
  );
  const noLegacyId = await db.query(`
    SELECT count(*)::int AS c
    FROM public.project_feedback
    WHERE id = '48484848-4848-4848-8848-000000000001'
  `);
  assert(
    Number(noLegacyId.rows[0]?.c) === 0,
    "legacy featured-only FB id should not be inserted",
  );

  await db.exec(`
    DELETE FROM public.project_release_events
    WHERE id = '46464646-4646-4646-8646-000000000001';
    DELETE FROM public.projects
    WHERE id = 'eeeeeeee-eeee-4eee-8eee-000000000091';
    UPDATE public.project_feedback
    SET created_at = now() - interval '20 days',
        updated_at = now() - interval '20 days'
    WHERE id = '99999999-9999-4999-8999-000000000001';

    CREATE FUNCTION public.fail_featured_hero_release_insert()
    RETURNS trigger LANGUAGE plpgsql AS $$
    BEGIN
      RAISE EXCEPTION 'intentional featured hero seed failure';
    END;
    $$;
    CREATE TRIGGER fail_featured_hero_release_insert
      BEFORE INSERT ON public.project_release_events
      FOR EACH ROW EXECUTE FUNCTION public.fail_featured_hero_release_insert();
  `);
  await expectFailure(
    db,
    "featured hero seed mid-file rollback",
    seedSql,
    /intentional featured hero seed failure/i,
  );
  const rollback = await db.query(`
    SELECT
      (SELECT count(*)::int FROM public.project_release_events
       WHERE id = '46464646-4646-4646-8646-000000000001') AS release_count,
      (SELECT created_at < now() - interval '19 days'
       FROM public.project_feedback
       WHERE id = '99999999-9999-4999-8999-000000000001') AS feedback_stayed_old,
      (SELECT count(*)::int FROM public.projects
       WHERE id = 'eeeeeeee-eeee-4eee-8eee-000000000091') AS dedicated_count
  `);
  assert(
    Number(rollback.rows[0]?.release_count) === 0 &&
      rollback.rows[0]?.feedback_stayed_old === true &&
      Number(rollback.rows[0]?.dedicated_count) === 0,
    "failed seed left partial activity / dedicated project changes",
  );

  await db.exec(`
    DROP TRIGGER fail_featured_hero_release_insert
      ON public.project_release_events;
    DROP FUNCTION public.fail_featured_hero_release_insert();
  `);
  await execSql(db, "featured hero seed after rollback", seedSql);
  await assertExactPairs(db);

  console.log(
    JSON.stringify(
      {
        ok: true,
        environment: "in-memory PGlite (no remote connection)",
        assertions: {
          firstPublishedAtImmutableLikeStaging050: true,
          fullSeedFirstApply: true,
          fullSeedRerun: true,
          exactFourAxisProjectPairs: true,
          shared003Untouched: true,
          intentionalMidFileFailureRolledBack: true,
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
