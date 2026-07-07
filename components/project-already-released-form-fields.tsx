"use client";

import { useState } from "react";
import { ProjectAlreadyReleasedHelpModal } from "@/components/project-already-released-help-modal";

type ProjectAlreadyReleasedFormFieldsProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  readOnlyReleased?: boolean;
  inputId?: string;
};

export function ProjectAlreadyReleasedFormFields({
  checked,
  onChange,
  readOnlyReleased = false,
  inputId = "declare-already-released",
}: ProjectAlreadyReleasedFormFieldsProps) {
  const [helpOpen, setHelpOpen] = useState(false);

  if (readOnlyReleased) {
    return (
      <div className="rounded-lg border border-amber-500/25 bg-amber-500/5 px-3 py-3">
        <p className="text-sm font-medium text-amber-100">
          正式版公開済みとして表示中
        </p>
        <p className="mt-1.5 text-xs leading-relaxed text-zinc-500">
          この状態は通常の編集画面では取り消せません。正式版後も、開発フェーズや説明文、プレイURLなどは更新できます。
        </p>
      </div>
    );
  }

  return (
    <>
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-zinc-400">正式版公開済み</legend>
        <label
          htmlFor={inputId}
          className={`flex cursor-pointer gap-3 rounded-lg border px-3 py-3 transition-colors ${
            checked
              ? "border-amber-500/35 bg-amber-500/5"
              : "border-zinc-800 bg-zinc-950/50"
          }`}
        >
          <input
            id={inputId}
            type="checkbox"
            checked={checked}
            onChange={(event) => onChange(event.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 rounded border-zinc-600 bg-zinc-900 text-amber-500 focus:ring-amber-500/50"
          />
          <span>
            <span className="block text-sm font-medium text-zinc-300">
              すでに正式版として公開済み
            </span>
            <span className="mt-1 block text-xs leading-relaxed text-zinc-600">
              Steam・itch.io・BOOTH・自サイトなどで、すでに完成版として公開している作品にチェックしてください。
              一度チェックして保存すると、通常の編集画面では取り消せません。
            </span>
          </span>
        </label>
        <button
          type="button"
          onClick={() => setHelpOpen(true)}
          className="text-xs text-violet-400 transition-colors hover:text-violet-300"
        >
          正式版公開済みとは？
        </button>
      </fieldset>

      <ProjectAlreadyReleasedHelpModal
        open={helpOpen}
        onClose={() => setHelpOpen(false)}
      />
    </>
  );
}
