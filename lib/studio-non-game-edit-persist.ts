/**
 * Non-game Studio overview edit persist (no React) — validate then write.
 */
import type { Game } from "@/lib/mock-games";
import type { ProjectEditFormData } from "@/lib/project-form";
import { buildProjectEditFormDataFromGame } from "@/lib/project-edit-form-data";
import {
  encodePrototypeFieldsToCategoryAttributes,
  mergeCategoryAttributesJson,
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

  return {
    ok: true,
    payload: {
      ...base,
      ...publishPatch,
      category: input.game.category,
      categoryAttributes: mergeCategoryAttributesJson(
        input.game.categoryAttributes,
        studioAttrs,
      ),
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
  update: (payload: ProjectEditFormData) => Promise<void>;
}): Promise<NonGameEditPersistResult> {
  const built = buildNonGameEditPersistPayload(input);
  if (!built.ok) {
    return built;
  }
  await input.update(built.payload);
  return built;
}
