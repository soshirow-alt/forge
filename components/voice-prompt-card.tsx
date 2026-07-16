"use client";

import type { VersionPrompt, VersionPromptOption } from "@/lib/version-prompt-types";
import { YES_NO_OPTIONS } from "@/lib/version-prompt-types";
import { supportsOptionalFreeTextComment } from "@/lib/version-prompt-form";
import { FEEDBACK_FREE_TEXT_MAX } from "@/lib/feedback-free-text";
import { AutoGrowTextarea } from "@/components/auto-grow-textarea";

type VoicePromptCardProps = {
  prompt: VersionPrompt;
  value?: string;
  optionalComment?: string;
  onChange: (answerValue: string, answerLabel: string) => void;
  onOptionalCommentChange?: (comment: string) => void;
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

const textareaClassName =
  "mt-2 w-full resize-none rounded-lg border border-zinc-800 bg-zinc-900/80 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-orange-500/40 focus:outline-none focus:ring-1 focus:ring-orange-500/30";

export function VoicePromptCard({
  prompt,
  value,
  optionalComment = "",
  onChange,
  onOptionalCommentChange,
  answered = false,
}: VoicePromptCardProps) {
  const options =
    prompt.options ??
    (prompt.responseKind === "yes_no" ? YES_NO_OPTIONS : []);

  const showOptionalComment =
    supportsOptionalFreeTextComment(prompt.responseKind) &&
    onOptionalCommentChange;

  const freeText = value ?? "";

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
          <AutoGrowTextarea
            rows={7}
            value={freeText}
            maxLength={FEEDBACK_FREE_TEXT_MAX}
            minHeightPx={160}
            maxHeightPx={360}
            placeholder={`${FEEDBACK_FREE_TEXT_MAX}文字以内で自由に入力`}
            onChange={(event) => onChange(event.target.value, event.target.value)}
            className={textareaClassName}
          />
          <p className="mt-1 text-[11px] text-zinc-600">
            {freeText.length} / {FEEDBACK_FREE_TEXT_MAX}
          </p>
        </>
      ) : (
        <>
          <OptionButtons options={options} value={value} onChange={onChange} />
          {showOptionalComment && (
            <div className="mt-3">
              <label className="text-xs text-zinc-500">
                ひと言コメント{" "}
                <span className="text-zinc-600">（任意）</span>
              </label>
              <AutoGrowTextarea
                rows={3}
                value={optionalComment}
                maxLength={FEEDBACK_FREE_TEXT_MAX}
                minHeightPx={96}
                maxHeightPx={280}
                placeholder="はい/いいえ以外の感想や理由があれば"
                onChange={(event) => onOptionalCommentChange(event.target.value)}
                className={`${textareaClassName} mt-1.5`}
              />
              <p className="mt-1 text-[11px] text-zinc-600">
                {optionalComment.length} / {FEEDBACK_FREE_TEXT_MAX}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
