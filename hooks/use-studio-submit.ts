"use client";

import { useCallback } from "react";
import { useGames } from "@/components/games-provider";
import { mapProjectSubmitErrorMessage } from "@/lib/error-message";
import { validatePublishAccess } from "@/lib/project-access-form";
import { resolvePlayableVersion } from "@/lib/playable-version";
import { normalizeDeveloperProfileText } from "@/lib/developer-profiles";
import { resolveDeveloperPublicName } from "@/lib/developer-display-name";
import { isSpecifiedPlayAccessType } from "@/lib/play-access-type";
import {
  getSubmitPromptsToSave,
  SUBMIT_VALIDATION_PANEL_LABELS,
  type SubmitDraftOwner,
  type SubmitDraftState,
  type SubmitValidationEditMode,
} from "@/lib/studio-submit-draft";
import { sanitizeProjectGenresForSave } from "@/lib/project-genres";
import { validateProjectOneLineDescription } from "@/lib/project-one-line-description";
import { validateProjectTitle } from "@/lib/project-title";
import { validatePromptDrafts } from "@/lib/version-prompt-form";
import type { User } from "@/lib/auth";
import type { ProjectVisibility } from "@/lib/project-visibility";
import type { ProjectCategoryId } from "@/lib/project-categories";
import {
  validateNonGamePrototypeFields,
  validateNonGamePrototypeFieldsForSave,
} from "@/lib/studio-non-game-validation";
import { isStudioCommonFieldsOnlyCategory } from "@/lib/studio-category-mode";
import { planStudioSubmitWrite } from "@/lib/studio-submit-write-plan";
import type {
  SubmitPrototypeCategory,
  SubmitPrototypeCategoryFields,
} from "@/lib/prototype/studio-submit-flow";
import {
  sanitizeAssetFieldsForSave,
  sanitizeNonGamePrototypeFieldsForSave,
  type SubmitAssetCategoryFields,
} from "@/lib/studio-non-game-attributes";
import { normalizeFormalMultiForSave } from "@/lib/project-formal-filter-registry";

export {
  validateNonGamePrototypeFields,
  validateNonGamePrototypeFieldsForEditMode,
  validateNonGamePrototypeFieldsForSave,
} from "@/lib/studio-non-game-validation";

export type { SubmitValidationEditMode } from "@/lib/studio-submit-draft";

export type SubmitDraftFailureResult = {
  ok: false;
  message: string;
  editMode?: SubmitValidationEditMode;
  sectionLabel?: string;
};

export type SubmitDraftSuccessResult = {
  ok: true;
  gameId: string;
  title: string;
  visibility: ProjectVisibility;
};

export type SubmitDraftValidationResult =
  | { ok: true }
  | SubmitDraftFailureResult;

export type SubmitDraftResult = SubmitDraftSuccessResult | SubmitDraftFailureResult;

function validationFailure(
  editMode: SubmitValidationEditMode,
  detail: string,
): SubmitDraftFailureResult {
  const sectionLabel = SUBMIT_VALIDATION_PANEL_LABELS[editMode];
  return {
    ok: false,
    message: `「${sectionLabel}」を確認してください。${detail}`,
    editMode,
    sectionLabel,
  };
}

