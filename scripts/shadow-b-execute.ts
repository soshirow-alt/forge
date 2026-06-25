/**
 * shadow B — 実運用寄せ voice mix → devlog 新ver公開 → live matcher → FP レビュー
 *
 * mix: direct 2 / indirect 3 / reject 5（計 10）
 *
 * Usage:
 *   npm run shadow:b -- [--project-id <id>]
 */

import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { runAdoptionMatcherForDevlog } from "../lib/voice-adoption/run-adoption-matcher";
import { isVoiceAdoptionPlayerVisible } from "../lib/voice-adoption/constants";
import { resolvePlayableVersion, DEFAULT_PLAYABLE_VERSION } from "../lib/playable-version";

function loadEnvLocal(): void {
  const path = resolve(process.cwd(), ".env.local");
  if (!existsSync(path)) return;
  const text = readFileSync(path, "utf8");
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

loadEnvLocal();

const projectIdArg =
  process.argv.find((a) => a.startsWith("--project-id="))?.split("=")[1] ??
  (process.argv.indexOf("--project-id") >= 0
    ? process.argv[process.argv.indexOf("--project-id") + 1]
    : undefined);

type VoiceSpec = {
  key: string;
  tag: "direct" | "indirect" | "reject";
  label: string;
  answer: string;
  promptText: string;
};

/** 実運用寄せ mix — direct 2 / indirect 3 / reject 5 */
const SHADOW_B_VOICES: VoiceSpec[] = [
  {
    key: "direct-ui",
    tag: "direct",
    label: "UIの説明が分かりにくい",
    answer: "ステータス画面の説明が分かりにくかった",
    promptText: "shadow-b direct — UI説明",
  },
  {
    key: "direct-bgm",
    tag: "direct",
    label: "BGM音量が小さい",
    answer: "BGMの音量が小さくて聞こえにくい",
    promptText: "shadow-b direct — BGM音量",
  },
  {
    key: "indirect-tempo",
    tag: "indirect",
    label: "テンポが悪い",
    answer: "テンポが悪くて退屈に感じた",
    promptText: "shadow-b indirect — テンポ",
  },
  {
    key: "indirect-bored",
    tag: "indirect",
    label: "序盤が退屈",
    answer: "序盤が退屈で続ける気が失せた",
    promptText: "shadow-b indirect — 序盤退屈",
  },
  {
    key: "indirect-hard",
    tag: "indirect",
    label: "最初が難しすぎる",
    answer: "最初のステージが難しすぎて詰んだ",
    promptText: "shadow-b indirect — 初期難易度",
  },
  {
    key: "reject-multi",
    tag: "reject",
    label: "マルチプレイが欲しい",
    answer: "マルチプレイが欲しい",
    promptText: "shadow-b reject — マルチ",
  },
  {
    key: "reject-praise",
    tag: "reject",
    label: "ゲームは面白い",
    answer: "ゲームは面白い",
    promptText: "shadow-b reject — 称賛のみ",
  },
  {
    key: "reject-save",
    tag: "reject",
    label: "セーブ機能が欲しい",
    answer: "セーブ機能が欲しい",
    promptText: "shadow-b reject — セーブ",
  },
  {
    key: "reject-pvp",
    tag: "reject",
    label: "PvPが欲しい",
    answer: "PvPが欲しい",
    promptText: "shadow-b reject — PvP",
  },
  {
    key: "reject-monetize",
    tag: "reject",
    label: "課金システム追加",
    answer: "課金システムを追加してほしい",
    promptText: "shadow-b reject — 課金",
  },
];

const SHADOW_B_DEVLOG = {
  title: "shadow-b — 序盤・UI・音響の総合調整",
  content: `今回の更新内容です。

ステータス画面の説明文を整理し、用語を統一しました。
BGMのデフォルト音量を20%上げました。
序盤の待ち時間を30%短縮し、イベント発生までの間隔を詰めました。
最初のステージに小イベントを2つ追加しました。
1面の敵出現数を減らし、初期武器の性能を上げました。`,
};

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing ${name} in .env.local`);
  return value;
}

function bumpVersion(current: string): string {
  const resolved = resolvePlayableVersion(current);
  const parts = resolved.split(".").map((part) => Number.parseInt(part, 10));
  if (parts.some((n) => Number.isNaN(n))) return "0.6";
  const last = parts.length - 1;
  parts[last] = (parts[last] ?? 0) + 1;
  return parts.join(".");
}

async function resolveVoiceVersionKey(
  supabase: SupabaseClient,
  projectId: string,
  playableVersion: string,
): Promise<string> {
  const resolved = resolvePlayableVersion(playableVersion);
  const parts = resolved.split(".").map((part) => Number.parseInt(part, 10));
  if (!parts.some((n) => Number.isNaN(n))) return resolved;

  const { data } = await supabase
    .from("project_voice_responses")
    .select("version_key")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .limit(1);

  if (data?.[0]?.version_key) {
    return resolvePlayableVersion(data[0].version_key as string);
  }
  return DEFAULT_PLAYABLE_VERSION;
}

async function pickProject(supabase: SupabaseClient) {
  const select = async (id: string) => {
    const { data, error } = await supabase
      .from("projects")
      .select("id, title, owner_id, playable_version")
      .eq("id", id)
      .maybeSingle();
    if (error || !data) throw new Error(`Project not found: ${id}`);
    return {
      id: data.id,
      title: data.title,
      ownerId: data.owner_id,
      playableVersion: resolvePlayableVersion(data.playable_version),
    };
  };

  if (projectIdArg) return select(projectIdArg);

  const shadowAProject = "8d6d8478-b470-46ae-9116-a68e68fc05eb";
  try {
    return await select(shadowAProject);
  } catch {
    const { data, error } = await supabase
      .from("projects")
      .select("id, title, owner_id, playable_version")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error || !data) throw new Error("No projects found");
    return {
      id: data.id,
      title: data.title,
      ownerId: data.owner_id,
      playableVersion: resolvePlayableVersion(data.playable_version),
    };
  }
}

async function ensurePrompt(
  supabase: SupabaseClient,
  projectId: string,
  versionKey: string,
  promptText: string,
  sortOrder: number,
): Promise<string> {
  const { data: existing } = await supabase
    .from("project_version_prompts")
    .select("id")
    .eq("project_id", projectId)
    .eq("version_key", versionKey)
    .eq("prompt_text", promptText)
    .maybeSingle();

  if (existing?.id) return existing.id as string;

  const { data, error } = await supabase
    .from("project_version_prompts")
    .insert({
      project_id: projectId,
      version_key: versionKey,
      prompt_text: promptText,
      response_kind: "short_text",
      sort_order: sortOrder,
      source: "developer",
    })
    .select("id")
    .single();

  if (error || !data) throw new Error(`Failed to create prompt: ${error?.message}`);
  return (data as { id: string }).id;
}

async function upsertVoice(
  supabase: SupabaseClient,
  input: {
    userId: string;
    projectId: string;
    versionKey: string;
    promptId: string;
    answer: string;
    label: string;
    createdAt: string;
  },
): Promise<string> {
  const { data: existing } = await supabase
    .from("project_voice_responses")
    .select("id")
    .eq("user_id", input.userId)
    .eq("prompt_id", input.promptId)
    .maybeSingle();

  if (existing?.id) {
    const { data, error } = await supabase
      .from("project_voice_responses")
      .update({
        answer_value: input.answer,
        answer_label: input.label,
        created_at: input.createdAt,
        updated_at: input.createdAt,
      })
      .eq("id", existing.id)
      .select("id")
      .single();
    if (error || !data) throw new Error(`Voice update failed: ${error?.message}`);
    return (data as { id: string }).id;
  }

  const { data, error } = await supabase
    .from("project_voice_responses")
    .insert({
      user_id: input.userId,
      project_id: input.projectId,
      version_key: input.versionKey,
      prompt_id: input.promptId,
      answer_value: input.answer,
      answer_label: input.label,
      created_at: input.createdAt,
      updated_at: input.createdAt,
    })
    .select("id")
    .single();

  if (error || !data) throw new Error(`Voice insert failed: ${error?.message}`);
  return (data as { id: string }).id;
}

function voiceById(voiceIds: Map<string, string>, responseId: string): VoiceSpec | undefined {
  for (const voice of SHADOW_B_VOICES) {
    if (voiceIds.get(voice.key) === responseId) return voice;
  }
  return undefined;
}

async function main() {
  requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  requireEnv("SUPABASE_SERVICE_ROLE_KEY");
  requireEnv("OPENAI_API_KEY");

  if (process.env.NEXT_PUBLIC_VOICE_ADOPTION_FIXTURE?.trim().toLowerCase() === "true") {
    throw new Error("NEXT_PUBLIC_VOICE_ADOPTION_FIXTURE must be false");
  }
  if (process.env.VOICE_ADOPTION_MATCHER_MODE?.trim().toLowerCase() === "fixture") {
    throw new Error("VOICE_ADOPTION_MATCHER_MODE must be live");
  }

  const supabase = createClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  console.log("=== shadow B execute ===");
  console.log(`player UI visible: ${isVoiceAdoptionPlayerVisible()}`);
  console.log(`voice mix: direct 2 / indirect 3 / reject 5`);
  console.log("");

  const project = await pickProject(supabase);
  const voiceVersion = await resolveVoiceVersionKey(
    supabase,
    project.id,
    project.playableVersion,
  );
  const newPublishedVersion = bumpVersion(voiceVersion);
  const voiceCreatedAt = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();

  console.log(`project: ${project.title} (${project.id})`);
  console.log(`voice version (before publish): ${voiceVersion}`);
  console.log(`new published version: ${newPublishedVersion}`);
  console.log("");

  const voiceIds = new Map<string, string>();

  for (let i = 0; i < SHADOW_B_VOICES.length; i++) {
    const voice = SHADOW_B_VOICES[i]!;
    const promptId = await ensurePrompt(
      supabase,
      project.id,
      voiceVersion,
      voice.promptText,
      i,
    );
    const id = await upsertVoice(supabase, {
      userId: project.ownerId,
      projectId: project.id,
      versionKey: voiceVersion,
      promptId,
      answer: voice.answer,
      label: voice.label,
      createdAt: voiceCreatedAt,
    });
    voiceIds.set(voice.key, id);
    console.log(`voice [${voice.tag}] ${voice.label} → ${id}`);
  }

  console.log("");
  console.log("Publishing devlog...");

  const { data: devlogRow, error: devlogErr } = await supabase
    .from("project_devlogs")
    .insert({
      project_id: project.id,
      author_id: project.ownerId,
      title: SHADOW_B_DEVLOG.title,
      content: SHADOW_B_DEVLOG.content,
      published_version: newPublishedVersion,
    })
    .select("id")
    .single();

  if (devlogErr || !devlogRow) {
    throw new Error(`Devlog insert failed: ${devlogErr?.message}`);
  }

  const devlogId = (devlogRow as { id: string }).id;

  await supabase
    .from("project_devlogs")
    .update({ published_at: new Date().toISOString() })
    .eq("id", devlogId);

  await supabase
    .from("projects")
    .update({ playable_version: newPublishedVersion })
    .eq("id", project.id);

  console.log(`devlogId: ${devlogId}`);
  console.log("");
  console.log("Running live matcher...");

  const matcherResult = await runAdoptionMatcherForDevlog(devlogId);

  const { data: runRow } = await supabase
    .from("voice_adoption_matcher_runs")
    .select("status, candidate_count, adopted_count, error_message")
    .eq("id", matcherResult.runId)
    .maybeSingle();

  const { data: adoptionRows } = await supabase
    .from("voice_adoptions")
    .select(
      `
      voice_response_id,
      player_quote,
      update_summary,
      confidence,
      project_voice_responses ( answer_value, answer_label )
    `,
    )
    .eq("devlog_id", devlogId)
    .eq("status", "active");

  const matchByVoiceId = new Map(
    matcherResult.matches.map((m) => [m.voiceResponseId, m]),
  );

  type AdoptionRow = {
    voice_response_id: string;
    player_quote: string;
    update_summary: string;
    confidence: number;
    project_voice_responses:
      | { answer_value: string; answer_label: string | null }
      | { answer_value: string; answer_label: string | null }[]
      | null;
  };

  const adoptions = (adoptionRows ?? []) as AdoptionRow[];

  const fpRows: Array<{ voice: string; reason: string; summary: string }> = [];
  const legacyFpRows: Array<{ voice: string; reason: string; summary: string }> = [];

  for (const row of adoptions) {
    const spec = voiceById(voiceIds, row.voice_response_id);
    if (spec?.tag === "reject") {
      fpRows.push({
        voice: spec.label,
        reason: "reject ケースが採用された",
        summary: row.update_summary,
      });
    } else if (!spec) {
      const voiceJoin = row.project_voice_responses;
      const v = Array.isArray(voiceJoin) ? voiceJoin[0] : voiceJoin;
      const label = v?.answer_label ?? row.player_quote;
      const summary = row.update_summary.toLowerCase();
      const unrelated =
        label.includes("ボス") && !summary.includes("ボス") && !summary.includes("hp");
      if (unrelated) {
        legacyFpRows.push({
          voice: label,
          reason: "旧ver voice が今回 devlog と無関係に見える",
          summary: row.update_summary,
        });
      }
    }
  }

  const qualityIssues: string[] = [];
  for (const row of adoptions) {
    const summary = row.update_summary.trim();
    if (/^(改善|対応|反映|更新|調整|修正)しました$/u.test(summary)) {
      qualityIssues.push(`抽象的すぎる: 「${summary}」`);
    }
    if (/可能性|かもしれ|おそらく|たぶん/u.test(summary)) {
      qualityIssues.push(`弱い表現: 「${summary}」`);
    }
  }

  let indirectAdopted = 0;
  for (const row of adoptions) {
    const match = matchByVoiceId.get(row.voice_response_id);
    if (match?.matchType === "indirect") indirectAdopted += 1;
  }

  const fpCount = fpRows.length + legacyFpRows.length;
  const adoptionCount = adoptions.length;
  const pass =
    fpCount === 0 &&
    adoptionCount >= 1 &&
    matcherResult.status === "completed";

  console.log("");
  console.log("■ shadow B 結果");
  console.log(`- devlogId: ${devlogId}`);
  console.log(`- matcher_run status: ${runRow?.status ?? matcherResult.status}`);
  console.log(`- candidate数: ${runRow?.candidate_count ?? matcherResult.candidateCount}`);
  console.log(`- adoption数: ${runRow?.adopted_count ?? adoptionCount}`);
  console.log(`- indirect adoption数: ${indirectAdopted}（参考・PASS 必須ではない）`);
  if (runRow?.error_message) console.log(`- error: ${runRow.error_message}`);
  console.log("");

  console.log("■ 採用一覧");
  if (adoptions.length === 0) {
    console.log("(0 件 — FAIL: 最低 1 件 adoption 必要)");
  } else {
    for (const row of adoptions) {
      const voiceJoin = row.project_voice_responses;
      const v = Array.isArray(voiceJoin) ? voiceJoin[0] : voiceJoin;
      const voiceText = v
        ? `${v.answer_label ?? ""}: ${v.answer_value}`.trim()
        : row.player_quote;
      const match = matchByVoiceId.get(row.voice_response_id);
      const spec = voiceById(voiceIds, row.voice_response_id);
      console.log(`- player voice: ${voiceText}`);
      console.log(`  shadow-b tag: ${spec?.tag ?? "legacy/other"}`);
      console.log(`  update summary: ${row.update_summary}`);
      console.log(`  confidence: ${row.confidence}`);
      console.log(`  match type: ${match?.matchType ?? "unknown"}`);
      if (match?.reason) console.log(`  reason: ${match.reason}`);
      console.log("");
    }
  }

  console.log("■ shadow B voice ごとの matcher 結果");
  for (const voice of SHADOW_B_VOICES) {
    const id = voiceIds.get(voice.key)!;
    const adopted = adoptions.some((r) => r.voice_response_id === id);
    const match = matchByVoiceId.get(id);
    console.log(
      `- [${voice.tag}] ${voice.label} → ${adopted ? "ADOPTED" : "none"} (type: ${match?.matchType ?? "n/a"}, conf: ${match?.confidence ?? "n/a"})`,
    );
  }
  console.log("");

  console.log("■ FP 判定");
  console.log(`- FP 件数: ${fpCount}`);
  for (const fp of [...fpRows, ...legacyFpRows]) {
    console.log(`  - ${fp.voice}: ${fp.reason} / ${fp.summary}`);
  }
  if (fpCount === 0) console.log("- reject 誤採用なし");

  console.log("");
  console.log("■ Explanation Quality");
  if (qualityIssues.length === 0) {
    console.log("- 目立つ問題なし（自動チェック範囲）");
  } else {
    for (const issue of qualityIssues) console.log(`- ${issue}`);
  }

  console.log("");
  console.log("■ 最終判定");
  console.log(pass ? "- shadow B PASS" : "- shadow B FAIL");
  if (adoptionCount === 0) console.log("  理由: adoption 0 件");
  else if (fpCount > 0) console.log("  理由: FP > 0");
  else if (matcherResult.status !== "completed") {
    console.log(`  理由: matcher ${matcherResult.status}`);
  }
  if (pass && indirectAdopted === 0) {
    console.log("  補足: indirect adoption 0（FN 許容・PASS には影響なし）");
  }

  console.log("");
  console.log(`Review: npm run shadow:adoption-review -- ${devlogId}`);

  process.exit(pass ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
