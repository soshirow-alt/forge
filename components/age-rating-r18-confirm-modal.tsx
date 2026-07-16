"use client";

import { V0SimpleModal } from "@/components/v0-simple-modal";

type AgeRatingR18ConfirmModalProps = {
  onCancel: () => void;
  onConfirm: () => void;
};

export function AgeRatingR18ConfirmModal({
  onCancel,
  onConfirm,
}: AgeRatingR18ConfirmModalProps) {
  return (
    <V0SimpleModal title="R18作品として設定しますか？" onClose={onCancel}>
      <p className="text-sm leading-relaxed text-zinc-300">
        この作品を開く際、プレイヤーに18歳以上であることを確認します。
      </p>
      <p className="mt-3 text-sm leading-relaxed text-zinc-400">
        また、ホーム・検索結果・SNS共有など、年齢確認前にも表示されるサムネイルには、一般閲覧に適さない露骨な画像を使用できません。
      </p>
      <div className="mt-6 flex flex-wrap justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-zinc-700 px-3 py-2 text-sm text-zinc-300 hover:border-zinc-600 hover:text-zinc-100"
        >
          キャンセル
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="rounded-lg bg-violet-600 px-3 py-2 text-sm font-semibold text-white hover:bg-violet-500"
        >
          理解して設定する
        </button>
      </div>
    </V0SimpleModal>
  );
}
