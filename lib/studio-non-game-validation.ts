/**
 * Non-game Studio validation — single rule source with scoped execution.
 *
 * Scopes:
 * - create / full: all non-game rules (submit)
 * - section: only rules for one overview panel (edit / error clear)
 *
 * Do not duplicate required/allowed checks elsewhere — call this engine.
 */

import { validatePublishAccess } from "@/lib/project-access-form";
import {
  mapPrototypePublishToFormal,
  validatePrototypePublishDestinationsForCategory,
} from "@/lib/studio-non-game-attributes";
import {
  SUBMIT_VALIDATION_PANEL_LABELS,
  type SubmitValidationEditMode,
} from "@/lib/studio-submit-draft";
import {
  isUsableMusicDuration,
  parseMusicDurationParts,
  type SubmitPrototypeCategory,
  type SubmitPrototypeCategoryFields,
} from "@/lib/prototype/studio-submit-flow";

export type NonGameValidationScope =
  | { mode: "create" }
  | { mode: "full" }
  | { mode: "section"; section: "genres-tags" | "play-info" | "publication" };

export type NonGameValidationFailure = {
  ok: false;
  message: string;
  editMode?: SubmitValidationEditMode;
  sectionLabel?: string;
};

export type NonGameValidationResult = { ok: true } | NonGameValidationFailure;

function failure(
  editMode: SubmitValidationEditMode,
  detail: string,
): NonGameValidationFailure {
  const sectionLabel = SUBMIT_VALIDATION_PANEL_LABELS[editMode];
  return {
    ok: false,
    message: `「${sectionLabel}」を確認してください。${detail}`,
    editMode,
    sectionLabel,
  };
}

/** Rule: classification kind required. */
function ruleKindRequired(
  fields: SubmitPrototypeCategoryFields,
): NonGameValidationFailure | null {
  if (!fields.kind.trim()) {
    return failure("genres-tags", "種類を選んでください。");
  }
  return null;
}

/** Rule: music duration format when provided. */
function ruleMusicDuration(
  category: SubmitPrototypeCategory,
  fields: SubmitPrototypeCategoryFields,
): NonGameValidationFailure | null {
  if (category !== "music" || !fields.musicDuration.trim()) {
    return null;
  }
  const parts = parseMusicDurationParts(fields.musicDuration);
  if (!parts || !isUsableMusicDuration(parts.minutes, parts.seconds)) {
    return failure("play-info", "再生時間を確認してください。");
  }
  return null;
}

/** Rule: dev_tool usage method required. */
function ruleToolUsageMethod(
  category: SubmitPrototypeCategory,
  fields: SubmitPrototypeCategoryFields,
): NonGameValidationFailure | null {
  if (category === "dev_tool" && !fields.toolUsageMethod.trim()) {
    return failure("play-info", "利用方法を選んでください。");
  }
  return null;
}

/**
 * Rule: prototype publish kinds allowlist + formal publish access.
 * Unknown kind → reject (no silent other fallback).
 */
function rulePublish(
  category: SubmitPrototypeCategory,
  fields: SubmitPrototypeCategoryFields,
): NonGameValidationFailure | null {
  const publishKindError = validatePrototypePublishDestinationsForCategory(
    category,
    fields.publishDestinations,
  );
  if (publishKindError) {
    return failure("publication", publishKindError);
  }
  const formalPublish = mapPrototypePublishToFormal(
    fields.publishDestinations,
  );
  const publishError = validatePublishAccess(formalPublish);
  if (publishError) {
    return failure("publication", publishError);
  }
  return null;
}

type RuleFn = (
  category: SubmitPrototypeCategory,
  fields: SubmitPrototypeCategoryFields,
) => NonGameValidationFailure | null;

const SECTION_RULES: Record<
  "genres-tags" | "play-info" | "publication",
  RuleFn[]
> = {
  "genres-tags": [(_c, f) => ruleKindRequired(f)],
  "play-info": [ruleMusicDuration, ruleToolUsageMethod],
  publication: [rulePublish],
};

const FULL_RULES: RuleFn[] = [
  (_c, f) => ruleKindRequired(f),
  ruleMusicDuration,
  ruleToolUsageMethod,
  rulePublish,
];

/**
 * Single non-game validation engine.
 * Rule definitions live only in this module's rule* helpers + SECTION_RULES.
 */
export function validateNonGamePrototypeFields(
  prototypeCategory: SubmitPrototypeCategory,
  prototypeFields: SubmitPrototypeCategoryFields,
  scope: NonGameValidationScope,
): NonGameValidationResult {
  const rules =
    scope.mode === "section"
      ? SECTION_RULES[scope.section]
      : FULL_RULES;

  for (const rule of rules) {
    const err = rule(prototypeCategory, prototypeFields);
    if (err) return err;
  }
  return { ok: true };
}

/** Submit: all non-game rules. */
export function validateNonGamePrototypeFieldsForSave(
  prototypeCategory: SubmitPrototypeCategory,
  prototypeFields: SubmitPrototypeCategoryFields,
): NonGameValidationResult {
  return validateNonGamePrototypeFields(prototypeCategory, prototypeFields, {
    mode: "create",
  });
}

/** Overview edit: panel-scoped rules only. */
export function validateNonGamePrototypeFieldsForEditMode(
  editMode: "genres-tags" | "play-info" | "publication",
  prototypeCategory: SubmitPrototypeCategory,
  prototypeFields: SubmitPrototypeCategoryFields,
): NonGameValidationResult {
  return validateNonGamePrototypeFields(prototypeCategory, prototypeFields, {
    mode: "section",
    section: editMode,
  });
}
