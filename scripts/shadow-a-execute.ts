/**
 * shadow A — テスト voice 投入 → devlog 新版公開 → live matcher → FP レビュー報告
 *
 * Usage:
 *   npm run shadow:a -- [--project-id <id>]
 *
 * Requires .env.local (see docs/voice-adoptions-shadow-a-runbook.md)
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

const projectIdArg = process.argv.find((a) => a.startsWith("--project-id="))?.split("=")[1]
  ?? (process.argv.indexOf("--project-id") >= 0
    ? process.argv[process.argv.indexOf("--project-id") + 1]
    : undefined);

const SHADOW_VOICES = [
  {
    tag: "direct",
    label: "序盤ボスが強すぎる",
    answer: "序盤ボスが強すぎて何度も負けた",
    promptText: "shadow-a direct — 序盤ボスの難易度",
  },
  {
    tag: "indirect",
    label: "テンポが悪い",
    answer: "テンポが悪くて退屈に感じた",
    promptText: "shadow-a indirect — テンポ",
  },
  {
    tag: "reject",
    label: "マルチプレイが欲しい",
    answer: "マルチプレイが欲しい",
    promptText: "shadow-a reject — 無関係",
  },
] as const;

const SHADOW_DEVLOG = {
  title: "shadow-a — 序盤調整",
  content:
    "序盤ボスのHPを30%削減しました。あわせて序盤の待ち時間を30%短縮し、イベント発生までの間隔を詰めました。",
};

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing ${name} in .env.local`);
  }
  return value;
}

function bumpVersion(current: string): string {
  const resolved = resolvePlayableVersion(current);
  const parts = resolved.split(".").map((part) => Number.parseInt(part, 10));
  if (parts.some((n) => Number.isNaN(n))) {
    return "0.5";
  }
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
  if (!parts.some((n) => Number.isNaN(n))) {
    return resolved;
  }

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

async function pickProject(supabase: SupabaseClient): Promise<{
  id: string;
  title: string;
  ownerId: string;
  playableVersion: string;
}> {
  if (projectIdArg) {
    const { data, error } = await supabase
      .from("projects")
      .select("id, title, owner_id, playable_version")
      .eq("id", projectIdArg)
      .maybeSingle();
    if (error || !data) {
      throw new Error(`Project not found: ${projectIdArg}`);
    }
    return {
      id: data.id,
      title: data.title,
      ownerId: data.owner_id,
      playableVersion: resolvePlayableVersion(data.playable_version),
    };
  }

  const { data, error } = await supabase
    .from("projects")
    .select("id, title, owner_id, playable_version")
    .order("updated_at", { ascending: false })
    .limit(20);

  if (error || !data?.length) {
    throw new Error("No projects found in Supabase");
  }

  const preferred = data.find((p) =>
    String(p.title).toLowerCase().includes("shadow"),
  );
  const row = preferred ?? data[0]!;

  return {
    id: row.id,
    title: row.title,
    ownerId: row.owner_id,
    playableVersion: resolvePlayableVersion(row.playable_version),
  };
}

async function ensureShadowPrompt(
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

  if (existing?.id) {
    return existing.id as string;
  }

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

  if (error || !data) {
    throw new Error(`Failed to create prompt: ${error?.message}`);
  }

  return (data as { id: string }).id;
}

async function upsertShadowVoice(
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
    if (error || !data) {
      throw new Error(`Voice update failed: ${error?.message}`);
    }
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

  if (error || !data) {
    throw new Error(`Voice insert failed: ${error?.message}`);
  }

  return (data as { id: string }).id;
}

async function main() {
  requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  requireEnv("SUPABASE_SERVICE_ROLE_KEY");
  requireEnv("OPENAI_API_KEY");

  const fixture = process.env.NEXT_PUBLIC_VOICE_ADOPTION_FIXTURE?.trim().toLowerCase();
  const matcherMode = process.env.VOICE_ADOPTION_MATCHER_MODE?.trim().toLowerCase();
  if (fixture === "true") {
    throw new Error("NEXT_PUBLIC_VOICE_ADOPTION_FIXTURE must be false for shadow A");
  }
  if (matcherMode === "fixture") {
    throw new Error("VOICE_ADOPTION_MATCHER_MODE must be live for shadow A");
  }

  const url = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  const key = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
  const supabase = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  console.log("=== shadow A execute ===");
  console.log(`player UI visible: ${isVoiceAdoptionPlayerVisible()}`);
  console.log(`matcher mode: ${process.env.VOICE_ADOPTION_MATCHER_MODE ?? "live (default)"}`);
  console.log("");

  const project = await pickProject(supabase);
  const voiceVersion = await resolveVoiceVersionKey(
    supabase,
    project.id,
    project.playableVersion,
  );
  const newPublishedVersion = bumpVersion(voiceVersion);
  const voiceCreatedAt = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();

  console.log(`project: ${project.title} (${project.id})`);
  console.log(`voice version (before publish): ${voiceVersion}`);
  console.log(`new published version: ${newPublishedVersion}`);
  console.log("");

  const voiceIds: Record<string, string> = {};

  for (let i = 0; i < SHADOW_VOICES.length; i++) {
    const voice = SHADOW_VOICES[i]!;
    const promptId = await ensureShadowPrompt(
      supabase,
      project.id,
      voiceVersion,
      voice.promptText,
      6 + i,
    );
    voiceIds[voice.tag] = await upsertShadowVoice(supabase, {
      userId: project.ownerId,
      projectId: project.id,
      versionKey: voiceVersion,
      promptId,
      answer: voice.answer,
      label: voice.label,
      createdAt: voiceCreatedAt,
    });
    console.log(`voice [${voice.tag}]: ${voice.label} → ${voiceIds[voice.tag]}`);
  }

  console.log("");
  console.log("Publishing devlog...");

  const { data: devlogRow, error: devlogErr } = await supabase
    .from("project_devlogs")
    .insert({
      project_id: project.id,
      author_id: project.ownerId,
      title: SHADOW_DEVLOG.title,
      content: SHADOW_DEVLOG.content,
      published_version: newPublishedVersion,
    })
    .select("id, created_at")
    .single();

  if (devlogErr || !devlogRow) {
    throw new Error(`Devlog insert failed: ${devlogErr?.message}`);
  }

  const devlogId = (devlogRow as { id: string }).id;

  await supabase
    .from("project_devlogs")
    .update({ published_at: new Date().toISOString() })
    .eq("id", devlogId);

  const { error: projectErr } = await supabase
    .from("projects")
    .update({ playable_version: newPublishedVersion })
    .eq("id", project.id);

  if (projectErr) {
    throw new Error(`Project version update failed: ${projectErr.message}`);
  }

  console.log(`devlogId: ${devlogId}`);
  console.log("");
  console.log("Running live matcher (same path as POST /api/voice-adoption/run)...");

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
      id,
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

  const fpRows: Array<{ voice: string; reason: string; updateSummary: string }> = [];

  for (const row of adoptions) {
    const voiceId = row.voice_response_id;
    if (voiceId === voiceIds.reject) {
      fpRows.push({
        voice: SHADOW_VOICES[2]!.label,
        reason: "reject ケース（マルチプレイ）が採用された",
        updateSummary: row.update_summary,
      });
    }
  }

  const qualityIssues: string[] = [];
  for (const row of adoptions) {
    const summary = row.update_summary.trim();
    if (/^(改善|対応|反映|更新|調整|修正)しました$/u.test(summary)) {
      qualityIssues.push(`抽象的すぎる update_summary: 「${summary}」`);
    }
    if (/可能性|かもしれ|おそらく|たぶん/u.test(summary)) {
      qualityIssues.push(`弱い表現: 「${summary}」`);
    }
  }

  const adoptionCount = adoptions.length;
  const fpCount = fpRows.length;
  const pass =
    fpCount === 0 &&
    adoptionCount >= 1 &&
    matcherResult.status === "completed";

  console.log("");
  console.log("■ shadow A 結果");
  console.log(`- devlogId: ${devlogId}`);
  console.log(`- matcher_run status: ${runRow?.status ?? matcherResult.status}`);
  console.log(`- candidate数: ${runRow?.candidate_count ?? matcherResult.candidateCount}`);
  console.log(`- adoption数: ${runRow?.adopted_count ?? adoptionCount}`);
  if (runRow?.error_message) {
    console.log(`- error: ${runRow.error_message}`);
  }
  console.log(`- API 相当: runAdoptionMatcherForDevlog → ${matcherResult.status} (POST /api/voice-adoption/run と同一サーバー処理)`);
  console.log("");

  console.log("■ 採用一覧");
  if (adoptions.length === 0) {
    console.log("(0 件 — shadow A 評価対象外: 最低 1 件 adoption 必要)");
  } else {
    for (const row of adoptions) {
      const voiceJoin = row.project_voice_responses;
      const voice = Array.isArray(voiceJoin) ? voiceJoin[0] : voiceJoin;
      const voiceText = voice
        ? `${voice.answer_label ?? ""}: ${voice.answer_value}`.trim()
        : row.player_quote;
      const match = matchByVoiceId.get(row.voice_response_id);
      console.log(`- player voice: ${voiceText}`);
      console.log(`  update summary: ${row.update_summary}`);
      console.log(`  confidence: ${row.confidence}`);
      console.log(`  match type: ${match?.matchType ?? "unknown"}`);
      if (match?.reason) {
        console.log(`  reason: ${match.reason}`);
      }
      console.log("");
    }
  }

  console.log("■ 未採用（期待）");
  for (const voice of SHADOW_VOICES) {
    const id = voiceIds[voice.tag];
    const adopted = adoptions.some((r) => r.voice_response_id === id);
    const match = matchByVoiceId.get(id);
    if (!adopted) {
      console.log(
        `- [${voice.tag}] ${voice.label} → none (matcher: ${match?.matchType ?? "n/a"}, conf: ${match?.confidence ?? "n/a"})`,
      );
    }
  }
  console.log("");

  console.log("■ FP 判定");
  console.log(`- FP 件数: ${fpCount}`);
  if (fpRows.length > 0) {
    for (const fp of fpRows) {
      console.log(`  - ${fp.voice}: ${fp.reason} / summary: ${fp.updateSummary}`);
    }
  }
  console.log("");

  console.log("■ Explanation Quality");
  if (qualityIssues.length === 0) {
    console.log("- 目立つ問題なし（自動チェック範囲）");
  } else {
    for (const issue of qualityIssues) {
      console.log(`- ${issue}`);
    }
  }
  console.log("");

  console.log("■ 最終判定");
  console.log(pass ? "- shadow A PASS" : "- shadow A FAIL");
  if (adoptionCount === 0) {
    console.log("  理由: adoption 0 件（評価不可）");
  } else if (fpCount > 0) {
    console.log("  理由: FP > 0");
  } else if (matcherResult.status !== "completed") {
    console.log(`  理由: matcher status ${matcherResult.status}`);
  }

  console.log("");
  console.log(`Review again: npm run shadow:adoption-review -- ${devlogId}`);
  console.log(`Game URL: http://localhost:3000/games/${project.id}`);

  process.exit(pass ? 0 : 1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
