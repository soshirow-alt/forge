"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  StudioSubmitPrototypeClassificationEditPanel,
  StudioSubmitPrototypePublicationEditPanel,
  StudioSubmitPrototypeUsageEditPanel,
} from "@/components/studio-submit-edit-panels";
import type { StudioOverviewEditPanelCommonProps } from "@/components/studio-overview-edit-panel-types";
import { useGames } from "@/components/games-provider";
import { createEmptySubmitDraft, type SubmitDraftState } from "@/lib/studio-submit-draft";
import { buildProjectEditFormDataFromGame } from "@/lib/project-edit-form-data";
import {
  decodeCategoryAttributesToPrototypeFields,
  projectCategoryToPrototypeCategory,
} from "@/lib/studio-non-game-attributes";
import {
  pickFeatureTagsFromGameTags,
  sanitizeFeatureTagsForSave,
} from "@/lib/forge-feature-tag-options";
import {
  getPublicGameTags,
  parsePlayEnvironmentFromTags,
} from "@/lib/play-environment";
import type { Game } from "@/lib/mock-games";
import type { SubmitPrototypeCategoryFields } from "@/lib/prototype/studio-submit-flow";
import { createNonGameEditSaveSession } from "@/lib/studio-non-game-edit-save-session";

export type NonGameOverviewEditMode =
  | "genres-tags"
  | "play-info"
  | "publication";

export type StudioOverviewNonGameFieldsEditPanelProps =
  StudioOverviewEditPanelCommonProps & {
    mode: NonGameOverviewEditMode;
  };

type SeedState = {
  fields: SubmitPrototypeCategoryFields;
  draft: SubmitDraftState;
};

function buildInitialDraft(game: Game): SeedState {
  const decoded = decodeCategoryAttributesToPrototypeFields(
    game.categoryAttributes,
  );
  const base = buildProjectEditFormDataFromGame(game);
  const featureTags = sanitizeFeatureTagsForSave(
    pickFeatureTagsFromGameTags(getPublicGameTags(game.tags ?? [])),
  );
  return {
    fields: decoded,
    draft: {
      ...createEmptySubmitDraft(),
      featureTags,
      visibility: base.visibility,
      relatedLinks: base.relatedLinks ?? [],
      publishDestinations: base.publishDestinations ?? [],
    },
  };
}

export function StudioOverviewNonGameFieldsEditPanel({
  projectId,
  mode,
  onCancel,
  onSaved,
}: StudioOverviewNonGameFieldsEditPanelProps) {
  const { getOwnedProjectById, updateProjectDetails, dataReady } = useGames();
  const game = getOwnedProjectById(projectId);
  const prototypeCategory = projectCategoryToPrototypeCategory(game?.category);

  const [fields, setFields] = useState<SubmitPrototypeCategoryFields | null>(
    null,
  );
  const [draft, setDraft] = useState<SubmitDraftState | null>(null);
  const [formLoaded, setFormLoaded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const pendingRef = useRef<SeedState | null>(null);

  useEffect(() => {
    if (!game || formLoaded) {
      return;
    }
    const seed = buildInitialDraft(game);
    queueMicrotask(() => {
      setFields(seed.fields);
      setDraft(seed.draft);
      pendingRef.current = seed;
      setFormLoaded(true);
    });
  }, [game, formLoaded]);

  const playEnvironment = useMemo(
    () => parsePlayEnvironmentFromTags(game?.tags ?? []),
    [game?.tags],
  );

  const saveSession = useMemo(() => {
    if (!game || !prototypeCategory) return null;
    return createNonGameEditSaveSession({
      game,
      prototypeCategory,
      playEnvironment,
      editMode: mode,
      update: (payload) => updateProjectDetails(projectId, payload),
      onSaved,
    });
  }, [
    game,
    mode,
    onSaved,
    playEnvironment,
    projectId,
    prototypeCategory,
    updateProjectDetails,
  ]);

  async function persistAndClose(
    nextFields: SubmitPrototypeCategoryFields,
    nextDraft: SubmitDraftState,
  ) {
    if (!saveSession || isSaving) return;
    setSaveError(null);
    setIsSaving(true);
    try {
      const outcome = await saveSession.requestSave(nextFields, nextDraft);
      setSaveError(outcome.saveError);
      // close only via onSaved inside session on success — never onCancel here
    } finally {
      setIsSaving(false);
    }
  }

  function applyFieldsPatch(patch: Partial<SubmitPrototypeCategoryFields>) {
    if (!fields || !draft) return null;
    const current = pendingRef.current ?? { fields, draft };
    const nextFields = { ...current.fields, ...patch };
    const next = { fields: nextFields, draft: current.draft };
    pendingRef.current = next;
    setFields(nextFields);
    return next;
  }

  function applyDraftPatch(patch: Partial<SubmitDraftState>) {
    if (!fields || !draft) return null;
    const current = pendingRef.current ?? { fields, draft };
    const nextDraft = { ...current.draft, ...patch };
    const next = { fields: current.fields, draft: nextDraft };
    pendingRef.current = next;
    setDraft(nextDraft);
    return next;
  }

  if (!dataReady || !game || !prototypeCategory || !fields || !draft) {
    return <p className="px-1 text-sm text-zinc-500">読み込み中…</p>;
  }

  if (mode === "genres-tags") {
    return (
      <div className="space-y-2">
        <StudioSubmitPrototypeClassificationEditPanel
          category={prototypeCategory}
          fields={fields}
          draft={draft}
          deferClose
          isSaving={isSaving}
          onFieldsChange={(patch) => {
            applyFieldsPatch(patch);
          }}
          onDraftChange={(patch) => {
            const next = applyDraftPatch(patch);
            if (next) void persistAndClose(next.fields, next.draft);
          }}
          onCancel={onCancel}
        />
        {saveError ? (
          <p className="text-xs text-rose-400">{saveError}</p>
        ) : null}
      </div>
    );
  }

  if (mode === "play-info") {
    return (
      <div className="space-y-2">
        <StudioSubmitPrototypeUsageEditPanel
          category={prototypeCategory}
          fields={fields}
          deferClose
          isSaving={isSaving}
          onChange={(patch) => {
            const next = applyFieldsPatch(patch);
            if (next) void persistAndClose(next.fields, next.draft);
          }}
          onCancel={onCancel}
        />
        {saveError ? (
          <p className="text-xs text-rose-400">{saveError}</p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <StudioSubmitPrototypePublicationEditPanel
        category={prototypeCategory}
        draft={draft}
        fields={fields}
        deferClose
        isSaving={isSaving}
        onFieldsChange={(patch) => {
          applyFieldsPatch(patch);
        }}
        onDraftChange={(patch) => {
          const next = applyDraftPatch(patch);
          if (next) void persistAndClose(next.fields, next.draft);
        }}
        onCancel={onCancel}
      />
      {saveError ? (
        <p className="text-xs text-rose-400">{saveError}</p>
      ) : null}
    </div>
  );
}
