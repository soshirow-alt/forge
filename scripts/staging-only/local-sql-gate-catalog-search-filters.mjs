/**
 * Local PGlite gate for migrations 084 + 085 catalog search filters.
 * No Staging/Production writes.
 *
 * Usage: node scripts/staging-only/local-sql-gate-catalog-search-filters.mjs
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { PGlite } from "@electric-sql/pglite";

const root = resolve(".");
const migration084Path = resolve(
  root,
  "supabase/migrations/084_catalog_search_query_genres_tags.sql",
);
const migration085Path = resolve(
  root,
  "supabase/migrations/085_catalog_five_category_filters.sql",
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

const FIXTURE_SQL = [
  "DO $$ BEGIN",
  "  CREATE ROLE anon NOLOGIN;",
  "EXCEPTION WHEN duplicate_object THEN NULL;",
  "END $$;",
  "DO $$ BEGIN",
  "  CREATE ROLE authenticated NOLOGIN;",
  "EXCEPTION WHEN duplicate_object THEN NULL;",
  "END $$;",
  "DO $$ BEGIN",
  "  CREATE ROLE service_role NOLOGIN;",
  "EXCEPTION WHEN duplicate_object THEN NULL;",
  "END $$;",
  "",
  "CREATE TABLE public.projects (",
  "  id uuid PRIMARY KEY,",
  "  title text NOT NULL,",
  "  description text,",
  "  category text,",
  "  thumbnail_url text,",
  "  creator text,",
  "  owner_name text,",
  "  genre text,",
  "  genres text[],",
  "  tags text[] NOT NULL DEFAULT '{}',",
  "  purpose_tags text[] NOT NULL DEFAULT '{}',",
  "  asset_kinds text[] NOT NULL DEFAULT '{}',",
  "  stream_policy text DEFAULT 'unset',",
  "  quick_try boolean DEFAULT false,",
  "  usable_for_creation boolean DEFAULT false,",
  "  looking_for_testers boolean DEFAULT false,",
  "  visibility text NOT NULL DEFAULT 'public',",
  "  estimated_play_time text,",
  "  category_attributes jsonb NOT NULL DEFAULT '{}'::jsonb,",
  "  first_published_at timestamptz,",
  "  created_at timestamptz NOT NULL DEFAULT now(),",
  "  owner_id uuid,",
  "  playable_version text",
  ");",
  "",
  // note / title / content / published_version are required for
  // get_home_meaningful_updates (085 section D, LANGUAGE sql ? validated
  // against real columns at CREATE FUNCTION time, not just call time).
  "CREATE TABLE public.project_release_events (",
  "  id bigserial PRIMARY KEY,",
  "  project_id uuid NOT NULL,",
  "  event_type text NOT NULL,",
  "  source text,",
  "  note text,",
  "  created_at timestamptz NOT NULL DEFAULT now()",
  ");",
  "",
  "CREATE TABLE public.project_devlogs (",
  "  id bigserial PRIMARY KEY,",
  "  project_id text NOT NULL,",
  "  title text,",
  "  content text,",
  "  published_version text,",
  "  is_initial_publish boolean DEFAULT false,",
  "  published_at timestamptz,",
  "  created_at timestamptz NOT NULL DEFAULT now()",
  ");",
  "",
  "CREATE INDEX IF NOT EXISTS projects_genres_gin_idx",
  "  ON public.projects USING gin (genres);",
  "",
  "-- Note: player_counts is added by 085 itself -- no fixture column here.",
  "-- Row data is seeded separately (seedFixtureData) AFTER 085 apply.",
  "",
  "-- Prior 9-arg signature (pre-084) so DROP path is exercised",
  "CREATE OR REPLACE FUNCTION public.get_public_projects_by_category(",
  "  p_category text DEFAULT NULL,",
  "  p_sort text DEFAULT 'newest',",
  "  p_quick_try boolean DEFAULT NULL,",
  "  p_feedback_wanted boolean DEFAULT NULL,",
  "  p_usable_for_creation boolean DEFAULT NULL,",
  "  p_stream_policy text DEFAULT NULL,",
  "  p_asset_kind text DEFAULT NULL,",
  "  p_limit integer DEFAULT 24,",
  "  p_offset integer DEFAULT 0",
  ")",
  "RETURNS TABLE (",
  "  project_id uuid,",
  "  title text,",
  "  description text,",
  "  category text,",
  "  thumbnail_url text,",
  "  creator text,",
  "  genres text[],",
  "  tags text[],",
  "  purpose_tags text[],",
  "  asset_kinds text[],",
  "  stream_policy text,",
  "  quick_try boolean,",
  "  usable_for_creation boolean,",
  "  looking_for_testers boolean,",
  "  first_published_at timestamptz,",
  "  meaningful_update_at timestamptz",
  ")",
  "LANGUAGE sql",
  "STABLE",
  "AS $$",
  "  SELECT",
  "    p.id,",
  "    p.title,",
  "    p.description,",
  "    coalesce(p.category, 'game'),",
  "    p.thumbnail_url,",
  "    coalesce(nullif(btrim(p.creator), ''), p.owner_name),",
  "    coalesce(p.genres, ARRAY[p.genre]::text[]),",
  "    coalesce(p.tags, '{}'),",
  "    coalesce(p.purpose_tags, '{}'),",
  "    coalesce(p.asset_kinds, '{}'),",
  "    coalesce(p.stream_policy, 'unset'),",
  "    coalesce(p.quick_try, false),",
  "    coalesce(p.usable_for_creation, false),",
  "    coalesce(p.looking_for_testers, false),",
  "    coalesce(p.first_published_at, p.created_at),",
  "    coalesce(p.first_published_at, p.created_at)",
  "  FROM public.projects p",
  "  WHERE p.visibility = 'public'",
  "  LIMIT greatest(1, least(coalesce(p_limit, 24), 60))",
  "  OFFSET greatest(0, coalesce(p_offset, 0));",
  "$$;",
].join("\n");

/**
 * Seed rows for post-085 filter smoke tests. Non-ASCII option/label values are
 * passed as Unicode escapes (not literal source characters) to avoid any
 * editor/tool encoding round-trip risk in this file ? functionally identical
 * once the JS string literal is parsed.
 */
