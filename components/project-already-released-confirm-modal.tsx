"use client";

type ProjectAlreadyReleasedConfirmModalProps = {
  open: boolean;
  busy?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export function ProjectAlreadyReleasedConfirmModal({
  open,
  busy = false,
  onCancel,
  onConfirm,
}: ProjectAlreadyReleasedConfirmModalProps) {
  if (!open) {
    return null;
  }

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
          正式版公開済みとして保存しますか？
        </h2>
        <div className="mt-3 space-y-3 text-sm leading-relaxed text-zinc-400">
          <p>この作品はForge上で「完成品」として表示されます。</p>
          <p>
            正式版後に追加改善を続けることはできますが、「正式版として公開済み」という履歴は残ります。
          </p>
          <p className="text-zinc-500">
            一度保存すると、通常の編集画面では取り消せません。
          </p>
        </div>
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
            disabled={busy}
            className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-500 disabled:opacity-60"
          >
            {busy ? "保存中…" : "正式版公開済みとして保存"}
          </button>
        </div>
      </div>
    </div>
  );
}
