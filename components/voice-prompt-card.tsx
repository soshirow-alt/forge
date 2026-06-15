"use client";

import type { VersionPrompt, VersionPromptOption } from "@/lib/version-prompt-types";
import { YES_NO_OPTIONS } from "@/lib/version-prompt-types";

type VoicePromptCardProps = {
  prompt: VersionPrompt;
  value?: string;
  onChange: (answerValue: string, answerLabel: string) => void;
  answered?: boolean;
};

function OptionButtons({
  options,
  value,
  onChange,
}: {
  options: VersionPromptOption[];
  value?: string;
  onChange: (answerValue: string, answerLabel: string) => void;
}) {
  return (
    <div>
      <p className="mt-2 text-xs text-zinc-500">ひとつ選んでください</p>
      <div
        className="mt-2 flex flex-wrap gap-2"
        role="group"
        aria-label="回答を選ぶ"
      >
        {options.map((option) => {
          const selected = value === option.id;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onChange(option.id, option.label)}
              className={`min-h-10 cursor-pointer rounded-lg border px-4 py-2 text-xs transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/40 ${
                selected
                  ? "border-orange-500/40 bg-orange-500/10 text-orange-300"
                  : "border-zinc-600/80 bg-zinc-800/80 text-zinc-300 hover:border-orange-500/30 hover:bg-zinc-800 hover:text-zinc-100"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function VoicePromptCard({
  prompt,
  value,
  onChange,
  answered = false,
}: VoicePromptCardProps) {
  const options =
    prompt.options ??
    (prompt.responseKind === "yes_no" ? YES_NO_OPTIONS : []);

  return (
    <div className="rounded-lg border border-zinc-800/80 bg-zinc-950/40 px-3.5 py-3">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm leading-relaxed text-zinc-200">{prompt.promptText}</p>
        {answered && (
          <span className="shrink-0 text-[11px] font-medium text-orange-400/90">
            回答済
          </span>
        )}
      </div>

      {prompt.responseKind === "short_text" ? (
        <>
          <textarea
            rows={3}
            value={value ?? ""}
            maxLength={200}
            placeholder="200文字以内で自由に入力"
            onChange={(event) => onChange(event.target.value, event.target.value)}
            className="mt-2 w-full resize-y rounded-lg border border-zinc-800 bg-zinc-900/80 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-orange-500/40 focus:outline-none focus:ring-1 focus:ring-orange-500/30"
          />
          <p className="mt-1 text-[11px] text-zinc-600">200文字以内</p>
        </>
      ) : (
        <OptionButtons options={options} value={value} onChange={onChange} />
      )}
    </div>
  );
}
