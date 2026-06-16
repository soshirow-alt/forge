"use client";

import { useEffect, useId, useState } from "react";
import {
  isModifyGameModalDismissed,
  setModifyGameModalDismissed,
} from "@/lib/nurture-persistence/modify-game-modal-local";

type ModifyGameExplanationModalProps = {
  open: boolean;
  onClose: () => void;
};

export function ModifyGameExplanationModal({
  open,
  onClose,
}: ModifyGameExplanationModalProps) {
  const checkboxId = useId();
  const [skipNextTime, setSkipNextTime] = useState(false);

  useEffect(() => {
    if (!open) {
      setSkipNextTime(false);
    }
  }, [open]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-950/80 px-4"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modify-game-modal-title"
        className="w-full max-w-md rounded-xl border border-zinc-800 bg-zinc-900 p-6 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <h2
          id="modify-game-modal-title"
          className="text-lg font-semibold tracking-tight text-zinc-100"
        >
          ゲームを修正する
        </h2>
        <div className="mt-4 space-y-3 text-sm leading-relaxed text-zinc-400">
          <p>Forgeではゲーム自体の修正はできません。</p>
          <p>
            プレイヤーの回答を参考に、あなたの開発環境でゲームを修正してください。
          </p>
          <p>
            修正が終わったらForgeに戻り、変更内容を記録して新版を公開しましょう。
          </p>
        </div>

        <label
          htmlFor={checkboxId}
          className="mt-5 flex cursor-pointer items-center gap-2 text-sm text-zinc-500"
        >
          <input
            id={checkboxId}
            type="checkbox"
            checked={skipNextTime}
            onChange={(event) => setSkipNextTime(event.target.checked)}
            className="rounded border-zinc-700 bg-zinc-950 text-orange-500 focus:ring-orange-500/40"
          />
          次回から表示しない
        </label>

        <button
          type="button"
          onClick={() => {
            if (skipNextTime) {
              setModifyGameModalDismissed(true);
            }
            onClose();
          }}
          className="mt-6 w-full rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-3 text-sm font-semibold text-zinc-950 transition-opacity hover:opacity-90"
        >
          わかった
        </button>
      </div>
    </div>
  );
}

export function shouldShowModifyGameModal(): boolean {
  return !isModifyGameModalDismissed();
}
