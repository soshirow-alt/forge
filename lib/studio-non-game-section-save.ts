/**
 * Shared non-game section-save controller used by Studio edit panels and verifies.
 * Panels must not re-implement required/allowed checks — call this, then apply/persist in onApply.
 *
 * Contract:
 * - validation fail → onApply never runs (no draft apply, no persist)
 * - validation ok → await onApply() (panel may apply draft and/or persist via save session)
 * - message is engine-derived; UI should display it as validationError
 */
import {
  validateNonGamePrototypeFields,
  type NonGameValidationResult,
} from "@/lib/studio-non-game-validation";
import type {
  SubmitPrototypeCategory,
  SubmitPrototypeCategoryFields,
} from "@/lib/prototype/studio-submit-flow";

export type NonGameSectionId = "genres-tags" | "play-info" | "publication";

export type NonGameSectionSaveAttemptResult =
  | {
      applied: true;
      message: null;
      validation: Extract<NonGameValidationResult, { ok: true }>;
    }
  | {
      applied: false;
      message: string;
      validation: Extract<NonGameValidationResult, { ok: false }>;
    };

/**
 * Gate with the central engine (section scope), then run onApply only when allowed.
 */
export async function attemptNonGameSectionSave(input: {
  category: SubmitPrototypeCategory;
  section: NonGameSectionId;
  fields: SubmitPrototypeCategoryFields;
  onApply: () => void | Promise<void>;
}): Promise<NonGameSectionSaveAttemptResult> {
  const validation = validateNonGamePrototypeFields(
    input.category,
    input.fields,
    { mode: "section", section: input.section },
  );
  if (!validation.ok) {
    return {
      applied: false,
      message: validation.message,
      validation,
    };
  }
  await input.onApply();
  return { applied: true, message: null, validation };
}
