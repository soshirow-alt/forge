/**
 * Local PGlite smoke for get_home_discovery_feed (055 LANGUAGE sql).
 * Staging-only helper — does not touch remote DBs.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
const migrationPath = join(
  root,
  "supabase/migrations/055_fix_home_discovery_feed_variable_conflict.sql",
);

const schemaSql = `
CREATE SCHEMA IF NOT EXISTS public;

CREATE TABLE public.projects (
  id uuid PRIMARY KEY,
  title text,
  description text,
  playable_version text,
  thumbnail_url text,
  genre text,
  visibility text,
  first_published_at timestamptz
);

CREATE TABLE public.project_devlogs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  is_initial_publish boolean NOT NULL DEFAULT false
);

CREATE TABLE public.project_release_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  event_type text NOT NULL,
  source text
);

CREATE TABLE public.project_voice_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id text NOT NULL,
  user_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  moderation_status text NOT NULL DEFAULT 'visible'
);

CREATE TABLE public.project_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id text NOT NULL,
  user_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  moderation_status text NOT NULL DEFAULT 'visible'
);

CREATE TABLE public.project_watches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.project_play_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id text NOT NULL,
  user_id uuid,
  played_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.project_witness_grants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL
);

CREATE OR REPLACE FUNCTION public.get_public_project_stats(p_project_ids uuid[])
RETURNS TABLE (
  project_id uuid,
  feedback_participant_count bigint,
  watch_count bigint,
  witness_grant_count bigint,
  latest_devlog_at timestamptz
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    p.id AS project_id,
    0::bigint AS feedback_participant_count,
    0::bigint AS watch_count,
    0::bigint AS witness_grant_count,
    NULL::timestamptz AS latest_devlog_at
  FROM public.projects p
  WHERE p.visibility = 'public'
    AND p.id = ANY(COALESCE(p_project_ids, ARRAY[]::uuid[]));
$$;
`;

function extractMigrationBody(raw) {
  const begin = raw.indexOf("CREATE OR REPLACE FUNCTION");
  const commit = raw.lastIndexOf("\nCOMMIT;");
  if (begin < 0 || commit < 0) {
    throw new Error("Could not extract function body from 055");
  }
  return raw.slice(begin, commit).trim();
}

async function countBySection(db) {
  const res = await db.query(`
    SELECT section, count(*)::int AS n
    FROM public.get_home_discovery_feed()
    GROUP BY section
    ORDER BY section
  `);
  const out = { newest: 0, updated: 0, trending: 0 };
  for (const row of res.rows) out[row.section] = row.n;
  return out;
}

async function main() {
  const db = new PGlite();
  await db.exec(schemaSql);

  // Roles used by GRANT in migration (PGlite may not have them)
  await db.exec(`
    DO $$ BEGIN
      CREATE ROLE anon;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;
    DO $$ BEGIN
      CREATE ROLE authenticated;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;
  `);

  const migration = extractMigrationBody(readFileSync(migrationPath, "utf8"));
  await db.exec(migration);

  const results = [];

  // 1) empty
  let counts = await countBySection(db);
  results.push({ case: "empty", counts, ok: counts.newest === 0 && counts.updated === 0 && counts.trending === 0 });

  const idA = "11111111-1111-1111-1111-111111111111";
  const idB = "22222222-2222-2222-2222-222222222222";
  const idC = "33333333-3333-3333-3333-333333333333";
  const user1 = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";

  // 2) public only → newest only
  await db.exec(`
    INSERT INTO public.projects (id, title, description, playable_version, thumbnail_url, genre, visibility, first_published_at)
    VALUES
      ('${idA}', 'A', 'da', '0.1', null, 'rpg', 'public', now() - interval '3 days'),
      ('${idB}', 'B', 'db', '0.1', null, 'rpg', 'public', now() - interval '2 days'),
      ('${idC}', 'Private', 'dc', '0.1', null, 'rpg', 'private', now() - interval '1 days');
  `);
  counts = await countBySection(db);
  results.push({
    case: "public_newest_only",
    counts,
    ok: counts.newest === 2 && counts.updated === 0 && counts.trending === 0,
  });

  // 3) updated only (non-initial devlog after first_published_at)
  await db.exec(`
    INSERT INTO public.project_devlogs (project_id, created_at, is_initial_publish)
    VALUES ('${idA}', now() - interval '1 day', false);
  `);
  counts = await countBySection(db);
  results.push({
    case: "updated_present",
    counts,
    ok: counts.newest === 2 && counts.updated === 1 && counts.trending === 0,
  });

  // 4) trending only path (engagement in window) — also multi-section overlap on A
  await db.exec(`
    INSERT INTO public.project_voice_responses (project_id, user_id, created_at, moderation_status)
    VALUES ('${idA}', '${user1}', now() - interval '2 hours', 'visible');
    INSERT INTO public.project_watches (project_id, created_at)
    VALUES ('${idA}', now() - interval '3 hours');
  `);
  counts = await countBySection(db);
  const overlap = await db.query(`
    SELECT project_id::text AS id, array_agg(section ORDER BY section) AS sections
    FROM public.get_home_discovery_feed()
    GROUP BY project_id
    HAVING count(*) > 1
  `);
  results.push({
    case: "trending_and_overlap",
    counts,
    overlap: overlap.rows,
    ok:
      counts.newest === 2 &&
      counts.updated === 1 &&
      counts.trending === 1 &&
      overlap.rows.some((r) => r.id === idA && r.sections.includes("newest") && r.sections.includes("trending")),
  });

  // 5) invalid text project_id must not crash whole feed
  await db.exec(`
    INSERT INTO public.project_devlogs (project_id, created_at, is_initial_publish)
    VALUES ('not-a-uuid', now() - interval '1 hour', false);
    INSERT INTO public.project_voice_responses (project_id, user_id, created_at, moderation_status)
    VALUES ('also-bad', '${user1}', now() - interval '1 hour', 'visible');
  `);
  let crashed = false;
  try {
    counts = await countBySection(db);
  } catch (e) {
    crashed = true;
    results.push({ case: "invalid_text_project_id", ok: false, error: String(e) });
  }
  if (!crashed) {
    results.push({
      case: "invalid_text_project_id",
      counts,
      ok: counts.newest === 2 && counts.updated === 1 && counts.trending === 1,
    });
  }

  // 6) GRANT shape: anon/authenticated have EXECUTE; no service_role grant in migration
  const grants = await db.query(`
    SELECT grantee::text AS grantee, privilege_type
    FROM information_schema.routine_privileges
    WHERE routine_schema = 'public'
      AND routine_name = 'get_home_discovery_feed'
  `);
  const grantees = new Set(grants.rows.map((r) => r.grantee));
  const migrationText = readFileSync(migrationPath, "utf8");
  const createBlock = migrationText.slice(
    migrationText.indexOf("CREATE OR REPLACE FUNCTION"),
    migrationText.indexOf("$$;"),
  );
  results.push({
    case: "grants",
    grantees: [...grantees],
    ok:
      /GRANT EXECUTE ON FUNCTION public\.get_home_discovery_feed\(\) TO anon;/.test(migrationText) &&
      /GRANT EXECUTE ON FUNCTION public\.get_home_discovery_feed\(\) TO authenticated;/.test(migrationText) &&
      !/GRANT EXECUTE ON FUNCTION public\.get_home_discovery_feed\(\) TO service_role;/.test(migrationText) &&
      /LANGUAGE sql/.test(createBlock) &&
      !/LANGUAGE plpgsql/.test(createBlock),
  });

  // 7) language is sql
  const lang = await db.query(`
    SELECT l.lanname AS language
    FROM pg_proc p
    JOIN pg_language l ON l.oid = p.prolang
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'get_home_discovery_feed'
  `);
  results.push({
    case: "language_sql",
    language: lang.rows[0]?.language,
    ok: lang.rows[0]?.language === "sql",
  });

  const failed = results.filter((r) => !r.ok);
  console.log(JSON.stringify({ pass: failed.length === 0, results }, null, 2));
  if (failed.length) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
