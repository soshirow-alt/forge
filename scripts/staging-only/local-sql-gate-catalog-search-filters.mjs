/**
 * Local PGlite gate for migration 084 catalog search filters.
 * No Staging/Production writes.
 *
 * Usage: node scripts/staging-only/local-sql-gate-catalog-search-filters.mjs
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { PGlite } from "@electric-sql/pglite";

const root = resolve(".");
const migrationPath = resolve(
  root,
  "supabase/migrations/084_catalog_search_query_genres_tags.sql",
);

function mustExist(path) {
  if (!existsSync(path)) throw new Error(`missing file: ${path}`);
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

const fixture = `
DO $$ BEGIN
  CREATE ROLE anon NOLOGIN;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE ROLE authenticated NOLOGIN;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE ROLE service_role NOLOGIN;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE public.projects (
  id uuid PRIMARY KEY,
  title text NOT NULL,
  description text,
  category text,
  thumbnail_url text,
  creator text,
  owner_name text,
  genre text,
  genres text[],
  tags text[] NOT NULL DEFAULT '{}',
  purpose_tags text[] NOT NULL DEFAULT '{}',
  asset_kinds text[] NOT NULL DEFAULT '{}',
  stream_policy text DEFAULT 'unset',
  quick_try boolean DEFAULT false,
  usable_for_creation boolean DEFAULT false,
  looking_for_testers boolean DEFAULT false,
  visibility text NOT NULL DEFAULT 'public',
  first_published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.project_release_events (
  id bigserial PRIMARY KEY,
  project_id uuid NOT NULL,
  event_type text NOT NULL,
  source text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.project_devlogs (
  id bigserial PRIMARY KEY,
  project_id text NOT NULL,
  is_initial_publish boolean DEFAULT false,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS projects_genres_gin_idx
  ON public.projects USING gin (genres);

-- Prior 9-arg signature (pre-084) so DROP path is exercised
CREATE OR REPLACE FUNCTION public.get_public_projects_by_category(
  p_category text DEFAULT NULL,
  p_sort text DEFAULT 'newest',
  p_quick_try boolean DEFAULT NULL,
  p_feedback_wanted boolean DEFAULT NULL,
  p_usable_for_creation boolean DEFAULT NULL,
  p_stream_policy text DEFAULT NULL,
  p_asset_kind text DEFAULT NULL,
  p_limit integer DEFAULT 24,
  p_offset integer DEFAULT 0
)
RETURNS TABLE (
  project_id uuid,
  title text,
  description text,
  category text,
  thumbnail_url text,
  creator text,
  genres text[],
  tags text[],
  purpose_tags text[],
  asset_kinds text[],
  stream_policy text,
  quick_try boolean,
  usable_for_creation boolean,
  looking_for_testers boolean,
  first_published_at timestamptz,
  meaningful_update_at timestamptz
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    p.id,
    p.title,
    p.description,
    coalesce(p.category, 'game'),
    p.thumbnail_url,
    coalesce(nullif(btrim(p.creator), ''), p.owner_name),
    coalesce(p.genres, ARRAY[p.genre]::text[]),
    coalesce(p.tags, '{}'),
    coalesce(p.purpose_tags, '{}'),
    coalesce(p.asset_kinds, '{}'),
    coalesce(p.stream_policy, 'unset'),
    coalesce(p.quick_try, false),
    coalesce(p.usable_for_creation, false),
    coalesce(p.looking_for_testers, false),
    coalesce(p.first_published_at, p.created_at),
    coalesce(p.first_published_at, p.created_at)
  FROM public.projects p
  WHERE p.visibility = 'public'
  LIMIT greatest(1, least(coalesce(p_limit, 24), 60))
  OFFSET greatest(0, coalesce(p_offset, 0));
$$;

INSERT INTO public.projects (
  id, title, description, category, creator, genres, tags, visibility, first_published_at
) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Dragon RPG', 'epic quest', 'game', 'Alice', ARRAY['RPG','アクション'], ARRAY['ピクセルアート','pc'], 'public', now()),
  ('22222222-2222-2222-2222-222222222222', 'Calm BGM', 'relax track', 'audio', 'Bob', ARRAY[]::text[], ARRAY['癒し系'], 'public', now()),
  ('33333333-3333-3333-3333-333333333333', 'Secret Game', 'hidden', 'game', 'Carol', ARRAY['RPG'], ARRAY['ピクセルアート'], 'private', now()),
  ('44444444-4444-4444-4444-444444444444', 'Puzzle Soft', 'casual', 'game', 'Dana', ARRAY['パズル'], ARRAY['ソロ向け'], 'public', now());
`;

mustExist(migrationPath);
const migrationSql = readFileSync(migrationPath, "utf8");

// Deliberate mid-migration failure → full rollback (no partial signature/index)
{
  const dbFail = new PGlite();
  await execSql(dbFail, "rollback fixture", fixture);
  const brokenSql = migrationSql.replace(/\bCOMMIT\s*;\s*$/i, () => {
    return [
      "DO $$ BEGIN RAISE EXCEPTION 'forced catalog-search rollback'; END $$;",
      "COMMIT;",
    ].join("\n");
  });
  let failed = false;
  try {
    await dbFail.exec(brokenSql);
  } catch (error) {
    failed = /forced catalog-search rollback/i.test(String(error?.message || error));
    if (!failed) throw error;
  }
  if (!failed) {
    throw new Error("expected forced rollback failure");
  }
  try {
    await dbFail.exec("ROLLBACK;");
  } catch {
    // already rolled back
  }
  const sigs = await dbFail.query(`
    SELECT pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'get_public_projects_by_category'
  `);
  const argList = sigs.rows.map((row) => row.args);
  const hasTextArray = argList.some((args) => String(args).includes("text[]"));
  const hasNineArgShape = argList.some((args) => {
    const normalized = String(args).replace(/\b\w+\s+/g, "");
    return (
      normalized ===
      "text, text, boolean, boolean, boolean, text, text, integer, integer"
    );
  });
  if (!hasNineArgShape) {
    throw new Error(
      `rollback lost pre-084 9-arg signature; found=${JSON.stringify(argList)}`,
    );
  }
  if (hasTextArray) {
    throw new Error("rollback left 084 signature behind");
  }
  const idxFail = await dbFail.query(
    `SELECT 1 FROM pg_indexes WHERE indexname = 'projects_tags_gin_idx'`,
  );
  if (idxFail.rows.length !== 0) {
    throw new Error("rollback left projects_tags_gin_idx behind");
  }
  console.log("OK  forced failure rollback");
  await dbFail.close();
}

const db = new PGlite();
await execSql(db, "fixture schema + seed", fixture);
await execSql(db, "084 first apply", migrationSql);
await execSql(db, "084 re-run (idempotent)", migrationSql);

const byQuery = await db.query(
  `SELECT title FROM get_public_projects_by_category(p_query := 'Dragon')`,
);
if (byQuery.rows.length !== 1 || byQuery.rows[0].title !== "Dragon RPG") {
  throw new Error(`query filter unexpected: ${JSON.stringify(byQuery.rows)}`);
}
console.log("OK  query filter");

const byGenre = await db.query(
  `SELECT title FROM get_public_projects_by_category(
     p_category := 'game',
     p_genres := ARRAY['RPG']
   ) ORDER BY title`,
);
const genreTitles = byGenre.rows.map((r) => r.title).sort();
if (JSON.stringify(genreTitles) !== JSON.stringify(["Dragon RPG"])) {
  // Puzzle Soft is puzzle-only; Secret is private
  throw new Error(`genre filter unexpected: ${JSON.stringify(genreTitles)}`);
}
console.log("OK  genre filter");

const byTag = await db.query(
  `SELECT title FROM get_public_projects_by_category(
     p_category := 'game',
     p_tags := ARRAY['ピクセルアート']
   )`,
);
if (byTag.rows.length !== 1 || byTag.rows[0].title !== "Dragon RPG") {
  throw new Error(`tag filter unexpected: ${JSON.stringify(byTag.rows)}`);
}
console.log("OK  tag filter");

const combined = await db.query(
  `SELECT title FROM get_public_projects_by_category(
     p_category := 'game',
     p_query := 'epic',
     p_genres := ARRAY['RPG','アクション'],
     p_tags := ARRAY['ピクセルアート']
   )`,
);
if (combined.rows.length !== 1 || combined.rows[0].title !== "Dragon RPG") {
  throw new Error(`combined filter unexpected: ${JSON.stringify(combined.rows)}`);
}
console.log("OK  combined q+genre+tag");

const privateLeak = await db.query(
  `SELECT title FROM get_public_projects_by_category(p_query := 'Secret')`,
);
if (privateLeak.rows.length !== 0) {
  throw new Error("private project leaked");
}
console.log("OK  private not leaked");

const idx = await db.query(
  `SELECT 1 FROM pg_indexes WHERE indexname = 'projects_tags_gin_idx'`,
);
if (idx.rows.length !== 1) {
  throw new Error("missing projects_tags_gin_idx");
}
console.log("OK  tags gin index");

const injection = await db.query(
  `SELECT title FROM get_public_projects_by_category(p_query := '%')`,
);
// escaped % should not match everything as wildcard alone in pattern... pattern is \%\% so literal %
// titles don't contain %, expect 0
if (injection.rows.length !== 0) {
  throw new Error(`unexpected wildcard leak: ${JSON.stringify(injection.rows)}`);
}
console.log("OK  query escape");

const explainGenre = await db.query(`
  EXPLAIN (FORMAT TEXT)
  SELECT id FROM public.projects
  WHERE visibility = 'public' AND genres && ARRAY['RPG']::text[]
`);
const genrePlan = explainGenre.rows.map((r) => Object.values(r)[0]).join("\n");
if (!/projects_genres_gin_idx|Bitmap Index Scan|Bitmap Heap Scan|gin/i.test(genrePlan)) {
  console.warn("WARN genre EXPLAIN (PGlite may omit names):\n", genrePlan);
}
// Assert index-compatible predicate exists in migration source
if (!/OR p\.genres && p_genres/.test(migrationSql) || !/OR p\.tags && p_tags/.test(migrationSql)) {
  throw new Error("migration must use index-compatible genres/tags && predicates");
}
console.log("OK  index-compatible predicates + EXPLAIN sampled");

console.log("local-sql-gate-catalog-search-filters PASS");
await db.close();
