"use client";

import { useEffect, useState } from "react";

type ProjectAlreadyReleasedConfirmModalProps = {
  open: boolean;
  busy?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  requireAcknowledgement?: boolean;
  confirmLabel?: string;
};

export function ProjectAlreadyReleasedConfirmModal({
  open,
  busy = false,
  onCancel,
  onConfirm,
  requireAcknowledgement = true,
  confirmLabel = "設定する",
}: ProjectAlreadyReleasedConfirmModalProps) {
  const [understood, setUnderstood] = useState(false);

  useEffect(() => {
    if (open) {
      setUnderstood(false);
    }
  }, [open]);

  if (!open) {
    return null;
  }

  const canConfirm = !requireAcknowledgement || understood;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="already-released-confirm-title"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-md rounded-xl border border-zinc-700 bg-zinc-900 p-5 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <h2
          id="already-released-confirm-title"
          className="text-base font-semibold text-zinc-100"
        >
          完成品として扱います
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-zinc-400">
          この作品を、開発中ではなく「完成品」として表示します。
        </p>
        <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-zinc-400">
          <li>作品カードや作品ページに「完成品」と表示されます</li>
          <li>プレイヤーに完成版として受け取られます</li>
          <li>開発中の作品に設定すると期待値がずれます</li>
          <li>通常の編集画面では元に戻せません</li>
          <li>将来、見届け人やSpecial Thanksなどの判定に使う可能性があります</li>
        </ul>

        {requireAcknowledgement ? (
          <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-lg border border-zinc-800 bg-zinc-950/50 px-3 py-3">
            <input
              type="checkbox"
              checked={understood}
              onChange={(event) => setUnderstood(event.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-zinc-600 bg-zinc-900 text-zinc-300 focus:ring-zinc-500/40"
            />
            <span className="text-sm text-zinc-300">上記を理解しました</span>
          </label>
        ) : null}

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="rounded-lg border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:border-zinc-600 hover:text-zinc-100 disabled:opacity-60"
          >
            キャンセル
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy || !canConfirm}
            className="rounded-lg border border-zinc-600 bg-zinc-800 px-4 py-2 text-sm font-semibold text-zinc-100 transition-colors hover:border-zinc-500 hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? "処理中…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
