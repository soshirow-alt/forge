"use client";

import { ChevronDown } from "lucide-react";
import { FieldLabelWithHint } from "@/components/input-hint-badge";
import type { ConfirmationRequestDraft } from "@/lib/confirmation-request-draft";

const fieldInputClassName =
  "mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-zinc-100 placeholder:text-zinc-600 focus:border-orange-500/50 focus:outline-none focus:ring-1 focus:ring-orange-500/50";

type DevlogConfirmationRequestPanelProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  draft: ConfirmationRequestDraft;
  onDraftChange: (draft: ConfirmationRequestDraft) => void;
};

export function DevlogConfirmationRequestPanel({
  open,
  onOpenChange,
  draft,
  onDraftChange,
}: DevlogConfirmationRequestPanelProps) {
  function updateField<K extends keyof ConfirmationRequestDraft>(
    key: K,
    value: ConfirmationRequestDraft[K],
  ) {
    onDraftChange({ ...draft, [key]: value });
  }

  if (!open) {
    return (
      <div className="rounded-lg border border-dashed border-zinc-800 bg-zinc-950/30 p-4">
        <p className="text-sm text-zinc-500">
          プレイヤーにもう一度触ってほしい場合、何が変わったか・何を見てほしいかを書いておくと、通知やゲーム詳細で伝わりやすくなります。
        </p>
        <button
          type="button"
          onClick={() => onOpenChange(true)}
          className="mt-3 text-sm font-medium text-orange-400 transition-colors hover:text-orange-300"
        >
          確認依頼を追加（任意）
        </button>
      </div>
    );
  }

  return (
    <section
      className="space-y-4 rounded-lg border border-zinc-800 bg-zinc-950/50 p-4"
      aria-label="確認依頼（任意）"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-medium text-zinc-300">確認依頼（任意）</h2>
          <p className="mt-1 text-xs text-zinc-600">
            未入力でも開発ログ・新ver公開はできます。書いた分だけ、プレイヤーへの変化チェックが具体化されます。
          </p>
        </div>
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          className="shrink-0 text-xs text-zinc-600 transition-colors hover:text-zinc-400"
          aria-expanded="true"
        >
          閉じる
        </button>
      </div>

      <div>
        <FieldLabelWithHint
          htmlFor="confirmation-changes"
          label="今回変わったこと"
          hint={
            <>
              変更点を1〜3個だけ書くと、プレイヤーが「前回から何が変わったか」を理解しやすくなります。
              <br />
              例：ボス戦の難易度を調整 / チュートリアル説明を追加
            </>
          }
        />
        <input
          id="confirmation-changes"
          type="text"
          value={draft.changesSummary}
          onChange={(event) => updateField("changesSummary", event.target.value)}
          className={fieldInputClassName}
          placeholder="例: ボス戦の難易度を調整"
        />
      </div>

      <div>
        <FieldLabelWithHint
          htmlFor="confirmation-ask"
          label="今回見てほしいこと"
          hintLabel="プレイヤーに伝わりやすくするヒント"
          hint={
            <>
              プレイヤーに確認してほしい観点を書いておくと、FBの質が上がります。
              <br />
              例：ボス戦が前より理不尽に感じないか見てほしい
            </>
          }
        />
        <textarea
          id="confirmation-ask"
          rows={3}
          value={draft.askSummary}
          onChange={(event) => updateField("askSummary", event.target.value)}
          className={`${fieldInputClassName} resize-y`}
          placeholder="例: 5分ほど遊んで、前より納得感があるか教えてください"
        />
      </div>

      <div>
        <FieldLabelWithHint
          htmlFor="confirmation-duration"
          label="所要時間"
          hintLabel="再確認しやすくするヒント"
          hint={
            <>
              どれくらい遊べば確認できるかを書くと、プレイヤーが戻りやすくなります。
              <br />
              例：5分だけ / ステージ1だけ / 最初から10分ほど
            </>
          }
        />
        <input
          id="confirmation-duration"
          type="text"
          value={draft.estimatedDuration}
          onChange={(event) => updateField("estimatedDuration", event.target.value)}
          className={fieldInputClassName}
          placeholder="例: 5分ほど / ステージ1だけ"
        />
      </div>

      <p className="flex items-center gap-1 text-xs text-zinc-600">
        <ChevronDown className="size-3.5 shrink-0 rotate-[-90deg] opacity-60" aria-hidden="true" />
        対象者・課題紐付けは今後追加予定（Step 5 以降）
      </p>
    </section>
  );
}