const JP = {
  action: "\u30a2\u30af\u30b7\u30e7\u30f3", // ?????
  pixelArt: "\u30d4\u30af\u30bb\u30eb\u30a2\u30fc\u30c8", // ???????
  retro: "\u30ec\u30c8\u30ed", // ???
  envPc: "PC\u5bfe\u5fdc", // PC??
  envMobile: "\u30b9\u30de\u30db\u5bfe\u5fdc", // ?????
  puzzle: "\u30d1\u30ba\u30eb", // ???
  soloFriendly: "\u30bd\u30ed\u5411\u3051", // ????
  playTime1530: "15\u301c30\u5206", // 15?30?
  playTime515: "5\u301c15\u5206", // 5?15?
  healing: "\u7652\u3057\u7cfb", // ???
  sfx: "SE",
  pixelSet: "\u30c9\u30c3\u30c8\u7d75", // ????
  bgm: "BGM",
  pop: "\u30dd\u30c3\u30d7", // ???
  bright: "\u660e\u308b\u3044", // ???
  legacySfxJingle: "\u52b9\u679c\u97f3\u30fb\u30b8\u30f3\u30b0\u30eb", // ????????
  legacySfxOnly: "\u52b9\u679c\u97f3\u30fbSE", // ????SE
  jingleOnly: "\u30b8\u30f3\u30b0\u30eb", // ????
  format2d: "2D",
  taste: "\u30d4\u30af\u30bb\u30eb\u30a2\u30fc\u30c8", // ???????
  toolUnity: "Unity",
  cli: "CLI",
  toolEnvWindows: "Windows",
  toolEnvWebBrowser: "Web\u30d6\u30e9\u30a6\u30b6", // Web????
  featureAutomation: "\u81ea\u52d5\u5316", // ???
  kindWebService: "Web\u30b5\u30fc\u30d3\u30b9", // Web????
  purposeCreationSupport: "\u5236\u4f5c\u652f\u63f4", // ????
  serviceEnvWeb: "Web",
  featureAiSupport: "AI\u5bfe\u5fdc", // AI??
  assetKindCharacter: "\u30ad\u30e3\u30e9\u30af\u30bf\u30fc", // ??????
  playerCount1: "1\u4eba", // 1?
  playerCount5plus: "5\u4eba\u4ee5\u4e0a", // 5???
  duration10to30: "10\u301c30\u79d2", // 10?30?
  durationUnder10: "10\u79d2\u672a\u6e80", // 10???
  duration1to3min: "1\u301c3\u5206", // 1?3?
  duration3plusMin: "3\u5206\u4ee5\u4e0a", // 3???
  legacyServiceKindPhone: "\u30b9\u30de\u30fc\u30c8\u30d5\u30a9\u30f3\u30a2\u30d7\u30ea", // legacy service kind label (smartphone app)
  canonicalServiceKindPhone: "\u30b9\u30de\u30db\u30a2\u30d7\u30ea", // canonical service kind label (smartphone app)
  legacyToolEnvVsCode: "Visual Studio Code",
  canonicalToolEnvVsCode: "VS Code",
};

