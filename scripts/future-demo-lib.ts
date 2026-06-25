/**
 * Future demo world — shared constants and helpers (staging Seeder)
 */
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";
import type { SupabaseClient } from "@supabase/supabase-js";
import { resolveWitnessTier } from "../lib/witness-tier";

export const FUTURE_DEMO_TITLE_PREFIX = "[future-demo]";
export const FUTURE_DEMO_MARKER = "forge-future-demo-world-v1";

export const DEMO_VETERAN_EMAIL = "veteran@forge-future-demo.local";
export const DEMO_VETERAN_PASSWORD = "ForgeDemo!Veteran2026";
export const DEMO_NEW_USER_EMAIL = "new@forge-future-demo.local";
export const DEMO_NEW_USER_PASSWORD = "ForgeDemo!New2026";

export const VERIFY_THRESHOLDS = {
  projects: 20,
  devlogs: 60,
  voices: 100,
  released: 10,
  reopened: 2,
  worldGrants: 30,
  veteranGrants: 10,
  veteranSessions: 40,
  veteranVoices: 25,
} as const;

export const VETERAN_OWNED_PROJECT_COUNT = 7;

export const VETERAN_DEVELOPER_THRESHOLDS = {
  ownedProjects: 6,
  ownedReleased: 4,
  ownedReopened: 1,
  ownedDevlogs: 20,
  ownedVoices: 15,
} as const;

export const VETERAN_DEVELOPER_NAME = "デモベテラン";
export const VETERAN_DEVELOPER_CREATOR = "Demo Veteran";
export const VETERAN_DEVELOPER_CREATOR_ID = "future-demo-veteran";

export const VETERAN_PROJECT_SUFFIXES = [
  "炉心の残光",
  "緑潮の工房",
  "星屑の航路",
  "白磁の庭",
  "夜航の手記",
  "琥珀の回廊",
  "遠雷の譜",
] as const;

export const WORLD_COUNTS = {
  projects: 25,
  devNpcs: 6,
  playerNpcs: 12,
  released: 12,
  reopened: 3,
  veteranGrantTarget: 12,
} as const;

export type FutureDemoWorldMeta = {
  worldId: string;
  veteranId: string;
  newUserId: string;
  devNpcIds: string[];
  playerNpcIds: string[];
  projectIds: string[];
  releasedProjectIds: string[];
  reopenedProjectIds: string[];
  veteranOwnedProjectIds?: string[];
  seededAt: string;
  visibility: "public" | "private";
};

export type DevNpcDef = {
  key: string;
  email: string;
  password: string;
  publicName: string;
  creator: string;
  projectCount: number;
};

export const DEV_NPC_DEFS: DevNpcDef[] = [
  {
    key: "dev1",
    email: "npc-dev-1@forge-future-demo.local",
    password: "ForgeDemo!NpcDev1",
    publicName: "星野あかり",
    creator: "星野あかり",
    projectCount: 5,
  },
  {
    key: "dev2",
    email: "npc-dev-2@forge-future-demo.local",
    password: "ForgeDemo!NpcDev2",
    publicName: "結城ソラ",
    creator: "結城ソラ",
    projectCount: 4,
  },
  {
    key: "dev3",
    email: "npc-dev-3@forge-future-demo.local",
    password: "ForgeDemo!NpcDev3",
    publicName: "霧島レン",
    creator: "霧島レン",
    projectCount: 4,
  },
  {
    key: "dev4",
    email: "npc-dev-4@forge-future-demo.local",
    password: "ForgeDemo!NpcDev4",
    publicName: "白井ヒカル",
    creator: "白井ヒカル",
    projectCount: 4,
  },
  {
    key: "dev5",
    email: "npc-dev-5@forge-future-demo.local",
    password: "ForgeDemo!NpcDev5",
    publicName: "黒川ユイ",
    creator: "黒川ユイ",
    projectCount: 4,
  },
  {
    key: "dev6",
    email: "npc-dev-6@forge-future-demo.local",
    password: "ForgeDemo!NpcDev6",
    publicName: "青木タク",
    creator: "青木タク",
    projectCount: 4,
  },
];

export const PROJECT_TITLE_SUFFIXES = [
  "星灯の旅路",
  "潮音の記録",
  "深淵ノート",
  "霧港の余白",
  "砂上の盟約",
  "初灯の試作",
  "群青の境界",
  "ネオンアーカイブ",
  "灰都奇譚",
  "緋色の砂",
  "蒼穹の舟",
  "古森の約束",
  "氷裂の譜",
  "銅線の迷宮",
  "夜明けの檻",
  "遠望の詩",
  "晶雲の駅",
  "残響の城",
  "薄明の枝",
  "逆潮の橋",
  "静寂の炉",
  "白夜の旅",
  "裂け目の庭",
  "忘却の港",
  "終末の種",
] as const;

export const GENRES = [
  "アクションRPG",
  "パズル",
  "ホラー",
  "シミュレーション",
  "アドベンチャー",
  "ローグライク",
] as const;

const WORLD_STATE_PATH = join(process.cwd(), "scripts", ".future-demo-world-state.json");

