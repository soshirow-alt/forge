/**
 * Non-game overview edit save session — close / onSaved only after successful persist.
 * Pure controller for panel + behavioral verify (no React test framework required).
 */
import { mapProjectSubmitErrorMessage } from "@/lib/error-message";
import type { Game } from "@/lib/mock-games";
import type { ProjectEditFormData } from "@/lib/project-form";
import type { PlayEnvironmentFormState } from "@/lib/play-environment";
import type { SubmitDraftState } from "@/lib/studio-submit-draft";
import type {
  SubmitPrototypeCategory,
  SubmitPrototypeCategoryFields,
} from "@/lib/prototype/studio-submit-flow";
import { runNonGameEditPersist } from "@/lib/studio-non-game-edit-persist";

export type NonGameEditSaveOutcome = {
  closed: boolean;
  onSavedCalled: boolean;
  updateCalled: boolean;
  duplicateIgnored: boolean;
  saveError: string | null;
  isSaving: boolean;
};

export type NonGameEditSaveSession = {
  getState: () => {
    isSaving: boolean;
    saveError: string | null;
  };
  requestSave: (
    fields: SubmitPrototypeCategoryFields,
    draft: SubmitDraftState,
  ) => Promise<NonGameEditSaveOutcome>;
};

export function createNonGameEditSaveSession(input: {
  game: Game;
  prototypeCategory: SubmitPrototypeCategory;
  playEnvironment: PlayEnvironmentFormState;
  editMode: import("@/lib/studio-non-game-edit-persist").NonGameEditPersistMode;
  update: (payload: ProjectEditFormData) => Promise<void>;
  onSaved?: () => void;
}): NonGameEditSaveSession {
  let isSaving = false;
  let saveError: string | null = null;

  return {
    getState: () => ({ isSaving, saveError }),
    async requestSave(fields, draft) {
      if (isSaving) {
        return {
          closed: false,
          onSavedCalled: false,
          updateCalled: false,
          duplicateIgnored: true,
          saveError,
          isSaving: true,
        };
      }

      isSaving = true;
      saveError = null;
      let updateCalled = false;
      let onSavedCalled = false;

      try {
        const result = await runNonGameEditPersist({
          game: input.game,
          prototypeCategory: input.prototypeCategory,
          fields,
          draft,
          playEnvironment: input.playEnvironment,
          editMode: input.editMode,
          update: async (payload) => {
            updateCalled = true;
            await input.update(payload);
          },
        });

        if (!result.ok) {
          saveError = result.message;
          return {
            closed: false,
            onSavedCalled: false,
            updateCalled: false,
            duplicateIgnored: false,
            saveError,
            isSaving: false,
          };
        }

        onSavedCalled = true;
        input.onSaved?.();
        return {
          closed: true,
          onSavedCalled,
          updateCalled,
          duplicateIgnored: false,
          saveError: null,
          isSaving: false,
        };
      } catch (error) {
        saveError = mapProjectSubmitErrorMessage(error);
        return {
          closed: false,
          onSavedCalled: false,
          updateCalled,
          duplicateIgnored: false,
          saveError,
          isSaving: false,
        };
      } finally {
        isSaving = false;
      }
    },
  };
}