function seedFixtureData() {
  return `
INSERT INTO public.projects (
  id, title, description, category, creator, genres, tags, visibility, first_published_at,
  estimated_play_time, category_attributes, asset_kinds
) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Dragon RPG', 'epic quest', 'game', 'Alice',
   ARRAY['RPG','${JP.action}'], ARRAY['${JP.pixelArt}','${JP.retro}','${JP.envPc}'], 'public', now(),
   '${JP.playTime1530}', '{}'::jsonb, ARRAY[]::text[]),
  ('22222222-2222-2222-2222-222222222222', 'Calm BGM', 'relax track', 'audio', 'Bob',
   ARRAY[]::text[], ARRAY['${JP.healing}'], 'public', now(),
   NULL, '{"kinds":["${JP.bgm}"],"musicGenres":["${JP.pop}"],"moods":["${JP.bright}"],"musicDuration":"1:15"}'::jsonb,
   ARRAY[]::text[]),
  ('33333333-3333-3333-3333-333333333333', 'Secret Game', 'hidden', 'game', 'Carol',
   ARRAY['RPG'], ARRAY['${JP.pixelArt}'], 'private', now(),
   NULL, '{}'::jsonb, ARRAY[]::text[]),
  ('44444444-4444-4444-4444-444444444444', 'Puzzle Soft', 'casual', 'game', 'Dana',
   ARRAY['${JP.puzzle}'], ARRAY['${JP.soloFriendly}','${JP.envMobile}'], 'public', now(),
   '${JP.playTime515}', '{}'::jsonb, ARRAY[]::text[]),
  ('55555555-5555-5555-5555-555555555555', 'SE Kit', 'sfx pack', 'audio', 'Eve',
   ARRAY[]::text[], ARRAY['${JP.sfx}'], 'public', now(),
   NULL, '{"kind":"${JP.legacySfxJingle}","musicDuration":"0:08"}'::jsonb, ARRAY[]::text[]),
  ('66666666-6666-6666-6666-666666666666', 'Pixel Set', 'asset pack', 'asset', 'Fay',
   ARRAY[]::text[], ARRAY['${JP.pixelSet}'], 'public', now(),
   NULL, '{"formats":["${JP.format2d}"],"tastes":["${JP.taste}"],"tools":["${JP.toolUnity}"]}'::jsonb, ARRAY['${JP.assetKindCharacter}']::text[]),
  ('77777777-7777-7777-7777-777777777777', 'Debug CLI', 'dev tool', 'dev-tool', 'Gus',
   ARRAY[]::text[], ARRAY['${JP.cli}'], 'public', now(),
   NULL, '{"kinds":["${JP.cli}"],"toolEnvironments":["${JP.toolEnvWindows}","${JP.toolEnvWebBrowser}"],"features":["${JP.featureAutomation}"]}'::jsonb, ARRAY[]::text[]),
  ('88888888-8888-8888-8888-888888888888', 'Studio Hub', 'web service', 'service-app', 'Hana',
   ARRAY[]::text[], ARRAY['${JP.kindWebService}'], 'public', now(),
   NULL, '{"kinds":["${JP.kindWebService}"],"purposes":["${JP.purposeCreationSupport}"],"serviceEnvironments":["${JP.toolEnvWebBrowser}"],"features":["${JP.featureAiSupport}"]}'::jsonb, ARRAY[]::text[]),
  ('99999999-9999-9999-9999-999999999999', 'Legacy Phone App', 'legacy service kind label', 'service-app', 'Ivy',
   ARRAY[]::text[], ARRAY[]::text[], 'public', now(),
   NULL, '{"kinds":["${JP.legacyServiceKindPhone}"]}'::jsonb, ARRAY[]::text[]),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Legacy VS Code Tool', 'legacy dev-tool env label', 'dev-tool', 'Jae',
   ARRAY[]::text[], ARRAY[]::text[], 'public', now(),
   NULL, '{"kinds":["CLI"],"toolEnvironments":["${JP.legacyToolEnvVsCode}"]}'::jsonb, ARRAY[]::text[]);

UPDATE public.projects SET player_counts = ARRAY['${JP.playerCount1}','2\u4eba'] WHERE id = '11111111-1111-1111-1111-111111111111'::uuid;
UPDATE public.projects SET player_counts = ARRAY['${JP.playerCount5plus}'] WHERE id = '44444444-4444-4444-4444-444444444444'::uuid;
`;
}

mustExist(migration084Path);
mustExist(migration085Path);
const migration084Sql = readFileSync(migration084Path, "utf8");
const migration085Sql = readFileSync(migration085Path, "utf8");

// ---------------------------------------------------------------------------
// 1. Deliberate mid-migration failure (084) -> full rollback (no partial signature/index)
// ---------------------------------------------------------------------------
{
  const dbFail = new PGlite();
  await execSql(dbFail, "084 rollback fixture", FIXTURE_SQL);
  const brokenSql = migration084Sql.replace(/\bCOMMIT\s*;\s*$/i, () => {
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
    throw new Error("expected forced rollback failure (084)");
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
      `084 rollback lost pre-084 9-arg signature; found=${JSON.stringify(argList)}`,
    );
  }
  if (hasTextArray) {
    throw new Error("084 rollback left 084 signature behind");
  }
  const idxFail = await dbFail.query(
    `SELECT 1 FROM pg_indexes WHERE indexname = 'projects_tags_gin_idx'`,
  );
  if (idxFail.rows.length !== 0) {
    throw new Error("084 rollback left projects_tags_gin_idx behind");
  }
  console.log("OK  084 forced failure rollback");
  await dbFail.close();
}

