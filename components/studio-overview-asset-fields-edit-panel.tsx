"use client";

import { useEffect, useState } from "react";
import { StudioSubmitAssetAttributesEditPanel } from "@/components/studio-submit-edit-panels";
import type { StudioOverviewEditPanelCommonProps } from "@/components/studio-overview-edit-panel-types";
import { useGames } from "@/components/games-provider";
import {
  decodeCategoryAttributesToAssetFields,
  type SubmitAssetCategoryFields,
} from "@/lib/studio-non-game-attributes";
import { buildAssetEditPersistPayload } from "@/lib/studio-asset-edit-persist";
import { mapProjectSubmitErrorMessage } from "@/lib/error-message";

/**
 * Asset structured attributes (kinds / formats / tastes / tools) overview edit.
 * Reuses the submit-time asset panel — the only difference is hydrate-from-game
 * + persist-via-updateProjectDetails instead of local draft state.
 */
export function StudioOverviewAssetFieldsEditPanel({
  projectId,
  onCancel,
  onSaved,
}: StudioOverviewEditPanelCommonProps) {
  const { getOwnedProjectById, updateProjectDetails, dataReady } = useGames();
  const game = getOwnedProjectById(projectId);

  const [fields, setFields] = useState<SubmitAssetCategoryFields | null>(null);
  const [formLoaded, setFormLoaded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (!game || formLoaded) {
      return;
    }
    const decoded = decodeCategoryAttributesToAssetFields(
      game.categoryAttributes,
      game.assetKinds,
    );
    queueMicrotask(() => {
      setFields(decoded);
      setFormLoaded(true);
    });
  }, [game, formLoaded]);

  if (!dataReady || !game || !fields) {
    return <p className="px-1 text-sm text-zinc-500">読み込み中…</p>;
  }

  return (
    <div className="space-y-2">
      <StudioSubmitAssetAttributesEditPanel
        fields={fields}
        isSaving={isSaving}
        deferClose
        onCancel={onCancel}
        onFieldsChange={(next) => {
          setFields(next);
          setSaveError(null);
          const built = buildAssetEditPersistPayload({ game, fields: next });
          if (!built.ok) {
            setSaveError(built.message);
            return;
          }
          setIsSaving(true);
          void updateProjectDetails(projectId, built.payload)
            .then(() => {
              onSaved?.();
            })
            .catch((error: unknown) => {
              setSaveError(mapProjectSubmitErrorMessage(error));
            })
            .finally(() => setIsSaving(false));
        }}
      />
      {saveError ? <p className="text-xs text-rose-400">{saveError}</p> : null}
    </div>
  );
}
