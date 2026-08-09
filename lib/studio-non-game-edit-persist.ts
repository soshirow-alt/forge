/**
 * Non-game Studio overview edit persist (no React) — validate then write.
 */
import type { Game } from "@/lib/mock-games";
import type { ProjectEditFormData } from "@/lib/project-form";
import { buildProjectEditFormDataFromGame } from "@/lib/project-edit-form-data";
import {
  decodeCategoryAttributesToPrototypeFields,
  encodePrototypeFieldsToCategoryAttributes,
  mergeCategoryAttributesJson,
  NON_GAME_CLASSIFICATION_ATTRIBUTE_KEYS,
  NON_GAME_PUBLICATION_ATTRIBUTE_KEYS,
  NON_GAME_USAGE_ATTRIBUTE_KEYS,
  sanitizeNonGamePrototypeFieldsForSave,
  type StudioStoredCategoryAttributes,
} from "@/lib/studio-non-game-attributes";
import { buildNonGamePublishWriteFields } from "@/lib/project-publish-write-adapter";
import { composeProjectTagsForWrite } from "@/lib/project-tags";
import type { PlayEnvironmentFormState } from "@/lib/play-environment";
import type { SubmitDraftState } from "@/lib/studio-submit-draft";
import type {
  SubmitPrototypeCategory,
  SubmitPrototypeCategoryFields,
} from "@/lib/prototype/studio-submit-flow";
import { validateNonGamePrototypeFieldsForEditMode } from "@/lib/studio-non-game-validation";

export type NonGameEditPersistMode =
  | "genres-tags"
  | "play-info"
  | "publication";

export type NonGameEditPersistResult =
  | { ok: true; payload: ProjectEditFormData }
  | { ok: false; message: string };

function pickOwnedAttrs(
  encoded: StudioStoredCategoryAttributes,
  owned: readonly (keyof StudioStoredCategoryAttributes)[],
): StudioStoredCategoryAttributes {
  const out: StudioStoredCategoryAttributes = {};
  for (const key of owned) {
    if (encoded[key] !== undefined) {
      (out as Record<string, unknown>)[key] = encoded[key];
    }
  }
  return out;
}

export function buildNonGameEditPersistPayload(input: {
  game: Game;
  prototypeCategory: SubmitPrototypeCategory;
  fields: SubmitPrototypeCategoryFields;
  draft: SubmitDraftState;
  playEnvironment: PlayEnvironmentFormState;
  editMode: NonGameEditPersistMode;
}): NonGameEditPersistResult {
  const baseline = decodeCategoryAttributesToPrototypeFields(
    input.game.categoryAttributes,
  );
  const sanitizeResult = sanitizeNonGamePrototypeFieldsForSave(
    input.prototypeCategory,
    input.fields,
    baseline,
  );
  if (!sanitizeResult.ok) {
    return { ok: false, message: sanitizeResult.message };
  }
  const sanitizedFields = sanitizeResult.fields;
  const validation = validateNonGamePrototypeFieldsForEditMode(
    input.editMode,
    input.prototypeCategory,
    sanitizedFields,
  );
  if (!validation.ok) {
    return { ok: false, message: validation.message };
  }

  const base = buildProjectEditFormDataFromGame(input.game);

  let publishPatch: Partial<ProjectEditFormData> = {
    publishDestinations: base.publishDestinations ?? [],
  };
  if (input.editMode === "publication") {
    const write = buildNonGamePublishWriteFields(input.fields.publishDestinations);
    publishPatch = {
      publishDestinations: write.publishDestinations,
      playUrl: write.playUrl,
      steamUrl: write.steamUrl,
      itchUrl: write.itchUrl,
      githubUrl: write.githubUrl,
      discordUrl: write.discordUrl,
      officialUrl: write.officialUrl,
      xUrl: write.xUrl,
      youtubeUrl: write.youtubeUrl,
    };
  }

  // Scope category_attributes rewrite to the active panel only.
  // Unedited panels' legacy/unknown values must survive.
  let nextCategoryAttributes: Record<string, unknown> | undefined =
    (input.game.categoryAttributes as Record<string, unknown> | undefined) ??
    undefined;
  if (input.editMode === "publication") {
    const encoded = encodePrototypeFieldsToCategoryAttributes(sanitizedFields);
    nextCategoryAttributes = mergeCategoryAttributesJson(
      input.game.categoryAttributes,
      pickOwnedAttrs(encoded, NON_GAME_PUBLICATION_ATTRIBUTE_KEYS),
      NON_GAME_PUBLICATION_ATTRIBUTE_KEYS,
    ) as Record<string, unknown>;
  } else if (input.editMode === "genres-tags") {
    const encoded = encodePrototypeFieldsToCategoryAttributes(sanitizedFields);
    nextCategoryAttributes = mergeCategoryAttributesJson(
      input.game.categoryAttributes,
      pickOwnedAttrs(encoded, NON_GAME_CLASSIFICATION_ATTRIBUTE_KEYS),
      NON_GAME_CLASSIFICATION_ATTRIBUTE_KEYS,
    ) as Record<string, unknown>;
  } else if (input.editMode === "play-info") {
    const encoded = encodePrototypeFieldsToCategoryAttributes(sanitizedFields);
    nextCategoryAttributes = mergeCategoryAttributesJson(
      input.game.categoryAttributes,
      pickOwnedAttrs(encoded, NON_GAME_USAGE_ATTRIBUTE_KEYS),
      NON_GAME_USAGE_ATTRIBUTE_KEYS,
    ) as Record<string, unknown>;
  }

  return {
    ok: true,
    payload: {
      ...base,
      ...publishPatch,
      category: input.game.category,
      categoryAttributes: nextCategoryAttributes,
      tags: composeProjectTagsForWrite({
        featureTags: input.draft.featureTags,
        playEnvironment: input.playEnvironment,
        existingTags: input.game.tags,
      }),
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
  update: (payload: ProjectEditFormData) => Promise<unknown>;
}): Promise<NonGameEditPersistResult> {
  const built = buildNonGameEditPersistPayload(input);
  if (!built.ok) return built;
  await input.update(built.payload);
  return built;
}
