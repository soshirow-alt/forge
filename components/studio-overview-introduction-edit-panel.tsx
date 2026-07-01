"use client";

import { useMemo, useRef, useState } from "react";
import {
  GameDetailOverviewV0Tab,
  type GameOverviewEditorHandle,
} from "@/components/game-detail-overview-v0-tab";
import { useGames } from "@/components/games-provider";
import {
  normalizeOverviewIntroduction,
  resolveEditableIntroduction,
} from "@/lib/project-overview";
import { PROJECT_INTRO_HINT } from "@/lib/project-form-copy";
import { gameToDetailV0 } from "@/lib/submitted-game-v0-adapter";

const cancelButtonClassName =
  "inline-flex flex-1 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-900/60 px-3 py-2 text-sm font-medium text-zinc-300 transition-colors hover:border-zinc-600 hover:bg-zinc-800/80 hover:text-zinc-100 disabled:cursor-not-allowed disabled:opacity-50";

const saveButtonClassName =
  "inline-flex flex-1 items-center justify-center rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 px-3 py-2 text-sm font-semibold text-zinc-950 shadow-sm shadow-orange-500/20 transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50";

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
      const message =
        error instanceof Error
          ? error.message
          : "保存に失敗しました。時間をおいて再度お試しください。";
      setSaveError(message);
    } finally {
      setIsSaving(false);
    }
  }

  if (!dataReady || !game || !overviewDisplayGame) {
    return <p className="text-sm text-zinc-500">読み込み中…</p>;
  }

  return (
    <section
      aria-label="作品紹介を編集"
      className="rounded-xl border border-zinc-800/80 bg-zinc-900/35 p-4"
    >
      <button
        type="button"
        onClick={onCancel}
        disabled={isSaving}
        className="text-xs font-medium text-zinc-500 transition-colors hover:text-zinc-300 disabled:cursor-not-allowed disabled:opacity-50"
      >
        ← 公開ページを編集
      </button>

      <h3 className="mt-3 text-sm font-semibold text-zinc-200">作品紹介を編集</h3>
      <p className="mt-1 text-xs leading-relaxed text-zinc-600">{PROJECT_INTRO_HINT}</p>

      {validationError ? (
        <p
          role="alert"
          className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-200"
        >
          {validationError}
        </p>
      ) : null}

      {saveError ? (
        <p
          role="alert"
          className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-200"
        >
          {saveError}
        </p>
      ) : null}

      <div className="mt-4">
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

      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSaving}
          className={cancelButtonClassName}
        >
          キャンセル
        </button>
        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={isSaving}
          className={saveButtonClassName}
        >
          {isSaving ? "保存中…" : "保存"}
        </button>
      </div>
    </section>
  );
}
