"use client";

import { ChevronDown } from "lucide-react";
import { FieldLabelWithHint } from "@/components/input-hint-badge";
import {
  CONFIRMATION_NOTIFY_AUDIENCE_OPTIONS,
  type ConfirmationNotifyAudienceKey,
} from "@/lib/confirmation-request-audience";
import type {
  ConfirmationRequestDraft,
  LinkedPriorityRef,
} from "@/lib/confirmation-request-draft";
import type { TopPriority } from "@/lib/top-priorities";

const fieldInputClassName =
  "mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-zinc-100 placeholder:text-zinc-600 focus:border-orange-500/50 focus:outline-none focus:ring-1 focus:ring-orange-500/50";

type DevlogConfirmationRequestPanelProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  draft: ConfirmationRequestDraft;
  onDraftChange: (draft: ConfirmationRequestDraft) => void;
  topPriorities?: TopPriority[];
  prioritiesLoaded?: boolean;
};

function togglePriority(
  current: LinkedPriorityRef[],
  priority: TopPriority,
): LinkedPriorityRef[] {
  const exists = current.some((item) => item.id === priority.id);
  if (exists) {
    return current.filter((item) => item.id !== priority.id);
  }

  if (current.length >= 3) {
    return current;
  }

  return [...current, { id: priority.id, title: priority.title }];
}

function toggleAudience(
  current: ConfirmationNotifyAudienceKey[],
  key: ConfirmationNotifyAudienceKey,
): ConfirmationNotifyAudienceKey[] {
  if (key === "all") {
    return current.includes("all") ? [] : ["all"];
  }

  const withoutAll = current.filter((item) => item !== "all");
  if (withoutAll.includes(key)) {
    return withoutAll.filter((item) => item !== key);
  }

  return [...withoutAll, key];
}

export function DevlogConfirmationRequestPanel({
  open,
  onOpenChange,
  draft,
  onDraftChange,
  topPriorities = [],
  prioritiesLoaded = true,
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

  const actionablePriorities = topPriorities.filter(
    (item) => item.category !== "action",
  );

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

      <div id="confirmation-priorities">
        <FieldLabelWithHint
          htmlFor="confirmation-priorities"
          label="対応した課題（任意）"
          hintLabel="Studioの次に直すこと"
          hint={
            <>
              Studio に表示されている課題と紐付けると、プレイヤーに「あのFBへの対応だ」と伝わりやすくなります。
              <br />
              最大3件まで選べます。
            </>
          }
        />
        {!prioritiesLoaded ? (
          <p className="mt-2 text-xs text-zinc-600">課題を読み込み中…</p>
        ) : actionablePriorities.length === 0 ? (
          <p className="mt-2 text-xs text-zinc-600">
            まだ紐付けできる課題がありません。FBが届くとここに表示されます。
          </p>
        ) : (
          <ul className="mt-2 space-y-2">
            {actionablePriorities.map((priority) => {
              const checked = draft.linkedPriorities.some(
                (item) => item.id === priority.id,
              );
              return (
                <li key={priority.id}>
                  <label className="flex cursor-pointer items-start gap-2 rounded-lg border border-zinc-800 bg-zinc-950/40 px-3 py-2.5 transition-colors hover:border-zinc-700">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() =>
                        updateField(
                          "linkedPriorities",
                          togglePriority(draft.linkedPriorities, priority),
                        )
                      }
                      className="mt-0.5 h-4 w-4 shrink-0 rounded border-zinc-600 bg-zinc-900 text-orange-500 focus:ring-orange-500/50"
                    />
                    <span className="min-w-0">
                      <span className="block text-sm text-zinc-200">{priority.title}</span>
                      <span className="mt-0.5 block text-xs text-zinc-500">
                        {priority.reason}
                      </span>
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div id="confirmation-audience">
        <FieldLabelWithHint
          htmlFor="confirmation-audience"
          label="誰に届けるか（任意）"
          hintLabel="対象者"
          hint={
            <>
              未選択のときは「前verを遊んだ人」と「更新を追っている人」に届きます。
              <br />
              「関連FBを送った人」は、上で選んだ課題に関係する人を優先します。
            </>
          }
        />
        <ul className="mt-2 flex flex-wrap gap-2">
          {CONFIRMATION_NOTIFY_AUDIENCE_OPTIONS.map((option) => {
            const checked = draft.notifyAudience.includes(option.key);
            return (
              <li key={option.key}>
                <button
                  type="button"
                  title={option.description}
                  onClick={() =>
                    updateField(
                      "notifyAudience",
                      toggleAudience(draft.notifyAudience, option.key),
                    )
                  }
                  className={
                    checked
                      ? "rounded-full border border-orange-500/40 bg-orange-500/10 px-3 py-1.5 text-xs font-medium text-orange-200"
                      : "rounded-full border border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-400 transition-colors hover:border-zinc-600 hover:text-zinc-300"
                  }
                >
                  {option.label}
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-zinc-800 bg-zinc-950/40 px-3 py-2.5">
        <input
          type="checkbox"
          checked={draft.notifyEnabled}
          onChange={(event) => updateField("notifyEnabled", event.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 rounded border-zinc-600 bg-zinc-900 text-orange-500 focus:ring-orange-500/50"
        />
        <span>
          <span className="block text-sm text-zinc-300">通知する</span>
          <span className="mt-0.5 block text-xs text-zinc-600">
            オフにすると履歴・ゲーム詳細・マイページには残り、プッシュ通知だけ送りません。
          </span>
        </span>
      </label>

      <p className="flex items-center gap-1 text-xs text-zinc-600">
        <ChevronDown className="size-3.5 shrink-0 rotate-[-90deg] opacity-60" aria-hidden="true" />
        すべて任意です。空でも公開できます。
      </p>
    </section>
  );
}