export function validateSubmitDraftForPost(
  draft: SubmitDraftState,
  options?: {
    prototypeCategory?: SubmitPrototypeCategory | null;
    prototypeFields?: SubmitPrototypeCategoryFields | null;
    projectCategory?: ProjectCategoryId | null;
    assetFields?: SubmitAssetCategoryFields | null;
  },
): SubmitDraftValidationResult {
  const prototypeCategory = options?.prototypeCategory ?? null;
  const prototypeFields = options?.prototypeFields ?? null;
  const assetFields = options?.assetFields ?? null;
  const commonFieldsOnly = isStudioCommonFieldsOnlyCategory(
    options?.projectCategory,
  );

  if (!draft.title.trim()) {
    return validationFailure("basic-info", "タイトルを入力してください。");
  }

  const titleError = validateProjectTitle(draft.title);
  if (titleError) {
    return validationFailure("basic-info", titleError);
  }

  const leadError = validateProjectOneLineDescription(draft.description);
  if (leadError) {
    return validationFailure("basic-info", leadError);
  }

  if (!draft.introduction.trim()) {
    return validationFailure("introduction", "作品紹介を入力してください。");
  }

  if (!draft.phase.trim()) {
    return validationFailure("basic-info", "開発フェーズを選んでください。");
  }

  if (commonFieldsOnly) {
    const sanitizedAssetResult = assetFields
      ? sanitizeAssetFieldsForSave(assetFields)
      : null;
    if (sanitizedAssetResult && !sanitizedAssetResult.ok) {
      return validationFailure("genres-tags", sanitizedAssetResult.message);
    }
    const sanitizedAssetFields = sanitizedAssetResult?.ok
      ? sanitizedAssetResult.fields
      : null;
    if (!sanitizedAssetFields || sanitizedAssetFields.kinds.length === 0) {
      return validationFailure("genres-tags", "アセット種別を1つ以上選んでください。");
    }
    const publishError = validatePublishAccess(draft.publishDestinations);
    if (publishError) {
      return validationFailure("publication", publishError);
    }
  } else if (prototypeCategory && prototypeFields) {
    const sanitizedResult = sanitizeNonGamePrototypeFieldsForSave(
      prototypeCategory,
      prototypeFields,
    );
    if (!sanitizedResult.ok) {
      return validationFailure("genres-tags", sanitizedResult.message);
    }
    const nonGame = validateNonGamePrototypeFieldsForSave(
      prototypeCategory,
      sanitizedResult.fields,
    );
    if (!nonGame.ok) {
      return nonGame;
    }
  } else {
    const genres = sanitizeProjectGenresForSave(draft.genres);
    if (genres.length === 0) {
      return validationFailure("genres-tags", "ジャンルを1つ以上選んでください。");
    }

    if (!isSpecifiedPlayAccessType(draft.playAccessType)) {
      return validationFailure("play-info", "料金・公開形態を選んでください。");
    }

    // Create path (no baseline) — an unknown/obsolete value must reject,
    // never silently drop (see `parseAllowlistedMulti` vs
    // `normalizeFormalMultiForSave` note in lib/project-formal-filter-registry.ts).
    const playerCountsResult = normalizeFormalMultiForSave({
      next: draft.playerCounts,
      fieldId: "player_count",
    });
    if (!playerCountsResult.ok) {
      return validationFailure("play-info", playerCountsResult.message);
    }

    const publishError = validatePublishAccess(draft.publishDestinations);
    if (publishError) {
      return validationFailure("publication", publishError);
    }
  }

  const promptValidation = validatePromptDrafts(draft.promptDrafts);
  if (promptValidation.blocking) {
    return {
      ok: false,
      message: promptValidation.message ?? "質問の設定を確認してください。",
    };
  }

  return { ok: true };
}

/** Re-validate a single section — used to clear stale submit errors after input. */
export function validateSubmitDraftSection(
  draft: SubmitDraftState,
  editMode: SubmitValidationEditMode,
  options?: {
    prototypeCategory?: SubmitPrototypeCategory | null;
    prototypeFields?: SubmitPrototypeCategoryFields | null;
    projectCategory?: ProjectCategoryId | null;
    assetFields?: SubmitAssetCategoryFields | null;
  },
): SubmitDraftValidationResult {
  const prototypeCategory = options?.prototypeCategory ?? null;
  const prototypeFields = options?.prototypeFields ?? null;
  const assetFields = options?.assetFields ?? null;
  const commonFieldsOnly = isStudioCommonFieldsOnlyCategory(
    options?.projectCategory,
  );

  switch (editMode) {
    case "basic-info": {
      if (!draft.title.trim()) {
        return validationFailure("basic-info", "タイトルを入力してください。");
      }
      const titleError = validateProjectTitle(draft.title);
      if (titleError) {
        return validationFailure("basic-info", titleError);
      }
      const leadError = validateProjectOneLineDescription(draft.description);
      if (leadError) {
        return validationFailure("basic-info", leadError);
      }
      if (!draft.phase.trim()) {
        return validationFailure("basic-info", "開発フェーズを選んでください。");
      }
      return { ok: true };
    }
    case "genres-tags": {
      if (commonFieldsOnly) {
        const sanitizedAssetResult = assetFields
          ? sanitizeAssetFieldsForSave(assetFields)
          : null;
        if (sanitizedAssetResult && !sanitizedAssetResult.ok) {
          return validationFailure("genres-tags", sanitizedAssetResult.message);
        }
        const sanitizedAssetFields = sanitizedAssetResult?.ok
          ? sanitizedAssetResult.fields
          : null;
        if (!sanitizedAssetFields || sanitizedAssetFields.kinds.length === 0) {
          return validationFailure(
            "genres-tags",
            "アセット種別を1つ以上選んでください。",
          );
        }
        return { ok: true };
      }
      if (prototypeCategory && prototypeFields) {
        const sanitizedResult = sanitizeNonGamePrototypeFieldsForSave(
          prototypeCategory,
          prototypeFields,
        );
        if (!sanitizedResult.ok) {
          return validationFailure("genres-tags", sanitizedResult.message);
        }
        return validateNonGamePrototypeFields(
          prototypeCategory,
          sanitizedResult.fields,
          { mode: "section", section: "genres-tags" },
        );
      }
      const genres = sanitizeProjectGenresForSave(draft.genres);
      if (genres.length === 0) {
        return validationFailure("genres-tags", "ジャンルを1つ以上選んでください。");
      }
      return { ok: true };
    }
    case "introduction": {
      if (!draft.introduction.trim()) {
        return validationFailure("introduction", "作品紹介を入力してください。");
      }
      return { ok: true };
    }
    case "play-info": {
      if (commonFieldsOnly) {
        return { ok: true };
      }
      if (prototypeCategory && prototypeFields) {
        const sanitizedResult = sanitizeNonGamePrototypeFieldsForSave(
          prototypeCategory,
          prototypeFields,
        );
        if (!sanitizedResult.ok) {
          return validationFailure("play-info", sanitizedResult.message);
        }
        return validateNonGamePrototypeFields(
          prototypeCategory,
          sanitizedResult.fields,
          { mode: "section", section: "play-info" },
        );
      }
      if (!isSpecifiedPlayAccessType(draft.playAccessType)) {
        return validationFailure("play-info", "料金・公開形態を選んでください。");
      }
      const playerCountsResult = normalizeFormalMultiForSave({
        next: draft.playerCounts,
        fieldId: "player_count",
      });
      if (!playerCountsResult.ok) {
        return validationFailure("play-info", playerCountsResult.message);
      }
      return { ok: true };
    }
    case "publication": {
      if (prototypeCategory && prototypeFields && !commonFieldsOnly) {
        const sanitizedResult = sanitizeNonGamePrototypeFieldsForSave(
          prototypeCategory,
          prototypeFields,
        );
        if (!sanitizedResult.ok) {
          return validationFailure("publication", sanitizedResult.message);
        }
        return validateNonGamePrototypeFields(
          prototypeCategory,
          sanitizedResult.fields,
          { mode: "section", section: "publication" },
        );
      }
      const publishError = validatePublishAccess(draft.publishDestinations);
      if (publishError) {
        return validationFailure("publication", publishError);
      }
      return { ok: true };
    }
    default:
      return { ok: true };
  }
}

