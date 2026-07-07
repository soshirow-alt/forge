"use client";

type ProjectAlreadyReleasedHelpModalProps = {
  open: boolean;
  onClose: () => void;
};

export function ProjectAlreadyReleasedHelpModal({
  open,
  onClose,
}: ProjectAlreadyReleasedHelpModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="already-released-help-title"
      onClick={onClose}
    >
      <div
        className="max-h-[min(85vh,640px)] w-full max-w-lg overflow-y-auto rounded-xl border border-zinc-700 bg-zinc-900 p-5 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <h2
          id="already-released-help-title"
          className="text-base font-semibold text-zinc-100"
        >
          Forgeでの「正式版公開済み」とは？
        </h2>
        <div className="mt-4 space-y-4 text-sm leading-relaxed text-zinc-400">
          <p>
            この作品が、開発中・テスト中の段階を越えて、作者として「完成版として公開している」状態を指します。
          </p>
          <p>
            チェックすると、Forge上ではこの作品に「完成品」バッジが表示されます。プレイヤーには、正式版として公開済みの作品として伝わります。
          </p>
          <div>
            <p className="font-medium text-zinc-300">たとえば、以下のような作品が対象です。</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Steam、itch.io、BOOTH、自サイトなどで完成版として公開済み</li>
              <li>有料販売中、または無料公開中の完成版</li>
              <li>今後も改善する可能性はあるが、作者として一度正式版と呼べる状態</li>
            </ul>
          </div>
          <div>
            <p className="font-medium text-zinc-300">一方で、以下の場合はチェックしないでください。</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>まだテストプレイ段階</li>
              <li>完成版候補だが、まだ正式版とは言い切れない</li>
              <li>プレイヤーの反応を見てから正式版にしたい</li>
            </ul>
          </div>
          <p>
            正式版後に追加改善を続けることはできます。ただし、「正式版として公開済み」という履歴は残ります。
          </p>
          <p className="text-zinc-500">
            一度保存すると、通常の編集画面では取り消せません。間違いがないか確認してから保存してください。
          </p>
        </div>
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:border-zinc-600 hover:text-zinc-100"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
}
