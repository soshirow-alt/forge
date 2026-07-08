"use client";

import { useEffect, useState } from "react";
import { ProjectAlreadyReleasedConfirmModal } from "@/components/project-already-released-confirm-modal";

type ProjectAlreadyReleasedFormFieldsProps = {
  scheduled: boolean;
  readOnlyReleased?: boolean;
  onSchedule: () => void;
  onCancelSchedule: () => void;
};

const mutedActionButtonClassName =
  "inline-flex w-full items-center justify-center rounded-lg border border-zinc-700/80 bg-transparent px-3 py-2 text-sm font-medium text-zinc-300 transition-colors hover:border-zinc-600 hover:bg-zinc-900/60 hover:text-zinc-100";

const cancelScheduleButtonClassName =
  "inline-flex w-full items-center justify-center rounded-lg border border-zinc-700 px-3 py-2 text-sm font-medium text-zinc-300 transition-colors hover:border-zinc-600 hover:text-zinc-100";

export function ProjectAlreadyReleasedFormFields({
  scheduled,
  readOnlyReleased = false,
  onSchedule,
  onCancelSchedule,
}: ProjectAlreadyReleasedFormFieldsProps) {
  const [expanded, setExpanded] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  if (readOnlyReleased) {
    return (
      <div className="rounded-lg border border-zinc-800 bg-zinc-950/40 px-3 py-3">
        <p className="text-sm font-medium text-zinc-300">正式版公開済みとして表示中</p>
        <p className="mt-1.5 text-xs leading-relaxed text-zinc-500">
          Forge上で「完成品」として表示されています。通常の編集画面では元に戻せません。
          説明文・プレイURL・開発フェーズなどは更新できます。
        </p>
      </div>
    );
  }

  if (scheduled) {
    return (
      <div className="space-y-3 rounded-lg border border-zinc-700/80 bg-zinc-950/40 px-3 py-3">
        <p className="text-sm font-medium text-zinc-300">正式版公開済みとして設定予定</p>
        <p className="text-xs leading-relaxed text-zinc-500">
          保存すると、この作品はForge上で「完成品」として表示されます。保存前であれば取り消せます。
        </p>
        <button type="button" onClick={onCancelSchedule} className={cancelScheduleButtonClassName}>
          設定予定を取り消す
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-lg border border-zinc-800/80 bg-zinc-950/30 px-3 py-2.5">
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="flex w-full items-start gap-2 text-left"
          aria-expanded={expanded}
        >
          <span className="mt-0.5 text-xs text-zinc-500" aria-hidden="true">
            {expanded ? "−" : "＋"}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm text-zinc-400">正式版公開済みにする（任意）</span>
            {!expanded ? (
              <span className="mt-1 block text-xs leading-relaxed text-zinc-600">
                Steamなどで、すでに完成版として公開済みの作品向けです。
              </span>
            ) : null}
          </span>
        </button>

        {expanded ? (
          <div className="mt-3 space-y-3 border-t border-zinc-800/80 pt-3">
            <p className="text-sm font-medium text-zinc-300">正式版公開済みにする</p>
            <p className="text-xs leading-relaxed text-zinc-500">
              完成版として公開済みの作品だけ設定してください。設定すると、Forge上で開発中作品ではなく「完成品」として扱われます。
            </p>
            <button
              type="button"
              onClick={() => setConfirmOpen(true)}
              className={mutedActionButtonClassName}
            >
              正式版公開済みに設定する
            </button>
          </div>
        ) : null}
      </div>

      <ProjectAlreadyReleasedConfirmModal
        open={confirmOpen}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => {
          setConfirmOpen(false);
          onSchedule();
        }}
      />
    </>
  );
}
