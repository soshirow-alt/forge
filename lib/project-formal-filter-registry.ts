/**
 * Formal Studio + Search option/filter registry (Owner taxonomy).
 *
 * Single source for allowlisted values, URL keys, cardinality, and storage hints.
 * Not a search framework — consumers build UI/RPC from these specs.
 *
 * Distinct from `project-formal-filter-ownership.ts` (076 inactive-column ownership).
 */

import {
  FORGE_FEATURE_TAG_OPTIONS,
  MAX_PROJECT_FEATURE_TAGS,
} from "@/lib/forge-feature-tag-options";
import { FORGE_GENRE_OPTIONS } from "@/lib/forge-genre-options";
import {
  ENV_BROWSER_TAG,
  ENV_MOBILE_TAG,
  ENV_PC_TAG,
} from "@/lib/play-environment";
import { PLAY_TIME_OPTIONS } from "@/lib/play-time-options";
import {
  ASSET_KIND_CANONICAL_LABELS,
  type ProjectCategoryId,
} from "@/lib/project-categories";
import { MAX_PROJECT_GENRES } from "@/lib/project-genres";

export type FormalFilterFieldId =
  | "genre"
  | "feature_tag"
  | "play_time"
  | "play_environment"
  | "player_count"
  | "audio_kinds"
  | "music_genres"
  | "audio_moods"
  | "audio_purposes"
  | "audio_duration_bucket"
  | "asset_kind"
  | "asset_formats"
  | "asset_tastes"
  | "asset_tools"
  | "dev_tool_kinds"
  | "dev_tool_environments"
  | "dev_tool_features"
  | "service_kinds"
  | "service_purposes"
  | "service_environments"
  | "service_features";

export type FormalFilterOption = {
  value: string;
  label: string;
};

export type FormalFilterFieldSpec = {
  category: ProjectCategoryId;
  fieldId: FormalFilterFieldId;
  label: string;
  urlKey: string;
  cardinality: "single" | "multi";
  maxSelection: number;
  studioApplicable: boolean;
  searchApplicable: boolean;
  options: FormalFilterOption[];
  /** Storage / writer / Search notes (not user-facing copy). */
  storageNotes: string;
};

function optionsFromValues(values: readonly string[]): FormalFilterOption[] {
  return values.map((value) => ({ value, label: value }));
}

// ─── GAME ───────────────────────────────────────────────────────────────────

export const PLAY_ENVIRONMENT_UI_OPTIONS = ["PC", "スマホ", "ブラウザ"] as const;
export type PlayEnvironmentUiOption = (typeof PLAY_ENVIRONMENT_UI_OPTIONS)[number];

export const PLAYER_COUNT_OPTIONS = [
  "1人",
  "2人",
  "3〜4人",
  "5人以上",
] as const;

const PLAY_ENV_UI_TO_STORAGE: Record<PlayEnvironmentUiOption, string> = {
  PC: ENV_PC_TAG,
  スマホ: ENV_MOBILE_TAG,
  ブラウザ: ENV_BROWSER_TAG,
};

const PLAY_ENV_STORAGE_TO_UI: Record<string, PlayEnvironmentUiOption> = {
  [ENV_PC_TAG]: "PC",
  [ENV_MOBILE_TAG]: "スマホ",
  [ENV_BROWSER_TAG]: "ブラウザ",
};

export function mapPlayEnvironmentUiToStorageTag(
  ui: string,
): string | null {
  if ((PLAY_ENVIRONMENT_UI_OPTIONS as readonly string[]).includes(ui)) {
    return PLAY_ENV_UI_TO_STORAGE[ui as PlayEnvironmentUiOption];
  }
  return null;
}

export function mapPlayEnvironmentStorageTagToUi(
  tag: string,
): PlayEnvironmentUiOption | null {
  return PLAY_ENV_STORAGE_TO_UI[tag] ?? null;
}

