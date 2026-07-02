"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useGames } from "@/components/games-provider";
import { mapProjectSubmitErrorMessage } from "@/lib/error-message";
import { validatePlayAccess } from "@/lib/project-access-form";
import { projectStudioPath } from "@/lib/project-nurture-links";
import { resolvePlayableVersion } from "@/lib/playable-version";
import { normalizeDeveloperProfileText } from "@/lib/developer-profiles";
import { resolveDeveloperPublicName } from "@/lib/developer-display-name";
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
import { validatePromptDrafts } from "@/lib/version-prompt-form";
import type { User } from "@/lib/auth";

export type { SubmitValidationEditMode } from "@/lib/studio-submit-draft";

export type SubmitDraftValidationResult =
  | { ok: true }
  | {
      ok: false;
      message: string;
      editMode?: SubmitValidationEditMode;
      sectionLabel?: string;
    };

function validationFailure(
  editMode: SubmitValidationEditMode,
  detail: string,
): SubmitDraftValidationResult {
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
): SubmitDraftValidationResult {
  if (!draft.title.trim()) {
    return validationFailure("basic-info", "タイトルを入力してください。");
  }

  const leadError = validateProjectOneLineDescription(draft.description);
  if (leadError) {
    return validationFailure("basic-info", leadError);
  }

  const genres = sanitizeProjectGenresForSave(draft.genres);
  if (genres.length === 0) {
    return validationFailure("genres-tags", "ジャンルを1つ以上選んでください。");
  }

  if (!draft.introduction.trim()) {
    return validationFailure("introduction", "作品紹介を入力してください。");
  }

  if (!draft.phase.trim()) {
    return validationFailure("basic-info", "開発フェーズを選んでください。");
  }

  const accessError = validatePlayAccess(draft.playEnvironment, draft.playUrl);
  if (accessError) {
    return validationFailure("play-info", accessError);
  }

  if (draft.promptMode === "custom") {
    const validation = validatePromptDrafts(draft.promptDrafts);
    if (validation.blocking) {
      return {
        ok: false,
        message: validation.message ?? "質問の設定を確認してください。",
      };
    }
  }

  return { ok: true };
}

export function useStudioSubmit() {
  const router = useRouter();
  const {
    addSubmittedGame,
    getDeveloperProfileByUserId,
    saveDeveloperProfile,
    saveDeveloperVersionPrompts,
  } = useGames();

  const submitDraft = useCallback(
    async (
      draft: SubmitDraftState,
      user: User,
    ): Promise<SubmitDraftValidationResult> => {
      const validation = validateSubmitDraftForPost(draft);
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

        const data = draftToSubmitFormData(draft, owner);
        const game = await addSubmittedGame(data, {
          ownerId: user.id,
          ownerName: publicName,
        });

        const versionKey = resolvePlayableVersion(game.playableVersion);
        const promptsToSave = getSubmitPromptsToSave(draft);
        await saveDeveloperVersionPrompts(game.id, versionKey, promptsToSave);

        router.push(projectStudioPath(game.id));
        return { ok: true };
      } catch (error) {
        return { ok: false, message: mapProjectSubmitErrorMessage(error) };
      }
    },
    [
      addSubmittedGame,
      getDeveloperProfileByUserId,
      router,
      saveDeveloperProfile,
      saveDeveloperVersionPrompts,
    ],
  );

  return { submitDraft, validateSubmitDraftForPost };
}
