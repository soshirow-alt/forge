/**
 * Local SQL handoff gate for Player IA home v0 SQL trio.
 * Uses PGlite (Postgres WASM) — no Staging/Production writes.
 *
 * Fixture scope (intentional limits vs full Staging):
 *  - Matches real schema for beautify/audit safety: thumbnail_urls text[] NOT NULL DEFAULT '{}',
 *    011 immutable published-devlog trigger, 083 DROP+CREATE OUT shapes, seed UUID/tag prefixes.
 *  - Does NOT clone full Staging RLS, Storage, auth, or non-seed inventory.
 *  - Inventory counts match player-ia-staging-seed-README.md basic seed coverage.
 *  - PGlite PASS does not guarantee live Staging apply success (owner still runs SQL Editor).
 *
 * Runs:
 *  1) schema fixture + inventory seed
 *  2) 083 first + re-run
 *  3) beautify first + re-run
 *  4) audit full file
 *  5) Production guard / incomplete counts / rollback / immutable / non-seed asserts
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
  imagesDir: resolve(root, "public/images/staging-only/player-ia"),
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

function extractGateAssert(auditSql, name) {
  const marker = `-- GATE_ASSERT:${name}`;
  const start = auditSql.indexOf(marker);
  if (start < 0) throw new Error(`missing GATE_ASSERT marker: ${name}`);
  const after = auditSql.slice(start);
  const withStart = after.search(/\bWITH\b/);
  const selectStart = after.search(/\bSELECT\b/);
  let stmtStart = -1;
  if (withStart >= 0 && (selectStart < 0 || withStart < selectStart)) {
    stmtStart = start + withStart;
  } else if (selectStart >= 0) {
    stmtStart = start + selectStart;
  }
  if (stmtStart < 0) throw new Error(`missing WITH/SELECT after GATE_ASSERT:${name}`);
  const rest = auditSql.slice(stmtStart);
  const endMatch = rest.search(/;\s*(?:\r?\n|$)/);
  if (endMatch < 0) throw new Error(`unterminated GATE_ASSERT:${name}`);
  return rest.slice(0, endMatch + 1);
}

async function assertGateVerdict(db, auditSql, name, expected, label = name) {
  const sql = extractGateAssert(auditSql, name);
  const res = await query(db, sql);
  const verdict = res.rows[0]?.verdict;
  assert(
    verdict === expected,
    `${label}: verdict=${verdict} expected=${expected}`,
  );
  console.log(`OK  audit assert ${label}=${expected}`);
}

const fixtureSchema = `
-- PGlite fixture: minimal tables/constraints needed to validate 083 + beautify + audit.
-- Real Staging also has RLS/Storage/auth complexity not modeled here.
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
  -- Matches migration 035: text[] NOT NULL DEFAULT '{}'
  thumbnail_urls text[] NOT NULL DEFAULT '{}',
  playable_version text DEFAULT '0.1',
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
  project_id text NOT NULL,
  target_source text NOT NULL CHECK (
    target_source IN (
      'registered_voice',
      'guest_voice',
      'registered_detailed',
      'guest_detailed'
    )
  ),
  target_id uuid NOT NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, target_source, target_id)
);

CREATE TABLE public.feedback_card_replies (
  id uuid PRIMARY KEY,
  project_id text NOT NULL,
  target_source text NOT NULL CHECK (
    target_source IN (
      'registered_voice',
      'guest_voice',
      'registered_detailed',
      'guest_detailed'
    )
  ),
  target_id uuid NOT NULL,
  author_id uuid NOT NULL REFERENCES auth.users(id),
  body text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 200),
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
`);

  // Extra users for empathy UNIQUE(user_id, target_source, target_id)
  for (let u = 101; u <= 110; u += 1) {
    const uid = `dddddddd-dddd-4ddd-8ddd-${String(u).padStart(12, "0")}`;
    lines.push(
      `INSERT INTO auth.users (id) VALUES ('${uid}'::uuid) ON CONFLICT (id) DO NOTHING;`,
    );
  }

  lines.push(`
INSERT INTO public.projects (
  id, owner_id, owner_name, title, creator, description, overview_introduction,
  visibility, category, tags, thumbnail_url, thumbnail_urls, playable_version, first_published_at
) VALUES (
  '41ff5a96-105c-42a2-87b4-787bcfeacb45'::uuid, '${ownerA}'::uuid, 'SmokeA',
  'Smoke A', 'SmokeA', 'smoke', 'smoke', 'public', 'game', ARRAY['smoke']::text[],
  'https://example.com/smoke.png', ARRAY['https://example.com/smoke.png']::text[],
  '1.0', now()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.developer_profiles (user_id, creator_id, public_name) VALUES
  ('${ownerA}'::uuid, 'hc-dev-b-forge-st-hero-carousel-v1', 'HC Dev B'),
  ('${ownerB}'::uuid, 'hc-dev-c-forge-st-hero-carousel-v1', 'HC Dev C')
ON CONFLICT (user_id) DO NOTHING;
`);

  // Exact pairs from player-ia-auth-seed.ts (n=1..20)
  const dedicatedCanon = [
    ["01", "ゲーム職人"],
    ["02", "ホラー好きDev"],
    ["03", "Unity屋"],
    ["04", "UEクリエイター"],
    ["05", "Godot民"],
    ["06", "配信者A"],
    ["07", "配信者B"],
    ["08", "ドット絵師"],
    ["09", "3Dキャラ職人"],
    ["10", "BGM制作"],
    ["11", "SE職人"],
    ["12", "ツール屋"],
    ["13", "サービス開発"],
    ["14", "分析屋"],
    ["15", "Bot作者"],
    ["16", "マルチA"],
    ["17", "マルチB"],
    ["18", "テスト募集"],
    ["19", "制作に使える派"],
    ["20", "超長い制作者プロフィール名の折り返し検証用ABCDEFG"],
  ];
  for (const [nn] of dedicatedCanon) {
    const uid = `a1a1a1a1-a1a1-41a1-81a1-${nn.padStart(12, "0")}`;
    lines.push(
      `INSERT INTO auth.users (id) VALUES ('${uid}'::uuid) ON CONFLICT (id) DO NOTHING;`,
    );
  }
  // Negatives: prefix-only mismatch + user-only mismatch + unrelated
  lines.push(`
INSERT INTO auth.users (id) VALUES
  ('cccccccc-cccc-4ccc-8ccc-000000000001'::uuid),
  ('a1a1a1a1-a1a1-41a1-81a1-000000000099'::uuid),
  ('bbbbbbbb-bbbb-4bbb-8bbb-000000009999'::uuid)
ON CONFLICT (id) DO NOTHING;
`);
  for (const [nn, natural] of dedicatedCanon) {
    const uid = `a1a1a1a1-a1a1-41a1-81a1-${nn.padStart(12, "0")}`;
    const creatorId = `ia-seed-dev-${nn}`;
    const seededName = `IA Seed ${natural}`.replace(/'/g, "''");
    lines.push(`
INSERT INTO public.developer_profiles (user_id, creator_id, public_name) VALUES
  ('${uid}'::uuid, '${creatorId}', '${seededName}')
ON CONFLICT (user_id) DO UPDATE SET
  creator_id = EXCLUDED.creator_id,
  public_name = EXCLUDED.public_name;
`);
  }
  lines.push(`
-- Negative: ia-seed-dev prefix but non-a1a1 user_id
INSERT INTO public.developer_profiles (user_id, creator_id, public_name) VALUES
  ('cccccccc-cccc-4ccc-8ccc-000000000001'::uuid, 'ia-seed-dev-99', 'IA Seed PrefixOnly Trap')
ON CONFLICT (user_id) DO UPDATE SET
  creator_id = EXCLUDED.creator_id,
  public_name = EXCLUDED.public_name;

-- Negative: a1a1-like user_id but creator_id not in allowlist
INSERT INTO public.developer_profiles (user_id, creator_id, public_name) VALUES
  ('a1a1a1a1-a1a1-41a1-81a1-000000000099'::uuid, 'not-ia-seed-dev', 'IA Seed UserOnly Trap')
ON CONFLICT (user_id) DO UPDATE SET
  creator_id = EXCLUDED.creator_id,
  public_name = EXCLUDED.public_name;

INSERT INTO public.developer_profiles (user_id, creator_id, public_name) VALUES
  ('bbbbbbbb-bbbb-4bbb-8bbb-000000009999'::uuid, 'unrelated-dev', 'Unrelated Studio')
ON CONFLICT (user_id) DO UPDATE SET
  creator_id = EXCLUDED.creator_id,
  public_name = EXCLUDED.public_name;

INSERT INTO public.projects (
  id, owner_id, owner_name, title, creator, description, overview_introduction,
  visibility, category, tags, thumbnail_url, thumbnail_urls, playable_version, first_published_at
) VALUES (
  'dddddddd-dddd-4ddd-8ddd-000000000203'::uuid, '${ownerB}'::uuid, 'Hero',
  'Hero Carousel', 'Hero', 'hero', 'hero', 'public', 'game', ARRAY['hero']::text[],
  'https://example.com/hero.png', ARRAY['https://example.com/hero.png']::text[],
  '1.0', now()
) ON CONFLICT (id) DO NOTHING;
`);

  for (let n = 1; n <= 40; n += 1) {
    const id = `eeeeeeee-eeee-4eee-8eee-${String(n).padStart(12, "0")}`;
    const category = categories[Math.floor((n - 1) / 8)];
    const owner = n % 2 === 0 ? ownerB : ownerA;
    const ownerLabel = n % 2 === 0 ? "IA Seed Owner B" : "IA Seed Owner A";
    const longEdge = n === 8 || n === 39;
    const longCreator = n === 8
      ? "IA Seed 超長い制作者表示名の折り返し検証用サンプルネームABCDEFG"
      : ownerLabel;
    const description = longEdge
      ? `'[IA Seed] 長い説明文エッジケースです。検索ヒット・カード展開・詳細ページでの折り返しを確認します。短編のテンポと導線の話を中心に書きつつ、本文は通常の作品紹介として読める長さにしています。ああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああ'`
      : `'[IA Seed] Seed Project ${n} — Staging専用架空作品。'`;
    const noImage = n === 4 || n === 21;
    const thumb = noImage
      ? "NULL"
      : `'https://example.com/seed/${n}.png'`;
    const thumbs = noImage
      ? `'{}'::text[]`
      : `ARRAY['https://example.com/seed/${n}.png']::text[]`;
    lines.push(`
INSERT INTO public.projects (
  id, owner_id, owner_name, title, creator, description, overview_introduction,
  visibility, category, tags, thumbnail_url, thumbnail_urls, playable_version, first_published_at
) VALUES (
  '${id}'::uuid, '${owner}'::uuid, '${longCreator.replace(/'/g, "''")}',
  '[IA Seed] Seed Project ${n}', '${longCreator.replace(/'/g, "''")}',
  ${description}, '[IA Seed] overview ${n}',
  'public', '${category}', ARRAY['forge-ia-seed-v1','seed']::text[],
  ${thumb}, ${thumbs},
  '0.${(n % 5) + 1}', now() - interval '${n} days'
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  overview_introduction = EXCLUDED.overview_introduction,
  tags = EXCLUDED.tags,
  category = EXCLUDED.category,
  thumbnail_url = EXCLUDED.thumbnail_url,
  thumbnail_urls = EXCLUDED.thumbnail_urls,
  owner_id = EXCLUDED.owner_id,
  owner_name = EXCLUDED.owner_name,
  creator = EXCLUDED.creator;
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

  for (let n = 1; n <= 45; n += 1) {
    const id = `66666666-6666-4666-8666-${String(n).padStart(12, "0")}`;
    const projectN = ((n - 1) % 40) + 1;
    const projectId = `eeeeeeee-eeee-4eee-8eee-${String(projectN).padStart(12, "0")}`;
    // Real seed: 17 published_version set, 28 NULL
    const publishedVersion = n <= 17 ? `'0.${(n % 9) + 1}'` : "NULL";
    lines.push(`
INSERT INTO public.project_devlogs (
  id, project_id, author_id, title, content, published_version, published_at, is_initial_publish
) VALUES (
  '${id}'::uuid, '${projectId}', '${ownerA}'::uuid,
  '[IA Seed] Devlog ${n}', '[IA Seed] Devlog body ${n}',
  ${publishedVersion}, now() - interval '${n} days', false
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  content = EXCLUDED.content,
  published_version = EXCLUDED.published_version;
`);
  }

  for (let n = 1; n <= 8; n += 1) {
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

  for (let n = 1; n <= 31; n += 1) {
    const id = `99999999-9999-4999-8999-${String(n).padStart(12, "0")}`;
    const projectN = ((n - 1) % 40) + 1;
    const projectId = `eeeeeeee-eeee-4eee-8eee-${String(projectN).padStart(12, "0")}`;
    lines.push(`
INSERT INTO public.project_feedback (
  id, project_id, user_id, good_points, concerns, moderation_status
) VALUES (
  '${id}'::uuid, '${projectId}', '${ownerB}'::uuid,
  'good ${n}', 'concern ${n}', 'visible'
) ON CONFLICT (id) DO NOTHING;
`);
  }

  for (let n = 1; n <= 7; n += 1) {
    const id = `bbbbbbbb-bbbb-4bbb-8bbb-${String(n).padStart(12, "0")}`;
    const projectN = ((n - 1) % 40) + 1;
    const projectId = `eeeeeeee-eeee-4eee-8eee-${String(projectN).padStart(12, "0")}`;
    const key = `bbbbbbbb-bbbb-4bbb-8bbb-${String(100 + n).padStart(12, "0")}`;
    lines.push(`
INSERT INTO public.project_guest_feedback (
  id, project_id, submitter_key, good_points, concerns, moderation_status
) VALUES (
  '${id}'::uuid, '${projectId}', '${key}'::uuid,
  'guest good ${n}', 'guest concern ${n}', 'visible'
) ON CONFLICT (id) DO NOTHING;
`);
  }

  for (let n = 1; n <= 72; n += 1) {
    const id = `88888888-8888-4888-8888-${String(n).padStart(12, "0")}`;
    const targetN = ((n - 1) % 31) + 1;
    const targetId = `99999999-9999-4999-8999-${String(targetN).padStart(12, "0")}`;
    const projectN = ((targetN - 1) % 40) + 1;
    const projectId = `eeeeeeee-eeee-4eee-8eee-${String(projectN).padStart(12, "0")}`;
    const userN = 101 + Math.floor((n - 1) / 31);
    const userId = `dddddddd-dddd-4ddd-8ddd-${String(userN).padStart(12, "0")}`;
    lines.push(`
INSERT INTO public.feedback_card_empathies (
  id, project_id, target_source, target_id, user_id
) VALUES (
  '${id}'::uuid, '${projectId}', 'registered_detailed', '${targetId}'::uuid, '${userId}'::uuid
) ON CONFLICT (id) DO NOTHING;
`);
  }

  for (let n = 1; n <= 13; n += 1) {
    const id = `77777777-7777-4777-8777-${String(n).padStart(12, "0")}`;
    const targetN = ((n - 1) % 31) + 1;
    const targetId = `99999999-9999-4999-8999-${String(targetN).padStart(12, "0")}`;
    const projectN = ((n - 1) % 40) + 1;
    const projectId = `eeeeeeee-eeee-4eee-8eee-${String(projectN).padStart(12, "0")}`;
    lines.push(`
INSERT INTO public.feedback_card_replies (
  id, project_id, target_source, target_id, author_id, body
) VALUES (
  '${id}'::uuid, '${projectId}', 'registered_detailed', '${targetId}'::uuid,
  '${ownerA}'::uuid, 'ありがとうございます。次の更新で確認します。'
) ON CONFLICT (id) DO NOTHING;
`);
  }

  return lines.join("\n");
}

function assertInventory(row, label) {
  const checks = [
    ["projects", 40],
    ["usage", 12],
    ["registered_fb", 31],
    ["guest_fb", 7],
    ["empathy", 72],
    ["replies", 13],
    ["devlogs", 45],
    ["releases", 8],
    ["ann_published", 6],
    ["ann_draft", 2],
  ];
  for (const [key, expected] of checks) {
    assert(
      Number(row[key]) === expected,
      `${label}: ${key}=${row[key]} expected ${expected}`,
    );
  }
}

async function loadInventory(db) {
  const res = await query(
    db,
    `SELECT
       (SELECT count(*) FROM public.projects WHERE id::text LIKE 'eeeeeeee-eeee-4eee-8eee-%') AS projects,
       (SELECT count(*) FROM public.project_usage_relations WHERE id::text LIKE 'ffffffff-ffff-4fff-8fff-%') AS usage,
       (SELECT count(*) FROM public.project_feedback WHERE id::text LIKE '99999999-9999-4999-8999-%') AS registered_fb,
       (SELECT count(*) FROM public.project_guest_feedback WHERE id::text LIKE 'bbbbbbbb-bbbb-4bbb-8bbb-%') AS guest_fb,
       (SELECT count(*) FROM public.feedback_card_empathies WHERE id::text LIKE '88888888-8888-4888-8888-%') AS empathy,
       (SELECT count(*) FROM public.feedback_card_replies WHERE id::text LIKE '77777777-7777-4777-8777-%') AS replies,
       (SELECT count(*) FROM public.project_devlogs WHERE id::text LIKE '66666666-6666-4666-8666-%') AS devlogs,
       (SELECT count(*) FROM public.project_release_events WHERE id::text LIKE '55555555-5555-4555-8555-%') AS releases,
       (SELECT count(*) FROM public.platform_announcements WHERE id::text LIKE 'aaaaaaaa-aaaa-4aaa-8aaa-%' AND status='published') AS ann_published,
       (SELECT count(*) FROM public.platform_announcements WHERE id::text LIKE 'aaaaaaaa-aaaa-4aaa-8aaa-%' AND status='draft') AS ann_draft`,
  );
  return res.rows[0];
}

async function main() {
  const db = new PGlite();
  const report = {
    env: "pglite",
    migrationRange:
      "minimal fixture mimicking 011+035 thumbnail_urls NOT NULL + 076–080 tables + 080 RPC OUT shapes, then 083",
    seed: "40 forge-ia-seed-v1 + smoke/hero + inventory matching seed README coverage",
    fixtureLimits:
      "No full Staging RLS/Storage/auth; PGlite PASS ≠ live Staging success guarantee",
  };

  const sqlBeautify = readSql(paths.beautify);
  const referencedImages = [
    ...sqlBeautify.matchAll(/\/images\/staging-only\/player-ia\/([a-z0-9-]+\.webp)/g),
  ].map((m) => m[1]);
  const uniqueImages = [...new Set(referencedImages)];
  assert(uniqueImages.length >= 20, "beautify should reference staging-only webp paths");
  for (const name of uniqueImages) {
    assert(
      existsSync(resolve(paths.imagesDir, name)),
      `missing staging-only image referenced by beautify: ${name}`,
    );
  }
  report.stagingOnlyImages = { referenced: uniqueImages.length, allExist: true };

  await execSql(db, "fixture schema", fixtureSchema);
  await execSql(db, "minimal seed", buildSeedSql());
  assertInventory(await loadInventory(db), "pre-beautify inventory");

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

  const outNewest = await query(
    db,
    `SELECT pg_get_function_result(p.oid) AS result
     FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
     WHERE n.nspname='public' AND p.proname='get_home_newest_projects'`,
  );
  assert(
    /description/i.test(outNewest.rows[0]?.result || ""),
    "083 newest OUT shape missing description",
  );

  const outFb = await query(
    db,
    `SELECT pg_get_function_result(p.oid) AS result
     FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
     WHERE n.nspname='public' AND p.proname='get_home_feedback_gathering_projects'`,
  );
  assert(
    /empathy_count/i.test(outFb.rows[0]?.result || "") &&
      /window_days/i.test(outFb.rows[0]?.result || ""),
    "083 feedback-gathering OUT shape incomplete",
  );

  const reviewPresent = await query(
    db,
    `SELECT to_regprocedure('public.get_home_review_highlights(integer)') IS NOT NULL AS ok`,
  );
  assert(reviewPresent.rows[0].ok === true, "legacy get_home_review_highlights missing");

  const fbRows = await query(
    db,
    `SELECT count(*)::int AS n,
            coalesce(sum(empathy_count), 0)::bigint AS empathy_sum,
            bool_or(has_creator_reply) AS any_reply
     FROM public.get_home_feedback_gathering_projects(16)`,
  );
  assert(Number(fbRows.rows[0].n) > 0, "feedback-gathering RPC returned 0 rows");
  assert(Number(fbRows.rows[0].empathy_sum) > 0, "feedback-gathering empathy_count all zero");
  assert(fbRows.rows[0].any_reply === true, "feedback-gathering has_creator_reply never true");

  const smokeBefore = await query(
    db,
    `SELECT title, thumbnail_url FROM public.projects
     WHERE id = '41ff5a96-105c-42a2-87b4-787bcfeacb45'::uuid`,
  );

  const annMetaBefore = await query(
    db,
    `SELECT id::text AS id, status, importance, published_at::text AS published_at, title, body
     FROM public.platform_announcements
     WHERE id::text LIKE 'aaaaaaaa-aaaa-4aaa-8aaa-%'
     ORDER BY id`,
  );
  assert(annMetaBefore.rows.length === 8, "expected 8 seed announcements before beautify");

  await execSql(db, "beautify first apply", sqlBeautify);
  await execSql(db, "beautify re-run (idempotent)", sqlBeautify);

  const afterBeautify = await query(
    db,
    `SELECT
       count(*) FILTER (WHERE title LIKE '[IA Seed]%') AS prefixed,
       count(*) FILTER (
         WHERE thumbnail_url LIKE '/images/staging-only/player-ia/%'
           AND thumbnail_urls = ARRAY[thumbnail_url]::text[]
       ) AS thumbs_aligned,
       count(*) FILTER (
         WHERE id IN (
           'eeeeeeee-eeee-4eee-8eee-000000000004'::uuid,
           'eeeeeeee-eeee-4eee-8eee-000000000021'::uuid
         )
         AND thumbnail_url IS NULL
         AND thumbnail_urls = '{}'::text[]
       ) AS no_image,
       count(*) FILTER (
         WHERE 'forge-ia-seed-v1' = ANY (coalesce(tags, '{}'::text[]))
           AND id NOT IN (
             'eeeeeeee-eeee-4eee-8eee-000000000004'::uuid,
             'eeeeeeee-eeee-4eee-8eee-000000000021'::uuid
           )
           AND (
             thumbnail_url IS NULL
             OR cardinality(thumbnail_urls) <> 1
             OR thumbnail_urls[1] IS DISTINCT FROM thumbnail_url
           )
       ) AS thumb_mismatch,
       count(*) FILTER (
         WHERE thumbnail_url LIKE '/images/%'
           AND thumbnail_url NOT LIKE '/images/staging-only/player-ia/%'
       ) AS non_staging_local_thumbs
     FROM public.projects
     WHERE id::text LIKE 'eeeeeeee-eeee-4eee-8eee-%'`,
  );
  assert(Number(afterBeautify.rows[0].prefixed) === 0, "projects still prefixed after beautify");
  assert(Number(afterBeautify.rows[0].thumbs_aligned) === 38, "expected 38 aligned staging thumbs");
  assert(Number(afterBeautify.rows[0].no_image) === 2, "expected 2 no-image edges with {}");
  assert(Number(afterBeautify.rows[0].thumb_mismatch) === 0, "thumbnail_url/urls mismatch");
  assert(
    Number(afterBeautify.rows[0].non_staging_local_thumbs) === 0,
    "non staging-only local image paths assigned",
  );

  const copyClean = await query(
    db,
    `SELECT
       count(*) FILTER (WHERE coalesce(description,'') LIKE '%Staging専用%') AS staging_senyo,
       count(*) FILTER (
         WHERE coalesce(creator,'') ~* 'IA Seed'
            OR coalesce(owner_name,'') ~* 'IA Seed'
       ) AS ia_owner,
       count(*) FILTER (
         WHERE id NOT IN (
           'eeeeeeee-eeee-4eee-8eee-000000000008'::uuid,
           'eeeeeeee-eeee-4eee-8eee-000000000039'::uuid
         )
         AND description IN (
           '探索や戦略を実際に遊んで試せる開発中のゲームです。',
           'ゲームや映像制作に利用できる音楽・音声素材です。',
           'ゲームやアプリ制作に利用できる素材セットです。',
           '制作や開発作業を支援する開発ツールです。',
           'ブラウザから実際に試せるサービス・アプリです。'
         )
       ) AS natural_desc,
       (
         SELECT left(description, 8)
         FROM public.projects
         WHERE id = 'eeeeeeee-eeee-4eee-8eee-000000000008'::uuid
       ) AS long_desc_prefix,
       (
         SELECT creator
         FROM public.projects
         WHERE id = 'eeeeeeee-eeee-4eee-8eee-000000000008'::uuid
       ) AS long_creator
     FROM public.projects
     WHERE id::text LIKE 'eeeeeeee-eeee-4eee-8eee-%'`,
  );
  assert(Number(copyClean.rows[0].staging_senyo) === 0, "Staging専用 remains in description");
  assert(Number(copyClean.rows[0].ia_owner) === 0, "IA Seed remains in creator/owner_name");
  assert(Number(copyClean.rows[0].natural_desc) === 38, "natural category descriptions missing");
  assert(
    copyClean.rows[0].long_desc_prefix === "長い説明文エッジ",
    "long description edge fixture lost",
  );
  assert(
    String(copyClean.rows[0].long_creator).startsWith("超長い制作者表示名"),
    "long creator edge fixture lost",
  );

  const heroProfiles = await query(
    db,
    `SELECT user_id::text AS user_id, public_name
     FROM public.developer_profiles
     WHERE user_id IN (
       'dddddddd-dddd-4ddd-8ddd-000000000001'::uuid,
       'dddddddd-dddd-4ddd-8ddd-000000000002'::uuid
     )
     ORDER BY user_id`,
  );
  assert(heroProfiles.rows.length === 2, "expected both hero profiles");
  assert(heroProfiles.rows[0].public_name === "HC Dev B", "hero profile B changed");
  assert(heroProfiles.rows[1].public_name === "HC Dev C", "hero profile C changed");

  const dedicatedProfiles = await query(
    db,
    `SELECT count(*)::int AS n,
            count(*) FILTER (WHERE coalesce(public_name,'') ~* 'IA Seed')::int AS ia_left,
            count(*) FILTER (WHERE public_name = 'ゲーム職人')::int AS name_01,
            count(*) FILTER (WHERE public_name = '超長い制作者プロフィール名の折り返し検証用ABCDEFG')::int AS name_20
     FROM public.developer_profiles dp
     WHERE EXISTS (
       SELECT 1 FROM (VALUES
         ('ia-seed-dev-01'::text, 'a1a1a1a1-a1a1-41a1-81a1-000000000001'::uuid),
         ('ia-seed-dev-20'::text, 'a1a1a1a1-a1a1-41a1-81a1-000000000020'::uuid)
       ) AS sample(creator_id, user_id)
       WHERE dp.creator_id = sample.creator_id AND dp.user_id = sample.user_id
     )
        OR dp.user_id::text LIKE 'a1a1a1a1-a1a1-41a1-81a1-0000000000%'`,
  );
  const exactPairs = await query(
    db,
    `SELECT count(*)::int AS n,
            count(*) FILTER (WHERE coalesce(public_name,'') ~* 'IA Seed')::int AS ia_left
     FROM public.developer_profiles dp
     WHERE dp.user_id::text LIKE 'a1a1a1a1-a1a1-41a1-81a1-%'
       AND dp.creator_id ~ '^ia-seed-dev-[0-9]{2}$'
       AND dp.user_id::text NOT LIKE '%000000000099'`,
  );
  assert(Number(exactPairs.rows[0].n) === 20, "expected 20 exact-pair profiles");
  assert(Number(exactPairs.rows[0].ia_left) === 0, "exact-pair profiles still contain IA Seed");
  assert(Number(dedicatedProfiles.rows[0].name_01) === 1, "profile 01 natural name missing");
  assert(Number(dedicatedProfiles.rows[0].name_20) === 1, "profile 20 long name missing");

  const prefixOnlyTrap = await query(
    db,
    `SELECT public_name FROM public.developer_profiles
     WHERE user_id = 'cccccccc-cccc-4ccc-8ccc-000000000001'::uuid`,
  );
  assert(
    prefixOnlyTrap.rows[0].public_name === "IA Seed PrefixOnly Trap",
    "prefix-only mismatch profile was mutated",
  );

  const userOnlyTrap = await query(
    db,
    `SELECT public_name FROM public.developer_profiles
     WHERE user_id = 'a1a1a1a1-a1a1-41a1-81a1-000000000099'::uuid`,
  );
  assert(
    userOnlyTrap.rows[0].public_name === "IA Seed UserOnly Trap",
    "user-only mismatch profile was mutated",
  );

  const unrelated = await query(
    db,
    `SELECT public_name FROM public.developer_profiles
     WHERE user_id = 'bbbbbbbb-bbbb-4bbb-8bbb-000000009999'::uuid`,
  );
  assert(unrelated.rows[0].public_name === "Unrelated Studio", "unrelated profile changed");

  // Fail-closed: 19 exact pairs must abort (partial package)
  await db.exec(`
    UPDATE public.projects
    SET description = '[IA Seed] dirty-for-profile-abort'
    WHERE id = 'eeeeeeee-eeee-4eee-8eee-000000000001'::uuid;
  `);
  await db.exec(`
    DELETE FROM public.developer_profiles
    WHERE user_id = 'a1a1a1a1-a1a1-41a1-81a1-000000000020'::uuid;
  `);
  await execExpectFail(
    db,
    "beautify dedicated profile count 19 abort",
    sqlBeautify,
    /exact-pair count|ABORT beautify/i,
  );
  const dirtyAfter19 = await query(
    db,
    `SELECT description FROM public.projects
     WHERE id = 'eeeeeeee-eeee-4eee-8eee-000000000001'::uuid`,
  );
  assert(
    dirtyAfter19.rows[0].description === "[IA Seed] dirty-for-profile-abort",
    "19-pair abort did not roll back project description mutation",
  );
  const trapAfter19 = await query(
    db,
    `SELECT public_name FROM public.developer_profiles
     WHERE user_id = 'cccccccc-cccc-4ccc-8ccc-000000000001'::uuid`,
  );
  assert(
    trapAfter19.rows[0].public_name === "IA Seed PrefixOnly Trap",
    "19-pair abort mutated prefix trap",
  );
  await db.exec(`
INSERT INTO public.developer_profiles (user_id, creator_id, public_name) VALUES
  ('a1a1a1a1-a1a1-41a1-81a1-000000000020'::uuid, 'ia-seed-dev-20',
   'IA Seed 超長い制作者プロフィール名の折り返し検証用ABCDEFG')
ON CONFLICT (user_id) DO UPDATE SET
  creator_id = EXCLUDED.creator_id,
  public_name = EXCLUDED.public_name;
`);

  // Fail-closed: unexpected a1a1 + ia-seed-dev pair outside allowlist
  await db.exec(`
INSERT INTO auth.users (id) VALUES ('a1a1a1a1-a1a1-41a1-81a1-000000000050'::uuid)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.developer_profiles (user_id, creator_id, public_name) VALUES
  ('a1a1a1a1-a1a1-41a1-81a1-000000000050'::uuid, 'ia-seed-dev-50', 'IA Seed Unexpected Pair')
ON CONFLICT (user_id) DO UPDATE SET
  creator_id = EXCLUDED.creator_id,
  public_name = EXCLUDED.public_name;
`);
  await execExpectFail(
    db,
    "beautify unexpected a1a1/ia-seed-dev pair abort",
    sqlBeautify,
    /unexpected a1a1\/ia-seed-dev|ABORT beautify/i,
  );
  const unexpectedStill = await query(
    db,
    `SELECT public_name FROM public.developer_profiles
     WHERE user_id = 'a1a1a1a1-a1a1-41a1-81a1-000000000050'::uuid`,
  );
  assert(
    unexpectedStill.rows[0].public_name === "IA Seed Unexpected Pair",
    "unexpected-pair abort mutated unexpected row",
  );
  const dirtyAfterUnexpected = await query(
    db,
    `SELECT description FROM public.projects
     WHERE id = 'eeeeeeee-eeee-4eee-8eee-000000000001'::uuid`,
  );
  assert(
    dirtyAfterUnexpected.rows[0].description === "[IA Seed] dirty-for-profile-abort",
    "unexpected-pair abort did not preserve dirty description",
  );
  await db.exec(`
    DELETE FROM public.developer_profiles
    WHERE user_id = 'a1a1a1a1-a1a1-41a1-81a1-000000000050'::uuid;
    DELETE FROM auth.users
    WHERE id = 'a1a1a1a1-a1a1-41a1-81a1-000000000050'::uuid;
  `);

  await execSql(db, "beautify after profile fail-closed restore", sqlBeautify);
  const restoredDesc = await query(
    db,
    `SELECT description FROM public.projects
     WHERE id = 'eeeeeeee-eeee-4eee-8eee-000000000001'::uuid`,
  );
  assert(
    restoredDesc.rows[0].description !== "[IA Seed] dirty-for-profile-abort",
    "beautify did not clear dirty description after profile restore",
  );
  assert(
    !/IA Seed/i.test(String(restoredDesc.rows[0].description)),
    "restored description still has IA Seed",
  );
  const exactAfterRestore = await query(
    db,
    `SELECT count(*)::int AS n,
            count(*) FILTER (WHERE coalesce(public_name,'') ~* 'IA Seed')::int AS ia_left
     FROM public.developer_profiles dp
     WHERE dp.user_id::text LIKE 'a1a1a1a1-a1a1-41a1-81a1-%'
       AND dp.creator_id ~ '^ia-seed-dev-[0-9]{2}$'
       AND dp.user_id::text NOT LIKE '%000000000099'`,
  );
  assert(Number(exactAfterRestore.rows[0].n) === 20, "exact pairs not restored to 20");
  assert(Number(exactAfterRestore.rows[0].ia_left) === 0, "exact pairs still marked after restore");

  const expectedAnnCopy = [
    ["aaaaaaaa-aaaa-4aaa-8aaa-000000000001", "作品へのフィードバックを募集しています", "気になった作品を試して、良かった点や改善してほしい点を開発者へ届けてみてください。", "published", "important"],
    ["aaaaaaaa-aaaa-4aaa-8aaa-000000000002", "制作に使える素材・ツールを探せます", "音楽・音声、アセット、開発ツールなど、制作に活用できる作品をまとめて探せます。", "published", "normal"],
    ["aaaaaaaa-aaaa-4aaa-8aaa-000000000003", "サムネイル未設定作品の表示を改善しました", "画像がない作品でも内容を確認しやすいフォールバック表示に対応しました。", "published", "normal"],
    ["aaaaaaaa-aaaa-4aaa-8aaa-000000000004", "作品同士のつながりを確認できます", "素材やツールが別の作品で使われた関係を、Homeから確認できます。", "published", "normal"],
    ["aaaaaaaa-aaaa-4aaa-8aaa-000000000005", "新着作品と更新作品を見つけやすくしました", "公開されたばかりの作品や、最近更新された作品をHomeで確認できます。", "published", "normal"],
    ["aaaaaaaa-aaaa-4aaa-8aaa-000000000006", "5カテゴリの掲載に対応しました", "ゲーム、音楽・音声、アセット、開発ツール、サービス・アプリを掲載・探索できます。", "published", "normal"],
    ["aaaaaaaa-aaaa-4aaa-8aaa-000000000007", "開発者プロフィールの表示改善", "作品と制作者の活動がより分かりやすくなる表示改善を準備しています。", "draft", "normal"],
    ["aaaaaaaa-aaaa-4aaa-8aaa-000000000008", "フィードバック機能の改善", "送ったフィードバックや開発者からの返信を追いやすくする改善を準備しています。", "draft", "normal"],
  ];

  const ann = await query(
    db,
    `SELECT id::text AS id, status, importance, published_at::text AS published_at, title, body
     FROM public.platform_announcements
     WHERE id::text LIKE 'aaaaaaaa-aaaa-4aaa-8aaa-%'
     ORDER BY id`,
  );
  assert(ann.rows.length === 8, "expected 8 seed announcements after beautify");
  assert(
    ann.rows.filter((r) => r.status === "published").length === 6,
    "announcements published must stay 6",
  );
  assert(
    ann.rows.filter((r) => r.status === "draft").length === 2,
    "announcements draft must stay 2",
  );
  for (let i = 0; i < expectedAnnCopy.length; i += 1) {
    const [id, title, body, status, importance] = expectedAnnCopy[i];
    const row = ann.rows[i];
    assert(row.id === id, `announcement id mismatch at ${i}`);
    assert(row.title === title, `announcement title mismatch at ${id}`);
    assert(row.body === body, `announcement body mismatch at ${id}`);
    assert(row.status === status, `announcement status changed at ${id}`);
    assert(row.importance === importance, `announcement importance changed at ${id}`);
    assert(
      row.published_at === annMetaBefore.rows[i].published_at,
      `announcement published_at changed at ${id}`,
    );
    assert(
      row.status === annMetaBefore.rows[i].status,
      `announcement status drifted from fixture at ${id}`,
    );
    assert(
      row.importance === annMetaBefore.rows[i].importance,
      `announcement importance drifted from fixture at ${id}`,
    );
  }
  assert(
    ann.rows.every(
      (r) =>
        !/preview|staging|seed|確認用|確認メモ|\[IA Seed\]/i.test(
          `${r.title} ${r.body}`,
        ),
    ),
    "announcement copy still has internal markers",
  );

  // Fail-closed: 7 seed announcements abort + rollback
  await db.exec(`
    UPDATE public.projects
    SET description = '[IA Seed] dirty-for-ann-abort'
    WHERE id = 'eeeeeeee-eeee-4eee-8eee-000000000002'::uuid;
    DELETE FROM public.platform_announcements
    WHERE id = 'aaaaaaaa-aaaa-4aaa-8aaa-000000000008'::uuid;
  `);
  await execExpectFail(
    db,
    "beautify announcement count 7 abort",
    sqlBeautify,
    /expected 8 seed announcements|ABORT beautify/i,
  );
  const dirtyAnnAbort = await query(
    db,
    `SELECT description FROM public.projects
     WHERE id = 'eeeeeeee-eeee-4eee-8eee-000000000002'::uuid`,
  );
  assert(
    dirtyAnnAbort.rows[0].description === "[IA Seed] dirty-for-ann-abort",
    "7-ann abort did not roll back project mutation",
  );
  await db.exec(`
INSERT INTO public.platform_announcements (
  id, slug, title, body, importance, status, published_at
) VALUES (
  'aaaaaaaa-aaaa-4aaa-8aaa-000000000008'::uuid, 'ia-seed-8',
  'フィードバック機能の改善',
  '送ったフィードバックや開発者からの返信を追いやすくする改善を準備しています。',
  'normal', 'draft', NULL
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  body = EXCLUDED.body,
  status = EXCLUDED.status,
  importance = EXCLUDED.importance,
  published_at = EXCLUDED.published_at;
`);

  // Extra seed-like UUID (9th) must abort — not silently update only 8
  await db.exec(`
INSERT INTO public.platform_announcements (
  id, slug, title, body, importance, status, published_at
) VALUES (
  'aaaaaaaa-aaaa-4aaa-8aaa-000000000099'::uuid, 'ia-seed-extra-99',
  'Preview用: 追加seed風',
  'Staging確認用の余分なお知らせ',
  'normal', 'published', now()
) ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, body = EXCLUDED.body;
`);
  await execExpectFail(
    db,
    "beautify announcement count 9 abort",
    sqlBeautify,
    /expected 8 seed announcements|ABORT beautify/i,
  );
  const extraStill = await query(
    db,
    `SELECT title, body FROM public.platform_announcements
     WHERE id = 'aaaaaaaa-aaaa-4aaa-8aaa-000000000099'::uuid`,
  );
  assert(
    extraStill.rows[0].title === "Preview用: 追加seed風",
    "extra seed-like announcement was mutated despite abort path",
  );
  await db.exec(`
    DELETE FROM public.platform_announcements
    WHERE id = 'aaaaaaaa-aaaa-4aaa-8aaa-000000000099'::uuid;
  `);
  await execSql(db, "beautify after announcement fail-closed restore", sqlBeautify);

  const smokeAfter = await query(
    db,
    `SELECT title, thumbnail_url FROM public.projects
     WHERE id = '41ff5a96-105c-42a2-87b4-787bcfeacb45'::uuid`,
  );
  assert(
    smokeAfter.rows[0].title === smokeBefore.rows[0].title,
    "non-seed smoke title changed",
  );
  assert(
    smokeAfter.rows[0].thumbnail_url === smokeBefore.rows[0].thumbnail_url,
    "non-seed smoke thumbnail changed",
  );

  await execSql(
    db,
    "insert non-seed announcement",
    `
INSERT INTO public.platform_announcements (id, slug, title, body, status, published_at)
VALUES (
  'cccccccc-cccc-4ccc-8ccc-000000000001'::uuid,
  'non-seed-ann',
  'Keep Me',
  'body',
  'published',
  now()
) ON CONFLICT (id) DO NOTHING;
`,
  );
  await execSql(db, "beautify after non-seed announcement insert", sqlBeautify);
  const nonSeedAnnAfter = await query(
    db,
    `SELECT title FROM public.platform_announcements
     WHERE id = 'cccccccc-cccc-4ccc-8ccc-000000000001'::uuid`,
  );
  assert(nonSeedAnnAfter.rows[0].title === "Keep Me", "non-seed announcement title changed");

  const devlog = await query(
    db,
    `SELECT count(*) FILTER (WHERE content LIKE '[IA Seed]%') AS content_prefixed,
            count(*) FILTER (WHERE title LIKE '[IA Seed]%') AS title_prefixed,
            count(*) AS total
     FROM public.project_devlogs
     WHERE id::text LIKE '66666666-6666-4666-8666-%'`,
  );
  assert(Number(devlog.rows[0].total) === 45, "devlogs count drifted");
  assert(
    Number(devlog.rows[0].content_prefixed) === 45,
    "devlog content should remain prefixed (not updated by beautify)",
  );
  assert(
    Number(devlog.rows[0].title_prefixed) === 45,
    "devlog title should remain prefixed (not updated by beautify)",
  );

  const release = await query(
    db,
    `SELECT count(*) FILTER (WHERE coalesce(note,'') LIKE '[IA Seed]%') AS note_prefixed,
            count(*) AS total
     FROM public.project_release_events
     WHERE id::text LIKE '55555555-5555-4555-8555-%'`,
  );
  assert(Number(release.rows[0].total) === 8, "releases count drifted");
  assert(
    Number(release.rows[0].note_prefixed) === 8,
    "release notes should remain prefixed (not updated by beautify)",
  );

  assertInventory(await loadInventory(db), "post-beautify inventory");

  // Production-ish guard: missing Smoke A should abort beautify
  await db.exec(`DELETE FROM public.projects WHERE id = '41ff5a96-105c-42a2-87b4-787bcfeacb45'::uuid`);
  await execExpectFail(
    db,
    "beautify Production/Staging guard",
    sqlBeautify,
    /Smoke A missing|ABORT beautify/i,
  );
  await db.exec(`
INSERT INTO public.projects (
  id, owner_id, owner_name, title, creator, description, overview_introduction,
  visibility, category, tags, thumbnail_url, thumbnail_urls, playable_version, first_published_at
) VALUES (
  '41ff5a96-105c-42a2-87b4-787bcfeacb45'::uuid,
  'dddddddd-dddd-4ddd-8ddd-000000000001'::uuid, 'SmokeA',
  'Smoke A', 'SmokeA', 'smoke', 'smoke', 'public', 'game', ARRAY['smoke']::text[],
  'https://example.com/smoke.png', ARRAY['https://example.com/smoke.png']::text[],
  '1.0', now()
) ON CONFLICT (id) DO NOTHING;
`);

  // Incomplete seed fail-closed (untag one seed; do not DELETE — FK cascades would shrink inventory)
  await db.exec(`
    UPDATE public.projects
    SET tags = ARRAY['seed']::text[]
    WHERE id = 'eeeeeeee-eeee-4eee-8eee-000000000040'::uuid;
  `);
  await execExpectFail(
    db,
    "beautify incomplete seed abort",
    sqlBeautify,
    /expected 40|ABORT beautify/i,
  );
  await db.exec(`
    UPDATE public.projects
    SET tags = ARRAY['forge-ia-seed-v1','seed']::text[]
    WHERE id = 'eeeeeeee-eeee-4eee-8eee-000000000040'::uuid;
  `);

  // Unexpected count rollback: force category imbalance then ensure titles stay cleaned
  const titleSnap = await query(
    db,
    `SELECT title FROM public.projects
     WHERE id = 'eeeeeeee-eeee-4eee-8eee-000000000001'::uuid`,
  );
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
  const titleAfterAbort = await query(
    db,
    `SELECT title FROM public.projects
     WHERE id = 'eeeeeeee-eeee-4eee-8eee-000000000001'::uuid`,
  );
  assert(
    titleAfterAbort.rows[0].title === titleSnap.rows[0].title,
    "rollback did not preserve prior beautify title",
  );
  await db.exec(`
    UPDATE public.projects
    SET category = 'audio'
    WHERE id = 'eeeeeeee-eeee-4eee-8eee-000000000009'::uuid;
  `);
  await execSql(db, "beautify after rollback restore", sqlBeautify);

  // Negative: non-seed staging thumb contamination must fail closed on beautify re-run
  await db.exec(`
    UPDATE public.projects
    SET thumbnail_url = '/images/staging-only/player-ia/hero-wind-memory.webp',
        thumbnail_urls = ARRAY['/images/staging-only/player-ia/hero-wind-memory.webp']::text[]
    WHERE id = '41ff5a96-105c-42a2-87b4-787bcfeacb45'::uuid;
  `);
  await execExpectFail(
    db,
    "beautify non-seed staging thumb abort",
    sqlBeautify,
    /non-seed projects unexpectedly have staging-only thumbs|ABORT beautify/i,
  );
  await db.exec(`
    UPDATE public.projects
    SET thumbnail_url = 'https://example.com/smoke.png',
        thumbnail_urls = ARRAY['https://example.com/smoke.png']::text[]
    WHERE id = '41ff5a96-105c-42a2-87b4-787bcfeacb45'::uuid;
  `);

  const sqlAudit = readSql(paths.audit);
  await execSql(db, "audit full file", sqlAudit);

  await assertGateVerdict(db, sqlAudit, "rpc_083_presence", "PASS");
  await assertGateVerdict(db, sqlAudit, "seed_project_inventory", "PASS");
  await assertGateVerdict(db, sqlAudit, "seed_announcements", "PASS");
  await assertGateVerdict(db, sqlAudit, "seed_related_inventory", "PASS");
  await assertGateVerdict(
    db,
    sqlAudit,
    "seed_devlogs_immutable_check",
    "PASS_title_and_content_untouched",
  );
  await assertGateVerdict(db, sqlAudit, "immutable_trigger", "PASS");
  await assertGateVerdict(db, sqlAudit, "seed_developer_profiles", "PASS");

  // Negative: dedicated profile marker remaining fails audit
  await db.exec(`
    UPDATE public.developer_profiles
    SET public_name = 'IA Seed ゲーム作者'
    WHERE user_id = 'a1a1a1a1-a1a1-41a1-81a1-000000000001'::uuid;
  `);
  await assertGateVerdict(
    db,
    sqlAudit,
    "seed_developer_profiles",
    "FAIL",
    "dedicated profile IA Seed remaining",
  );
  await execSql(db, "restore dedicated profile names via beautify", sqlBeautify);
  await assertGateVerdict(db, sqlAudit, "seed_developer_profiles", "PASS", "profiles restored");
  await db.exec(`DROP FUNCTION IF EXISTS public.get_home_review_highlights(integer);`);
  await assertGateVerdict(
    db,
    sqlAudit,
    "rpc_083_presence",
    "FAIL",
    "rpc missing review_highlights",
  );
  await db.exec(`
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
LANGUAGE sql STABLE AS $$
  SELECT 'x'::text, p.id, p.title, coalesce(p.category,'game'), p.thumbnail_url,
         'registered'::text, 'プレイヤー'::text, 'sample body text here'::text,
         0::bigint, now()
  FROM public.projects p LIMIT 1;
$$;
`);

  // Negative: announcement partial copy (prefix stripped but not exact beautify copy)
  await db.exec(`
    UPDATE public.platform_announcements
    SET title = 'Announcement 1'
    WHERE id = 'aaaaaaaa-aaaa-4aaa-8aaa-000000000001'::uuid;
  `);
  await assertGateVerdict(
    db,
    sqlAudit,
    "seed_announcements",
    "FAIL",
    "announcement partial copy",
  );
  await execSql(db, "restore announcement copy via beautify", sqlBeautify);

  // Negative: disabled immutable trigger fails audit
  await db.exec(`ALTER TABLE public.project_devlogs DISABLE TRIGGER project_devlogs_immutable_body;`);
  await assertGateVerdict(
    db,
    sqlAudit,
    "immutable_trigger",
    "FAIL",
    "disabled immutable trigger",
  );
  await db.exec(`
    UPDATE public.project_devlogs
    SET title = 'mutated title only'
    WHERE id = '66666666-6666-4666-8666-000000000001'::uuid;
  `);
  await assertGateVerdict(
    db,
    sqlAudit,
    "seed_devlogs_immutable_check",
    "FAIL_published_devlog_changed_or_incomplete",
    "devlog title-only drift",
  );
  await db.exec(`
    UPDATE public.project_devlogs
    SET title = '[IA Seed] Devlog 1'
    WHERE id = '66666666-6666-4666-8666-000000000001'::uuid;
  `);
  await db.exec(`ALTER TABLE public.project_devlogs ENABLE TRIGGER project_devlogs_immutable_body;`);

  // Negative: thumb mismatch fails project inventory audit
  await db.exec(`
    UPDATE public.projects
    SET thumbnail_urls = ARRAY['/images/staging-only/player-ia/neon-city.webp']::text[]
    WHERE id = 'eeeeeeee-eeee-4eee-8eee-000000000001'::uuid;
  `);
  await assertGateVerdict(
    db,
    sqlAudit,
    "seed_project_inventory",
    "FAIL",
    "thumbnail mismatch",
  );
  await execSql(db, "restore thumbs via beautify", sqlBeautify);
  await assertGateVerdict(db, sqlAudit, "seed_project_inventory", "PASS", "inventory restored");

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
    audit_verdicts_asserted: "OK",
    inventory_counts: "OK",
    immutable_trigger: "blocked content UPDATE",
    beautify_skips_devlogs_releases: true,
    production_guard: "blocked without Smoke A",
    incomplete_seed: "blocked",
    unexpected_count_rollback: "blocked",
    non_seed_unchanged: true,
    staging_only_images: "OK",
  };
  console.log(JSON.stringify(report, null, 2));
}

main().catch((error) => {
  console.error(JSON.stringify({ ok: false, error: String(error?.message || error) }, null, 2));
  process.exit(1);
});
