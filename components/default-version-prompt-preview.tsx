import {
  DEFAULT_REPLAY_PROMPT_TEXT,
  REPLAY_INTENT_OPTIONS,
} from "@/lib/version-prompt-types";

type DefaultVersionPromptPreviewProps = {
  className?: string;
};

export function DefaultVersionPromptPreview({
  className = "",
}: DefaultVersionPromptPreviewProps) {
  return (
    <div
      className={`space-y-2 rounded-lg border border-orange-500/20 bg-orange-500/5 p-4 ${className}`}
    >
      <p className="text-xs font-medium text-orange-300/90">
        プレイヤーにはこの問いが表示されます
      </p>
      <div className="rounded-lg border border-zinc-800/80 bg-zinc-950/40 px-3.5 py-3">
        <p className="text-sm leading-relaxed text-zinc-200">
          {DEFAULT_REPLAY_PROMPT_TEXT}
        </p>
        <ul className="mt-2 space-y-1.5" aria-label="回答選択肢">
          {REPLAY_INTENT_OPTIONS.map((option) => (
            <li
              key={option.id}
              className="rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2 text-xs text-zinc-400"
            >
              {option.label}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