// ---------------------------------------------------------------------------
// 2. Deliberate mid-migration failure (085, on top of successfully-applied 084)
//    -> full rollback (no player_counts column / new signature / new indexes)
// ---------------------------------------------------------------------------
{
  const dbFail = new PGlite();
  await execSql(dbFail, "085 rollback fixture", FIXTURE_SQL);
  await execSql(dbFail, "085 rollback: 084 apply (baseline)", migration084Sql);
  const broken085 = migration085Sql.replace(/\bCOMMIT\s*;\s*$/i, () => {
    return [
      "DO $$ BEGIN RAISE EXCEPTION 'forced five-category rollback'; END $$;",
      "COMMIT;",
    ].join("\n");
  });
  let failed = false;
  try {
    await dbFail.exec(broken085);
  } catch (error) {
    failed = /forced five-category rollback/i.test(String(error?.message || error));
    if (!failed) throw error;
  }
  if (!failed) {
    throw new Error("expected forced rollback failure (085)");
  }
  try {
    await dbFail.exec("ROLLBACK;");
  } catch {
    // already rolled back
  }
  const col = await dbFail.query(`
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'projects' AND column_name = 'player_counts'
  `);
  if (col.rows.length !== 0) {
    throw new Error("085 rollback left player_counts column behind");
  }
  const sigs = await dbFail.query(`
    SELECT pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'get_public_projects_by_category'
  `);
  const argList = sigs.rows.map((row) => row.args);
  const has26ArgShape = argList.some(
    (args) => String(args).split(",").length >= 20,
  );
  const has12ArgShape = argList.some((args) => {
    const normalized = String(args).replace(/\b\w+\s+/g, "");
    return (
      normalized ===
      "text, text, boolean, boolean, boolean, text, text, integer, integer, text, text[], text[]"
    );
  });
  if (!has12ArgShape) {
    throw new Error(
      `085 rollback lost 084 12-arg signature; found=${JSON.stringify(argList)}`,
    );
  }
  if (has26ArgShape) {
    throw new Error("085 rollback left 085 signature behind");
  }
  const idxFail = await dbFail.query(
    `SELECT 1 FROM pg_indexes WHERE indexname = 'projects_player_counts_gin_idx'`,
  );
  if (idxFail.rows.length !== 0) {
    throw new Error("085 rollback left projects_player_counts_gin_idx behind");
  }
  console.log("OK  085 forced failure rollback");
  await dbFail.close();
}

// ---------------------------------------------------------------------------
// 3. Full apply chain: fixture -> 084 -> 084 (idempotent) -> 085 -> 085 (idempotent)
// ---------------------------------------------------------------------------
const db = new PGlite();
await execSql(db, "fixture schema", FIXTURE_SQL);
await execSql(db, "084 first apply", migration084Sql);
await execSql(db, "084 re-run (idempotent)", migration084Sql);
await execSql(db, "085 first apply", migration085Sql);
await execSql(db, "085 re-run (idempotent)", migration085Sql);
await execSql(db, "085 fixture data (post-085 columns)", seedFixtureData());

// -- 084 filters (regression) --------------------------------------------
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
  throw new Error(`genre filter unexpected: ${JSON.stringify(genreTitles)}`);
}
console.log("OK  genre filter");

const byTag = await db.query(
  `SELECT title FROM get_public_projects_by_category(
     p_category := 'game',
     p_tags := ARRAY['${JP.pixelArt}']
   )`,
);
if (byTag.rows.length !== 1 || byTag.rows[0].title !== "Dragon RPG") {
  throw new Error(`tag filter unexpected: ${JSON.stringify(byTag.rows)}`);
}
console.log("OK  tag filter");

const privateLeak = await db.query(
  `SELECT title FROM get_public_projects_by_category(p_query := 'Secret')`,
);
if (privateLeak.rows.length !== 0) {
  throw new Error("private project leaked");
}
console.log("OK  private not leaked");

// -- 085 new filters --------------------------------------------------------

const byPlayTime = await db.query(
  `SELECT title FROM get_public_projects_by_category(
     p_category := 'game', p_play_times := ARRAY['${JP.playTime1530}']
   )`,
);
if (byPlayTime.rows.length !== 1 || byPlayTime.rows[0].title !== "Dragon RPG") {
  throw new Error(`play_times filter unexpected: ${JSON.stringify(byPlayTime.rows)}`);
}
console.log("OK  play_times filter");

const byPlayEnv = await db.query(
  `SELECT title FROM get_public_projects_by_category(
     p_category := 'game', p_play_envs := ARRAY['${JP.envMobile}']
   )`,
);
if (byPlayEnv.rows.length !== 1 || byPlayEnv.rows[0].title !== "Puzzle Soft") {
  throw new Error(`play_envs filter unexpected: ${JSON.stringify(byPlayEnv.rows)}`);
}
console.log("OK  play_envs filter");

const byPlayerCount = await db.query(
  `SELECT title FROM get_public_projects_by_category(
     p_category := 'game', p_player_counts := ARRAY['${JP.playerCount5plus}']
   )`,
);
if (byPlayerCount.rows.length !== 1 || byPlayerCount.rows[0].title !== "Puzzle Soft") {
  throw new Error(`player_counts filter unexpected: ${JSON.stringify(byPlayerCount.rows)}`);
}
console.log("OK  player_counts filter");

