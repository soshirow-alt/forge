/**
 * STAGING ONLY — Player IA dedicated auth users + developer_profiles (extension seed).
 *
 * Requires service role. Uses Supabase Admin API (never raw INSERT into auth.users).
 * Does NOT mutate existing Staging profiles (hero / Smoke owners).
 *
 * Usage:
 *   npx --yes tsx scripts/staging-only/player-ia-auth-seed.ts           # dry-run
 *   npx --yes tsx scripts/staging-only/player-ia-auth-seed.ts --execute  # write
 *
 * Guards:
 *   - aborts on Production ref bpnisgzxuwdxelhnduuf
 *   - requires Staging ref vuqpwvjvgyxffmvpfrxo
 *   - skips (exit 0) when credentials missing
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const STAGING_REF = "vuqpwvjvgyxffmvpfrxo";
const PROD_REF = "bpnisgzxuwdxelhnduuf";
const MARKER = "forge-ia-auth-seed-v1";
const EMAIL_DOMAIN = "forge-ia-seed.local";
const PROFILE_COUNT = 20;
const DESC_PREFIX = "[IA Auth Seed]";

type ProfileSpec = {
  n: number;
  userId: string;
  email: string;
  creatorId: string;
  publicName: string;
  profile: string;
  activityTags: string[];
};

function userId(n: number): string {
  return `a1a1a1a1-a1a1-41a1-81a1-${String(n).padStart(12, "0")}`;
}

function loadEnv(): Record<string, string> {
  const env: Record<string, string> = { ...process.env } as Record<string, string>;
  for (const file of [".env.local", ".env"]) {
    const p = resolve(process.cwd(), file);
    if (!existsSync(p)) continue;
    for (const line of readFileSync(p, "utf8").split("\n")) {
      const t = line.trim();
      if (!t || t.startsWith("#")) continue;
      const eq = t.indexOf("=");
      if (eq < 0) continue;
      let value = t.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      const key = t.slice(0, eq).trim();
      if (env[key] == null || env[key] === "") env[key] = value;
    }
  }
  return env;
}

function extractRef(url: string): string | null {
  try {
    const m = new URL(url).hostname.match(/^([a-z0-9]+)\.supabase\.co$/i);
    return m ? m[1] : null;
  } catch {
    return null;
  }
}

function buildSpecs(): ProfileSpec[] {
  const longName =
    "IA Seed 超長い制作者プロフィール名の折り返し検証用ABCDEFG";
  const bases: Array<{
    name: string;
    tags: string[];
    blurb: string;
  }> = [
    { name: "IA Seed ゲーム職人", tags: ["game_creator", "player"], blurb: "ローグライクと短編ゲームを作る制作者。" },
    { name: "IA Seed ホラー好きDev", tags: ["game_creator", "player"], blurb: "ホラー好き。廃校もの中心。" },
    { name: "IA Seed Unity屋", tags: ["tool_developer", "game_creator"], blurb: "Unity ツールとゲームの両方。" },
    { name: "IA Seed UEクリエイター", tags: ["tool_developer", "asset_creator"], blurb: "Unreal Engine 向けアセットとツール。" },
    { name: "IA Seed Godot民", tags: ["tool_developer", "game_creator"], blurb: "Godot マップ生成と短編。" },
    { name: "IA Seed 配信者A", tags: ["streamer_creator", "player"], blurb: "配信者。配信OK作品を探す側でもある。" },
    { name: "IA Seed 配信者B", tags: ["streamer_creator", "game_creator"], blurb: "配信者・動画制作者。実況向け短編も出す。" },
    { name: "IA Seed ドット絵師", tags: ["asset_creator"], blurb: "ドット絵とスプライト中心。" },
    { name: "IA Seed 3Dキャラ職人", tags: ["asset_creator"], blurb: "3Dキャラクターとモーション。" },
    { name: "IA Seed BGM制作", tags: ["audio_creator"], blurb: "BGM制作とループ音源。" },
    { name: "IA Seed SE職人", tags: ["audio_creator", "asset_creator"], blurb: "SEとゲーム向け音素材。" },
    { name: "IA Seed ツール屋", tags: ["tool_developer"], blurb: "SDK / CLI / セーブシステム。" },
    { name: "IA Seed サービス開発", tags: ["service_app_developer"], blurb: "Webサービスと制作管理。" },
    { name: "IA Seed 分析屋", tags: ["service_app_developer", "tool_developer"], blurb: "分析ダッシュボード。" },
    { name: "IA Seed Bot作者", tags: ["service_app_developer", "streamer_creator"], blurb: "配信支援Bot。配信者向け。" },
    { name: "IA Seed マルチA", tags: ["game_creator", "audio_creator", "asset_creator"], blurb: "複数カテゴリで活動（ゲーム/音/アセット）。" },
    { name: "IA Seed マルチB", tags: ["tool_developer", "service_app_developer", "game_creator"], blurb: "ツールとサービスとゲーム。" },
    { name: "IA Seed テスト募集", tags: ["game_creator", "player"], blurb: "テストプレイ募集が多い制作者。" },
    { name: "IA Seed 制作に使える派", tags: ["asset_creator", "audio_creator"], blurb: "制作に使える素材を公開。" },
    { name: longName, tags: ["player", "streamer_creator", "game_creator"], blurb: "長い名前エッジケース。配信OKな短編ゲームも。" },
  ];

  return bases.map((b, i) => {
    const n = i + 1;
    const id = String(n).padStart(2, "0");
    return {
      n,
      userId: userId(n),
      email: `ia-seed-dev-${id}@${EMAIL_DOMAIN}`,
      creatorId: `ia-seed-dev-${id}`,
      publicName: b.name,
      profile: `${DESC_PREFIX} ${b.blurb} marker=${MARKER}`,
      activityTags: b.tags,
    };
  });
}

async function listAllUsers(sb: SupabaseClient) {
  const users: Array<{ id: string; email?: string; user_metadata?: Record<string, unknown> }> = [];
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await sb.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw new Error(`listUsers failed: ${error.message}`);
    users.push(...(data.users as typeof users));
    if (data.users.length < 200) break;
  }
  return users;
}

async function ensureUser(
  sb: SupabaseClient,
  spec: ProfileSpec,
  existing: Array<{ id: string; email?: string; user_metadata?: Record<string, unknown> }>,
) {
  const found = existing.find((u) => u.email === spec.email || u.id === spec.userId);
  if (found) {
    const { error } = await sb.auth.admin.updateUserById(found.id, {
      email_confirm: true,
      user_metadata: {
        ...(found.user_metadata || {}),
        forge_seed_marker: MARKER,
        creator_id: spec.creatorId,
      },
    });
    if (error) throw new Error(`updateUserById failed for ${spec.email}: ${error.message}`);
    return found.id;
  }
  const { data, error } = await sb.auth.admin.createUser({
    id: spec.userId,
    email: spec.email,
    password: `IaSeed!${spec.userId.slice(-8)}`,
    email_confirm: true,
    user_metadata: { forge_seed_marker: MARKER, creator_id: spec.creatorId },
  });
  if (error) throw new Error(`createUser failed for ${spec.email}: ${error.message}`);
  return data.user!.id;
}

async function upsertProfile(sb: SupabaseClient, userId: string, spec: ProfileSpec) {
  const { error } = await sb.from("developer_profiles").upsert(
    {
      user_id: userId,
      creator_id: spec.creatorId,
      public_name: spec.publicName,
      profile: spec.profile,
      activity_tags: spec.activityTags,
    },
    { onConflict: "user_id" },
  );
  if (error) throw new Error(`upsert profile failed for ${spec.creatorId}: ${error.message}`);
}

async function main() {
  const execute = process.argv.includes("--execute");
  const specs = buildSpecs();
  if (specs.length < PROFILE_COUNT) {
    throw new Error(`expected >= ${PROFILE_COUNT} profiles`);
  }

  const creatorIds = specs.map((s) => s.creatorId);
  if (new Set(creatorIds).size !== creatorIds.length) {
    throw new Error("duplicate creator_id in auth seed specs");
  }
  const userIds = specs.map((s) => s.userId);
  if (new Set(userIds).size !== userIds.length) {
    throw new Error("duplicate user_id in auth seed specs");
  }

  console.log(
    JSON.stringify(
      {
        mode: execute ? "execute" : "dry-run",
        stagingRef: STAGING_REF,
        profiles: specs.length,
        streamerCreators: specs.filter((s) => s.activityTags.includes("streamer_creator")).length,
        multiCategory: specs.filter((s) => s.activityTags.length >= 2).length,
        marker: MARKER,
      },
      null,
      2,
    ),
  );

  if (!execute) {
    console.log("Dry-run only. Pass --execute to write Staging (service role required).");
    return;
  }

  const env = loadEnv();
  const url = env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL || "";
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY || "";
  if (!url || !serviceKey) {
    console.error(
      "SKIP: missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY — auth seed not applied.",
    );
    process.exit(0);
  }

  const ref = extractRef(url);
  if (ref === PROD_REF) {
    throw new Error("ABORT: Production ref — refuse auth seed");
  }
  if (ref !== STAGING_REF) {
    throw new Error(`ABORT: expected Staging ref ${STAGING_REF}, got ${ref}`);
  }

  const sb = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const existing = await listAllUsers(sb);
  for (const spec of specs) {
    const id = await ensureUser(sb, spec, existing);
    await upsertProfile(sb, id, spec);
    console.log(`ok ${spec.creatorId} (${id})`);
  }
  console.log(`DONE auth seed: ${specs.length} profiles`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