export function loadEnvLocal() {
  try {
    const raw = readFileSync(".env.local", "utf8");
    for (const line of raw.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq);
      const value = trimmed.slice(eq + 1);
      if (!process.env[key]) process.env[key] = value;
    }
  } catch {
    /* optional */
  }
}

export function projectTitle(suffix: string) {
  return `${FUTURE_DEMO_TITLE_PREFIX} ${suffix}`;
}

export function encodeWorldDescription(meta: FutureDemoWorldMeta, blurb: string) {
  return `${blurb}\n\n${FUTURE_DEMO_MARKER}\n${JSON.stringify(meta)}`;
}

export function decodeWorldMeta(description: string | null | undefined): FutureDemoWorldMeta | null {
  if (!description?.includes(FUTURE_DEMO_MARKER)) {
    return null;
  }

  const jsonLine = description.split(`\n${FUTURE_DEMO_MARKER}\n`)[1]?.split("\n")[0];
  if (!jsonLine) {
    return null;
  }

  try {
    return JSON.parse(jsonLine) as FutureDemoWorldMeta;
  } catch {
    return null;
  }
}

export function saveWorldState(meta: FutureDemoWorldMeta) {
  writeFileSync(WORLD_STATE_PATH, JSON.stringify(meta, null, 2), "utf8");
}

export function loadWorldState(): FutureDemoWorldMeta | null {
  if (!existsSync(WORLD_STATE_PATH)) {
    return null;
  }

  try {
    return JSON.parse(readFileSync(WORLD_STATE_PATH, "utf8")) as FutureDemoWorldMeta;
  } catch {
    return null;
  }
}

export async function check014Applied(supabase: SupabaseClient): Promise<boolean> {
  const { error } = await supabase.from("project_witness_grants").select("id").limit(1);

  if (error) {
    console.log("FAIL 014 — project_witness_grants:", error.message);
    return false;
  }

  return true;
}