const multiPlayerCount = await db.query(
  `SELECT title FROM get_public_projects_by_category(
     p_category := 'game', p_player_counts := ARRAY['${JP.playerCount1}','${JP.playerCount5plus}']
   ) ORDER BY title`,
);
if (multiPlayerCount.rows.length !== 2) {
  throw new Error(
    `player_counts OR-within-axis unexpected: ${JSON.stringify(multiPlayerCount.rows)}`,
  );
}
console.log("OK  player_counts OR within axis");

const byAttrKinds = await db.query(
  `SELECT title FROM get_public_projects_by_category(
     p_category := 'audio', p_attr_kinds := ARRAY['${JP.bgm}']
   )`,
);
if (byAttrKinds.rows.length !== 1 || byAttrKinds.rows[0].title !== "Calm BGM") {
  throw new Error(`attr_kinds (canonical array) unexpected: ${JSON.stringify(byAttrKinds.rows)}`);
}
console.log("OK  attr_kinds canonical array");

const legacyKindDirect = await db.query(
  `SELECT title FROM get_public_projects_by_category(
     p_category := 'audio', p_attr_kinds := ARRAY['${JP.legacySfxJingle}']
   )`,
);
if (legacyKindDirect.rows.length !== 1 || legacyKindDirect.rows[0].title !== "SE Kit") {
  throw new Error(`attr_kinds legacy direct unexpected: ${JSON.stringify(legacyKindDirect.rows)}`);
}
console.log("OK  attr_kinds legacy singular direct match");

const legacyKindSplit = await db.query(
  `SELECT title FROM get_public_projects_by_category(
     p_category := 'audio', p_attr_kinds := ARRAY['${JP.jingleOnly}']
   )`,
);
if (legacyKindSplit.rows.length !== 1 || legacyKindSplit.rows[0].title !== "SE Kit") {
  throw new Error(`attr_kinds legacy split unexpected: ${JSON.stringify(legacyKindSplit.rows)}`);
}
console.log("OK  attr_kinds legacy sfx-jingle split match (jingle)");

const legacyKindSplitSfx = await db.query(
  `SELECT title FROM get_public_projects_by_category(
     p_category := 'audio', p_attr_kinds := ARRAY['${JP.legacySfxOnly}']
   )`,
);
if (legacyKindSplitSfx.rows.length !== 1 || legacyKindSplitSfx.rows[0].title !== "SE Kit") {
  throw new Error(
    `attr_kinds legacy split (sfx) unexpected: ${JSON.stringify(legacyKindSplitSfx.rows)}`,
  );
}
console.log("OK  attr_kinds legacy sfx-jingle split match (sfx)");

const byCanonicalServiceKindHitsLegacyRow = await db.query(
  `SELECT title FROM get_public_projects_by_category(
     p_category := 'service-app', p_attr_kinds := ARRAY['${JP.canonicalServiceKindPhone}']
   )`,
);
if (
  byCanonicalServiceKindHitsLegacyRow.rows.length !== 1 ||
  byCanonicalServiceKindHitsLegacyRow.rows[0].title !== "Legacy Phone App"
) {
  throw new Error(
    `attr_kinds legacy service kind (?????? hits ??????????) unexpected: ${JSON.stringify(byCanonicalServiceKindHitsLegacyRow.rows)}`,
  );
}
console.log("OK  attr_kinds legacy service kind label (canonical filter hits legacy row)");

const byMusicGenre = await db.query(
  `SELECT title FROM get_public_projects_by_category(
     p_category := 'audio', p_attr_music_genres := ARRAY['${JP.pop}']
   )`,
);
if (byMusicGenre.rows.length !== 1 || byMusicGenre.rows[0].title !== "Calm BGM") {
  throw new Error(`music_genres filter unexpected: ${JSON.stringify(byMusicGenre.rows)}`);
}
console.log("OK  music_genres filter");

const byMood = await db.query(
  `SELECT title FROM get_public_projects_by_category(
     p_category := 'audio', p_attr_moods := ARRAY['${JP.bright}']
   )`,
);
if (byMood.rows.length !== 1 || byMood.rows[0].title !== "Calm BGM") {
  throw new Error(`moods filter unexpected: ${JSON.stringify(byMood.rows)}`);
}
console.log("OK  moods filter");

const byPurpose = await db.query(
  `SELECT title FROM get_public_projects_by_category(
     p_category := 'service-app', p_attr_purposes := ARRAY['${JP.purposeCreationSupport}']
   )`,
);
if (byPurpose.rows.length !== 1 || byPurpose.rows[0].title !== "Studio Hub") {
  throw new Error(`purposes filter unexpected: ${JSON.stringify(byPurpose.rows)}`);
}
console.log("OK  purposes filter (service-app)");

// Calm BGM musicDuration 1:15 = 75s -> bucket "1-3min"
const byDurationHit = await db.query(
  `SELECT title FROM get_public_projects_by_category(
     p_category := 'audio', p_duration_buckets := ARRAY['${JP.duration1to3min}']
   )`,
);
if (byDurationHit.rows.length !== 1 || byDurationHit.rows[0].title !== "Calm BGM") {
  throw new Error(`duration_buckets hit unexpected: ${JSON.stringify(byDurationHit.rows)}`);
}
console.log("OK  duration_buckets hit (1-3min)");

