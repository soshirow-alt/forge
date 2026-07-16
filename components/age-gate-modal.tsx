"use client";

import { V0SimpleModal } from "@/components/v0-simple-modal";

type AgeGateModalProps = {
  onUnderage: () => void;
  onAdult: () => void;
};

export function AgeGateModal({ onUnderage, onAdult }: AgeGateModalProps) {
  return (
    <V0SimpleModal title="あなたは18歳以上ですか？" onClose={onUnderage}>
      <p className="text-sm leading-relaxed text-zinc-300">
        この作品には、18歳未満の方に適さない内容が含まれます。
      </p>
      <div className="mt-6 flex flex-wrap justify-end gap-2">
        <button
          type="button"
          onClick={onUnderage}
          className="rounded-lg border border-zinc-700 px-3 py-2 text-sm text-zinc-300 hover:border-zinc-600 hover:text-zinc-100"
        >
          18歳未満です
        </button>
        <button
          type="button"
          onClick={onAdult}
          className="rounded-lg bg-violet-600 px-3 py-2 text-sm font-semibold text-white hover:bg-violet-500"
        >
          18歳以上です
        </button>
      </div>
    </V0SimpleModal>
  );
}
