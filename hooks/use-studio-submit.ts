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
  draftToSubmitFormData,
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
  encodePrototypeFieldsToCategoryAttributes,
  mergeCategoryAttributesJson,
  prototypeCategoryToProjectCategory,
} from "@/lib/studio-non-game-attributes";
import {
  validateNonGamePrototypeFields,
  validateNonGamePrototypeFieldsForSave,
} from "@/lib/studio-non-game-validation";
import { buildNonGamePublishWriteFields } from "@/lib/project-publish-write-adapter";
import type {
  SubmitPrototypeCategory,
  SubmitPrototypeCategoryFields,
} from "@/lib/prototype/studio-submit-flow";

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
  },
): SubmitDraftValidationResult {
  const prototypeCategory = options?.prototypeCategory ?? null;
  const prototypeFields = options?.prototypeFields ?? null;

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

  if (prototypeCategory && prototypeFields) {
    const nonGame = validateNonGamePrototypeFieldsForSave(
      prototypeCategory,
      prototypeFields,
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
  },
): SubmitDraftValidationResult {
  const prototypeCategory = options?.prototypeCategory ?? null;
  const prototypeFields = options?.prototypeFields ?? null;

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
      if (prototypeCategory && prototypeFields) {
        return validateNonGamePrototypeFields(prototypeCategory, prototypeFields, {
          mode: "section",
          section: "genres-tags",
        });
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
      if (prototypeCategory && prototypeFields) {
        return validateNonGamePrototypeFields(prototypeCategory, prototypeFields, {
          mode: "section",
          section: "play-info",
        });
      }
      if (!isSpecifiedPlayAccessType(draft.playAccessType)) {
        return validationFailure("play-info", "料金・公開形態を選んでください。");
      }
      return { ok: true };
    }
    case "publication": {
      if (prototypeCategory && prototypeFields) {
        return validateNonGamePrototypeFields(prototypeCategory, prototypeFields, {
          mode: "section",
          section: "publication",
        });
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
      },
    ): Promise<SubmitDraftResult> => {
      const prototypeCategory = options?.prototypeCategory ?? null;
      const prototypeFields = options?.prototypeFields ?? null;
      const validation = validateSubmitDraftForPost(draft, {
        prototypeCategory,
        prototypeFields,
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

        let category: ProjectCategoryId | undefined;
        let categoryAttributes: Record<string, unknown> | undefined;
        let publishOverride:
          | ReturnType<typeof buildNonGamePublishWriteFields>["publishDestinations"]
          | undefined;
        let publishLinkOverride:
          | ReturnType<typeof buildNonGamePublishWriteFields>
          | undefined;

        if (prototypeCategory && prototypeFields) {
          category = prototypeCategoryToProjectCategory(prototypeCategory);
          categoryAttributes = mergeCategoryAttributesJson(
            {},
            encodePrototypeFieldsToCategoryAttributes(prototypeFields),
          );
          publishLinkOverride = buildNonGamePublishWriteFields(
            prototypeFields.publishDestinations,
          );
          publishOverride = publishLinkOverride.publishDestinations;
        }

        const data = draftToSubmitFormData(draft, owner, {
          category,
          categoryAttributes,
          publishDestinationsOverride: publishOverride,
        });
        if (publishLinkOverride) {
          data.playUrl = publishLinkOverride.playUrl;
          data.steamUrl = publishLinkOverride.steamUrl;
          data.itchUrl = publishLinkOverride.itchUrl;
          data.githubUrl = publishLinkOverride.githubUrl;
          data.discordUrl = publishLinkOverride.discordUrl;
          data.officialUrl = publishLinkOverride.officialUrl;
          data.xUrl = publishLinkOverride.xUrl;
          data.youtubeUrl = publishLinkOverride.youtubeUrl;
        }
        if (
          prototypeCategory &&
          !isSpecifiedPlayAccessType(data.playAccessType)
        ) {
          data.playAccessType = "free";
        }

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