// ─── AUDIO ──────────────────────────────────────────────────────────────────

export const AUDIO_KIND_OPTIONS = [
  "楽曲",
  "BGM",
  "効果音・SE",
  "ジングル",
  "ボイス",
  "朗読・音声ドラマ",
  "環境音",
  "その他",
] as const;

/** Legacy singular kind still present on older rows — read fallback only. */
export const AUDIO_KIND_LEGACY_COMPAT = ["効果音・ジングル"] as const;

export const MUSIC_GENRE_OPTIONS = [
  "ポップ",
  "ロック",
  "エレクトロニック",
  "ヒップホップ",
  "ジャズ",
  "クラシック",
  "アンビエント",
  "劇伴・シネマティック",
  "チップチューン",
  "和風",
  "民族・ワールド",
  "その他",
] as const;

export const AUDIO_MOOD_OPTIONS = [
  "明るい",
  "穏やか",
  "楽しい・コミカル",
  "切ない",
  "暗い",
  "不穏・怖い",
  "激しい",
  "壮大",
  "幻想的",
  "緊張感",
] as const;

export const AUDIO_PURPOSE_OPTIONS = [
  "タイトル・メニュー",
  "フィールド・探索",
  "バトル",
  "イベント・ストーリー",
  "日常・会話",
  "ホラー・緊張演出",
  "UI・通知",
  "映像・PV",
  "配信・動画",
  "汎用",
] as const;

export const AUDIO_DURATION_BUCKETS = [
  "10秒未満",
  "10〜30秒",
  "30秒〜1分",
  "1〜3分",
  "3分以上",
] as const;

export type AudioDurationBucket = (typeof AUDIO_DURATION_BUCKETS)[number];

/** Parse `M:SS` or `H:MM:SS` into total seconds. */
export function parseMusicDurationToSeconds(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parts = trimmed.split(":");
  if (parts.length < 2 || parts.length > 3) return null;
  if (parts.some((part) => !/^\d+$/.test(part.trim()))) return null;
  const nums = parts.map((part) => Number(part.trim()));
  if (nums.some((num) => !Number.isFinite(num) || num < 0)) return null;
  if (parts.length === 2) {
    const [minutes, seconds] = nums;
    if (seconds > 59) return null;
    return minutes * 60 + seconds;
  }
  const [hours, minutes, seconds] = nums;
  if (minutes > 59 || seconds > 59) return null;
  return hours * 3600 + minutes * 60 + seconds;
}

export function matchDurationBucket(
  seconds: number,
): AudioDurationBucket | null {
  if (!Number.isFinite(seconds) || seconds < 0) return null;
  if (seconds < 10) return "10秒未満";
  if (seconds < 30) return "10〜30秒";
  if (seconds < 60) return "30秒〜1分";
  if (seconds < 180) return "1〜3分";
  return "3分以上";
}

export const AUDIO_MUSIC_GENRE_TRIGGER_KINDS = ["楽曲", "BGM"] as const;

export function audioKindsShowMusicGenres(kinds: readonly string[]): boolean {
  return kinds.some((kind) =>
    (AUDIO_MUSIC_GENRE_TRIGGER_KINDS as readonly string[]).includes(kind),
  );
}

// ─── ASSET ──────────────────────────────────────────────────────────────────

/** Canonical write labels — defined in project-categories beside legacy IDs. */
export { ASSET_KIND_CANONICAL_LABELS };

export const ASSET_FORMAT_OPTIONS = ["2D", "3D"] as const;

export const ASSET_TASTE_OPTIONS = [
  "ピクセルアート",
  "リアル",
  "ローポリ",
  "アニメ・トゥーン",
  "手描き",
  "ミニマル",
  "ファンタジー",
  "SF・近未来",
  "和風",
  "ダーク・ホラー",
] as const;

