/**
 * Single validation source for asset kinds/formats/tastes/tools.
 * Shared by Studio submit (create) and Studio overview edit — do not
 * duplicate the required check at each call site.
 *
 * maxSelection enforcement deliberately does NOT live here — it lives at the
 * save boundary (`sanitizeAssetFieldsForSave` → `normalizeFormalMultiForSave`),
 * which has preserve/reject semantics: a legacy row saved before this field's
 * maxSelection existed/shrank must be preservable on an unrelated edit, not
 * hard-rejected by a panel-level pre-check that runs before that baseline
 * comparison happens.
 */
import type { SubmitAssetCategoryFields } from "@/lib/studio-non-game-attributes";

/** Returns a user-facing error message, or null when fields are valid. */
export function validateAssetFields(
  fields: SubmitAssetCategoryFields,
): string | null {
  if (fields.kinds.length === 0) {
    return "アセット種別を1つ以上選んでください。";
  }
  return null;
}
