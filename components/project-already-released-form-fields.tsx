"use client";

import { useState } from "react";
import { ProjectAlreadyReleasedConfirmModal } from "@/components/project-already-released-confirm-modal";
import { ProjectAlreadyReleasedHelpModal } from "@/components/project-already-released-help-modal";

type ProjectAlreadyReleasedFormFieldsProps = {
  scheduled: boolean;
  readOnlyReleased?: boolean;
  onSchedule: () => void;
  onCancelSchedule: () => void;
};

const actionButtonClassName =
  "inline-flex w-full items-center justify-center rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2.5 text-sm font-semibold text-amber-100 transition-colors hover:border-amber-500/55 hover:bg-amber-500/15";

const cancelScheduleButtonClassName =
  "inline-flex w-full items-center justify-center rounded-lg border border-zinc-700 px-3 py-2 text-sm font-medium text-zinc-300 transition-colors hover:border-zinc-600 hover:text-zinc-100";

export function ProjectAlreadyReleasedFormFields({
  scheduled,
  readOnlyReleased = false,
  onSchedule,
  onCancelSchedule,
}: ProjectAlreadyReleasedFormFieldsProps) {
  const [helpOpen, setHelpOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  if (readOnlyReleased) {
    return (
      <div className="rounded-lg border border-amber-500/25 bg-amber-500/5 px-3 py-3">
        <p className="text-sm font-medium text-amber-100">正式版公開済みとして表示中</p>
        <p className="mt-1.5 text-xs leading-relaxed text-zinc-500">
          この作品はForge上で「完成品」として表示されています。通常の編集画面では取り消せません。
          正式版後も、説明文・プレイURL・開発フェーズなどは更新できます。
        </p>
      </div>
    );
  }

  if (scheduled) {
    return (
      <div className="space-y-3 rounded-lg border border-amber-500/30 bg-amber-500/8 px-3 py-3">
        <p className="text-sm font-medium text-amber-100">正式版公開済みとして設定予定</p>
        <p className="text-xs leading-relaxed text-zinc-500">
          保存すると、この作品はForge上で「完成品」として表示されます。この設定は、保存前であれば取り消せます。
        </p>
        <button type="button" onClick={onCancelSchedule} className={cancelScheduleButtonClassName}>
          設定予定を取り消す
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-3">
        <p className="text-sm font-medium text-amber-100">正式版公開済みにする</p>
        <p className="text-xs leading-relaxed text-zinc-500">
          Steam・itch.io・BOOTH・自サイトなどで、すでに完成版として公開済みの作品だけ設定してください。
          設定するとForge上で「完成品」として表示され、通常の編集画面では取り消せません。
        </p>
        <button type="button" onClick={() => setConfirmOpen(true)} className={actionButtonClassName}>
          正式版公開済みに設定する
        </button>
        <button
          type="button"
          onClick={() => setHelpOpen(true)}
          className="text-xs text-violet-400 transition-colors hover:text-violet-300"
        >
          正式版公開済みとは？
        </button>
      </div>

      <ProjectAlreadyReleasedConfirmModal
        open={confirmOpen}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => {
          setConfirmOpen(false);
          onSchedule();
        }}
      />

      <ProjectAlreadyReleasedHelpModal open={helpOpen} onClose={() => setHelpOpen(false)} />
    </>
  );
}