export const ASSET_TOOL_OPTIONS = [
  "Unity",
  "Unreal Engine",
  "Godot",
  "Blender",
  "Maya",
  "Photoshop",
  "Aseprite",
  "Spine",
  "その他",
] as const;

// ─── DEV-TOOL ───────────────────────────────────────────────────────────────

export const DEV_TOOL_KIND_OPTIONS = [
  "ブラウザツール",
  "デスクトップツール",
  "プラグイン・拡張機能",
  "CLI",
  "ライブラリ・SDK",
  "API",
  "デバッグ・テスト支援",
  "生成・変換ツール",
  "ビルド・CI/CD",
  "AI・コード支援",
  "その他",
] as const;

export const DEV_TOOL_ENVIRONMENT_OPTIONS = [
  "Webブラウザ",
  "Windows",
  "macOS",
  "Linux",
  "Unity",
  "Unreal Engine",
  "Godot",
  "VS Code",
  "GitHub",
  "汎用",
  "その他",
] as const;

/** Legacy env label still present on older rows. */
export const DEV_TOOL_ENVIRONMENT_LEGACY_COMPAT = [
  "Visual Studio Code",
] as const;

export const DEV_TOOL_FEATURE_OPTIONS = [
  "オープンソース",
  "ノーコード・ローコード",
  "自動化",
  "AI対応",
  "チーム開発向け",
  "個人開発向け",
  "軽量",
  "リアルタイム",
  "ローカル実行",
  "クラウド対応",
] as const;

// ─── SERVICE-APP ────────────────────────────────────────────────────────────

export const SERVICE_KIND_OPTIONS = [
  "Webサービス",
  "デスクトップアプリ",
  "スマホアプリ",
  "ブラウザ拡張",
  "Bot",
  "API",
  "その他",
] as const;

/** Legacy kind labels for read compatibility. */
export const SERVICE_KIND_LEGACY_COMPAT = [
  "スマートフォンアプリ",
] as const;

export const SERVICE_PURPOSE_OPTIONS = [
  "制作支援",
  "プロジェクト管理",
  "情報整理・ナレッジ",
  "コミュニケーション",
  "コミュニティ",
  "分析・可視化",
  "配信・コンテンツ制作",
  "学習",
  "自動化・連携",
  "その他",
] as const;

export const SERVICE_ENVIRONMENT_OPTIONS = [
  "Web",
  "Windows",
  "macOS",
  "iOS",
  "Android",
  "Discord",
  "Slack",
  "その他",
] as const;

/** Legacy env still present on older rows. */
export const SERVICE_ENVIRONMENT_LEGACY_COMPAT = ["Webブラウザ"] as const;

export const SERVICE_FEATURE_OPTIONS = [
  "AI対応",
  "リアルタイム",
  "自動化",
  "チーム向け",
  "個人向け",
  "コラボレーション",
  "データ分析",
  "カスタマイズ可能",
  "外部サービス連携",
  "オープンソース",
] as const;

// ─── Registry table ─────────────────────────────────────────────────────────

