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
        <p className="text-sm font-medium text-zinc-300">正式版公開済み</p>
        <p className="mt-1 text-xs text-zinc-500">完成品として表示中です。</p>
      </div>
    );
  }

  if (scheduled) {
    return (
      <div className="space-y-3 rounded-lg border border-zinc-700/80 bg-zinc-950/40 px-3 py-3">
        <p className="text-sm font-medium text-zinc-300">正式版公開済み（設定予定）</p>
        <p className="text-xs text-zinc-500">保存前であれば取り消せます。</p>
        <button type="button" onClick={onCancelSchedule} className={cancelScheduleButtonClassName}>
          取り消す
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
            <span className="block text-sm text-zinc-400">正式版公開済み（任意）</span>
          </span>
        </button>

        {expanded ? (
          <div className="mt-3 space-y-3 border-t border-zinc-800/80 pt-3">
            <p className="text-sm font-medium text-zinc-300">正式版公開済み</p>
            <p className="text-xs text-zinc-500">完成品として扱う設定です。</p>
            <button
              type="button"
              onClick={() => setConfirmOpen(true)}
              className={mutedActionButtonClassName}
            >
              設定する
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
