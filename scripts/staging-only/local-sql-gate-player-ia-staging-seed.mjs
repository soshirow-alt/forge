/**
 * PGlite gate: execute generated player-ia-staging-seed.sql (first + re-run).
 * No Staging/Production writes. Does not rewrite seed files.
 *
 * Usage: node scripts/staging-only/local-sql-gate-player-ia-staging-seed.mjs
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { PGlite } from "@electric-sql/pglite";

const root = resolve(".");
const seedPath = resolve(root, "scripts/staging-only/player-ia-staging-seed.sql");
const auditPath = resolve(
  root,
  "scripts/staging-only/audit-player-ia-five-category-search.sql",
);

function assert(cond, message) {
  if (!cond) throw new Error(message);
}

function mustRead(path) {
  assert(existsSync(path), `missing ${path}`);
  return readFileSync(path, "utf8");
}

async function execSql(db, label, sql) {
  try {
    await db.exec(sql);
    console.log(`OK  ${label}`);
  } catch (error) {
    console.error(`FAIL ${label}`);
    console.error(error?.message || error);
    throw error;
  }
}

async function execExpectFail(db, label, sql, pattern) {
  try {
    await db.exec(sql);
    try {
      await db.exec("ROLLBACK;");
    } catch {
      // ignore
    }
    throw new Error(`expected failure for ${label}, but succeeded`);
  } catch (error) {
    const message = String(error?.message || error);
    if (/expected failure/i.test(message)) throw error;
    try {
      await db.exec("ROLLBACK;");
    } catch {
      // ignore
    }
    if (!pattern.test(message)) {
      throw new Error(`${label}: unexpected error: ${message}`);
    }
    console.log(`OK  ${label} (expected fail)`);
  }
}

async function seedInventory(db) {
  const res = await db.query(`
    SELECT
      (SELECT count(*)::int FROM public.projects
        WHERE 'forge-ia-seed-v1' = ANY (coalesce(tags, '{}'))) AS projects,
      (SELECT count(*)::int FROM public.project_usage_relations
        WHERE id::text LIKE 'ffffffff-ffff-4fff-8fff-%') AS usage,
      (SELECT count(*)::int FROM public.project_feedback
        WHERE id::text LIKE '99999999-9999-4999-8999-%') AS reg_fb,
      (SELECT count(*)::int FROM public.project_devlogs
        WHERE id::text LIKE '66666666-6666-4666-8666-%') AS devlogs,
      (SELECT count(*)::int FROM public.project_release_events
        WHERE id::text LIKE '55555555-5555-4555-8555-%') AS releases
  `);
  return res.rows[0];
}

const FIXTURE = `
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    CREATE ROLE anon NOLOGIN;
  END IF;
END $$;

CREATE SCHEMA IF NOT EXISTS auth;
CREATE TABLE IF NOT EXISTS auth.users (
  id uuid PRIMARY KEY,
  raw_user_meta_data jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE public.projects (
  id uuid PRIMARY KEY,
  owner_id uuid REFERENCES auth.users(id),
  owner_name text,
  title text NOT NULL,
  creator text,
  genre text,
  genres text[] DEFAULT '{}',
  description text,
  overview_introduction text,
  phase text,
  status text,
  looking_for_testers boolean DEFAULT false,
  tester_slots integer,
  section text,
  tags text[] DEFAULT '{}',
  play_url text,
  thumbnail_url text,
  thumbnail_urls text[] NOT NULL DEFAULT '{}',
  official_url text,
  github_url text,
  discord_url text,
  related_links jsonb,
  publish_destinations jsonb,
  estimated_play_time text,
  play_access_type text NOT NULL DEFAULT 'unspecified',
  visibility text NOT NULL DEFAULT 'public',
  playable_version text DEFAULT '0.1',
  release_status text,
  category text,
  quick_try boolean DEFAULT false,
  usable_for_creation boolean DEFAULT false,
  stream_policy text,
  stream_policy_note text,
  asset_kinds text[] DEFAULT '{}',
  purpose_tags text[] DEFAULT '{}',
  category_attributes jsonb DEFAULT '{}'::jsonb,
  player_counts text[] NOT NULL DEFAULT '{}',
  first_published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.developer_profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id),
  creator_id text,
  public_name text
);

CREATE TABLE public.platform_announcements (
  id uuid PRIMARY KEY,
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  body text NOT NULL,
  importance text NOT NULL DEFAULT 'normal',
  status text NOT NULL DEFAULT 'draft',
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.project_devlogs (
  id uuid PRIMARY KEY,
  project_id text NOT NULL,
  author_id uuid,
  title text NOT NULL,
  content text NOT NULL,
  published_version text,
  published_at timestamptz,
  is_initial_publish boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.project_release_events (
  id uuid PRIMARY KEY,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  actor_user_id uuid,
  note text,
  source text NOT NULL DEFAULT 'studio',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.project_usage_relations (
  id uuid PRIMARY KEY,
  source_project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  target_project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  relation_type text NOT NULL DEFAULT 'used',
  status text NOT NULL DEFAULT 'published',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.project_feedback (
  id uuid PRIMARY KEY,
  project_id text NOT NULL,
  user_id uuid NOT NULL,
  version_key text,
  good_points text,
  concerns text,
  bugs text,
  other_notes text,
  would_replay text,
  moderation_status text NOT NULL DEFAULT 'visible',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.project_guest_feedback (
  id uuid PRIMARY KEY,
  project_id text NOT NULL,
  version_key text,
  submitter_key uuid NOT NULL,
  good_points text,
  concerns text,
  bugs text,
  other_notes text,
  include_in_public_aggregate boolean NOT NULL DEFAULT true,
  moderation_status text NOT NULL DEFAULT 'visible',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.feedback_card_empathies (
  id uuid PRIMARY KEY,
  project_id text NOT NULL,
  target_source text NOT NULL,
  target_id uuid NOT NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, target_source, target_id)
);

CREATE TABLE public.feedback_card_replies (
  id uuid PRIMARY KEY,
  project_id text NOT NULL,
  target_source text NOT NULL,
  target_id uuid NOT NULL,
  author_id uuid NOT NULL REFERENCES auth.users(id),
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.enforce_devlog_immutable_body()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.published_version IS NOT NULL AND NEW.content IS DISTINCT FROM OLD.content THEN
    RAISE EXCEPTION 'Published devlog body is immutable. Create a new devlog instead.';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER project_devlogs_immutable_body
  BEFORE UPDATE ON public.project_devlogs
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_devlog_immutable_body();

CREATE OR REPLACE FUNCTION public.set_project_first_published_at()
RETURNS trigger LANGUAGE plpgsql AS $$
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
  ELSIF NEW.visibility = 'public' AND OLD.visibility IS DISTINCT FROM 'public' THEN
    NEW.first_published_at := now();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER projects_set_first_published_at
  BEFORE INSERT OR UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.set_project_first_published_at();
`;

const BOOTSTRAP = `
INSERT INTO auth.users (id) VALUES
  ('dddddddd-dddd-4ddd-8ddd-000000000001'::uuid),
  ('dddddddd-dddd-4ddd-8ddd-000000000002'::uuid)
ON CONFLICT (id) DO NOTHING;

INSERT INTO auth.users (id)
SELECT ('dddddddd-dddd-4ddd-8ddd-0000000001' || lpad(g::text, 2, '0'))::uuid
FROM generate_series(1, 10) g
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.projects (
  id, owner_id, owner_name, title, creator, description, visibility, category, tags, thumbnail_url
) VALUES (
  '41ff5a96-105c-42a2-87b4-787bcfeacb45'::uuid,
  'dddddddd-dddd-4ddd-8ddd-000000000001'::uuid,
  'SmokeA', 'Smoke A', 'SmokeA', 'smoke', 'public', 'game', ARRAY['smoke']::text[],
  'https://example.com/smoke.png'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.projects (
  id, owner_id, owner_name, title, creator, description, visibility, category, tags, thumbnail_url
) VALUES (
  'dddddddd-dddd-4ddd-8ddd-000000000203'::uuid,
  'dddddddd-dddd-4ddd-8ddd-000000000002'::uuid,
  'Hero', 'Hero Carousel', 'Hero', 'hero', 'public', 'game', ARRAY['hero']::text[],
  'https://example.com/hero.png'
) ON CONFLICT (id) DO NOTHING;
`;

async function main() {
  const seedSql = mustRead(seedPath);
  const auditSql = mustRead(auditPath);
  assert(
    !/\bSET\s+LOCAL\s+session_replication_role\b/i.test(seedSql),
    "seed SQL must not SET session_replication_role",
  );
  assert(/ON CONFLICT \(id\) DO NOTHING/i.test(seedSql), "devlog/release must DO NOTHING");
  assert(/\bBEGIN\s*;/i.test(seedSql) && /\bCOMMIT\s*;/i.test(seedSql), "seed must be transactional");

  // Failure-path rollback: abort before COMMIT; no seed inventory may remain.
  const failingSeed = seedSql.replace(
    /\nCOMMIT;\s*\n/,
    `\nDO $abort$ BEGIN RAISE EXCEPTION 'intentional abort for rollback gate'; END $abort$;\nCOMMIT;\n`,
  );
  assert(
    failingSeed.includes("intentional abort for rollback gate"),
    "failed to inject rollback abort",
  );
  const dbFail = new PGlite();
  await execSql(dbFail, "rollback fixture schema", FIXTURE);
  await execSql(dbFail, "rollback bootstrap", BOOTSTRAP);
  const beforeFail = await seedInventory(dbFail);
  assert(beforeFail.projects === 0, "pre-fail inventory must be empty");
  await execExpectFail(
    dbFail,
    "seed intentional abort",
    failingSeed,
    /intentional abort for rollback gate/i,
  );
  const afterFail = await seedInventory(dbFail);
  assert(
    afterFail.projects === 0 &&
      afterFail.usage === 0 &&
      afterFail.reg_fb === 0 &&
      afterFail.devlogs === 0 &&
      afterFail.releases === 0,
    `rollback left residue: ${JSON.stringify(afterFail)}`,
  );
  console.log("OK  seed failure rollback (no residue)");

  const db = new PGlite();
  await execSql(db, "fixture schema", FIXTURE);
  await execSql(db, "bootstrap smoke/hero/users", BOOTSTRAP);
  await execSql(db, "seed first apply", seedSql);
  await execSql(db, "seed re-apply", seedSql);

  const counts = await db.query(`
    SELECT
      count(*)::int AS total,
      count(*) FILTER (WHERE category = 'game')::int AS game_n,
      count(*) FILTER (WHERE category = 'asset')::int AS asset_n
    FROM public.projects
    WHERE 'forge-ia-seed-v1' = ANY (coalesce(tags, '{}'))
  `);
  assert(counts.rows[0].total === 40, `expected 40 seed projects, got ${counts.rows[0].total}`);
  assert(counts.rows[0].game_n === 8, "game count");
  assert(counts.rows[0].asset_n === 8, "asset count");

  const asset = await db.query(`
    SELECT count(*)::int AS n
    FROM public.projects
    WHERE category = 'asset'
      AND 'forge-ia-seed-v1' = ANY (coalesce(tags, '{}'))
      AND coalesce(cardinality(asset_kinds), 0) >= 1
  `);
  assert(asset.rows[0].n === 8, "asset rows must all carry asset_kinds (085)");

  const assetFormatSplit = await db.query(`
    SELECT
      count(*) FILTER (WHERE category_attributes->'formats' ? '2D')::int AS n2d,
      count(*) FILTER (WHERE category_attributes->'formats' ? '3D')::int AS n3d
    FROM public.projects
    WHERE category = 'asset'
      AND 'forge-ia-seed-v1' = ANY (coalesce(tags, '{}'))
      AND 'キャラクター' = ANY (asset_kinds)
  `);
  assert(
    assetFormatSplit.rows[0].n2d >= 1 && assetFormatSplit.rows[0].n3d >= 1,
    "asset キャラクター kind must cover both 2D and 3D formats",
  );

  const playerCounts = await db.query(`
    SELECT
      count(*) FILTER (WHERE cardinality(player_counts) > 0)::int AS populated,
      count(*) FILTER (WHERE cardinality(player_counts) = 0)::int AS empty
    FROM public.projects
    WHERE category = 'game' AND 'forge-ia-seed-v1' = ANY (coalesce(tags, '{}'))
  `);
  assert(
    playerCounts.rows[0].populated > 0 && playerCounts.rows[0].empty > 0,
    "game player_counts must be populated on some but not all rows",
  );

  const andHit = await db.query(`
    SELECT count(*)::int AS n FROM public.projects
    WHERE category = 'game'
      AND genres && ARRAY['ローグライク']::text[]
      AND tags && ARRAY['ピクセルアート']::text[]
  `);
  assert(andHit.rows[0].n >= 1, "genre+tag AND hit");

  const andZero = await db.query(`
    SELECT count(*)::int AS n FROM public.projects
    WHERE category = 'game'
      AND genres && ARRAY['ローグライク']::text[]
      AND tags && ARRAY['協力プレイ']::text[]
  `);
  assert(andZero.rows[0].n === 0, "genre+tag AND zero");

  const usable = await db.query(`
    SELECT count(*)::int AS n FROM public.projects
    WHERE 'forge-ia-seed-v1' = ANY (tags) AND usable_for_creation = true
  `);
  assert(usable.rows[0].n === 25, `usable_for_creation expected 25, got ${usable.rows[0].n}`);

  const pubDevlog = await db.query(`
    SELECT id, content FROM public.project_devlogs
    WHERE id::text LIKE '66666666-6666-4666-8666-%'
      AND published_version IS NOT NULL
    LIMIT 1
  `);
  assert(pubDevlog.rows.length === 1, "published seed devlog present");
  const id = pubDevlog.rows[0].id;
  let immutableBlocked = false;
  try {
    await db.exec(`
      UPDATE public.project_devlogs
      SET content = 'tamper attempt'
      WHERE id = '${id}'::uuid;
    `);
  } catch (error) {
    immutableBlocked = /immutable/i.test(String(error?.message || error));
  }
  assert(immutableBlocked, "immutable published devlog content must block UPDATE");

  await execSql(db, "five-category audit (read-only)", auditSql);

  console.log(
    JSON.stringify(
      {
        ok: true,
        seedFirst: "OK",
        seedRerun: "OK",
        seedRollbackAbort: "OK",
        inventory40: "OK",
        assetKindsAndFormats: "OK",
        playerCountsPartial: "OK",
        genreTagMatrix: "OK",
        usableForCreation25: "OK",
        immutableDevlog: "blocked",
        audit: "OK",
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error?.message || error);
  process.exit(1);
});