export const PROJECT_FORMAL_FILTER_REGISTRY: FormalFilterFieldSpec[] = [
  // game
  {
    category: "game",
    fieldId: "genre",
    label: "ジャンル",
    urlKey: "genre",
    cardinality: "multi",
    maxSelection: MAX_PROJECT_GENRES,
    studioApplicable: true,
    searchApplicable: true,
    options: optionsFromValues(FORGE_GENRE_OPTIONS),
    storageNotes: "projects.genres text[]",
  },
  {
    category: "game",
    fieldId: "feature_tag",
    label: "特徴タグ",
    urlKey: "tag",
    cardinality: "multi",
    maxSelection: MAX_PROJECT_FEATURE_TAGS,
    studioApplicable: true,
    searchApplicable: true,
    options: optionsFromValues(FORGE_FEATURE_TAG_OPTIONS),
    storageNotes: "projects.tags (feature namespace via compose)",
  },
  {
    category: "game",
    fieldId: "play_time",
    label: "想定プレイ時間",
    urlKey: "play_time",
    cardinality: "single",
    maxSelection: 1,
    studioApplicable: true,
    searchApplicable: true,
    options: optionsFromValues(PLAY_TIME_OPTIONS),
    storageNotes: "projects.estimated_play_time text",
  },
  {
    category: "game",
    fieldId: "play_environment",
    label: "対応環境",
    urlKey: "env",
    cardinality: "multi",
    maxSelection: PLAY_ENVIRONMENT_UI_OPTIONS.length,
    studioApplicable: true,
    searchApplicable: true,
    options: optionsFromValues(PLAY_ENVIRONMENT_UI_OPTIONS),
    storageNotes:
      "UI PC/スマホ/ブラウザ → tags PC対応/スマホ対応/ブラウザ対応 (mapPlayEnvironmentUiToStorageTag)",
  },
  {
    category: "game",
    fieldId: "player_count",
    label: "プレイ人数",
    urlKey: "players",
    cardinality: "multi",
    maxSelection: PLAYER_COUNT_OPTIONS.length,
    studioApplicable: true,
    searchApplicable: true,
    options: optionsFromValues(PLAYER_COUNT_OPTIONS),
    storageNotes: "projects.player_counts text[] (dedicated; not generic tags)",
  },

  // audio
  {
    category: "audio",
    fieldId: "audio_kinds",
    label: "種類",
    urlKey: "audio_kind",
    cardinality: "multi",
    maxSelection: 2,
    studioApplicable: true,
    searchApplicable: true,
    options: optionsFromValues(AUDIO_KIND_OPTIONS),
    storageNotes:
      "category_attributes.kinds string[]; legacy singular kind = read fallback only; legacy 効果音・ジングル keep for compat",
  },
  {
    category: "audio",
    fieldId: "music_genres",
    label: "音楽ジャンル",
    urlKey: "music_genre",
    cardinality: "multi",
    maxSelection: 3,
    studioApplicable: true,
    searchApplicable: true,
    options: optionsFromValues(MUSIC_GENRE_OPTIONS),
    storageNotes:
      "category_attributes.musicGenres; Studio only when kinds include 楽曲 or BGM (clear on section apply if not)",
  },
  {
    category: "audio",
    fieldId: "audio_moods",
    label: "雰囲気",
    urlKey: "mood",
    cardinality: "multi",
    maxSelection: 3,
    studioApplicable: true,
    searchApplicable: true,
    options: optionsFromValues(AUDIO_MOOD_OPTIONS),
    storageNotes: "category_attributes.moods string[]",
  },
  {
    category: "audio",
    fieldId: "audio_purposes",
    label: "用途",
    urlKey: "purpose",
    cardinality: "multi",
    maxSelection: 3,
    studioApplicable: true,
    searchApplicable: true,
    options: optionsFromValues(AUDIO_PURPOSE_OPTIONS),
    storageNotes: "category_attributes.purposes string[]",
  },
  {
    category: "audio",
    fieldId: "audio_duration_bucket",
    label: "再生時間",
    urlKey: "duration",
    cardinality: "multi",
    maxSelection: AUDIO_DURATION_BUCKETS.length,
    studioApplicable: false,
    searchApplicable: true,
    options: optionsFromValues(AUDIO_DURATION_BUCKETS),
    storageNotes:
      "Search-only; derive from category_attributes.musicDuration via parseMusicDurationToSeconds + matchDurationBucket; no duplicate seconds column",
  },

  // asset
  {
    category: "asset",
    fieldId: "asset_kind",
    label: "アセット種別",
    urlKey: "asset_kind",
    cardinality: "multi",
    maxSelection: 3,
    studioApplicable: true,
    searchApplicable: true,
    options: optionsFromValues(ASSET_KIND_CANONICAL_LABELS),
    storageNotes:
      "projects.asset_kinds text[] stores these canonical labels; URL multi via comma like genre; legacy ASSET_KIND_IDS keep for read compat",
  },
  {
    category: "asset",
    fieldId: "asset_formats",
    label: "表現形式",
    urlKey: "format",
    cardinality: "multi",
    maxSelection: 2,
    studioApplicable: true,
    searchApplicable: true,
    options: optionsFromValues(ASSET_FORMAT_OPTIONS),
    storageNotes: "category_attributes.formats string[]",
  },
  {
    category: "asset",
    fieldId: "asset_tastes",
    label: "テイスト",
    urlKey: "taste",
    cardinality: "multi",
    maxSelection: 3,
    studioApplicable: true,
    searchApplicable: true,
    options: optionsFromValues(ASSET_TASTE_OPTIONS),
    storageNotes: "category_attributes.tastes string[]",
  },
  {
    category: "asset",
    fieldId: "asset_tools",
    label: "対応ツール",
    urlKey: "tool",
    cardinality: "multi",
    maxSelection: 4,
    studioApplicable: true,
    searchApplicable: true,
    options: optionsFromValues(ASSET_TOOL_OPTIONS),
    storageNotes:
      "category_attributes.tools string[]; optional — empty means 汎用/指定なし; no 汎用 option",
  },

  // dev-tool
  {
    category: "dev-tool",
    fieldId: "dev_tool_kinds",
    label: "種類",
    urlKey: "tool_kind",
    cardinality: "multi",
    maxSelection: 2,
    studioApplicable: true,
    searchApplicable: true,
    options: optionsFromValues(DEV_TOOL_KIND_OPTIONS),
    storageNotes:
      "category_attributes.kinds string[]; migrate from singular kind (read fallback); no dual-write of singular",
  },
  {
    category: "dev-tool",
    fieldId: "dev_tool_environments",
    label: "対応環境・ツール",
    urlKey: "tool_env",
    cardinality: "multi",
    maxSelection: 5,
    studioApplicable: true,
    searchApplicable: true,
    options: optionsFromValues(DEV_TOOL_ENVIRONMENT_OPTIONS),
    storageNotes:
      "category_attributes.toolEnvironments; legacy Visual Studio Code → treat as VS Code on read if needed",
  },
  {
    category: "dev-tool",
    fieldId: "dev_tool_features",
    label: "特徴",
    urlKey: "tool_feature",
    cardinality: "multi",
    maxSelection: 4,
    studioApplicable: true,
    searchApplicable: true,
    options: optionsFromValues(DEV_TOOL_FEATURE_OPTIONS),
    storageNotes:
      "category_attributes.features; do not write these into projects.tags",
  },

  // service-app
  {
    category: "service-app",
    fieldId: "service_kinds",
    label: "種類",
    urlKey: "service_kind",
    cardinality: "multi",
    maxSelection: 2,
    studioApplicable: true,
    searchApplicable: true,
    options: optionsFromValues(SERVICE_KIND_OPTIONS),
    storageNotes:
      "category_attributes.kinds string[]; legacy スマートフォンアプリ read compat",
  },
  {
    category: "service-app",
    fieldId: "service_purposes",
    label: "用途",
    urlKey: "service_purpose",
    cardinality: "multi",
    maxSelection: 3,
    studioApplicable: true,
    searchApplicable: true,
    options: optionsFromValues(SERVICE_PURPOSE_OPTIONS),
    storageNotes: "category_attributes.purposes string[]",
  },
  {
    category: "service-app",
    fieldId: "service_environments",
    label: "対応環境",
    urlKey: "service_env",
    cardinality: "multi",
    maxSelection: 5,
    studioApplicable: true,
    searchApplicable: true,
    options: optionsFromValues(SERVICE_ENVIRONMENT_OPTIONS),
    storageNotes:
      "category_attributes.serviceEnvironments; legacy Webブラウザ → Web on read if needed",
  },
  {
    category: "service-app",
    fieldId: "service_features",
    label: "特徴",
    urlKey: "service_feature",
    cardinality: "multi",
    maxSelection: 4,
    studioApplicable: true,
    searchApplicable: true,
    options: optionsFromValues(SERVICE_FEATURE_OPTIONS),
    storageNotes:
      "category_attributes.features; do not write these into projects.tags",
  },
];