// SE Kit musicDuration 0:08 = 8s -> bucket "<10s"
const byDurationSfx = await db.query(
  `SELECT title FROM get_public_projects_by_category(
     p_category := 'audio', p_duration_buckets := ARRAY['${JP.durationUnder10}']
   )`,
);
if (byDurationSfx.rows.length !== 1 || byDurationSfx.rows[0].title !== "SE Kit") {
  throw new Error(`duration_buckets <10s unexpected: ${JSON.stringify(byDurationSfx.rows)}`);
}
console.log("OK  duration_buckets hit (<10s)");

const byDurationZero = await db.query(
  `SELECT title FROM get_public_projects_by_category(
     p_category := 'audio', p_duration_buckets := ARRAY['${JP.duration3plusMin}']
   )`,
);
if (byDurationZero.rows.length !== 0) {
  throw new Error(`duration_buckets expected zero-hit: ${JSON.stringify(byDurationZero.rows)}`);
}
console.log("OK  duration_buckets zero-hit (>=3min)");

const byFormat = await db.query(
  `SELECT title FROM get_public_projects_by_category(
     p_category := 'asset', p_attr_formats := ARRAY['${JP.format2d}']
   )`,
);
if (byFormat.rows.length !== 1 || byFormat.rows[0].title !== "Pixel Set") {
  throw new Error(`formats filter unexpected: ${JSON.stringify(byFormat.rows)}`);
}
console.log("OK  formats filter");

const byTaste = await db.query(
  `SELECT title FROM get_public_projects_by_category(
     p_category := 'asset', p_attr_tastes := ARRAY['${JP.taste}']
   )`,
);
if (byTaste.rows.length !== 1 || byTaste.rows[0].title !== "Pixel Set") {
  throw new Error(`tastes filter unexpected: ${JSON.stringify(byTaste.rows)}`);
}
console.log("OK  tastes filter");

const byTool = await db.query(
  `SELECT title FROM get_public_projects_by_category(
     p_category := 'asset', p_attr_tools := ARRAY['${JP.toolUnity}']
   )`,
);
if (byTool.rows.length !== 1 || byTool.rows[0].title !== "Pixel Set") {
  throw new Error(`tools filter unexpected: ${JSON.stringify(byTool.rows)}`);
}
console.log("OK  tools filter");

const byEnvDevTool = await db.query(
  `SELECT title FROM get_public_projects_by_category(
     p_category := 'dev-tool', p_attr_environments := ARRAY['${JP.toolEnvWindows}']
   )`,
);
if (byEnvDevTool.rows.length !== 1 || byEnvDevTool.rows[0].title !== "Debug CLI") {
  throw new Error(`environments (dev-tool) unexpected: ${JSON.stringify(byEnvDevTool.rows)}`);
}
console.log("OK  attr_environments (dev-tool toolEnvironments)");

const byEnvServiceWebLegacy = await db.query(
  `SELECT title FROM get_public_projects_by_category(
     p_category := 'service-app', p_attr_environments := ARRAY['${JP.serviceEnvWeb}']
   )`,
);
if (
  byEnvServiceWebLegacy.rows.length !== 1 ||
  byEnvServiceWebLegacy.rows[0].title !== "Studio Hub"
) {
  throw new Error(
    `environments legacy Web mapping unexpected: ${JSON.stringify(byEnvServiceWebLegacy.rows)}`,
  );
}
console.log("OK  attr_environments legacy web-browser<->Web (service-app)");

const byCanonicalVsCodeHitsLegacyRow = await db.query(
  `SELECT title FROM get_public_projects_by_category(
     p_category := 'dev-tool', p_attr_environments := ARRAY['${JP.canonicalToolEnvVsCode}']
   )`,
);
if (
  byCanonicalVsCodeHitsLegacyRow.rows.length !== 1 ||
  byCanonicalVsCodeHitsLegacyRow.rows[0].title !== "Legacy VS Code Tool"
) {
  throw new Error(
    `attr_environments legacy dev-tool env (VS Code hits Visual Studio Code) unexpected: ${JSON.stringify(byCanonicalVsCodeHitsLegacyRow.rows)}`,
  );
}
console.log("OK  attr_environments legacy dev-tool env label (canonical VS Code filter hits legacy row)");

const byFeatureDevTool = await db.query(
  `SELECT title FROM get_public_projects_by_category(
     p_category := 'dev-tool', p_attr_features := ARRAY['${JP.featureAutomation}']
   )`,
);
if (byFeatureDevTool.rows.length !== 1 || byFeatureDevTool.rows[0].title !== "Debug CLI") {
  throw new Error(`features (dev-tool) unexpected: ${JSON.stringify(byFeatureDevTool.rows)}`);
}
console.log("OK  attr_features (dev-tool)");

