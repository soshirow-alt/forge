"use client";

import { useEffect } from "react";
import {
  PROJECT_TITLE_HINT,
  PROJECT_TITLE_MAX,
  clampProjectTitle,
} from "@/lib/project-title";

type ProjectTitleFieldProps = {
  id: string;
  value: string;
  onChange: (value: string) => void;
  inputClassName: string;
  placeholder?: string;
  required?: boolean;
};

export function ProjectTitleField({
  id,
  value,
  onChange,
  inputClassName,
  placeholder,
  required,
}: ProjectTitleFieldProps) {
  const safeValue = clampProjectTitle(value);
  const length = safeValue.length;

  useEffect(() => {
    if (value !== safeValue) {
      onChange(safeValue);
    }
  }, [value, safeValue, onChange]);

  function commitNext(raw: string) {
    onChange(clampProjectTitle(raw));
  }

  return (
    <div>
      <label htmlFor={id} className="text-xs font-medium text-zinc-500">
        タイトル
      </label>
      <input
        id={id}
        type="text"
        value={safeValue}
        maxLength={PROJECT_TITLE_MAX}
        required={required}
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
        placeholder={placeholder}
      />
      <p className="mt-1 text-[11px] leading-relaxed text-zinc-600">
        {PROJECT_TITLE_HINT}
      </p>
      <p
        className={`mt-0.5 text-right text-[11px] tabular-nums ${
          length >= PROJECT_TITLE_MAX ? "text-orange-300/90" : "text-zinc-500"
        }`}
        aria-live="polite"
      >
        {length} / {PROJECT_TITLE_MAX}
      </p>
    </div>
  );
}