export function getFormalFiltersForCategory(
  category: ProjectCategoryId | "all" | null | undefined,
): FormalFilterFieldSpec[] {
  if (!category || category === "all") {
    return [];
  }
  return PROJECT_FORMAL_FILTER_REGISTRY.filter(
    (spec) => spec.category === category,
  );
}

export function getFormalFilterByFieldId(
  fieldId: FormalFilterFieldId,
): FormalFilterFieldSpec | undefined {
  return PROJECT_FORMAL_FILTER_REGISTRY.find((spec) => spec.fieldId === fieldId);
}

// ─── Shared multi-select max enforcement ───────────────────────────────────
//
// Single toggle/cap source so every formal multi-select (audio moods/purposes/
// musicGenres/kinds, asset formats/tastes/tools/kinds, tool/service
// environments/features/kinds) enforces registry maxSelection the same way —
// in chip UI (toggle) and at save time (cap), not ad hoc per panel.

/**
 * Toggle `value` in/out of `current`, refusing to add past `max`.
 * `max` omitted or <= 0 means unlimited (dedupe/remove only).
 */
export function toggleAllowlistedSelection(
  current: readonly string[],
  value: string,
  max?: number,
): string[] {
  if (current.includes(value)) {
    return current.filter((item) => item !== value);
  }
  if (typeof max === "number" && max > 0 && current.length >= max) {
    return [...current];
  }
  return [...current, value];
}

