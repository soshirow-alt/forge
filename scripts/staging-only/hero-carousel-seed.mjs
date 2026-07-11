/**
 * STAGING ONLY — Hero carousel verification seed (P1–P6 + 12 users).
 *
 * Guard: aborts unless NEXT_PUBLIC_SUPABASE_URL ref === vuqpwvjvgyxffmvpfrxo
 *        and ref !== bpnisgzxuwdxelhnduuf (production).
 *
 * Does NOT mutate Smoke A / Smoke B / existing owner (4bdc4a2f-…).
 * All seed rows use fixed UUIDs under namespace dddddddd-dddd-4ddd-8ddd-*.
 * Independent from Home Seed C–F (cccccccc namespace).
 *
 * Usage:
 *   node scripts/staging-only/hero-carousel-seed.mjs           # dry-run
 *   node scripts/staging-only/hero-carousel-seed.mjs --execute  # write staging
 */

import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync } from "node:fs";
import { deflateSync } from "node:zlib";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STAGING_REF = "vuqpwvjvgyxffmvpfrxo";
const PROD_REF = "bpnisgzxuwdxelhnduuf";
const OWNER_ID = "4bdc4a2f-2a39-4599-a14c-91303310ef56";
const SMOKE_A = "41ff5a96-105c-42a2-87b4-787bcfeacb45";
const SMOKE_B = "aa910df8-afdf-4cbb-a00e-42a9518afc52";
const MARKER = "forge-st-hero-carousel-v1";
const DESC_PREFIX = "[hero-carousel-seed]";
const EMAIL_DOMAIN = "forge-st-hero-carousel.local";
const STORAGE_BUCKET = "project-thumbnails";
const STORAGE_PREFIX = "hero-carousel-seed";
const PLAY_URL = "https://example.com/forge-hero-carousel-seed";

// ---------------------------------------------------------------------------
// Fixed UUID helpers — namespace dddddddd-dddd-4ddd-8ddd-*
// ---------------------------------------------------------------------------

/** Developer user UUIDs */
const DEV_B_ID = "dddddddd-dddd-4ddd-8ddd-000000000001";
const DEV_C_ID = "dddddddd-dddd-4ddd-8ddd-000000000002";

/** Player user UUIDs U01–U10 */
function playerUUID(n) {
  return `dddddddd-dddd-4ddd-8ddd-0000000001${String(n).padStart(2, "0")}`;
}

/** Project UUIDs P1–P6 */
function projectUUID(n) {
  return `dddddddd-dddd-4ddd-8ddd-0000000002${String(n).padStart(2, "0")}`;
}

/** Play session UUID — last 12 hex: 3sss uupp iiii (type 3 + user + project + index) */
function playSessionUUID(userN, projectN, sessionIndex = 1) {
  const u = String(userN).padStart(2, "0");
  const p = String(projectN).padStart(2, "0");
  const i = String(sessionIndex).padStart(4, "0");
  return `dddddddd-dddd-4ddd-8ddd-3000${u}${p}${i}`;
}

/** Feedback UUID — last 12 hex: 4uu pp 000000 */
function feedbackUUID(userN, projectN) {
  const u = String(userN).padStart(2, "0");
  const p = String(projectN).padStart(2, "0");
  return `dddddddd-dddd-4ddd-8ddd-4000${u}${p}0000`;
}

/** Watch — no fixed UUID needed (PK = user_id + project_id) */

/** Bookmark — no fixed UUID needed (PK = user_id + project_id) */

/** Devlog UUID — last 12 hex: 5pp iiiiii */
function devlogUUID(projectN, devlogIndex = 1) {
  const p = String(projectN).padStart(2, "0");
  const i = String(devlogIndex).padStart(6, "0");
  return `dddddddd-dddd-4ddd-8ddd-5000${p}${i}`;
}

// ---------------------------------------------------------------------------
// Project metadata
// ---------------------------------------------------------------------------

const P = {
  1: { id: projectUUID(1), owner: DEV_B_ID, title: "Neon Depths", genre: "アクション", genres: ["アクション"], tags: ["staging", MARKER, "trending"], phase: "ベータ", status: "ベータ", playable_version: "0.1", description: `${DESC_PREFIX} Neon Depths — side-scrolling action game with neon underwater visuals.`, devlogs: 2, imageSpec: { main: [1600, 900, [0x1a, 0x1a, 0x4a]], extras: [[800, 450, [0x0d, 0x2a, 0x5e]], [800, 450, [0x0a, 0x3a, 0x6a]]] } },
  2: { id: projectUUID(2), owner: DEV_B_ID, title: "Pixel Harvest", genre: "シミュレーション", genres: ["シミュレーション"], tags: ["staging", MARKER, "updated"], phase: "アルファ", status: "アルファ", playable_version: "0.1", description: `${DESC_PREFIX} Pixel Harvest — relaxing pixel-art farming simulation.`, devlogs: 1, imageSpec: { main: [800, 800, [0x2a, 0x4a, 0x1a]], extras: [[800, 450, [0x1a, 0x3a, 0x0a]], [800, 450, [0x2a, 0x5a, 0x1a]]] } },
  3: { id: projectUUID(3), owner: DEV_C_ID, title: "Storm Tactics", genre: "ストラテジー", genres: ["ストラテジー"], tags: ["staging", MARKER, "newest"], phase: "試作版", status: "試作版", playable_version: "0.1", description: `${DESC_PREFIX} Storm Tactics — turn-based strategy with dynamic weather systems.`, devlogs: 0, imageSpec: { main: [1200, 900, [0x3a, 0x2a, 0x0a]], extras: [[800, 450, [0x4a, 0x3a, 0x0d]]] } },
  4: { id: projectUUID(4), owner: DEV_B_ID, title: "Gravity Shift", genre: "パズル", genres: ["パズル"], tags: ["staging", MARKER, "updated"], phase: "アルファ", status: "アルファ", playable_version: "0.2", description: `${DESC_PREFIX} Gravity Shift — puzzle platformer with gravity-reversal mechanics.`, devlogs: 1, imageSpec: { main: [720, 1280, [0x4a, 0x1a, 0x4a]], extras: [] } },
  5: { id: projectUUID(5), owner: DEV_C_ID, title: "Echo Valley", genre: "RPG", genres: ["RPG"], tags: ["staging", MARKER, "updated"], phase: "ベータ", status: "ベータ", playable_version: "0.1", description: `${DESC_PREFIX} Echo Valley — atmospheric RPG with sound-based puzzles in a mysterious valley.`, devlogs: 1, imageSpec: { main: [1600, 900, [0x2a, 0x1a, 0x0a]], extras: [[800, 450, [0x3a, 0x2a, 0x0d]]] } },
  6: { id: projectUUID(6), owner: DEV_C_ID, title: "Comet Rush", genre: "レーシング", genres: ["レーシング"], tags: ["staging", MARKER], phase: "試作版", status: "試作版", playable_version: "0.1", description: `${DESC_PREFIX} Comet Rush — fast-paced space racing through asteroid fields.`, devlogs: 0, imageSpec: { main: [800, 800, [0x4a, 0x3a, 0x1a]], extras: [] } },
};

