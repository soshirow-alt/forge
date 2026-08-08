/**
 * Non-game Studio overview edit persist (no React) — validate then write.
 */
import type { Game } from "@/lib/mock-games";
import type { ProjectEditFormData } from "@/lib/project-form";
import { buildProjectEditFormDataFromGame } from "@/lib/project-edit-form-data";
import {
  encodePrototypeFieldsToCategoryAttributes,
  mapPrototypePublishToFormal,
  mergeCategoryAttributesJson,
} from "@/lib/studio-non-game-attributes";
import {
  sanitizeFeatureTagsForSave,
} from "@/lib/forge-feature-tag-options";
import {
  mergePlayEnvironmentIntoTags,
  type PlayEnvironmentFormState,
} from "@/lib/play-environment";
import type { SubmitDraftState } from "@/lib/studio-submit-draft";
import type {
  SubmitPrototypeCategory,
  SubmitPrototypeCategoryFields,
} from "@/lib/prototype/studio-submit-flow";
import { validateNonGamePrototypeFieldsForEditMode } from "@/hooks/use-studio-submit";

export type NonGameEditPersistMode =
  | "genres-tags"
  | "play-info"
  | "publication";

export type NonGameEditPersistResult =
  | { ok: true; payload: ProjectEditFormData }
  | { ok: false; message: string };

export function buildNonGameEditPersistPayload(input: {
  game: Game;
  prototypeCategory: SubmitPrototypeCategory;
  fields: SubmitPrototypeCategoryFields;
  draft: SubmitDraftState;
  playEnvironment: PlayEnvironmentFormState;
  editMode: NonGameEditPersistMode;
}): NonGameEditPersistResult {
  const validation = validateNonGamePrototypeFieldsForEditMode(
    input.editMode,
    input.prototypeCategory,
    input.fields,
  );
  if (!validation.ok) {
    return { ok: false, message: validation.message };
  }

  const base = buildProjectEditFormDataFromGame(input.game);
  const studioAttrs = encodePrototypeFieldsToCategoryAttributes(input.fields);

  // Publication panel owns publish destinations; other panels keep existing formal links.
  const publishDestinations =
    input.editMode === "publication"
      ? mapPrototypePublishToFormal(input.fields.publishDestinations)
      : base.publishDestinations ?? [];

  return {
    ok: true,
    payload: {
      ...base,
      category: input.game.category,
      categoryAttributes: mergeCategoryAttributesJson(
        input.game.categoryAttributes,
        studioAttrs,
      ),
      tags: mergePlayEnvironmentIntoTags(
        sanitizeFeatureTagsForSave(input.draft.featureTags),
        input.playEnvironment,
      ),
      publishDestinations,
      visibility: input.draft.visibility,
      relatedLinks: input.draft.relatedLinks,
    },
  };
}

export async function runNonGameEditPersist(input: {
  game: Game;
  prototypeCategory: SubmitPrototypeCategory;
  fields: SubmitPrototypeCategoryFields;
  draft: SubmitDraftState;
  playEnvironment: PlayEnvironmentFormState;
  editMode: NonGameEditPersistMode;
  update: (payload: ProjectEditFormData) => Promise<void>;
}): Promise<NonGameEditPersistResult> {
  const planned = buildNonGameEditPersistPayload(input);
  if (!planned.ok) {
    return planned;
  }
  await input.update(planned.payload);
  return planned;
}
