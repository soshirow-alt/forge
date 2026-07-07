"use client";

import { DEVELOPMENT_PHASE_OPTIONS } from "@/lib/development-phases";

type ProjectPhaseFormFieldsProps = {
  value: string;
  onChange: (value: string) => void;
  radioName?: string;
  required?: boolean;
};

export function ProjectPhaseFormFields({
  value,
  onChange,
  radioName = "phase",
  required = true,
}: ProjectPhaseFormFieldsProps) {
  return (
    <fieldset className="space-y-3">
      <legend className="text-sm font-medium text-zinc-400">開発フェーズ</legend>
      <p className="text-xs text-zinc-600">
        今の完成度を選んでください。プレイヤーがどこまで遊べるかの目安になります
      </p>
      <div className="space-y-2">
        {DEVELOPMENT_PHASE_OPTIONS.map((option) => (
          <label
            key={option.value}
            className={`flex cursor-pointer gap-3 rounded-lg border px-3 py-3 transition-colors ${
              value === option.value
                ? "border-orange-500/40 bg-orange-500/5"
                : "border-zinc-800 bg-zinc-950/50"
            }`}
          >
            <input
              type="radio"
              name={radioName}
              required={required}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              className="mt-0.5 h-4 w-4 shrink-0 border-zinc-600 bg-zinc-900 text-orange-500 focus:ring-orange-500/50"
            />
            <span>
              <span className="block text-sm font-medium text-zinc-300">{option.label}</span>
              <span className="mt-0.5 block text-xs text-zinc-600">{option.hint}</span>
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