export function useStudioSubmit() {
  const {
    addSubmittedGame,
    createInitialProjectDevlog,
    getDeveloperProfileByUserId,
    saveDeveloperProfile,
    saveDeveloperVersionPrompts,
  } = useGames();

  const submitDraft = useCallback(
    async (
      draft: SubmitDraftState,
      user: User,
      options?: {
        prototypeCategory?: SubmitPrototypeCategory | null;
        prototypeFields?: SubmitPrototypeCategoryFields | null;
        projectCategory?: ProjectCategoryId | null;
        assetFields?: SubmitAssetCategoryFields | null;
      },
    ): Promise<SubmitDraftResult> => {
      const prototypeCategory = options?.prototypeCategory ?? null;
      const prototypeFields = options?.prototypeFields ?? null;
      const projectCategoryOption = options?.projectCategory ?? null;
      const assetFields = options?.assetFields ?? null;
      const validation = validateSubmitDraftForPost(draft, {
        prototypeCategory,
        prototypeFields,
        projectCategory: projectCategoryOption,
        assetFields,
      });
      if (!validation.ok) {
        return validation;
      }

      const publicName = resolveDeveloperPublicName(
        user,
        getDeveloperProfileByUserId(user.id),
      );
      const owner: SubmitDraftOwner = {
        ownerId: user.id,
        ownerName: publicName,
        creator: publicName,
      };

      try {
        if (!getDeveloperProfileByUserId(user.id)) {
          await saveDeveloperProfile(user.id, {
            publicName,
            profile: normalizeDeveloperProfileText(""),
          });
        }

        const data = planStudioSubmitWrite({
          draft,
          owner,
          prototypeCategory,
          prototypeFields,
          projectCategory: projectCategoryOption,
          assetFields,
        });

        const game = await addSubmittedGame(data, {
          ownerId: user.id,
          ownerName: publicName,
        });

        try {
          await createInitialProjectDevlog(game.id, user.id, draft.introduction);
        } catch {
          throw new Error(
            "初回開発ログの作成に失敗しました。作品は作成済みの可能性があります。マイページを確認してください。",
          );
        }

        const versionKey = resolvePlayableVersion(game.playableVersion);
        const promptsToSave = getSubmitPromptsToSave(draft);
        try {
          await saveDeveloperVersionPrompts(game.id, versionKey, promptsToSave);
        } catch {
          throw new Error(
            "フィードバック用の問いの保存に失敗しました。作品は作成済みの可能性があります。マイページを確認してください。",
          );
        }

        return {
          ok: true,
          gameId: game.id,
          title: game.title,
          visibility: game.visibility === "private" ? "private" : "public",
        };
      } catch (error) {
        return { ok: false, message: mapProjectSubmitErrorMessage(error) };
      }
    },
    [
      addSubmittedGame,
      createInitialProjectDevlog,
      getDeveloperProfileByUserId,
      saveDeveloperProfile,
      saveDeveloperVersionPrompts,
    ],
  );

  return { submitDraft, validateSubmitDraftForPost, validateSubmitDraftSection };
}
