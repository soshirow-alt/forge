/** Forge voice↔update adoption threshold — DB CHECK と一致 */
import { shouldHideV0MockContent } from "@/lib/production-mode";

export const ADOPTION_THRESHOLD = 0.82;

/** indirect 採用 — 偽陽性回避のため direct より厳格 */
export const INDIRECT_ADOPTION_THRESHOLD = 0.88;

export const MATCHER_TRIGGER_VERSION = "matcher-v1";
export const ADOPTION_PROMPT_VERSION = "adoption-prompt-v2";
export const OPENAI_MATCHER_MODEL = "gpt-4o-mini";

/** matcher が OpenAI に送る候補 voice の上限（precision 保護。現フェーズ暫定） */
export const VOICE_ADOPTION_MAX_CANDIDATES = 50;

/** Phase3 再プレイ CTA（現行）。将来は update_summary から具体化可能 */
export const ADOPTION_VERIFY_CTA_DEFAULT = "変化を確かめる";

/** プレイヤー向け AI 紐づけの説明（dispute 補助） */
export const VOICE_ADOPTION_AI_DISCLAIMER =
  "ForgeはAIで回答と更新内容を紐づけています。内容によっては意図と異なる関連付けになる場合があります。もし違うと思ったら「この関連は違う」から教えてください。";

const ABSTRACT_UPDATE_SUMMARY_PATTERNS = [
  /^改善しました$/u,
  /^全体的に改善しました$/u,
  /^対応しました$/u,
  /^反映しました$/u,
  /^更新しました$/u,
  /^調整しました$/u,
  /^修正しました$/u,
  /^最適化しました$/u,
  /可能性があります/u,
  /かもしれません/u,
  /かもしれない/u,
  /おそらく/u,
  /たぶん/u,
];

export function isAbstractUpdateSummary(summary: string): boolean {
  const trimmed = summary.trim();
  if (!trimmed) {
    return true;
  }

  return ABSTRACT_UPDATE_SUMMARY_PATTERNS.some((pattern) => pattern.test(trimmed));
}

export function buildAdoptionVerifyCta(updateSummary: string): string {
  const trimmed = updateSummary.trim();
  if (!trimmed) {
    return ADOPTION_VERIFY_CTA_DEFAULT;
  }

  return `${trimmed}を確かめる`;
}

export const FIXTURE_STORAGE_KEY = "forge-voice-adoptions-fixture-v1";

export function isVoiceAdoptionFixtureMode(): boolean {
  return process.env.NEXT_PUBLIC_VOICE_ADOPTION_FIXTURE === "true";
}

export function isVoiceAdoptionMatcherFixtureMode(): boolean {
  return (
    process.env.VOICE_ADOPTION_MATCHER_MODE === "fixture" ||
    process.env.NEXT_PUBLIC_VOICE_ADOPTION_FIXTURE === "true"
  );
}

export function resolveServerMatcherMode(): "fixture" | "live" {
  if (isVoiceAdoptionMatcherFixtureMode()) {
    return "fixture";
  }

  return "live";
}

/**
 * shadow A/B 中は false — DB INSERT は行うがプレイヤー UI には出さない。
 * 本番モードでは明示的 true のみ表示。preview / local は false 明示時のみ非表示。
 */
export function isVoiceAdoptionPlayerVisible(): boolean {
  const raw = process.env.NEXT_PUBLIC_VOICE_ADOPTION_PLAYER_VISIBLE?.trim().toLowerCase();

  if (shouldHideV0MockContent()) {
    return raw === "true" || raw === "1" || raw === "yes";
  }

  if (raw === "false" || raw === "0" || raw === "no") {
    return false;
  }
  return true;
}