export async function listFutureDemoProjects(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("projects")
    .select("id, title, owner_id, description, release_status, visibility, created_at")
    .like("title", `${FUTURE_DEMO_TITLE_PREFIX}%`)
    .order("created_at", { ascending: true });

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function ensureAuthUser(
  supabase: SupabaseClient,
  email: string,
  password: string,
): Promise<string> {
  const { data: listData, error: listError } = await supabase.auth.admin.listUsers({
    perPage: 1000,
  });

  if (listError) {
    throw listError;
  }

  const existing = (listData.users ?? []).find((user) => user.email === email);
  if (existing) {
    const { error: updateError } = await supabase.auth.admin.updateUserById(existing.id, {
      password,
      email_confirm: true,
    });

    if (updateError) {
      throw updateError;
    }

    return existing.id;
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (error || !data.user) {
    throw error ?? new Error(`createUser failed for ${email}`);
  }

  return data.user.id;
}

export async function ensureDeveloperProfile(
  supabase: SupabaseClient,
  userId: string,
  creatorId: string,
  publicName: string,
) {
  const { error } = await supabase.from("developer_profiles").upsert(
    {
      user_id: userId,
      creator_id: creatorId,
      public_name: publicName,
      profile: `${publicName} — Forge 将来像デモ世界の開発者です。`,
    },
    { onConflict: "user_id" },
  );

  if (error) {
    throw error;
  }
}

export function makePlayerNpcEmail(index: number) {
  return `npc-player-${index}@forge-future-demo.local`;
}

export function makePlayerNpcPassword(index: number) {
  return `ForgeDemo!NpcPlayer${index}`;
}

export function worldBaseTime() {
  return new Date("2025-12-01T09:00:00.000Z");
}

export function worldTs(base: Date, offsetMinutes: number) {
  return new Date(base.getTime() + offsetMinutes * 60_000).toISOString();
}

export async function ensureVersionPrompt(
  supabase: SupabaseClient,
  projectIdText: string,
  versionKey: string,
) {
  const { data: existing } = await supabase
    .from("project_version_prompts")
    .select("id")
    .eq("project_id", projectIdText)
    .eq("version_key", versionKey)
    .eq("source", "platform_default")
    .maybeSingle();

  if (existing?.id) {
    return existing.id as string;
  }

  const { data, error } = await supabase
    .from("project_version_prompts")
    .insert({
      project_id: projectIdText,
      version_key: versionKey,
      prompt_text: "このverをプレイした感想を教えてください。",
      response_kind: "yes_no",
      options: [
        { value: "yes", label: "はい" },
        { value: "no", label: "いいえ" },
      ],
      sort_order: 0,
      source: "platform_default",
    })
    .select("id")
    .single();

  if (error) {
    throw error;
  }

  return data.id as string;
}

export async function upsertPlay(
  supabase: SupabaseClient,
  userId: string,
  projectIdText: string,
  playedAt: string,
) {
  const { error } = await supabase.from("project_plays").upsert(
    { user_id: userId, project_id: projectIdText, created_at: playedAt },
    { onConflict: "user_id,project_id" },
  );

  if (error) {
    throw error;
  }
}

export async function insertSession(
  supabase: SupabaseClient,
  input: {
    userId: string;
    projectIdText: string;
    versionKey: string;
    playedAt: string;
  },
) {
  const { error } = await supabase.from("project_play_sessions").insert({
    user_id: input.userId,
    project_id: input.projectIdText,
    version_key: input.versionKey,
    played_at: input.playedAt,
    context: "general",
  });

  if (error) {
    throw error;
  }
}

export async function insertVoice(
  supabase: SupabaseClient,
  input: {
    userId: string;
    projectIdText: string;
    versionKey: string;
    promptId: string;
    createdAt: string;
    answerValue?: string;
    answerLabel?: string;
  },
) {
  const { error } = await supabase.from("project_voice_responses").insert({
    user_id: input.userId,
    project_id: input.projectIdText,
    version_key: input.versionKey,
    prompt_id: input.promptId,
    answer_value: input.answerValue ?? "yes",
    answer_label: input.answerLabel ?? "はい",
    created_at: input.createdAt,
  });

  if (error) {
    throw error;
  }
}

export async function insertWatch(
  supabase: SupabaseClient,
  userId: string,
  projectIdText: string,
  createdAt: string,
) {
  const { error } = await supabase.from("project_watches").upsert(
    { user_id: userId, project_id: projectIdText, created_at: createdAt },
    { onConflict: "user_id,project_id" },
  );

  if (error) {
    throw error;
  }
}

export async function insertReleaseEvent(
  supabase: SupabaseClient,
  projectId: string,
  ownerId: string,
  eventType: "released" | "release_reopened",
  note: string,
  createdAt: string,
) {
  const nextStatus = eventType === "released" ? "released" : "release_reopened";

  const { error: eventError } = await supabase.from("project_release_events").insert({
    project_id: projectId,
    event_type: eventType,
    actor_user_id: ownerId,
    note,
    created_at: createdAt,
  });

  if (eventError) {
    throw eventError;
  }

  const { error: statusError } = await supabase
    .from("projects")
    .update({ release_status: nextStatus })
    .eq("id", projectId);

  if (statusError) {
    throw statusError;
  }
}

export async function countFutureDemoGrants(supabase: SupabaseClient, projectIds: string[]) {
  if (projectIds.length === 0) {
    return 0;
  }

  const { count, error } = await supabase
    .from("project_witness_grants")
    .select("id", { count: "exact", head: true })
    .in("project_id", projectIds);

  if (error) {
    throw error;
  }

  return count ?? 0;
}

export async function projectHasGrants(supabase: SupabaseClient, projectId: string) {
  const { count, error } = await supabase
    .from("project_witness_grants")
    .select("id", { count: "exact", head: true })
    .eq("project_id", projectId);

  if (error) {
    throw error;
  }

  return (count ?? 0) > 0;
}

export async function deleteFutureDemoProjectData(
  supabase: SupabaseClient,
  projectId: string,
  projectIdText: string,
) {
  if (await projectHasGrants(supabase, projectId)) {
    return false;
  }

  await supabase.from("project_release_events").delete().eq("project_id", projectId);
  await supabase.from("project_play_sessions").delete().eq("project_id", projectIdText);
  await supabase.from("project_plays").delete().eq("project_id", projectIdText);
  await supabase.from("project_voice_responses").delete().eq("project_id", projectIdText);
  await supabase.from("project_watches").delete().eq("project_id", projectIdText);
  await supabase.from("project_version_prompts").delete().eq("project_id", projectIdText);
  await supabase.from("project_devlogs").delete().eq("project_id", projectIdText);
  await supabase.from("projects").delete().eq("id", projectId);
  return true;
}

export async function setFutureDemoVisibility(
  supabase: SupabaseClient,
  visibility: "public" | "private",
) {
  const projects = await listFutureDemoProjects(supabase);
  let updated = 0;

  for (const project of projects) {
    const { error } = await supabase
      .from("projects")
      .update({ visibility })
      .eq("id", project.id as string);

    if (error) {
      throw error;
    }

    updated += 1;
  }

  const state = loadWorldState();
  if (state) {
    saveWorldState({ ...state, visibility });
  }

  return updated;
}

export function printLoginCredentials() {
  console.log("\n=== Future demo login (staging) ===");
  console.log("Demo Veteran (主役):");
  console.log(`  email: ${DEMO_VETERAN_EMAIL}`);
  console.log(`  password: ${DEMO_VETERAN_PASSWORD}`);
  console.log("Demo New User (对比):");
  console.log(`  email: ${DEMO_NEW_USER_EMAIL}`);
  console.log(`  password: ${DEMO_NEW_USER_PASSWORD}`);
  console.log("\nWalkthrough: docs/future-demo-walkthrough.md");
  console.log("Hide demo world: npm run hide:future-demo:staging");
  console.log("Show demo world: npm run show:future-demo:staging");
}

export function assertVeteranGold(grantCount: number) {
  const tier = resolveWitnessTier(grantCount);
  return tier?.label === "見届け人 Gold";
}