const byFeatureService = await db.query(
  `SELECT title FROM get_public_projects_by_category(
     p_category := 'service-app', p_attr_features := ARRAY['${JP.featureAiSupport}']
   )`,
);
if (byFeatureService.rows.length !== 1 || byFeatureService.rows[0].title !== "Studio Hub") {
  throw new Error(`features (service-app) unexpected: ${JSON.stringify(byFeatureService.rows)}`);
}
console.log("OK  attr_features (service-app)");

const byAssetKindsMulti = await db.query(
  `SELECT title FROM get_public_projects_by_category(
     p_category := 'asset', p_asset_kinds := ARRAY['${JP.assetKindCharacter}']
   )`,
);
if (byAssetKindsMulti.rows.length !== 1 || byAssetKindsMulti.rows[0].title !== "Pixel Set") {
  throw new Error(`asset_kinds multi unexpected: ${JSON.stringify(byAssetKindsMulti.rows)}`);
}
console.log("OK  p_asset_kinds multi");

const byAssetKindSingularStillWorks = await db.query(
  `SELECT title FROM get_public_projects_by_category(
     p_category := 'asset', p_asset_kind := '${JP.assetKindCharacter}'
   )`,
);
if (
  byAssetKindSingularStillWorks.rows.length !== 1 ||
  byAssetKindSingularStillWorks.rows[0].title !== "Pixel Set"
) {
  throw new Error(
    `p_asset_kind singular (085) unexpected: ${JSON.stringify(byAssetKindSingularStillWorks.rows)}`,
  );
}
console.log("OK  p_asset_kind singular still works post-085");

// Cross-axis AND: dev-tool kind CLI AND env Windows both must hold (same project OK);
// env macOS (not present) must zero-out even though kind matches.
const crossAxisZero = await db.query(
  `SELECT title FROM get_public_projects_by_category(
     p_category := 'dev-tool',
     p_attr_kinds := ARRAY['${JP.cli}'],
     p_attr_environments := ARRAY['macOS']
   )`,
);
if (crossAxisZero.rows.length !== 0) {
  throw new Error(`cross-axis AND expected zero: ${JSON.stringify(crossAxisZero.rows)}`);
}
console.log("OK  cross-axis AND (different axes) zero-hit");

const crossAxisHit = await db.query(
  `SELECT title FROM get_public_projects_by_category(
     p_category := 'dev-tool',
     p_attr_kinds := ARRAY['${JP.cli}'],
     p_attr_environments := ARRAY['${JP.toolEnvWindows}']
   )`,
);
if (crossAxisHit.rows.length !== 1 || crossAxisHit.rows[0].title !== "Debug CLI") {
  throw new Error(`cross-axis AND expected hit: ${JSON.stringify(crossAxisHit.rows)}`);
}
console.log("OK  cross-axis AND (different axes) hit");

const injection = await db.query(
  `SELECT title FROM get_public_projects_by_category(p_query := '%')`,
);
if (injection.rows.length !== 0) {
  throw new Error(`unexpected wildcard leak: ${JSON.stringify(injection.rows)}`);
}
console.log("OK  query escape");

const idxTags = await db.query(
  `SELECT 1 FROM pg_indexes WHERE indexname = 'projects_tags_gin_idx'`,
);
if (idxTags.rows.length !== 1) {
  throw new Error("missing projects_tags_gin_idx");
}
const idxPlayerCounts = await db.query(
  `SELECT 1 FROM pg_indexes WHERE indexname = 'projects_player_counts_gin_idx'`,
);
if (idxPlayerCounts.rows.length !== 1) {
  throw new Error("missing projects_player_counts_gin_idx");
}
const idxCategoryAttrs = await db.query(
  `SELECT 1 FROM pg_indexes WHERE indexname = 'projects_category_attributes_gin_idx'`,
);
if (idxCategoryAttrs.rows.length !== 1) {
  throw new Error("missing projects_category_attributes_gin_idx");
}
console.log("OK  084 + 085 gin indexes present");

// Assert index-compatible predicate exists in migration source
if (
  !/OR p\.genres && p_genres/.test(migration084Sql) ||
  !/OR p\.tags && p_tags/.test(migration084Sql)
) {
  throw new Error("084 migration must use index-compatible genres/tags && predicates");
}
if (
  !/p\.player_counts && p_player_counts/.test(migration085Sql) ||
  !/attrs\.kinds_arr && p_attr_kinds/.test(migration085Sql)
) {
  throw new Error("085 migration must use index-compatible array && predicates");
}
console.log("OK  index-compatible predicates present in migration source");

const durationHelper = await db.query(
  `SELECT public.forge_parse_music_duration_seconds('1:15') AS s1,
          public.forge_parse_music_duration_seconds('1:05:00') AS s2,
          public.forge_parse_music_duration_seconds('bad') AS s3,
          public.forge_parse_music_duration_seconds('') AS s4`,
);
const helperRow = durationHelper.rows[0];
if (
  Number(helperRow.s1) !== 75 ||
  Number(helperRow.s2) !== 3900 ||
  helperRow.s3 !== null ||
  helperRow.s4 !== null
) {
  throw new Error(`forge_parse_music_duration_seconds unexpected: ${JSON.stringify(helperRow)}`);
}
console.log("OK  forge_parse_music_duration_seconds helper");

