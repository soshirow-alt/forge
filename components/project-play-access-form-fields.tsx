"use client";

import {
  SUBMIT_PLAY_ACCESS_OPTIONS,
  type SubmitPlayAccessType,
} from "@/lib/play-access-type";

type ProjectPlayAccessFormFieldsProps = {
  value: SubmitPlayAccessType | "";
  onChange: (value: SubmitPlayAccessType) => void;
  radioName?: string;
  required?: boolean;
  showUnspecifiedHint?: boolean;
};

export function ProjectPlayAccessFormFields({
  value,
  onChange,
  radioName = "play-access-type",
  required = true,
  showUnspecifiedHint = false,
}: ProjectPlayAccessFormFieldsProps) {
  return (
    <fieldset className="w-full min-w-0 max-w-full space-y-3">
      <legend className="text-sm font-medium text-zinc-400">料金・公開形態</legend>
      <p className="text-xs text-zinc-600">
        プレイヤーに、無料で遊べるのか、体験版なのか、購入が必要なのかを伝えます。
      </p>
      {showUnspecifiedHint ? (
        <p className="text-xs text-amber-400/90">未設定 — いずれかを選んでください。</p>
      ) : null}
      <div className="w-full min-w-0 max-w-full space-y-2">
        {SUBMIT_PLAY_ACCESS_OPTIONS.map((option) => (
          <label
            key={option.value}
            className={`flex w-full min-w-0 max-w-full box-border cursor-pointer gap-3 rounded-lg border px-3 py-3 transition-colors ${
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
            <span className="min-w-0 flex-1">
              <span className="block break-words text-sm font-medium text-zinc-300">
                {option.label}
              </span>
              <span className="mt-0.5 block break-words text-xs text-zinc-600">
                {option.hint}
              </span>
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
