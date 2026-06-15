"use client";

import type { VersionPromptOption } from "@/lib/version-prompt-types";

type DeveloperChoicePreviewProps = {
  promptText: string;
  options: VersionPromptOption[];
};

export function DeveloperChoicePreview({
  promptText,
  options,
}: DeveloperChoicePreviewProps) {
  if (options.length < 2) {
    return null;
  }

  const displayText = promptText.trim() || "（質問文を入力）";

  return (
    <div className="rounded-lg border border-zinc-800/60 bg-zinc-950/30 p-3">
      <p className="text-[11px] font-medium text-zinc-500">
        プレイヤーにこう見える
      </p>
      <div className="mt-2 rounded-lg border border-zinc-800/80 bg-zinc-950/40 px-3.5 py-3 opacity-90">
        <p className="text-sm leading-relaxed text-zinc-200">{displayText}</p>
        <div className="mt-2 flex flex-wrap gap-2" aria-hidden="true">
          {options.map((option) => (
            <span
              key={option.id}
              className="rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2 text-xs text-zinc-400"
            >
              {option.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
