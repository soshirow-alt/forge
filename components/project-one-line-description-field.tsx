"use client";

import { useEffect } from "react";
import {
  PROJECT_ONE_LINE_DESCRIPTION_HINT,
  PROJECT_ONE_LINE_DESCRIPTION_MAX,
  clampProjectOneLineDescription,
} from "@/lib/project-one-line-description";

type ProjectOneLineDescriptionFieldProps = {
  id: string;
  value: string;
  onChange: (value: string) => void;
  inputClassName: string;
};

export function ProjectOneLineDescriptionField({
  id,
  value,
  onChange,
  inputClassName,
}: ProjectOneLineDescriptionFieldProps) {
  const safeValue = clampProjectOneLineDescription(value);
  const length = safeValue.length;

  useEffect(() => {
    if (value !== safeValue) {
      onChange(safeValue);
    }
  }, [value, safeValue, onChange]);

  function commitNext(raw: string) {
    onChange(clampProjectOneLineDescription(raw));
  }

  return (
    <div>
      <label htmlFor={id} className="text-xs font-medium text-zinc-500">
        1行説明
      </label>
      <input
        id={id}
        type="text"
        value={safeValue}
        maxLength={PROJECT_ONE_LINE_DESCRIPTION_MAX}
        onChange={(event) => commitNext(event.target.value)}
        onPaste={(event) => {
          event.preventDefault();
          const pasted = event.clipboardData.getData("text");
          const input = event.currentTarget;
          const start = input.selectionStart ?? safeValue.length;
          const end = input.selectionEnd ?? safeValue.length;
          const merged =
            safeValue.slice(0, start) + pasted + safeValue.slice(end);
          commitNext(merged);
        }}
        onCompositionEnd={(event) => commitNext(event.currentTarget.value)}
        className={inputClassName}
        placeholder="ヒーローに表示される短い説明"
      />
      <p className="mt-1 text-[11px] leading-relaxed text-zinc-600">
        {PROJECT_ONE_LINE_DESCRIPTION_HINT}
      </p>
      <p
        className={`mt-0.5 text-right text-[11px] tabular-nums ${
          length >= PROJECT_ONE_LINE_DESCRIPTION_MAX ? "text-orange-300/90" : "text-zinc-500"
        }`}
        aria-live="polite"
      >
        {length} / {PROJECT_ONE_LINE_DESCRIPTION_MAX}
      </p>
    </div>
  );
}
