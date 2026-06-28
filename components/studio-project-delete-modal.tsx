"use client";

import { useState } from "react";
import { V0SimpleModal } from "@/components/v0-simple-modal";

export type PendingProjectDelete = {
  id: string;
  title: string;
};

export function useStudioProjectDeleteModal(
  deleteSubmittedGame: (id: string) => Promise<void>,
) {
  const [pendingDelete, setPendingDelete] = useState<PendingProjectDelete | null>(
    null,
  );
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  function requestDelete(project: PendingProjectDelete) {
    setDeleteError(null);
    setPendingDelete(project);
  }

  async function confirmDelete() {
    if (!pendingDelete) {
      return;
    }

    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteSubmittedGame(pendingDelete.id);
      setPendingDelete(null);
    } catch {
      setDeleteError("削除に失敗しました。時間をおいて再度お試しください。");
    } finally {
      setDeleting(false);
    }
  }

  const modal =
    pendingDelete ? (
      <V0SimpleModal
        title="作品を削除"
        onClose={() => {
          if (!deleting) {
            setPendingDelete(null);
            setDeleteError(null);
          }
        }}
      >
        <p className="text-sm leading-relaxed text-zinc-300">
          「{pendingDelete.title}」を削除します。devlog やフィードバックなど、関連データも削除されます。
          この操作は取り消せません。
        </p>
        {deleteError ? (
          <p className="mt-3 text-sm text-red-400" role="alert">
            {deleteError}
          </p>
        ) : null}
        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <button
            type="button"
            disabled={deleting}
            onClick={() => {
              setPendingDelete(null);
              setDeleteError(null);
            }}
            className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-300 transition-colors hover:border-zinc-600 disabled:opacity-50"
          >
            キャンセル
          </button>
          <button
            type="button"
            disabled={deleting}
            onClick={() => void confirmDelete()}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-500 disabled:opacity-50"
          >
            {deleting ? "削除中…" : "削除する"}
          </button>
        </div>
      </V0SimpleModal>
    ) : null;

  return { requestDelete, modal };
}
