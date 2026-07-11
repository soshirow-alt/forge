/**
 * STAGING ONLY — Special Thanks density seed (10+ players).
 *
 * Default: dry-run (no writes).
 * Writes require: --execute
 *
 * Safety:
 * - Aborts unless NEXT_PUBLIC_SUPABASE_URL ref === vuqpwvjvgyxffmvpfrxo
 * - Aborts if URL points to production ref bpnisgzxuwdxelhnduuf
 * - Creates Auth users via Admin API only (no direct auth.users INSERT)
 * - Email domain: forge-st-special-thanks.local
 * - Does NOT reuse / update existing Player A, Owner, or production users
 * - Does NOT mutate Smoke A title / thumbnail / playable_version / owner
 * - Does NOT touch production / 047 / 048 / OGP / Storage
 *
 * All density rows use fixed UUIDs under namespace bbbbbbbb-bbbb-4ccc-8ddd-*
 * so rollback can delete by id without leftovers.
 *
 * Usage:
 *   node scripts/staging-only/special-thanks-density-seed.mjs
 *   node scripts/staging-only/special-thanks-density-seed.mjs --execute
 */

import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync } from "node:fs";

const STAGING_REF = "vuqpwvjvgyxffmvpfrxo";
const PROD_REF = "bpnisgzxuwdxelhnduuf";
const PROJECT_ID = "41ff5a96-105c-42a2-87b4-787bcfeacb45";
const OWNER_ID = "4bdc4a2f-2a39-4599-a14c-91303310ef56";
const EMAIL_DOMAIN = "forge-st-special-thanks.local";
const EMAIL_PREFIX = "st-st-density-";
const MARKER = "st-special-thanks-density-v1";

const PROMPT_IDS = {
  "0.1": "bbbbbbbb-bbbb-4ccc-8ddd-000000000001",
  "0.1.1": "bbbbbbbb-bbbb-4ccc-8ddd-000000000002",
  "0.2": "bbbbbbbb-bbbb-4ccc-8ddd-000000000003",
};
const DEVLOG_IDS = {
  "0.1.1": "bbbbbbbb-bbbb-4ccc-8ddd-000000000011",
  "0.2": "bbbbbbbb-bbbb-4ccc-8ddd-000000000012",
};
const MATCHER_RUN_ID = "bbbbbbbb-bbbb-4ccc-8ddd-000000000021";

/** Fixed UUID helpers — all density rows stay in this namespace. */
function earlyVoiceId(key) {
  return `bbbbbbbb-bbbb-4ccc-8eee-${String(key).padStart(12, "0")}`;
}
function adoptionVoiceId(key, index1) {
  return `bbbbbbbb-bbbb-4ccc-8eef-${String(key).padStart(2, "0")}${String(index1).padStart(10, "0")}`;
}
function adoptionId(key, index1) {
  return `bbbbbbbb-bbbb-4ccc-8efa-${String(key).padStart(2, "0")}${String(index1).padStart(10, "0")}`;
}

