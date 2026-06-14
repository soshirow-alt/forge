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
    <div className="mt-2 flex flex-wrap gap-2">
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          onClick={() => onChange(option.id, option.label)}
          className={`rounded-lg border px-3 py-2 text-xs transition-colors ${
            value === option.id
              ? "border-orange-500/40 bg-orange-500/10 text-orange-300"
              : "border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-700 hover:text-zinc-300"
          }`}
        >
          {option.label}
        </button>
      ))}
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
        <textarea
          rows={3}
          value={value ?? ""}
          maxLength={200}
          placeholder="短く自由に入力"
          onChange={(event) => onChange(event.target.value, event.target.value)}
          className="mt-2 w-full resize-y rounded-lg border border-zinc-800 bg-zinc-900/80 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-orange-500/40 focus:outline-none focus:ring-1 focus:ring-orange-500/30"
        />
      ) : (
        <OptionButtons options={options} value={value} onChange={onChange} />
      )}
    </div>
  );
}