// first_published_at offsets (days ago) — varied so newest/updated/trending can differ
// P3 newest-ish (2d), P1 older (10d), P2/P4/P5 mid (5-7d), P6 mid (4d)
const FIRST_PUB_DAYS_AGO = { 1: 10, 2: 7, 3: 2, 4: 6, 5: 5, 6: 4 };

// ---------------------------------------------------------------------------
// Engagement plan
// ---------------------------------------------------------------------------

/*
 U01: play P1,P2,P4; FB P1,P4; watch P1,P2
 U02: play P1,P3,P5; FB P3; bookmark P5
 U03: play P2,P4; watch P4; follow DevB
 U04: play P1; FB P1 (bugs field set, bug report), moderation_status=visible
 U05: play P5,P6; FB P6; watch P5,P6
 U06: watch P2 only
 U07: play P3 only
 U08: bookmark P1,P6
 U09: play P4 v0.1 + v0.2 (two sessions); FB P4 version_key 0.1; watch P4
 U10: follow DevC only
*/

// ---------------------------------------------------------------------------
// Expected totals (deterministic)
// ---------------------------------------------------------------------------

const EXPECTED = {
  // Derived strictly from the engagement plan below.
  P1: {
    feedback_users: 2, // U01, U04
    watchers: 1, // U01
    bookmarks: 1, // U08
    play_users: 3, // U01, U02, U04
    play_sessions: 3,
    replay_users: 0,
    devlog_count: 2,
    playable_version: "0.1",
  },
  P2: {
    feedback_users: 0,
    watchers: 2, // U01, U06
    bookmarks: 0,
    play_users: 2, // U01, U03
    play_sessions: 2,
    replay_users: 0,
    devlog_count: 1,
    playable_version: "0.1",
  },
  P3: {
    feedback_users: 1, // U02
    watchers: 0,
    bookmarks: 0,
    play_users: 2, // U02, U07
    play_sessions: 2,
    replay_users: 0,
    devlog_count: 0,
    playable_version: "0.1",
  },
  P4: {
    feedback_users: 2, // U01, U09
    watchers: 2, // U03, U09
    bookmarks: 0,
    play_users: 3, // U01, U03, U09
    play_sessions: 4, // U01, U03, U09×2
    replay_users: 1, // U09
    devlog_count: 1,
    playable_version: "0.2",
  },
  P5: {
    feedback_users: 0,
    watchers: 1, // U05
    bookmarks: 1, // U02
    play_users: 2, // U02, U05
    play_sessions: 2,
    replay_users: 0,
    devlog_count: 1,
    playable_version: "0.1",
  },
  P6: {
    feedback_users: 1, // U05
    watchers: 1, // U05
    bookmarks: 1, // U08
    play_users: 1, // U05
    play_sessions: 1,
    replay_users: 0,
    devlog_count: 0,
    playable_version: "0.1",
  },
};

// ---------------------------------------------------------------------------
// Env / client helpers
// ---------------------------------------------------------------------------

function loadEnv(path = ".env.local") {
  const env = { ...process.env };
  if (!existsSync(path)) return env;
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    env[trimmed.slice(0, eq).trim()] = value;
  }
  return env;
}

function extractRef(url) {
  try {
    const m = new URL(url).hostname.match(/^([a-z0-9]+)\.supabase\.co$/i);
    return m ? m[1] : null;
  } catch {
    return null;
  }
}

function assertStaging(env) {
  const url = env.NEXT_PUBLIC_SUPABASE_URL || "";
  const ref = extractRef(url);
  if (!ref) throw new Error(`ABORT: could not parse Supabase ref from URL: ${url}`);
  if (ref === PROD_REF) throw new Error("ABORT: production Supabase ref — refuse to write");
  if (ref !== STAGING_REF) throw new Error(`ABORT: expected staging ref ${STAGING_REF}, got ${ref}`);
  return ref;
}