const PLAYER_SPECS = [
  {
    key: "01",
    displayName: "ST Density Player One",
    handle: "st_density_01",
    avatar: true,
    watch: true,
    earlyVersion: "0.1",
    adoptionCount: 1,
    adoptionVersions: ["0.1.1"],
    summaries: ["着地硬直を短縮した"],
  },
  {
    key: "02",
    displayName: "ST Density Watcher Two",
    handle: "st_density_02",
    avatar: true,
    watch: true,
    earlyVersion: "0.1",
    adoptionCount: 3,
    adoptionVersions: ["0.1.1", "0.1.1", "0.2"],
    summaries: ["ジャンプの余韻を短くした", "カメラ揺れを弱めた", "チュートリアル文言を短くした"],
  },
  {
    key: "03",
    displayName: "ST Density NoHandle Three",
    handle: null,
    avatar: false,
    watch: true,
    earlyVersion: "0.1",
    adoptionCount: 5,
    adoptionVersions: ["0.1.1", "0.1.1", "0.2", "0.2", "0.2"],
    summaries: [
      "着地硬直を短縮した",
      "壁キック判定を広げた",
      "ボス前チェックポイントを追加した",
      "SE音量バランスを調整した",
      "リトライ導線を分かりやすくした",
    ],
  },
  {
    key: "04",
    displayName: "ST Density Long Display Name Player Four For Layout",
    handle: "st_density_04",
    avatar: true,
    watch: true,
    earlyVersion: "0.1",
    adoptionCount: 1,
    adoptionVersions: ["0.2"],
    summaries: ["マップ導線の迷いを減らした"],
  },
  {
    key: "05",
    displayName: "ST Density Five",
    handle: null,
    avatar: true,
    watch: true,
    earlyVersion: "0.1.1",
    adoptionCount: 3,
    adoptionVersions: ["0.2", "0.2", "0.2"],
    summaries: ["操作説明を短くした", "UI余白を整えた", "セーブ頻度を上げた"],
  },
  {
    key: "06",
    displayName: "ST Density Six",
    handle: "st_density_06",
    avatar: false,
    watch: true,
    earlyVersion: "0.1",
    adoptionCount: 1,
    adoptionVersions: ["0.1.1"],
    summaries: ["敵の出現間隔を調整した"],
  },
  {
    key: "07",
    displayName: "ST Density Seven AvatarOnly",
    handle: null,
    avatar: true,
    watch: true,
    earlyVersion: "0.2",
    adoptionCount: 0,
    adoptionVersions: [],
    summaries: [],
  },
  {
    key: "08",
    displayName: "ST Density Eight",
    handle: "st_density_08",
    avatar: false,
    watch: true,
    earlyVersion: "0.1",
    adoptionCount: 5,
    adoptionVersions: ["0.1.1", "0.1.1", "0.2", "0.2", "0.2"],
    summaries: [
      "落下ダメージを緩和した",
      "リスポーン位置を見直した",
      "ヒント表示タイミングを早めた",
      "難所の足場を広げた",
      "クリア後の導線を追加した",
    ],
  },
  {
    key: "09",
    displayName: "ST Density Nine Very Long Japanese Display Name For Truncation Check",
    handle: "st_density_09",
    avatar: true,
    watch: true,
    earlyVersion: "0.1.1",
    adoptionCount: 0,
    adoptionVersions: [],
    summaries: [],
  },
  {
    key: "10",
    displayName: "ST Density Ten",
    handle: null,
    avatar: false,
    watch: true,
    earlyVersion: "0.1",
    adoptionCount: 0,
    adoptionVersions: [],
    summaries: [],
  },
  {
    key: "11",
    displayName: "ST Density Eleven",
    handle: "st_density_11",
    avatar: true,
    watch: true,
    earlyVersion: "0.2",
    adoptionCount: 3,
    adoptionVersions: ["0.2", "0.2", "0.2"],
    summaries: ["移動慣性を弱めた", "ダッシュの出だしを早くした", "カメラ追従を滑らかにした"],
  },
  {
    key: "12",
    displayName: "ST Density Twelve",
    handle: "st_density_12",
    avatar: false,
    watch: true,
    earlyVersion: "0.1",
    adoptionCount: 0,
    adoptionVersions: [],
    summaries: [],
  },
];

function loadEnv(path = ".env.local") {
  const merged = { ...process.env };
  if (!existsSync(path)) return merged;
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const i = trimmed.indexOf("=");
    const key = trimmed.slice(0, i).trim();
    let value = trimmed.slice(i + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    merged[key] = value;
  }
  return merged;
}

function extractRef(url) {
  try {
    const host = new URL(url).hostname;
    const m = host.match(/^([a-z0-9]+)\.supabase\.co$/i);
    return m ? m[1] : null;
  } catch {
    return null;
  }
}

function assertStagingOnly(url) {
  const ref = extractRef(url);
  if (!ref) throw new Error("ABORT: could not parse Supabase ref");
  if (ref === PROD_REF) throw new Error("ABORT: production Supabase ref — refuse to write");
  if (ref !== STAGING_REF) {
    throw new Error(`ABORT: expected staging ref ${STAGING_REF}, got ${ref}`);
  }
  return ref;
}

function avatarUrlFor(key) {
  return `https://api.dicebear.com/7.x/thumbs/png?seed=st-density-${key}&size=96`;
}

function daysAgoIso(days) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

function densityEmail(key) {
  return `${EMAIL_PREFIX}${key}@${EMAIL_DOMAIN}`;
}

async function listAllUsers(supabase) {
  const users = [];
  for (let page = 1; page <= 5; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const batch = data.users ?? [];
    users.push(...batch);
    if (batch.length < 200) break;
  }
  return users;
}