/** Defense-in-depth cap for save-time payloads (UI should already enforce max). */
export function capSelectionToMax(values: readonly string[], max?: number): string[] {
  if (typeof max === "number" && max > 0) {
    return values.slice(0, max);
  }
  return [...values];
}

// ─── Legacy value aliases (no DB backfill) ─────────────────────────────────
//
// Centralizes ad hoc legacy-label → canonical-label read compat that used to
// live only in scattered comments. Keyed by the `category_attributes` json
// key (storage location), not by registry fieldId, since a json key like
// `kinds` is shared storage across audio/dev-tool/service-app.

export const LEGACY_VALUE_ALIASES = {
  /** service-app 種類 — legacy label read fallback. */
  kinds: { スマートフォンアプリ: "スマホアプリ" },
  /** dev-tool 対応環境・ツール — legacy label read fallback. */
  toolEnvironments: { "Visual Studio Code": "VS Code" },
  /** service-app 対応環境 — legacy label read fallback. */
  serviceEnvironments: { Webブラウザ: "Web" },
} as const satisfies Record<string, Record<string, string>>;

export type LegacyAliasStorageKey = keyof typeof LEGACY_VALUE_ALIASES;

/**
 * Canonicalize known legacy labels; unknown values pass through unchanged.
 * De-duplicates in case a legacy + canonical label were both stored (edge case).
 */
export function canonicalizeLegacyValues(
  storageKey: LegacyAliasStorageKey,
  values: readonly string[],
): string[] {
  const aliasMap: Record<string, string> = LEGACY_VALUE_ALIASES[storageKey];
  const mapped = values.map((value) => aliasMap[value] ?? value);
  return Array.from(new Set(mapped));
}

/**
 * Keep allowlisted values only, preserve first-seen order, cap at max.
 * Accepts string[] or comma-separated string (URL multi style).
 */