function makeClient(url, key) {
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
async function assertServiceRoleTableGrants(sb) {
  const required = [
    "developer_profiles",
    "projects",
    "project_devlogs",
    "project_play_sessions",
    "project_feedback",
    "project_watches",
    "project_bookmarks",
    "developer_follows",
  ];
  const missing = [];
  for (const table of required) {
    const sel = await sb.from(table).select("*").limit(1);
    if (sel.error && /permission denied/i.test(sel.error.message)) {
      missing.push(table + " (SELECT)");
      continue;
    }
    let probe;
    if (table === "developer_profiles") {
      probe = await sb.from(table).update({ public_name: "x" }).eq("user_id", "00000000-0000-4000-8000-000000000000");
    } else if (table === "project_watches" || table === "project_bookmarks") {
      probe = await sb.from(table).delete().eq("user_id", "00000000-0000-4000-8000-000000000000");
    } else if (table === "developer_follows") {
      probe = await sb.from(table).delete().eq("follower_id", "00000000-0000-4000-8000-000000000000");
    } else {
      probe = await sb.from(table).update({ updated_at: new Date().toISOString() }).eq("id", "00000000-0000-4000-8000-000000000000");
    }
    if (probe.error && /permission denied/i.test(probe.error.message)) {
      missing.push(table + " (WRITE)");
    }
  }
  if (missing.length) {
    throw new Error(
      "ABORT: service_role missing table privileges: " +
        missing.join(", ") +
        ". Apply Staging SQL scripts/staging-only/hero-carousel-service-role-grants.sql (owner GO / Dashboard), then re-run --execute. Do not run on production.",
    );
  }
}

function daysAgoIso(days, offsetHours = 0) {
  return new Date(Date.now() - days * 86_400_000 - offsetHours * 3_600_000).toISOString();
}

function hoursAgoIso(hours) {
  return new Date(Date.now() - hours * 3_600_000).toISOString();
}

// ---------------------------------------------------------------------------
// Minimal PNG builder — solid color RGBA, no external deps, zlib only
// ---------------------------------------------------------------------------

function u32be(n) {
  const b = Buffer.allocUnsafe(4);
  b.writeUInt32BE(n, 0);
  return b;
}

function pngChunk(type, data) {
  const typeBytes = Buffer.from(type, "ascii");
  const crcBuf = Buffer.concat([typeBytes, data]);
  let crc = 0xffffffff;
  for (const byte of crcBuf) {
    crc ^= byte;
    for (let k = 0; k < 8; k++) {
      crc = crc & 1 ? (crc >>> 1) ^ 0xedb88320 : crc >>> 1;
    }
  }
  crc = (crc ^ 0xffffffff) >>> 0;
  return Buffer.concat([u32be(data.length), typeBytes, data, u32be(crc)]);
}

function buildPng(width, height, rgb) {
  const [r, g, b] = rgb;
  const PNG_SIG = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 2;  // colour type: RGB
  ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;

  // Raw pixel data: filter byte 0 + RGB per row
  const rowSize = 1 + width * 3;
  const raw = Buffer.alloc(height * rowSize);
  for (let y = 0; y < height; y++) {
    raw[y * rowSize] = 0; // filter None
    for (let x = 0; x < width; x++) {
      const off = y * rowSize + 1 + x * 3;
      raw[off] = r;
      raw[off + 1] = g;
      raw[off + 2] = b;
    }
  }

  const idat = deflateSync(raw);
  const iend = Buffer.alloc(0);

  return Buffer.concat([
    PNG_SIG,
    pngChunk("IHDR", ihdr),
    pngChunk("IDAT", idat),
    pngChunk("IEND", iend),
  ]);
}

// ---------------------------------------------------------------------------
// Storage upload
// ---------------------------------------------------------------------------

async function uploadImage(sb, pId, slot, width, height, rgb) {
  const png = buildPng(width, height, rgb);
  const path = `${STORAGE_PREFIX}/${pId}/${slot}.png`;
  const { error } = await sb.storage
    .from(STORAGE_BUCKET)
    .upload(path, png, { contentType: "image/png", upsert: true });
  if (error) {
    console.warn(`  storage upload failed for ${path}: ${error.message}`);
    return null;
  }
  const { data } = sb.storage.from(STORAGE_BUCKET).getPublicUrl(path);
  return data?.publicUrl ?? null;
}

/** Fallback URLs — distinct across all slots to avoid duplicate-image violations. */
const FALLBACK_URLS = [
  "/images/landing/game-1.png",
  "/images/landing/game-2.png",
  "/images/landing/game-3.png",
  "/images/landing/game-4.png",
  "/images/landing/game-5.png",
  "/demo-thumbnails/neon-drift.svg",
  "/demo-thumbnails/pixel-farm.svg",
  "/demo-thumbnails/storm-tactics.svg",
  "/demo-thumbnails/gravity-shift.svg",
];
let fallbackIndex = 0;
function nextFallback() {
  return FALLBACK_URLS[fallbackIndex++ % FALLBACK_URLS.length];
}

async function resolveProjectUrls(sb, pNum) {
  const spec = P[pNum];
  const { main, extras } = spec.imageSpec;
  const pId = spec.id;

  const mainUrl = (await uploadImage(sb, pId, 0, main[0], main[1], main[2])) ?? nextFallback();
  const extraUrls = [];
  for (let i = 0; i < extras.length; i++) {
    const ex = extras[i];
    const url = (await uploadImage(sb, pId, i + 1, ex[0], ex[1], ex[2])) ?? nextFallback();
    extraUrls.push(url);
  }
  return { mainUrl, allUrls: [mainUrl, ...extraUrls] };
}

// ---------------------------------------------------------------------------
// User management
// ---------------------------------------------------------------------------

async function listAllUsers(sb) {
  const users = [];
  for (let page = 1; page <= 10; page++) {
    const { data, error } = await sb.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const batch = data?.users ?? [];
    users.push(...batch);
    if (batch.length < 200) break;
  }
  return users;
}

async function ensureUser(sb, email, fixedId, meta, existingUsers) {
  const existing = existingUsers.find((u) => u.email === email);
  if (existing) {
    // Update metadata with marker
    const { error } = await sb.auth.admin.updateUserById(existing.id, {
      email_confirm: true,
      user_metadata: { ...existing.user_metadata, ...meta, forge_seed_marker: MARKER },
    });
    if (error) throw new Error(`updateUserById failed for ${email}: ${error.message}`);
    return existing.id;
  }
  const { data, error } = await sb.auth.admin.createUser({
    id: fixedId,
    email,
    password: `HeroCarousel!${fixedId.slice(-8)}`,
    email_confirm: true,
    user_metadata: { ...meta, forge_seed_marker: MARKER },
  });
  if (error) throw new Error(`createUser failed for ${email}: ${error.message}`);
  return data.user.id;
}

// ---------------------------------------------------------------------------
// Developer profiles
// ---------------------------------------------------------------------------

async function upsertDeveloperProfile(sb, userId, publicName, creatorId) {
  const { error } = await sb.from("developer_profiles").upsert(
    {
      user_id: userId,
      creator_id: creatorId,
      public_name: publicName,
      profile: `${DESC_PREFIX} Staging seed developer profile. Do not promote to production.`,
    },
    { onConflict: "user_id" },
  );
  if (error) throw new Error(`upsertDeveloperProfile failed for ${userId}: ${error.message}`);
}

// ---------------------------------------------------------------------------
// Projects
// ---------------------------------------------------------------------------

function projectPayload(pNum, ownerUserId, thumbnailUrl, allUrls, firstPublishedAt) {
  const spec = P[pNum];
  return {
    id: spec.id,
    owner_id: ownerUserId,
    owner_name: pNum <= 2 || pNum === 4 ? "HC Dev B" : "HC Dev C",
    title: spec.title,
    creator: pNum <= 2 || pNum === 4 ? "HC Dev B" : "HC Dev C",
    genre: spec.genre,
    genres: spec.genres,
    description: spec.description,
    overview_introduction: `${DESC_PREFIX} ${spec.title} overview.`,
    phase: spec.phase,
    status: spec.status,
    looking_for_testers: false,
    tester_slots: null,
    section: "new",
    thumbnail_url: thumbnailUrl,
    thumbnail_urls: allUrls,
    tags: spec.tags,
    play_url: PLAY_URL,
    visibility: "public",
    release_status: "in_development",
    playable_version: spec.playable_version,
  };
}

async function upsertProjects(sb, devBId, devCId, urlsMap) {
  const ownerMap = { 1: devBId, 2: devBId, 3: devCId, 4: devBId, 5: devCId, 6: devCId };
  const rows = [1, 2, 3, 4, 5, 6].map((n) => {
    const { mainUrl, allUrls } = urlsMap[n];
    return projectPayload(n, ownerMap[n], mainUrl, allUrls, null);
  });
  const { error } = await sb.from("projects").upsert(rows, { onConflict: "id" });
  if (error) throw new Error(`upsertProjects failed: ${error.message}`);
}

// ---------------------------------------------------------------------------
// first_published_at — update after insert (trigger sets now() on insert,
// we then backdate via direct UPDATE as service_role bypasses RLS).
// ---------------------------------------------------------------------------

async function backdateFirstPublishedAt(sb) {
  for (const [nStr, daysAgo] of Object.entries(FIRST_PUB_DAYS_AGO)) {
    const n = Number(nStr);
    const pId = projectUUID(n);
    const ts = daysAgoIso(daysAgo);
    const { error } = await sb
      .from("projects")
      .update({ first_published_at: ts })
      .eq("id", pId);
    if (error) {
      console.warn(`  backdateFirstPublishedAt P${n}: ${error.message} (trigger may reject — OK if immutable)`);
    }
  }
}

// ---------------------------------------------------------------------------
// Devlogs
// ---------------------------------------------------------------------------

async function upsertDevlogs(sb, devBId, devCId) {
  const authorMap = {
    1: devBId, // P1 owned by DevB
    2: devBId, // P2 owned by DevB
    4: devBId, // P4 owned by DevB
    5: devCId, // P5 owned by DevC
  };

  // P1: 2 non-initial devlogs
  // P2: 1 non-initial
  // P3: 0
  // P4: 1 non-initial (bump played_version to 0.2 done in project upsert)
  // P5: 1 non-initial
  // P6: 0

  const rows = [];

  // P1 devlog 1 (older)
  rows.push({
    id: devlogUUID(1, 1),
    project_id: String(P[1].id),
    author_id: authorMap[1],
    title: `${DESC_PREFIX} Neon Depths update 0.1.1`,
    content: "Fixed rendering issues and improved level design.",
    published_version: "0.1.1",
    is_initial_publish: false,
    created_at: hoursAgoIso(120),
    published_at: hoursAgoIso(120),
  });

  // P1 devlog 2 (more recent)
  rows.push({
    id: devlogUUID(1, 2),
    project_id: String(P[1].id),
    author_id: authorMap[1],
    title: `${DESC_PREFIX} Neon Depths major overhaul 0.1.2`,
    content: "Overhauled enemy AI and added two new zones.",
    published_version: "0.1.2",
    is_initial_publish: false,
    created_at: hoursAgoIso(24),
    published_at: hoursAgoIso(24),
  });

  // P2 devlog 1
  rows.push({
    id: devlogUUID(2, 1),
    project_id: String(P[2].id),
    author_id: authorMap[2],
    title: `${DESC_PREFIX} Pixel Harvest seasonal update`,
    content: "Added winter crops and new tool upgrades.",
    published_version: "0.1.1",
    is_initial_publish: false,
    created_at: hoursAgoIso(48),
    published_at: hoursAgoIso(48),
  });

  // P4 devlog 1 (bump to 0.2)
  rows.push({
    id: devlogUUID(4, 1),
    project_id: String(P[4].id),
    author_id: authorMap[4],
    title: `${DESC_PREFIX} Gravity Shift ver 0.2`,
    content: "New anti-gravity zones and 10 new puzzle levels.",
    published_version: "0.2",
    is_initial_publish: false,
    created_at: hoursAgoIso(36),
    published_at: hoursAgoIso(36),
  });

  // P5 devlog 1
  rows.push({
    id: devlogUUID(5, 1),
    project_id: String(P[5].id),
    author_id: authorMap[5],
    title: `${DESC_PREFIX} Echo Valley expanded world`,
    content: "Two new regions and branching dialogue system.",
    published_version: "0.1.1",
    is_initial_publish: false,
    created_at: hoursAgoIso(72),
    published_at: hoursAgoIso(72),
  });

  const { error } = await sb.from("project_devlogs").upsert(rows, { onConflict: "id" });
  if (error) throw new Error(`upsertDevlogs failed: ${error.message}`);
}

// ---------------------------------------------------------------------------
// Play sessions
// ---------------------------------------------------------------------------

async function upsertPlaySessions(sb, userIds) {
  // Delete existing seed sessions by fixed UUIDs first (idempotent)
  const allSessionIds = [
    playSessionUUID(1, 1), playSessionUUID(1, 2), playSessionUUID(1, 4),
    playSessionUUID(2, 1), playSessionUUID(2, 3), playSessionUUID(2, 5),
    playSessionUUID(3, 2), playSessionUUID(3, 4),
    playSessionUUID(4, 1),
    playSessionUUID(5, 5), playSessionUUID(5, 6),
    playSessionUUID(7, 3),
    playSessionUUID(9, 4, 1), playSessionUUID(9, 4, 2),
  ];
  await sb.from("project_play_sessions").delete().in("id", allSessionIds);

  const rows = [
    // U01: play P1,P2,P4
    { id: playSessionUUID(1, 1), user_id: userIds[1], project_id: String(P[1].id), version_key: "0.1", played_at: hoursAgoIso(150), context: "general" },
    { id: playSessionUUID(1, 2), user_id: userIds[1], project_id: String(P[2].id), version_key: "0.1", played_at: hoursAgoIso(145), context: "general" },
    { id: playSessionUUID(1, 4), user_id: userIds[1], project_id: String(P[4].id), version_key: "0.1", played_at: hoursAgoIso(140), context: "general" },
    // U02: play P1,P3,P5
    { id: playSessionUUID(2, 1), user_id: userIds[2], project_id: String(P[1].id), version_key: "0.1", played_at: hoursAgoIso(100), context: "general" },
    { id: playSessionUUID(2, 3), user_id: userIds[2], project_id: String(P[3].id), version_key: "0.1", played_at: hoursAgoIso(95), context: "general" },
    { id: playSessionUUID(2, 5), user_id: userIds[2], project_id: String(P[5].id), version_key: "0.1", played_at: hoursAgoIso(90), context: "general" },
    // U03: play P2,P4
    { id: playSessionUUID(3, 2), user_id: userIds[3], project_id: String(P[2].id), version_key: "0.1", played_at: hoursAgoIso(80), context: "general" },
    { id: playSessionUUID(3, 4), user_id: userIds[3], project_id: String(P[4].id), version_key: "0.1", played_at: hoursAgoIso(75), context: "general" },
    // U04: play P1
    { id: playSessionUUID(4, 1), user_id: userIds[4], project_id: String(P[1].id), version_key: "0.1", played_at: hoursAgoIso(60), context: "general" },
    // U05: play P5,P6
    { id: playSessionUUID(5, 5), user_id: userIds[5], project_id: String(P[5].id), version_key: "0.1", played_at: hoursAgoIso(50), context: "general" },
    { id: playSessionUUID(5, 6), user_id: userIds[5], project_id: String(P[6].id), version_key: "0.1", played_at: hoursAgoIso(48), context: "general" },
    // U07: play P3
    { id: playSessionUUID(7, 3), user_id: userIds[7], project_id: String(P[3].id), version_key: "0.1", played_at: hoursAgoIso(30), context: "general" },
    // U09: play P4 version 0.1 AND 0.2 (two sessions)
    { id: playSessionUUID(9, 4, 1), user_id: userIds[9], project_id: String(P[4].id), version_key: "0.1", played_at: hoursAgoIso(20), context: "general" },
    { id: playSessionUUID(9, 4, 2), user_id: userIds[9], project_id: String(P[4].id), version_key: "0.2", played_at: hoursAgoIso(10), context: "new_version" },
  ];

  const { error } = await sb.from("project_play_sessions").insert(rows);
  if (error) throw new Error(`upsertPlaySessions failed: ${error.message}`);
}

// ---------------------------------------------------------------------------
// Feedback
// ---------------------------------------------------------------------------

async function upsertFeedback(sb, userIds) {
  const rows = [
    // U01: FB P1
    {
      id: feedbackUUID(1, 1),
      user_id: userIds[1],
      project_id: String(P[1].id),
      version_key: "0.1",
      good_points: `${DESC_PREFIX} Great atmosphere and tight controls.`,
      moderation_status: "visible",
      created_at: hoursAgoIso(148),
      updated_at: hoursAgoIso(148),
    },
    // U01: FB P4
    {
      id: feedbackUUID(1, 4),
      user_id: userIds[1],
      project_id: String(P[4].id),
      version_key: "0.1",
      good_points: `${DESC_PREFIX} Gravity mechanic is very satisfying.`,
      moderation_status: "visible",
      created_at: hoursAgoIso(138),
      updated_at: hoursAgoIso(138),
    },
    // U02: FB P3
    {
      id: feedbackUUID(2, 3),
      user_id: userIds[2],
      project_id: String(P[3].id),
      version_key: "0.1",
      good_points: `${DESC_PREFIX} Weather system adds strategic depth.`,
      moderation_status: "visible",
      created_at: hoursAgoIso(93),
      updated_at: hoursAgoIso(93),
    },
    // U04: FB P1 with bugs field (bug report)
    {
      id: feedbackUUID(4, 1),
      user_id: userIds[4],
      project_id: String(P[1].id),
      version_key: "0.1",
      good_points: `${DESC_PREFIX} Visuals are stunning.`,
      bugs: "Crash on level 3 when picking up the blue orb.",
      moderation_status: "visible",
      created_at: hoursAgoIso(58),
      updated_at: hoursAgoIso(58),
    },
    // U05: FB P6
    {
      id: feedbackUUID(5, 6),
      user_id: userIds[5],
      project_id: String(P[6].id),
      version_key: "0.1",
      good_points: `${DESC_PREFIX} High-speed racing feels great!`,
      moderation_status: "visible",
      created_at: hoursAgoIso(46),
      updated_at: hoursAgoIso(46),
    },
    // U09: FB on P4 version_key 0.1
    {
      id: feedbackUUID(9, 4),
      user_id: userIds[9],
      project_id: String(P[4].id),
      version_key: "0.1",
      good_points: `${DESC_PREFIX} ver 0.1 was already fun, 0.2 is even better.`,
      moderation_status: "visible",
      created_at: hoursAgoIso(18),
      updated_at: hoursAgoIso(18),
    },
  ];

  // Upsert by id
  const { error } = await sb.from("project_feedback").upsert(rows, { onConflict: "id" });
  if (error) throw new Error(`upsertFeedback failed: ${error.message}`);
}

// ---------------------------------------------------------------------------
// Watches
// ---------------------------------------------------------------------------

async function upsertWatches(sb, userIds) {
  // U01: watch P1,P2; U03: watch P4; U05: watch P5,P6; U06: watch P2; U09: watch P4
  const pairs = [
    [1, 1], [1, 2],
    [3, 4],
    [5, 5], [5, 6],
    [6, 2],
    [9, 4],
  ];
  for (const [uN, pN] of pairs) {
    // delete first (idempotent), then insert
    await sb.from("project_watches")
      .delete()
      .eq("user_id", userIds[uN])
      .eq("project_id", String(P[pN].id));
    const { error } = await sb.from("project_watches").insert({
      user_id: userIds[uN],
      project_id: String(P[pN].id),
      created_at: hoursAgoIso(160 - uN * 10 - pN),
    });
    if (error) throw new Error(`upsertWatches U${uN} P${pN}: ${error.message}`);
  }
}

// ---------------------------------------------------------------------------
// Bookmarks
// ---------------------------------------------------------------------------

async function upsertBookmarks(sb, userIds) {
  // U02: bookmark P5; U08: bookmark P1,P6
  const pairs = [
    [2, 5],
    [8, 1], [8, 6],
  ];
  for (const [uN, pN] of pairs) {
    await sb.from("project_bookmarks")
      .delete()
      .eq("user_id", userIds[uN])
      .eq("project_id", String(P[pN].id));
    const { error } = await sb.from("project_bookmarks").insert({
      user_id: userIds[uN],
      project_id: String(P[pN].id),
      created_at: hoursAgoIso(90 - uN * 5 - pN),
    });
    if (error) throw new Error(`upsertBookmarks U${uN} P${pN}: ${error.message}`);
  }
}

// ---------------------------------------------------------------------------
// Developer follows
// ---------------------------------------------------------------------------

async function upsertDeveloperFollows(sb, userIds, devBId, devCId) {
  // U03: follow DevB; U10: follow DevC
  const pairs = [
    [3, devBId],
    [10, devCId],
  ];
  for (const [uN, devId] of pairs) {
    const followerId = userIds[uN];
    await sb.from("developer_follows")
      .delete()
      .eq("follower_id", followerId)
      .eq("developer_user_id", devId);
    const { error } = await sb.from("developer_follows").insert({
      follower_id: followerId,
      developer_user_id: devId,
      created_at: hoursAgoIso(70 - uN),
    });
    if (error) throw new Error(`upsertDeveloperFollows U${uN}: ${error.message}`);
  }
}

// ---------------------------------------------------------------------------
// Post-execute verification
// ---------------------------------------------------------------------------

async function verifyAfterExecute(sb, anonSb, userIds) {
  console.log("\n=== POST-EXECUTE VERIFICATION ===");
  let hasError = false;

  // 1. Re-query DB counts for P1–P6
  const projectIds = [1, 2, 3, 4, 5, 6].map((n) => P[n].id);

  const { data: feedbackRows } = await sb
    .from("project_feedback")
    .select("project_id, user_id")
    .in("project_id", projectIds)
    .eq("moderation_status", "visible");

  const { data: watchRows } = await sb
    .from("project_watches")
    .select("project_id, user_id")
    .in("project_id", projectIds);

  const { data: bookmarkRows } = await sb
    .from("project_bookmarks")
    .select("project_id, user_id")
    .in("project_id", projectIds);

  const { data: sessionRows } = await sb
    .from("project_play_sessions")
    .select("project_id, user_id, id")
    .in("project_id", projectIds);

  const { data: devlogRows } = await sb
    .from("project_devlogs")
    .select("project_id, id")
    .in("project_id", projectIds);

  const { data: projectRows } = await sb
    .from("projects")
    .select("id, playable_version, first_published_at")
    .in("id", projectIds);

  function countsByProject(rows, idField = "project_id") {
    const map = {};
    for (const r of rows ?? []) {
      const pid = r[idField];
      map[pid] = (map[pid] || 0) + 1;
    }
    return map;
  }

  function distinctUsersByProject(rows) {
    const map = {};
    for (const r of rows ?? []) {
      const pid = r.project_id;
      if (!map[pid]) map[pid] = new Set();
      map[pid].add(r.user_id);
    }
    const counts = {};
    for (const [k, v] of Object.entries(map)) counts[k] = v.size;
    return counts;
  }

  function replayUsersByProject(rows) {
    const map = {};
    for (const r of rows ?? []) {
      const pid = r.project_id;
      if (!map[pid]) map[pid] = {};
      map[pid][r.user_id] = (map[pid][r.user_id] || 0) + 1;
    }
    const counts = {};
    for (const [pid, users] of Object.entries(map)) {
      counts[pid] = Object.values(users).filter((c) => c >= 2).length;
    }
    return counts;
  }

  const fbUsers = distinctUsersByProject(feedbackRows);
  const watchCounts = distinctUsersByProject(watchRows);
  const bookmarkCounts = distinctUsersByProject(bookmarkRows);
  const playUsers = distinctUsersByProject(sessionRows);
  const playSessions = countsByProject(sessionRows);
  const replayUsers = replayUsersByProject(sessionRows);
  const devlogCounts = countsByProject(devlogRows);
  const projectMeta = {};
  for (const r of projectRows ?? []) {
    projectMeta[r.id] = { playable_version: r.playable_version, first_published_at: r.first_published_at };
  }

  const actual = {};
  for (const n of [1, 2, 3, 4, 5, 6]) {
    const pid = P[n].id;
    actual[`P${n}`] = {
      feedback_users: fbUsers[pid] ?? 0,
      watchers: watchCounts[pid] ?? 0,
      bookmarks: bookmarkCounts[pid] ?? 0,
      play_users: playUsers[pid] ?? 0,
      play_sessions: playSessions[pid] ?? 0,
      replay_users: replayUsers[pid] ?? 0,
      devlog_count: devlogCounts[pid] ?? 0,
      playable_version: projectMeta[pid]?.playable_version ?? null,
      first_published_at: projectMeta[pid]?.first_published_at ?? null,
    };
  }

  const expectedActual = EXPECTED;

  const mismatches = [];
  for (const key of Object.keys(expectedActual)) {
    const exp = expectedActual[key];
    const act = actual[key];
    for (const field of Object.keys(exp)) {
      if (exp[field] !== act?.[field]) {
        mismatches.push({ project: key, field, expected: exp[field], actual: act?.[field] });
        hasError = true;
      }
    }
  }

  console.log(JSON.stringify({ expected: expectedActual, actual, mismatches }, null, 2));

  // 2. Verify Smoke A/B still exist
  const { data: smokeA } = await sb.from("projects").select("id").eq("id", SMOKE_A).maybeSingle();
  const { data: smokeB } = await sb.from("projects").select("id").eq("id", SMOKE_B).maybeSingle();
  if (!smokeA) { console.error("FAIL: Smoke A missing!"); hasError = true; }
  else console.log("OK: Smoke A present");
  if (!smokeB) { console.error("FAIL: Smoke B missing!"); hasError = true; }
  else console.log("OK: Smoke B present");

  // 3. Call get_home_discovery_feed with anon key
  const { data: feed, error: feedError } = await anonSb.rpc("get_home_discovery_feed");
  if (feedError) {
    console.error("get_home_discovery_feed error:", feedError.message);
    hasError = true;
  } else {
    const heroIds = new Set(projectIds);
    const seedInFeed = (feed ?? []).filter((r) => heroIds.has(r.project_id?.toString() ?? ""));
    const bySection = {};
    for (const r of feed ?? []) {
      const pId = r.project_id?.toString() ?? r.project_id;
      if (!bySection[r.section]) bySection[r.section] = [];
      bySection[r.section].push({ rank: r.rank, id: pId, title: r.title });
    }

    // Inline hero selection: trending rank1, updated rank1, newest rank1
    const heroSelection = {};
    for (const section of ["trending", "updated", "newest"]) {
      const candidates = (bySection[section] ?? []).sort((a, b) => a.rank - b.rank);
      if (candidates.length > 0) heroSelection[section] = candidates[0];
    }

    console.log(JSON.stringify({ feedBySection: bySection, heroSelection, seedProjectsInFeed: seedInFeed.length }, null, 2));

    // 4. Check ≥1 shelf non-hero candidates
    const totalInFeed = (feed ?? []).length;
    console.log(`Total feed rows: ${totalInFeed} (need >3 for hero+shelf)`);
    if (totalInFeed < 4) {
      console.warn("WARN: fewer than 4 feed rows — shelf may be empty");
    }
  }

  if (hasError) {
    console.error("\nVERIFICATION FAILED — see mismatches above");
    process.exit(1);
  }
  console.log("\nAll verifications passed.");
}

// ---------------------------------------------------------------------------
// Dry-run plan output
// ---------------------------------------------------------------------------

function buildPlan(ref) {
  const playerEmails = Array.from({ length: 10 }, (_, i) => `hc-u${String(i + 1).padStart(2, "0")}@${EMAIL_DOMAIN}`);
  const devEmails = [
    `hc-dev-b@${EMAIL_DOMAIN}`,
    `hc-dev-c@${EMAIL_DOMAIN}`,
  ];
  const expectedRows = {
    auth_users: 12,
    developer_profiles: 2,
    projects: 6,
    project_devlogs: 5,   // P1×2 + P2×1 + P4×1 + P5×1
    project_play_sessions: 14,
    project_feedback: 6,
    project_watches: 7,   // U01×2 + U03×1 + U05×2 + U06×1 + U09×1
    project_bookmarks: 3, // U02×1 + U08×2
    developer_follows: 2,
  };

  return {
    mode: "DRY_RUN",
    staging_ref: ref,
    marker: MARKER,
    projects: [1, 2, 3, 4, 5, 6].map((n) => ({
      pNum: n,
      id: P[n].id,
      title: P[n].title,
      owner: n <= 2 || n === 4 ? "DevB" : "DevC",
      devlogs: P[n].devlogs,
    })),
    developers: [
      { id: DEV_B_ID, email: `hc-dev-b@${EMAIL_DOMAIN}`, name: "HC Dev B" },
      { id: DEV_C_ID, email: `hc-dev-c@${EMAIL_DOMAIN}`, name: "HC Dev C" },
    ],
    players: playerEmails.map((email, i) => ({
      n: i + 1,
      id: playerUUID(i + 1),
      email,
      display_name: `HC Player ${String(i + 1).padStart(2, "0")}`,
    })),
    expectedRows,
    expectedTotals: EXPECTED,
    fbBreakdown: {
      P1: "U01 + U04 = 2",
      P3: "U02 = 1",
      P4: "U01 + U09 = 2",
      P6: "U05 = 1",
    },
    protectedIds: { SMOKE_A, SMOKE_B, OWNER_ID },
    note: "first_published_at is set by trigger on insert (now()), then backdated via service_role UPDATE. Trigger blocks client UPDATE of existing non-null value — if backdate fails, projects will have today's first_published_at.",
  };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const execute = process.argv.includes("--execute");
  const env = loadEnv(".env.local");

  const ref = assertStaging(env);
  console.log(`Staging ref: ${ref}`);

  const url = env.NEXT_PUBLIC_SUPABASE_URL.trim();
  const serviceKey = (env.SUPABASE_SERVICE_ROLE_KEY || env.STAGING_SUPABASE_SERVICE_ROLE_KEY || "").trim();
  const anonKey = (env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "").trim();

  if (!serviceKey) throw new Error("ABORT: SUPABASE_SERVICE_ROLE_KEY missing");
  if (!anonKey && execute) throw new Error("ABORT: NEXT_PUBLIC_SUPABASE_ANON_KEY missing (needed for feed check after --execute)");

  const plan = buildPlan(ref);
  console.log(JSON.stringify(plan, null, 2));

  if (!execute) {
    console.log("\nDry-run only. Re-run with --execute to write Staging.");
    return;
  }

  const sb = makeClient(url, serviceKey);
  const anonSb = makeClient(url, anonKey);

  console.log("Checking service_role table grants...");
  await assertServiceRoleTableGrants(sb);

  // Verify Smoke A/B present and owner is correct
  const { data: smokeACheck, error: smokeAErr } = await sb
    .from("projects")
    .select("id, owner_id")
    .eq("id", SMOKE_A)
    .maybeSingle();
  if (smokeAErr || !smokeACheck) throw new Error("ABORT: Smoke A missing");
  if (smokeACheck.owner_id !== OWNER_ID) throw new Error("ABORT: Smoke A owner_id unexpected");

  const { data: smokeBCheck } = await sb
    .from("projects")
    .select("id")
    .eq("id", SMOKE_B)
    .maybeSingle();
  if (!smokeBCheck) throw new Error("ABORT: Smoke B missing");

  // 1. Ensure developer users
  console.log("Ensuring developer users...");
  const existingUsers = await listAllUsers(sb);

  const devBId = await ensureUser(
    sb,
    `hc-dev-b@${EMAIL_DOMAIN}`,
    DEV_B_ID,
    { display_name: "HC Dev B" },
    existingUsers,
  );
  const devCId = await ensureUser(
    sb,
    `hc-dev-c@${EMAIL_DOMAIN}`,
    DEV_C_ID,
    { display_name: "HC Dev C" },
    existingUsers,
  );
  console.log(`  DevB: ${devBId}`);
  console.log(`  DevC: ${devCId}`);

  // 2. Ensure player users
  console.log("Ensuring player users...");
  const userIds = {};
  for (let n = 1; n <= 10; n++) {
    const email = `hc-u${String(n).padStart(2, "0")}@${EMAIL_DOMAIN}`;
    const uid = await ensureUser(
      sb,
      email,
      playerUUID(n),
      { display_name: `HC Player ${String(n).padStart(2, "0")}` },
      existingUsers,
    );
    userIds[n] = uid;
    console.log(`  U${n}: ${uid}`);
  }

  // 3. Upsert developer profiles
  console.log("Upserting developer profiles...");
  await upsertDeveloperProfile(sb, devBId, "HC Dev B", `hc-dev-b-${MARKER}`);
  await upsertDeveloperProfile(sb, devCId, "HC Dev C", `hc-dev-c-${MARKER}`);

  // 4. Upload images and upsert projects
  console.log("Uploading images and upserting projects...");
  const urlsMap = {};
  for (const n of [1, 2, 3, 4, 5, 6]) {
    console.log(`  P${n}: uploading images...`);
    urlsMap[n] = await resolveProjectUrls(sb, n);
  }

  await upsertProjects(sb, devBId, devCId, urlsMap);
  console.log("Projects upserted.");

  // 5. Backdate first_published_at
  console.log("Backdating first_published_at...");
  await backdateFirstPublishedAt(sb);

  // 6. Upsert devlogs
  console.log("Upserting devlogs...");
  await upsertDevlogs(sb, devBId, devCId);

  // 7. Play sessions
  console.log("Upserting play sessions...");
  await upsertPlaySessions(sb, userIds);

  // 8. Feedback
  console.log("Upserting feedback...");
  await upsertFeedback(sb, userIds);

  // 9. Watches
  console.log("Upserting watches...");
  await upsertWatches(sb, userIds);

  // 10. Bookmarks
  console.log("Upserting bookmarks...");
  await upsertBookmarks(sb, userIds);

  // 11. Developer follows
  console.log("Upserting developer follows...");
  await upsertDeveloperFollows(sb, userIds, devBId, devCId);

  // 12. Verify
  await verifyAfterExecute(sb, anonSb, userIds);

  console.log("\nSeed complete.");
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
