"use client";

import { useMemo, useRef, useState } from "react";
import {
  GameDetailOverviewV0Tab,
  type GameOverviewEditorHandle,
} from "@/components/game-detail-overview-v0-tab";
import { StudioPanelEditShell } from "@/components/studio-panel-edit-shell";
import { useGames } from "@/components/games-provider";
import {
  normalizeOverviewIntroduction,
  resolveEditableIntroduction,
} from "@/lib/project-overview";
import { PROJECT_INTRO_HINT } from "@/lib/project-form-copy";
import { gameToDetailV0 } from "@/lib/submitted-game-v0-adapter";

export type StudioOverviewIntroductionEditPanelProps = {
  projectId: string;
  onCancel: () => void;
  onSaved?: () => void;
};

export function StudioOverviewIntroductionEditPanel({
  projectId,
  onCancel,
  onSaved,
}: StudioOverviewIntroductionEditPanelProps) {
  const overviewEditorRef = useRef<GameOverviewEditorHandle>(null);
  const { getSubmittedGameById, updateProjectOverview, dataReady } = useGames();
  const game = getSubmittedGameById(projectId);

  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const editIntroduction = game
    ? resolveEditableIntroduction(game.overviewIntroduction, game.description)
    : "";

  const overviewDisplayGame = useMemo(
    () => (game ? gameToDetailV0(game) : null),
    [game],
  );

  async function handleSave() {
    if (!game) {
      return;
    }

    setSaveError(null);
    setValidationError(null);

    const overviewResult = overviewEditorRef.current?.validateAndGetPayload();
    if (!overviewResult?.ok) {
      setValidationError(
        overviewResult?.error ?? "作品紹介を入力してください。",
      );
      return;
    }

    setIsSaving(true);
    try {
      await updateProjectOverview(projectId, {
        overviewIntroduction: normalizeOverviewIntroduction(
          overviewResult.payload.introduction,
        ),
        overviewFeatures: game.overviewFeatures ?? null,
      });
      onSaved?.();
    } catch (error) {
      setSaveError(
        error instanceof Error
          ? error.message
          : "保存に失敗しました。時間をおいて再度お試しください。",
      );
    } finally {
      setIsSaving(false);
    }
  }

  if (!dataReady || !game || !overviewDisplayGame) {
    return <p className="text-sm text-zinc-500">読み込み中…</p>;
  }

  return (
    <StudioPanelEditShell
      title="作品紹介を編集"
      onCancel={onCancel}
      onSave={() => void handleSave()}
      isSaving={isSaving}
      saveError={saveError}
      validationError={validationError}
    >
      <p className="text-xs leading-relaxed text-zinc-600">{PROJECT_INTRO_HINT}</p>
      <div>
        <p className="text-xs font-medium text-zinc-500">作品紹介</p>
        <GameDetailOverviewV0Tab
          ref={overviewEditorRef}
          key={`${projectId}-${editIntroduction}`}
          game={overviewDisplayGame}
          editable
          embeddedInForm
          hideVersionQuestions
          hideFeatures
          compactIntroduction
          editIntroduction={editIntroduction}
        />
      </div>
    </StudioPanelEditShell>
  );
}