async function ensureDensityUser(supabase, spec, existingUsers) {
  const email = densityEmail(spec.key);
  const password = `StDensity!${spec.key}!${MARKER}`;
  const meta = {
    display_name: spec.displayName,
    forge_seed_marker: MARKER,
    ...(spec.avatar ? { avatar_url: avatarUrlFor(spec.key) } : {}),
  };

  const existing = existingUsers.find((u) => u.email === email);
  let userId = existing?.id ?? null;

  if (!userId) {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: meta,
    });
    if (error || !data.user) throw error ?? new Error(`createUser failed for ${email}`);
    userId = data.user.id;
  } else {
    const { error } = await supabase.auth.admin.updateUserById(userId, {
      email_confirm: true,
      user_metadata: meta,
    });
    if (error) throw error;
  }

  if (spec.handle) {
    const { error } = await supabase.from("user_x_profiles").upsert(
      {
        user_id: userId,
        x_user_id: `st-density-${spec.key}`,
        x_username: spec.handle,
        x_display_name: spec.displayName,
        x_avatar_url: spec.avatar ? avatarUrlFor(spec.key) : null,
        x_connected_at: new Date().toISOString(),
        x_last_synced_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );
    if (error) throw error;
  }

  return { userId, email, spec };
}

function plannedCounts() {
  const adoptionRows = PLAYER_SPECS.reduce((sum, p) => {
    const uniquePublished = new Set(p.adoptionVersions);
    return sum + uniquePublished.size;
  }, 0);
  return {
    authUsersCreateOrUpdate: PLAYER_SPECS.length,
    userXProfiles: PLAYER_SPECS.filter((p) => p.handle).length,
    projectWatches: PLAYER_SPECS.filter((p) => p.watch).length,
    // One voice per user (unique user_id+prompt_id). Adoptions reuse that early voice.
    projectVoiceResponses: PLAYER_SPECS.length,
    projectFeedback: 0,
    voiceAdoptions: adoptionRows,
    projectDevlogs: Object.keys(DEVLOG_IDS).length,
    matcherRuns: 1,
    projectVersionPrompts: Object.keys(PROMPT_IDS).length,
  };
}