export function parseAllowlistedMulti(
  values: unknown,
  optionValues: readonly string[],
  max: number,
): string[] {
  const allow = new Set(optionValues);
  const raw: string[] = [];
  if (typeof values === "string") {
    raw.push(
      ...values
        .split(",")
        .map((part) => part.trim())
        .filter(Boolean),
    );
  } else if (Array.isArray(values)) {
    for (const item of values) {
      if (typeof item === "string" && item.trim()) {
        raw.push(item.trim());
      }
    }
  }

  const unique: string[] = [];
  for (const value of raw) {
    if (!allow.has(value) || unique.includes(value)) continue;
    unique.push(value);
    if (unique.length >= max) break;
  }
  return unique;
}

// ─── Save-boundary normalize: preserve legacy existing, reject new invalid ─
//
// `parseAllowlistedMulti` above silently drops anything outside the current
// allowlist — correct for parsing untrusted input (URL/query), wrong for a
// save boundary: it would silently erase legacy/obsolete values that were
// already persisted (data loss) while also silently swallowing a genuinely
// invalid new value (should be a validation error, not silent success).
// `normalizeFormalMultiForSave` is the save-boundary replacement: values
// already present in `baseline` (the pre-edit hydrated state) are preserved
// even if no longer allowlisted; any other unknown value is rejected.

export type FormalMultiNormalizeResult =
  | { ok: true; values: string[] }
  | { ok: false; message: string };

/**
 * Save-boundary allowlist for one registry-driven multi-select field with
 * legacy-preserve semantics:
 * - canonical/allowlisted values always pass
 * - values already present in `baseline` pass through even when no longer
 *   allowlisted (legacy existing data is not silently dropped just because
 *   an unrelated section, or the same section with no change, was saved)
 * - any other unknown value (new, tampered, never persisted before) is
 *   rejected with an explicit validation error — never silently stripped
 * - exceeding `maxSelection` after preserve+allowlist: if every kept value
 *   was already in `baseline` (a legacy row saved before this field's
 *   maxSelection existed/shrank), the oversized set is PRESERVED as-is —
 *   saving an untouched or partially-edited legacy field must never
 *   silently truncate it down to `maxSelection`. If the caller adds at
 *   least one value that was not already in baseline, the save rejects
 *   instead (a brand-new selection must respect the current max)
 */
export function normalizeFormalMultiForSave(input: {
  next: readonly string[];
  /** Pre-edit hydrated values for this same field — undefined/null for create (no legacy to preserve). */
  baseline?: readonly string[] | null;
  fieldId: FormalFilterFieldId;
  legacyKey?: LegacyAliasStorageKey;
}): FormalMultiNormalizeResult {
  const spec = getFormalFilterByFieldId(input.fieldId);
  if (!spec) {
    return { ok: false, message: "設定が見つかりません。" };
  }
  const nextCanonical = input.legacyKey
    ? canonicalizeLegacyValues(input.legacyKey, input.next)
    : Array.from(new Set(input.next));
  const baselineCanonical = input.legacyKey
    ? canonicalizeLegacyValues(input.legacyKey, input.baseline ?? [])
    : Array.from(new Set(input.baseline ?? []));
  const baselineSet = new Set(baselineCanonical);
  const allowSet = new Set(spec.options.map((option) => option.value));

  const kept: string[] = [];
  for (const value of nextCanonical) {
    if (kept.includes(value)) continue;
    if (allowSet.has(value) || baselineSet.has(value)) {
      kept.push(value);
      continue;
    }
    return {
      ok: false,
      message: `「${spec.label}」に不正な値があります。`,
    };
  }
  if (kept.length > spec.maxSelection) {
    const newlyAdded = kept.filter((value) => !baselineSet.has(value));
    if (newlyAdded.length > 0) {
      return {
        ok: false,
        message: `「${spec.label}」の選択数が上限を超えています。`,
      };
    }
    // Every kept value already existed in baseline — legacy over-max row,
    // preserve rather than truncate (see preserve+reject note above).
  }
  return { ok: true, values: kept };
}
