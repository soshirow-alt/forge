"use client";

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
  const length = value.length;

  return (
    <div>
      <label htmlFor={id} className="text-xs font-medium text-zinc-500">
        1行説明
      </label>
      <input
        id={id}
        type="text"
        value={value}
        maxLength={PROJECT_ONE_LINE_DESCRIPTION_MAX}
        onChange={(event) =>
          onChange(clampProjectOneLineDescription(event.target.value))
        }
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
