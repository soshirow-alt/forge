/**
 * Asset Studio overview edit persist (no React) — validate then write.
 * Mirrors lib/studio-non-game-edit-persist.ts for the asset structured
 * kinds/formats/tastes/tools panel (asset has no prototype category).
 */
import type { Game } from "@/lib/mock-games";
import type { ProjectEditFormData } from "@/lib/project-form";
import { buildProjectEditFormDataFromGame } from "@/lib/project-edit-form-data";
import {
  ASSET_ATTRIBUTE_KEYS,
  decodeCategoryAttributesToAssetFields,
  encodeAssetFieldsToCategoryAttributes,
  mergeCategoryAttributesJson,
  sanitizeAssetFieldsForSave,
  type SubmitAssetCategoryFields,
} from "@/lib/studio-non-game-attributes";
import { validateAssetFields } from "@/lib/studio-asset-validation";

export type AssetEditPersistResult =
  | { ok: true; payload: ProjectEditFormData }
  | { ok: false; message: string };

export function buildAssetEditPersistPayload(input: {
  game: Game;
  fields: SubmitAssetCategoryFields;
}): AssetEditPersistResult {
  // Baseline = pre-edit hydrated state from the DB row being edited — legacy
  // existing unknown values survive; a genuinely new unknown value rejects.
  const baseline = decodeCategoryAttributesToAssetFields(
    input.game.categoryAttributes,
    input.game.assetKinds,
  );
  const sanitizeResult = sanitizeAssetFieldsForSave(input.fields, baseline);
  if (!sanitizeResult.ok) {
    return { ok: false, message: sanitizeResult.message };
  }
  const sanitized = sanitizeResult.fields;
  const error = validateAssetFields(sanitized);
  if (error) {
    return { ok: false, message: error };
  }

  const base = buildProjectEditFormDataFromGame(input.game);
  const studioAttrs = encodeAssetFieldsToCategoryAttributes(sanitized);

  return {
    ok: true,
    payload: {
      ...base,
      category: "asset",
      categoryAttributes: mergeCategoryAttributesJson(
        input.game.categoryAttributes,
        studioAttrs,
        ASSET_ATTRIBUTE_KEYS,
      ),
      // Canonical kinds live in the dedicated asset_kinds column — always set
      // (never omitted) so deselecting down to zero-minus-required still clears.
      assetKinds: sanitized.kinds,
    },
  };
}

export async function runAssetEditPersist(input: {
  game: Game;
  fields: SubmitAssetCategoryFields;
  update: (payload: ProjectEditFormData) => Promise<void>;
}): Promise<AssetEditPersistResult> {
  const built = buildAssetEditPersistPayload(input);
  if (!built.ok) {
    return built;
  }
  await input.update(built.payload);
  return built;
}
