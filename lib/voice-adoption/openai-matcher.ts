import {
  ADOPTION_PROMPT_VERSION,
  OPENAI_MATCHER_MODEL,
} from "@/lib/voice-adoption/constants";
import type {
  MatcherCandidate,
  MatcherDevlogInput,
  MatcherMatchResult,
  MatcherOutput,
} from "@/lib/voice-adoption/types";

const MATCHER_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["matches"],
  properties: {
    matches: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "voice_response_id",
          "related",
          "match_type",
          "confidence",
          "player_quote",
          "update_summary",
          "reason",
        ],
        properties: {
          voice_response_id: { type: "string" },
          related: { type: "boolean" },
          match_type: { type: "string", enum: ["direct", "indirect", "none"] },
          confidence: { type: "number", minimum: 0, maximum: 1 },
          player_quote: { type: "string" },
          update_summary: { type: "string" },
          reason: { type: "string" },
        },
      },
    },
  },
} as const;

const SYSTEM_PROMPT = `You are Forge's voice-to-update matcher. Forge connects player feedback to developer devlogs.

Core rule (strict):
Adopt ONLY when you can reasonably explain that the problem the player pointed out and the problem the developer solved are THE SAME problem — even if the words differ (indirect). Do NOT adopt because topics sound similar or "might be related".

NG (increases false positives — never do this):
- Adopt because wording is similar
- Adopt because it "seems related"
- Adopt praise-only feedback
- Adopt when devlog is vague ("改善しました" only)

OK indirect examples (same underlying problem, different words):
- Player: テンポが悪い → Devlog: 移動速度を20%向上 → ADOPT (indirect). Sluggish pace addressed by faster movement.
- Player: 敵が硬すぎる → Devlog: 敵HPを15%減少 → ADOPT (indirect). Too tanky → HP reduced.
- Player: UIが分かりづらい → Devlog: チュートリアル追加 → ADOPT (indirect). Confusion addressed by tutorial.

Reject examples (different problems — NOT related):
- Player: テンポが悪い → Devlog: BGM追加 → REJECT. Pace vs audio — different problems.
- Player: キャラかわいい → Devlog: セーブ機能追加 → REJECT. Praise vs unrelated feature.

Output rules:
- Output JSON only, matching the provided schema.
- Be conservative: related=true only when the same-problem test passes.
- For EACH candidate, return player_quote AND update_summary as a pair.
- player_quote: short Japanese from the player's answer (max 40 characters). Use their wording.
- update_summary: short Japanese describing what changed IN THE DEVLOG that addresses THIS player's answer (max 40 characters). NOT a summary of the whole devlog.
- If the devlog mentions multiple changes, pick only the change relevant to this player's answer.
- NEVER use a whole-devlog summary for every match.
- NEVER use vague phrases alone in update_summary, such as "反映されました", "改善しました", "対応しました", "全体的に改善しました".
- NEVER use hedging language in player_quote or update_summary, such as "可能性があります", "かもしれません", "おそらく".
- Write update_summary as a concrete past-tense change (e.g. "序盤の待ち時間を短縮", "チュートリアルを追加").
- match_type:
  - direct: devlog explicitly mentions the same topic as the answer.
  - indirect: same underlying problem as player concern, concrete change in devlog, words may differ — explain the causal chain in reason.
  - none: unrelated, praise-only, different problem, or devlog too vague to link.
- If related=false, set update_summary to empty string "".
- If unsure, set related=false.`;

function truncateContent(content: string, maxLength = 2000): string {
  if (content.length <= maxLength) {
    return content;
  }

  return `${content.slice(0, maxLength - 1)}…`;
}

function buildUserPrompt(
  devlog: MatcherDevlogInput,
  candidates: MatcherCandidate[],
): string {
  const candidateBlocks = candidates
    .map(
      (candidate) => `---
id: ${candidate.voiceResponseId}
question: ${candidate.promptText}
answer: ${candidate.answerLabel?.trim() || candidate.answerValue}
played_version: ${candidate.versionKey}
answered_at: ${candidate.createdAt}
---`,
    )
    .join("\n");

  return `## Update (version ${devlog.publishedVersion})
devlog_id: ${devlog.id}
Title: ${devlog.title}
Body:
${truncateContent(devlog.content)}

## Player answers (${candidates.length} items)
Each item may or may not relate to this update.

${candidateBlocks}

Return one match object per candidate id listed above. Each match must include player_quote and update_summary as a pair.`;
}

function normalizeMatchType(value: string): "direct" | "indirect" | "none" {
  if (value === "direct" || value === "indirect" || value === "none") {
    return value;
  }

  return "none";
}

function mapOpenAiMatch(raw: {
  voice_response_id: string;
  related: boolean;
  match_type: string;
  confidence: number;
  player_quote: string;
  update_summary: string;
  reason?: string;
}): MatcherMatchResult {
  return {
    voiceResponseId: raw.voice_response_id,
    related: raw.related,
    matchType: normalizeMatchType(raw.match_type),
    confidence: raw.confidence,
    playerQuote: raw.player_quote.trim(),
    updateSummary: raw.update_summary.trim(),
    reason: raw.reason,
  };
}

export async function runOpenAiAdoptionMatcher(
  devlog: MatcherDevlogInput,
  candidates: MatcherCandidate[],
): Promise<MatcherOutput> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: OPENAI_MATCHER_MODEL,
      temperature: 0.1,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "forge_voice_adoption_matcher",
          strict: true,
          schema: MATCHER_JSON_SCHEMA,
        },
      },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: buildUserPrompt(devlog, candidates) },
      ],
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`OpenAI matcher failed (${response.status}): ${body}`);
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  const content = payload.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("OpenAI matcher returned empty content");
  }

  const parsed = JSON.parse(content) as {
    matches: Array<{
      voice_response_id: string;
      related: boolean;
      match_type: string;
      confidence: number;
      player_quote: string;
      update_summary: string;
      reason?: string;
    }>;
  };

  const byId = new Map(
    parsed.matches.map((match) => [match.voice_response_id, mapOpenAiMatch(match)]),
  );

  const matches = candidates.map((candidate) => {
    const matched = byId.get(candidate.voiceResponseId);
    if (matched) {
      return matched;
    }

    return {
      voiceResponseId: candidate.voiceResponseId,
      related: false,
      matchType: "none" as const,
      confidence: 0,
      playerQuote: candidate.answerLabel?.trim() || candidate.answerValue.slice(0, 40),
      updateSummary: "",
      reason: "missing from model output",
    };
  });

  return { matches };
}

export function getOpenAiMatcherModel(): string {
  return OPENAI_MATCHER_MODEL;
}

export function getOpenAiPromptVersion(): string {
  return ADOPTION_PROMPT_VERSION;
}
