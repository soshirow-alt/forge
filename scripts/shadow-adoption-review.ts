/**
 * shadow A/B — 新ver公開後の voice_adoptions をオーナー向けに一覧（FP レビュー用）。
 *
 * Usage:
 *   npm run shadow:adoption-review -- <devlogId>
 *
 * Requires .env.local: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

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

const devlogId = process.argv[2]?.trim();
if (!devlogId) {
  console.error("Usage: npm run shadow:adoption-review -- <devlogId>");
  process.exit(1);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  const { data: devlog, error: devlogErr } = await supabase
    .from("project_devlogs")
    .select("id, project_id, title, published_version, published_at, content, created_at")
    .eq("id", devlogId)
    .maybeSingle();

  if (devlogErr || !devlog) {
    console.error("Devlog not found:", devlogErr?.message ?? devlogId);
    process.exit(1);
  }

  const { data: runs } = await supabase
    .from("voice_adoption_matcher_runs")
    .select("id, status, candidate_count, adopted_count, error_message, created_at")
    .eq("devlog_id", devlogId)
    .order("created_at", { ascending: false })
    .limit(3);

  const { data: rows, error } = await supabase
    .from("voice_adoptions")
    .select(
      `
      id,
      voice_response_id,
      player_quote,
      update_summary,
      confidence,
      voice_version_key,
      created_at,
      project_voice_responses ( answer_value, answer_label, version_key, created_at )
    `,
    )
    .eq("devlog_id", devlogId)
    .eq("status", "active")
    .order("confidence", { ascending: false });

  if (error) {
    console.error("Query failed:", error.message);
    process.exit(1);
  }

  console.log("=== Shadow adoption review ===");
  console.log(`devlog_id: ${devlog.id}`);
  console.log(`project_id: ${devlog.project_id}`);
  console.log(`title: ${devlog.title ?? "(no title)"}`);
  console.log(`published_version: ${devlog.published_version ?? "(not published)"}`);
  console.log(`published_at: ${devlog.published_at ?? devlog.created_at}`);
  console.log("");
  console.log("--- devlog content (excerpt) ---");
  const content = (devlog.content as string) ?? "";
  console.log(content.slice(0, 500) + (content.length > 500 ? "…" : ""));
  console.log("");

  if (runs?.length) {
    console.log("--- matcher runs (latest) ---");
    for (const r of runs) {
      console.log(
        `  ${r.created_at} status=${r.status} candidates=${r.candidate_count} adopted=${r.adopted_count}${r.error_message ? ` err=${r.error_message}` : ""}`,
      );
    }
    console.log("");
  }

  const adoptions = rows ?? [];
  console.log(`--- voice_adoptions (${adoptions.length} active rows) ---`);
  if (adoptions.length === 0) {
    console.log("  (none — matcher may not have run, or no adoption above threshold)");
    console.log("");
    console.log("FP checklist: N/A (0 rows). Confirm matcher run status above.");
    return;
  }

  for (let i = 0; i < adoptions.length; i++) {
    const row = adoptions[i] as {
      id: string;
      voice_response_id: string;
      player_quote: string;
      update_summary: string;
      confidence: number;
      voice_version_key: string;
      project_voice_responses:
        | { answer_value: string; answer_label: string | null; version_key: string }
        | { answer_value: string; answer_label: string | null; version_key: string }[]
        | null;
    };
    const voiceJoin = row.project_voice_responses;
    const voice = Array.isArray(voiceJoin) ? voiceJoin[0] : voiceJoin;
    const voiceText = voice
      ? `${voice.answer_label ? `${voice.answer_label}: ` : ""}${voice.answer_value}`
      : row.player_quote;

    console.log(`[${i + 1}] conf=${row.confidence}`);
    console.log(`    voice_response_id: ${row.voice_response_id} (${row.voice_version_key})`);
    console.log(`    voice: ${voiceText.slice(0, 200)}${voiceText.length > 200 ? "…" : ""}`);
    console.log(`    player_quote: ${row.player_quote}`);
    console.log(`    update_summary: ${row.update_summary}`);
    console.log(`    FP? → voice と devlog 変更が同じ問題か（manual）`);
    console.log("");
  }

  console.log("--- FP sign-off ---");
  console.log("PASS = 0 false adoptions (each row: voice matches devlog change)");
  console.log("FAIL = any unrelated adoption → stop, fix prompt before shadow B");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