async function main() {
  const execute = process.argv.includes("--execute");
  const env = loadEnv(".env.local");
  const url = env.NEXT_PUBLIC_SUPABASE_URL?.trim() || "";
  const serviceKey = (env.SUPABASE_SERVICE_ROLE_KEY || env.STAGING_SUPABASE_SERVICE_ROLE_KEY || "").trim();
  const ref = assertStagingOnly(url);
  if (!serviceKey) throw new Error("ABORT: SUPABASE_SERVICE_ROLE_KEY missing");

  const plan = {
    mode: execute ? "EXECUTE" : "DRY_RUN",
    ref,
    projectId: PROJECT_ID,
    marker: MARKER,
    reusesPlayerA: false,
    mutatesOwnerAuth: false,
    mutatesSmokeAProjectFields: false,
    watchers: PLAYER_SPECS.filter((p) => p.watch).length,
    earlyPlayers: PLAYER_SPECS.length,
    updateContributors: PLAYER_SPECS.filter((p) => p.adoptionCount > 0).length,
    plannedCounts: plannedCounts(),
    users: PLAYER_SPECS.map((p) => ({
      key: p.key,
      email: densityEmail(p.key),
      display_name: p.displayName,
      handle: p.handle,
      avatar: p.avatar,
      adoptionCount: p.adoptionCount,
    })),
    avatarMix: {
      withAvatar: PLAYER_SPECS.filter((p) => p.avatar).length,
      withoutAvatar: PLAYER_SPECS.filter((p) => !p.avatar).length,
    },
    handleMix: {
      withHandle: PLAYER_SPECS.filter((p) => p.handle).length,
      withoutHandle: PLAYER_SPECS.filter((p) => !p.handle).length,
    },
  };
  console.log(JSON.stringify(plan, null, 2));

  if (!execute) {
    console.log("Dry-run only. Re-run with --execute to write Staging.");
    return;
  }

  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("id,visibility,release_status,owner_id")
    .eq("id", PROJECT_ID)
    .maybeSingle();
  if (projectError) throw projectError;
  if (!project || project.visibility !== "public") {
    throw new Error("ABORT: Smoke A missing or not public");
  }
  if (project.release_status !== "in_development") {
    throw new Error(`ABORT: expected in_development, got ${project.release_status}`);
  }
  if (project.owner_id !== OWNER_ID) {
    throw new Error("ABORT: Smoke A owner_id unexpected — refuse to seed");
  }

  const existingUsers = await listAllUsers(supabase);
  const players = [];
  for (const spec of PLAYER_SPECS) {
    players.push(await ensureDensityUser(supabase, spec, existingUsers));
  }

  // Reuse Phase A / existing prompts when (project_id, version_key) already exists
  // (unique: project_version_prompts_default_idx). Only insert density fixed IDs for missing keys.
  /** @type {Record<string, string>} */
  const promptIds = {};
  /** @type {string[]} */
  const promptsCreated = [];
  /** @type {string[]} */
  const promptsReused = [];
  for (const [versionKey, densityId] of Object.entries(PROMPT_IDS)) {
    const { data: existing, error: lookupError } = await supabase
      .from("project_version_prompts")
      .select("id")
      .eq("project_id", PROJECT_ID)
      .eq("version_key", versionKey)
      .maybeSingle();
    if (lookupError) throw lookupError;
    if (existing?.id) {
      promptIds[versionKey] = existing.id;
      promptsReused.push(versionKey);
      continue;
    }
    const { error } = await supabase.from("project_version_prompts").upsert(
      {
        id: densityId,
        project_id: PROJECT_ID,
        version_key: versionKey,
        prompt_text: `ST density: ${versionKey} の感想は？`,
        response_kind: "short_text",
        options: null,
        sort_order: 0,
        source: "developer",
      },
      { onConflict: "id" },
    );
    if (error) throw error;
    promptIds[versionKey] = densityId;
    promptsCreated.push(versionKey);
  }

  // Reuse existing published_version devlog when present (Phase A 0.1.1); create density rows only when missing.
  /** @type {Record<string, string>} */
  const devlogIds = {};
  /** @type {string[]} */
  const devlogsCreated = [];
  /** @type {string[]} */
  const devlogsReused = [];
  for (const [publishedVersion, densityId] of Object.entries(DEVLOG_IDS)) {
    const { data: existing, error: lookupError } = await supabase
      .from("project_devlogs")
      .select("id")
      .eq("project_id", PROJECT_ID)
      .eq("published_version", publishedVersion)
      .limit(1)
      .maybeSingle();
    if (lookupError) throw lookupError;
    if (existing?.id) {
      devlogIds[publishedVersion] = existing.id;
      devlogsReused.push(publishedVersion);
      continue;
    }
    const { error } = await supabase.from("project_devlogs").upsert(
      {
        id: densityId,
        project_id: PROJECT_ID,
        author_id: OWNER_ID,
        title: `ST density: ${publishedVersion}`,
        content: `${MARKER} temporary densify seed. Do not use in production.`,
        published_version: publishedVersion,
        published_at: daysAgoIso(publishedVersion === "0.1.1" ? 8 : 3),
        created_at: daysAgoIso(publishedVersion === "0.1.1" ? 8 : 3),
      },
      { onConflict: "id" },
    );
    if (error) throw error;
    devlogIds[publishedVersion] = densityId;
    devlogsCreated.push(publishedVersion);
  }

  {
    const { error } = await supabase.from("voice_adoption_matcher_runs").upsert(
      {
        id: MATCHER_RUN_ID,
        devlog_id: devlogIds["0.2"] ?? devlogIds["0.1.1"],
        project_id: PROJECT_ID,
        trigger_type: "backfill",
        trigger_version: MARKER,
        status: "completed",
        candidate_count: 40,
        evaluated_count: 40,
        adopted_count: 40,
        model: "fixture",
        prompt_version: MARKER,
        started_at: daysAgoIso(2),
        completed_at: daysAgoIso(2),
      },
      { onConflict: "id" },
    );
    if (error) throw error;
  }

  // Idempotent: clear previous density adoptions / adoption voices by fixed ids
  await supabase.from("voice_adoptions").delete().eq("matcher_run_id", MATCHER_RUN_ID);

  let watchCount = 0;
  let earlyCount = 0;
  let adoptionRows = 0;

  for (const [index, player] of players.entries()) {
    const { userId, spec } = player;
    const watchedAt = daysAgoIso(12 - index);

    if (spec.watch) {
      const { error } = await supabase.from("project_watches").upsert({
        user_id: userId,
        project_id: PROJECT_ID,
        created_at: watchedAt,
      });
      if (error) throw error;
      watchCount += 1;
    }

    const earlyAt = daysAgoIso(20 - index);
    const earlyId = earlyVoiceId(spec.key);
    {
      const promptId = promptIds[spec.earlyVersion];
      if (!promptId) throw new Error(`ABORT: missing prompt for earlyVersion ${spec.earlyVersion}`);
      const { error } = await supabase.from("project_voice_responses").upsert(
        {
          id: earlyId,
          user_id: userId,
          project_id: PROJECT_ID,
          version_key: spec.earlyVersion,
          prompt_id: promptId,
          answer_value: `${MARKER} early ${spec.key}`,
          answer_label: null,
          moderation_status: "visible",
          created_at: earlyAt,
          updated_at: earlyAt,
        },
        { onConflict: "id" },
      );
      if (error) throw error;
      earlyCount += 1;
    }

    // DB: unique (user_id, prompt_id) and unique (voice_response_id, devlog_id).
    // Reuse the early voice; one adoption per distinct published_version/devlog.
    const uniquePublished = [...new Set(spec.adoptionVersions)];
    for (let i = 0; i < uniquePublished.length; i += 1) {
      const publishedVersion = uniquePublished[i];
      const index1 = i + 1;
      const targetDevlogId = devlogIds[publishedVersion];
      if (!targetDevlogId) throw new Error(`ABORT: missing devlog for publishedVersion ${publishedVersion}`);
      const summaryIndex = spec.adoptionVersions.indexOf(publishedVersion);
      const { error: adoptionError } = await supabase.from("voice_adoptions").upsert(
        {
          id: adoptionId(spec.key, index1),
          project_id: PROJECT_ID,
          user_id: userId,
          voice_response_id: earlyId,
          devlog_id: targetDevlogId,
          voice_version_key: spec.earlyVersion,
          published_version: publishedVersion,
          player_quote: `${MARKER} adoption ${spec.key}-${index1}`,
          update_summary: spec.summaries[summaryIndex] ?? spec.summaries[0] ?? "改善を反映した",
          prompt_text: `ST density: ${publishedVersion}`,
          confidence: 0.9,
          model: "fixture",
          matcher_run_id: MATCHER_RUN_ID,
          status: "active",
          created_at: daysAgoIso(10 - i),
          updated_at: daysAgoIso(10 - i),
        },
        { onConflict: "id" },
      );
      if (adoptionError) throw adoptionError;
      adoptionRows += 1;
    }
  }

  // Post-write RPC check uses anon (GRANT is for anon/authenticated; service_role may be denied).
  const anonKey = (env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "").trim();
  if (!anonKey) throw new Error("ABORT: NEXT_PUBLIC_SUPABASE_ANON_KEY missing for post-seed RPC check");
  const anonClient = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: rpc, error: rpcError } = await anonClient.rpc("get_project_special_thanks", {
    p_project_id: PROJECT_ID,
  });
  if (rpcError) throw rpcError;

  const rpcJson = JSON.stringify(rpc ?? {});
  console.log(
    JSON.stringify(
      {
        wrote: {
          players: players.length,
          watchCount,
          earlyCount,
          adoptionRows,
          updateContributorsPlanned: PLAYER_SPECS.filter((p) => p.adoptionCount > 0).length,
          promptsCreated,
          promptsReused,
          promptIds,
          devlogsCreated,
          devlogsReused,
          devlogIds,
        },
        rpcSummary: {
          watchers: Array.isArray(rpc?.watchers) ? rpc.watchers.length : null,
          update_contributors: Array.isArray(rpc?.update_contributors)
            ? rpc.update_contributors.length
            : null,
          early_players: Array.isArray(rpc?.early_players) ? rpc.early_players.length : null,
          hasAvatarSample: Boolean(rpc?.watchers?.some((w) => w.avatar_url)),
          keys: rpc ? Object.keys(rpc) : [],
          leaks_user_id: /"user_id"/.test(rpcJson),
          leaks_email: /"email"/.test(rpcJson),
        },
      },
      null,
      2,
    ),
  );
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
