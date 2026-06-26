"use client";

import type { ReactNode } from "react";

type InputHintBadgeProps = {
  label?: string;
  children: ReactNode;
};

/** ラベル横の軽いヒント — ホバー / フォーカスでツールチップ表示（必須入力にはしない） */
export function InputHintBadge({
  label = "入力ヒント",
  children,
}: InputHintBadgeProps) {
  return (
    <span className="group relative inline-flex align-middle">
      <button
        type="button"
        tabIndex={0}
        className="ml-1.5 rounded-full border border-zinc-700/80 bg-zinc-800/60 px-2 py-0.5 text-[10px] font-medium leading-none text-zinc-500 transition-colors hover:border-zinc-600 hover:text-zinc-400 focus:border-orange-500/40 focus:text-zinc-300 focus:outline-none"
        aria-label={`${label}（ツールチップ）`}
      >
        {label}
      </button>
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 w-56 -translate-x-1/2 rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-left text-xs leading-relaxed text-zinc-400 opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
      >
        {children}
        <span
          className="absolute left-1/2 top-full -mt-px -translate-x-1/2 border-4 border-transparent border-t-zinc-700"
          aria-hidden="true"
        />
      </span>
    </span>
  );
}

type FieldLabelWithHintProps = {
  htmlFor: string;
  label: string;
  hintLabel?: string;
  hint: ReactNode;
};

export function FieldLabelWithHint({
  htmlFor,
  label,
  hintLabel,
  hint,
}: FieldLabelWithHintProps) {
  return (
    <label htmlFor={htmlFor} className="inline-flex flex-wrap items-center text-sm font-medium text-zinc-400">
      {label}
      <InputHintBadge label={hintLabel}>{hint}</InputHintBadge>
    </label>
  );
}
