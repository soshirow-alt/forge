"use client";

import { PLAY_TIME_OPTIONS } from "@/lib/play-time-options";

type ProjectEstimatedPlayTimeFieldProps = {
  value: string;
  onChange: (value: string) => void;
  inputClassName: string;
  inputId?: string;
};

export function ProjectEstimatedPlayTimeField({
  value,
  onChange,
  inputClassName,
  inputId = "estimatedPlayTime",
}: ProjectEstimatedPlayTimeFieldProps) {
  return (
    <div>
      <label htmlFor={inputId} className="text-sm font-medium text-zinc-400">
        想定プレイ時間 <span className="font-normal text-zinc-600">（任意）</span>
      </label>
      <select
        id={inputId}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={inputClassName}
      >
        <option value="">選択しない</option>
        {PLAY_TIME_OPTIONS.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}
