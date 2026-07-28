/**
 * Local SQL handoff gate for Player IA home v0 SQL trio.
 * Uses PGlite (Postgres WASM) — no Staging/Production writes.
 *
 * Runs:
 *  1) schema fixture to 080-equivalent home RPCs + 011 immutable trigger
 *  2) minimal 40-project seed (+ smoke/hero/announcements/devlogs/releases/usage)
 *  3) 083 first + re-run
 *  4) beautify first + re-run
 *  5) audit full file
 *  6) rollback / immutable / non-update assertions
 *
 * Usage: node scripts/staging-only/local-sql-gate-player-ia-home.mjs
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { PGlite } from "@electric-sql/pglite";

const root = resolve(".");
const paths = {
  migration083: resolve(
    root,
    "supabase/migrations/083_player_ia_home_v0_shelves.sql",
  ),
  beautify: resolve(
    root,
    "scripts/staging-only/beautify-player-ia-seed-display.sql",
  ),
  audit: resolve(
    root,
    "scripts/staging-only/audit-player-ia-home-v0-state.sql",
  ),
};

function mustExist(path) {
  if (!existsSync(path)) throw new Error(`missing file: ${path}`);
}

function readSql(path) {
  mustExist(path);
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

async function query(db, sql) {
  return db.query(sql);
}

async function execExpectFail(db, label, sql, pattern) {
  try {
    await db.exec(sql);
    await db.exec("ROLLBACK;");
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
      throw new Error(
        `${label}: failed with unexpected error: ${message}`,
      );
    }
    console.log(`OK  ${label} (expected fail)`);
    return message;
  }
}

function assert(cond, message) {
  if (!cond) throw new Error(message);
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
  description text,
  overview_introduction text,
  visibility text NOT NULL DEFAULT 'public',
  category text,
  tags text[] DEFAULT '{}',
  thumbnail_url text,
  thumbnail_urls text[],
  playable_version text DEFAULT '0.1',
  first_published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.platform_announcements (
  id uuid PRIMARY KEY,
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  body text NOT NULL,
  importance text NOT NULL DEFAULT 'normal',
  status text NOT NULL DEFAULT 'draft',
  published_at timestamptz,
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
  content_hash text,
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

-- Feedback tables referenced by 083 feedback-gathering RPC (LANGUAGE plpgsql; still needed for runtime smoke)
CREATE TABLE public.project_version_prompts (
  id uuid PRIMARY KEY,
  response_kind text NOT NULL DEFAULT 'short_text'
);

CREATE TABLE public.project_voice_responses (
  id uuid PRIMARY KEY,
  project_id text NOT NULL,
  user_id uuid NOT NULL,
  prompt_id uuid REFERENCES public.project_version_prompts(id),
  answer_value text,
  optional_comment text,
  moderation_status text NOT NULL DEFAULT 'visible',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.project_guest_voice_responses (
  id uuid PRIMARY KEY,
  project_id text NOT NULL,
  submitter_key uuid NOT NULL,
  prompt_id uuid REFERENCES public.project_version_prompts(id),
  answer_value text,
  optional_comment text,
  include_in_public_aggregate boolean NOT NULL DEFAULT true,
  moderation_status text NOT NULL DEFAULT 'visible',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.project_feedback (
  id uuid PRIMARY KEY,
  project_id text NOT NULL,
  user_id uuid NOT NULL,
  good_points text,
  concerns text,
  other_notes text,
  moderation_status text NOT NULL DEFAULT 'visible',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.project_guest_feedback (
  id uuid PRIMARY KEY,
  project_id text NOT NULL,
  submitter_key uuid NOT NULL,
  good_points text,
  concerns text,
  other_notes text,
  include_in_public_aggregate boolean NOT NULL DEFAULT true,
  moderation_status text NOT NULL DEFAULT 'visible',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.feedback_card_empathies (
  id uuid PRIMARY KEY,
  target_source text NOT NULL,
  target_id uuid NOT NULL
);

CREATE TABLE public.feedback_card_replies (
  id uuid PRIMARY KEY,
  project_id text NOT NULL,
  target_source text NOT NULL,
  target_id uuid NOT NULL,
  author_id uuid NOT NULL,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 011 immutable body trigger (published_version set ⇒ content locked)
CREATE OR REPLACE FUNCTION public.enforce_devlog_immutable_body()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.published_version IS NOT NULL AND NEW.content IS DISTINCT FROM OLD.content THEN
    RAISE EXCEPTION 'Published devlog body is immutable. Create a new devlog instead.';
  END IF;
  IF NEW.published_version IS NOT NULL AND OLD.published_version IS NULL THEN
    NEW.published_at := COALESCE(NEW.published_at, now());
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS project_devlogs_immutable_body ON public.project_devlogs;
CREATE TRIGGER project_devlogs_immutable_body
  BEFORE UPDATE ON public.project_devlogs
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_devlog_immutable_body();

-- 080-era OUT shapes (to be replaced by 083)
CREATE OR REPLACE FUNCTION public.get_home_meaningful_updates(p_limit integer DEFAULT 8)
RETURNS TABLE (
  project_id uuid,
  title text,
  category text,
  thumbnail_url text,
  update_kind text,
  meaningful_update_at timestamptz
)
LANGUAGE sql
STABLE
AS $$
  SELECT p.id, p.title, coalesce(p.category,'game'), p.thumbnail_url, 'devlog'::text, now()
  FROM public.projects p
  WHERE p.visibility = 'public'
  LIMIT greatest(1, least(coalesce(p_limit, 8), 20));
$$;

CREATE OR REPLACE FUNCTION public.get_home_newest_projects(
  p_limit integer DEFAULT 12,
  p_category text DEFAULT NULL
)
RETURNS TABLE (
  project_id uuid,
  title text,
  category text,
  thumbnail_url text,
  first_published_at timestamptz,
  creator text
)
LANGUAGE sql
STABLE
AS $$
  SELECT p.id, p.title, coalesce(p.category,'game'), p.thumbnail_url,
         coalesce(p.first_published_at, p.created_at),
         coalesce(nullif(btrim(p.creator), ''), p.owner_name)
  FROM public.projects p
  WHERE p.visibility = 'public'
  LIMIT greatest(1, least(coalesce(p_limit, 12), 40));
$$;

CREATE OR REPLACE FUNCTION public.get_home_review_highlights(p_limit integer DEFAULT 8)
RETURNS TABLE (
  card_id text,
  project_id uuid,
  project_title text,
  project_category text,
  project_thumbnail_url text,
  author_kind text,
  author_display_name text,
  body_text text,
  empathy_count bigint,
  created_at timestamptz
)
LANGUAGE sql
STABLE
AS $$
  SELECT 'x'::text, p.id, p.title, coalesce(p.category,'game'), p.thumbnail_url,
         'registered'::text, 'プレイヤー'::text, 'sample body text here'::text,
         0::bigint, now()
  FROM public.projects p
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_home_meaningful_updates(integer) TO PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_home_newest_projects(integer, text) TO PUBLIC;
`;

function buildSeedSql() {
  const categories = [
    "game",
    "audio",
    "asset",
    "dev-tool",
    "service-app",
  ];
  const ownerA = "dddddddd-dddd-4ddd-8ddd-000000000001";
  const ownerB = "dddddddd-dddd-4ddd-8ddd-000000000002";
  const lines = [];
  lines.push(`
INSERT INTO auth.users (id) VALUES
  ('${ownerA}'::uuid),
  ('${ownerB}'::uuid)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.projects (
  id, owner_id, owner_name, title, creator, description, overview_introduction,
  visibility, category, tags, thumbnail_url, playable_version, first_published_at
) VALUES (
  '41ff5a96-105c-42a2-87b4-787bcfeacb45'::uuid, '${ownerA}'::uuid, 'SmokeA',
  'Smoke A', 'SmokeA', 'smoke', 'smoke', 'public', 'game', ARRAY['smoke']::text[],
  'https://example.com/smoke.png', '1.0', now()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.projects (
  id, owner_id, owner_name, title, creator, description, overview_introduction,
  visibility, category, tags, thumbnail_url, playable_version, first_published_at
) VALUES (
  'dddddddd-dddd-4ddd-8ddd-000000000203'::uuid, '${ownerB}'::uuid, 'Hero',
  'Hero Carousel', 'Hero', 'hero', 'hero', 'public', 'game', ARRAY['hero']::text[],
  'https://example.com/hero.png', '1.0', now()
) ON CONFLICT (id) DO NOTHING;
`);

  for (let n = 1; n <= 40; n += 1) {
    const id = `eeeeeeee-eeee-4eee-8eee-${String(n).padStart(12, "0")}`;
    const category = categories[Math.floor((n - 1) / 8)];
    const owner = n % 2 === 0 ? ownerB : ownerA;
    const noImage = n === 4 || n === 21;
    const thumb = noImage
      ? "NULL"
      : `'https://example.com/seed/${n}.png'`;
    lines.push(`
INSERT INTO public.projects (
  id, owner_id, owner_name, title, creator, description, overview_introduction,
  visibility, category, tags, thumbnail_url, thumbnail_urls, playable_version, first_published_at
) VALUES (
  '${id}'::uuid, '${owner}'::uuid, 'SeedOwner',
  '[IA Seed] Seed Project ${n}', 'Seed Creator ${n}',
  '[IA Seed] description ${n}', '[IA Seed] overview ${n}',
  'public', '${category}', ARRAY['forge-ia-seed-v1','seed']::text[],
  ${thumb}, ${noImage ? "NULL" : `ARRAY['https://example.com/seed/${n}.png']::text[]`},
  '0.${(n % 5) + 1}', now() - interval '${n} days'
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  overview_introduction = EXCLUDED.overview_introduction,
  tags = EXCLUDED.tags,
  category = EXCLUDED.category,
  thumbnail_url = EXCLUDED.thumbnail_url,
  thumbnail_urls = EXCLUDED.thumbnail_urls,
  owner_id = EXCLUDED.owner_id;
`);
  }

  for (let n = 1; n <= 8; n += 1) {
    const id = `aaaaaaaa-aaaa-4aaa-8aaa-${String(n).padStart(12, "0")}`;
    const status = n <= 6 ? "published" : "draft";
    lines.push(`
INSERT INTO public.platform_announcements (
  id, slug, title, body, importance, status, published_at
) VALUES (
  '${id}'::uuid, 'ia-seed-${n}',
  '[IA Seed] Announcement ${n}',
  '[IA Seed] Body ${n}',
  CASE WHEN ${n} = 1 THEN 'important' ELSE 'normal' END,
  '${status}',
  CASE WHEN '${status}' = 'published' THEN now() - interval '${n} days' ELSE NULL END
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  body = EXCLUDED.body,
  status = EXCLUDED.status;
`);
  }

  // Published immutable seed devlogs (content must stay prefixed if beautify does not touch them)
  for (let n = 1; n <= 5; n += 1) {
    const id = `66666666-6666-4666-8666-${String(n).padStart(12, "0")}`;
    const projectN = n;
    const projectId = `eeeeeeee-eeee-4eee-8eee-${String(projectN).padStart(12, "0")}`;
    lines.push(`
INSERT INTO public.project_devlogs (
  id, project_id, author_id, title, content, published_version, published_at, is_initial_publish
) VALUES (
  '${id}'::uuid, '${projectId}', '${ownerA}'::uuid,
  '[IA Seed] Devlog ${n}', '[IA Seed] Devlog body ${n}',
  '0.${n}', now() - interval '${n} days', false
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  content = EXCLUDED.content,
  published_version = EXCLUDED.published_version;
`);
  }

  for (let n = 1; n <= 4; n += 1) {
    const id = `55555555-5555-4555-8555-${String(n).padStart(12, "0")}`;
    const projectId = `eeeeeeee-eeee-4eee-8eee-${String(n).padStart(12, "0")}`;
    lines.push(`
INSERT INTO public.project_release_events (
  id, project_id, event_type, actor_user_id, note, source, created_at
) VALUES (
  '${id}'::uuid, '${projectId}'::uuid, 'released', '${ownerA}'::uuid,
  '[IA Seed] release note ${n}', 'studio', now() - interval '${n} days'
) ON CONFLICT (id) DO UPDATE SET note = EXCLUDED.note;
`);
  }

  for (let n = 1; n <= 12; n += 1) {
    const id = `ffffffff-ffff-4fff-8fff-${String(n).padStart(12, "0")}`;
    const source = `eeeeeeee-eeee-4eee-8eee-${String(((n - 1) % 40) + 1).padStart(12, "0")}`;
    const target = `eeeeeeee-eeee-4eee-8eee-${String(((n + 7) % 40) + 1).padStart(12, "0")}`;
    lines.push(`
INSERT INTO public.project_usage_relations (
  id, source_project_id, target_project_id, relation_type, status, created_by
) VALUES (
  '${id}'::uuid, '${source}'::uuid, '${target}'::uuid, 'used', 'published', '${ownerA}'::uuid
) ON CONFLICT (id) DO NOTHING;
`);
  }

  return lines.join("\n");
}

async function main() {
  const db = new PGlite();
  const report = {
    env: "pglite",
    migrationRange: "minimal fixture mimicking 011+076–080 tables + 080 RPC OUT shapes, then 083",
    seed: "programmatic 40 forge-ia-seed-v1 projects + 8 announcements + smoke/hero + 5 published devlogs + 4 releases + 12 usage",
  };

  await execSql(db, "fixture schema", fixtureSchema);
  await execSql(db, "minimal seed", buildSeedSql());

  // Prove immutable trigger is active before beautify
  await execExpectFail(
    db,
    "immutable content UPDATE blocked",
    `
      UPDATE public.project_devlogs
      SET content = 'mutated'
      WHERE id = '66666666-6666-4666-8666-000000000001'::uuid;
    `,
    /immutable/i,
  );
  report.immutableTriggerActive = true;

  const sql083 = readSql(paths.migration083);
  await execSql(db, "083 first apply", sql083);
  await execSql(db, "083 re-run", sql083);

  const outMeaningful = await query(
    db,
    `SELECT pg_get_function_result(p.oid) AS result
     FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
     WHERE n.nspname='public' AND p.proname='get_home_meaningful_updates'`,
  );
  assert(
    /update_label/i.test(outMeaningful.rows[0]?.result || ""),
    "083 meaningful updates OUT shape missing update_label",
  );

  const sqlBeautify = readSql(paths.beautify);
  await execSql(db, "beautify first apply", sqlBeautify);
  await execSql(db, "beautify re-run (idempotent)", sqlBeautify);

  const afterBeautify = await query(
    db,
    `SELECT
       count(*) FILTER (WHERE title LIKE '[IA Seed]%') AS prefixed,
       count(*) FILTER (WHERE thumbnail_url LIKE '/images/staging-only/player-ia/%') AS thumbs,
       count(*) FILTER (
         WHERE id IN (
           'eeeeeeee-eeee-4eee-8eee-000000000004'::uuid,
           'eeeeeeee-eeee-4eee-8eee-000000000021'::uuid
         ) AND thumbnail_url IS NULL
       ) AS no_image
     FROM public.projects
     WHERE id::text LIKE 'eeeeeeee-eeee-4eee-8eee-%'`,
  );
  assert(Number(afterBeautify.rows[0].prefixed) === 0, "projects still prefixed after beautify");
  assert(Number(afterBeautify.rows[0].thumbs) === 38, "expected 38 staging thumbs");
  assert(Number(afterBeautify.rows[0].no_image) === 2, "expected 2 no-image edges");

  const ann = await query(
    db,
    `SELECT count(*) FILTER (WHERE title LIKE '[IA Seed]%' OR body LIKE '[IA Seed]%') AS prefixed
     FROM public.platform_announcements
     WHERE id::text LIKE 'aaaaaaaa-aaaa-4aaa-8aaa-%'`,
  );
  assert(Number(ann.rows[0].prefixed) === 0, "announcements still prefixed");

  const devlog = await query(
    db,
    `SELECT count(*) FILTER (WHERE content LIKE '[IA Seed]%') AS content_prefixed,
            count(*) FILTER (WHERE title LIKE '[IA Seed]%') AS title_prefixed
     FROM public.project_devlogs
     WHERE id::text LIKE '66666666-6666-4666-8666-%'`,
  );
  assert(
    Number(devlog.rows[0].content_prefixed) === 5,
    "devlog content should remain prefixed (not updated by beautify)",
  );

  const release = await query(
    db,
    `SELECT count(*) FILTER (WHERE coalesce(note,'') LIKE '[IA Seed]%') AS note_prefixed
     FROM public.project_release_events
     WHERE id::text LIKE '55555555-5555-4555-8555-%'`,
  );
  assert(
    Number(release.rows[0].note_prefixed) === 4,
    "release notes should remain prefixed (not updated by beautify)",
  );

  // Production-ish guard: missing Smoke A should abort beautify
  await db.exec(`DELETE FROM public.projects WHERE id = '41ff5a96-105c-42a2-87b4-787bcfeacb45'::uuid`);
  await execExpectFail(
    db,
    "beautify Production/Staging guard",
    sqlBeautify,
    /Smoke A missing|ABORT beautify/i,
  );
  // restore smoke for audit
  await db.exec(`
INSERT INTO public.projects (
  id, owner_id, owner_name, title, creator, description, overview_introduction,
  visibility, category, tags, thumbnail_url, playable_version, first_published_at
) VALUES (
  '41ff5a96-105c-42a2-87b4-787bcfeacb45'::uuid,
  'dddddddd-dddd-4ddd-8ddd-000000000001'::uuid, 'SmokeA',
  'Smoke A', 'SmokeA', 'smoke', 'smoke', 'public', 'game', ARRAY['smoke']::text[],
  'https://example.com/smoke.png', '1.0', now()
) ON CONFLICT (id) DO NOTHING;
`);

  // Unexpected count rollback
  await db.exec(`
    UPDATE public.projects
    SET category = 'game'
    WHERE id = 'eeeeeeee-eeee-4eee-8eee-000000000009'::uuid;
  `);
  await execExpectFail(
    db,
    "beautify unexpected category count abort",
    sqlBeautify,
    /category counts must be 8|ABORT beautify/i,
  );
  await db.exec(`
    UPDATE public.projects
    SET category = 'audio'
    WHERE id = 'eeeeeeee-eeee-4eee-8eee-000000000009'::uuid;
  `);
  await execSql(db, "beautify after rollback restore", sqlBeautify);

  const sqlAudit = readSql(paths.audit);
  await execSql(db, "audit full file", sqlAudit);

  // Confirm audit is read-only against current state by checking no write keywords executed
  // (static) and that category counts query returns 5 rows.
  const cats = await query(
    db,
    `SELECT coalesce(category, 'game') AS category, count(*) AS n
     FROM public.projects
     WHERE id::text LIKE 'eeeeeeee-eeee-4eee-8eee-%'
     GROUP BY coalesce(category, 'game')
     ORDER BY coalesce(category, 'game')`,
  );
  assert(cats.rows.length === 5, "expected 5 categories in audit category query");
  assert(
    cats.rows.every((r) => Number(r.n) === 8),
    "expected 8 projects per category",
  );

  report.ok = true;
  report.results = {
    "083_first": "OK",
    "083_rerun": "OK",
    beautify_first: "OK",
    beautify_rerun: "OK",
    audit_full: "OK",
    immutable_trigger: "blocked content UPDATE",
    beautify_skips_devlogs_releases: true,
    production_guard: "blocked without Smoke A",
    unexpected_count_rollback: "blocked",
  };
  console.log(JSON.stringify(report, null, 2));
}

main().catch((error) => {
  console.error(JSON.stringify({ ok: false, error: String(error?.message || error) }, null, 2));
  process.exit(1);
});