// -- Codex round-2 finding 1: integer overflow must resolve to NULL, never throw --

// Huge minutes (well beyond int4 range once multiplied by 60) must not raise.
const durationHugeMinutes = await db.query(
  `SELECT public.forge_parse_music_duration_seconds('99999999999:00') AS s`,
);
if (durationHugeMinutes.rows[0].s !== null) {
  throw new Error(
    `forge_parse_music_duration_seconds huge minutes expected NULL: ${JSON.stringify(durationHugeMinutes.rows[0])}`,
  );
}
console.log("OK  forge_parse_music_duration_seconds huge minutes -> NULL (no overflow)");

// Exactly at/just past int4 max seconds boundary.
const durationIntBoundary = await db.query(
  `SELECT public.forge_parse_music_duration_seconds('35791394:07') AS at_max,
          public.forge_parse_music_duration_seconds('35791394:08') AS over_max`,
);
if (Number(durationIntBoundary.rows[0].at_max) !== 2147483647) {
  throw new Error(
    `forge_parse_music_duration_seconds int4-max boundary unexpected: ${JSON.stringify(durationIntBoundary.rows[0])}`,
  );
}
if (durationIntBoundary.rows[0].over_max !== null) {
  throw new Error(
    `forge_parse_music_duration_seconds just-over int4-max expected NULL: ${JSON.stringify(durationIntBoundary.rows[0])}`,
  );
}
console.log("OK  forge_parse_music_duration_seconds int4 boundary (max ok, max+1 -> NULL)");

// Multiplication overflow via hours (small digit-count part, huge product).
const durationHourOverflow = await db.query(
  `SELECT public.forge_parse_music_duration_seconds('999999999:00:00') AS s`,
);
if (durationHourOverflow.rows[0].s !== null) {
  throw new Error(
    `forge_parse_music_duration_seconds hour-overflow expected NULL: ${JSON.stringify(durationHourOverflow.rows[0])}`,
  );
}
console.log("OK  forge_parse_music_duration_seconds hour-multiplication overflow -> NULL");

// Absurdly long digit run (beyond the 15-digit-per-part safety cap) must not raise.
const durationTooManyDigits = await db.query(
  `SELECT public.forge_parse_music_duration_seconds('${"9".repeat(30)}:00') AS s`,
);
if (durationTooManyDigits.rows[0].s !== null) {
  throw new Error(
    `forge_parse_music_duration_seconds 30-digit input expected NULL: ${JSON.stringify(durationTooManyDigits.rows[0])}`,
  );
}
console.log("OK  forge_parse_music_duration_seconds 30-digit part -> NULL (no overflow, no throw)");

// Invalid format (still NULL, still no throw) alongside a valid sibling in the same call.
const durationInvalidMixed = await db.query(
  `SELECT public.forge_parse_music_duration_seconds('1:2:3:4') AS too_many_parts,
          public.forge_parse_music_duration_seconds('12:99') AS seconds_out_of_range,
          public.forge_parse_music_duration_seconds('-1:00') AS negative`,
);
if (
  durationInvalidMixed.rows[0].too_many_parts !== null ||
  durationInvalidMixed.rows[0].seconds_out_of_range !== null ||
  durationInvalidMixed.rows[0].negative !== null
) {
  throw new Error(
    `forge_parse_music_duration_seconds invalid-format cases unexpected: ${JSON.stringify(durationInvalidMixed.rows[0])}`,
  );
}
console.log("OK  forge_parse_music_duration_seconds invalid formats -> NULL");

// The duration filter axis must not fail the whole RPC when a row's stored
// musicDuration is an overflow-triggering value ? it must just never match.
await db.exec(`
  INSERT INTO public.projects (
    id, title, description, category, creator, genres, tags, visibility, first_published_at,
    estimated_play_time, category_attributes, asset_kinds
  ) VALUES (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Overflow Duration Track', 'stress case', 'audio', 'Zed',
    ARRAY[]::text[], ARRAY[]::text[], 'public', now(),
    NULL, '{"kinds":["${JP.bgm}"],"musicDuration":"99999999999:00"}'::jsonb, ARRAY[]::text[]
  );
`);
const durationFilterSurvivesOverflowRow = await db.query(
  `SELECT title FROM get_public_projects_by_category(
     p_category := 'audio', p_duration_buckets := ARRAY['${JP.duration1to3min}']
   ) ORDER BY title`,
);
const overflowSurviveTitles = durationFilterSurvivesOverflowRow.rows.map((r) => r.title);
if (JSON.stringify(overflowSurviveTitles) !== JSON.stringify(["Calm BGM"])) {
  throw new Error(
    `duration_buckets filter must survive an overflow-triggering row (not throw, not match it): ${JSON.stringify(overflowSurviveTitles)}`,
  );
}
console.log("OK  duration_buckets filter does not fail the whole RPC on an overflow-triggering row");

console.log("local-sql-gate-catalog-search-filters PASS");
await db.close();
