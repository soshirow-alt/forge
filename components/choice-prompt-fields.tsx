"use client";

import {
  CHOICE_COUNT_OPTIONS,
  MAX_CHOICE_LABEL_LENGTH,
  type DeveloperPromptDraft,
} from "@/lib/version-prompt-form";

const inputClassName =
  "mt-1.5 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-zinc-100 placeholder:text-zinc-600 focus:border-orange-500/50 focus:outline-none focus:ring-1 focus:ring-orange-500/50";

type ChoicePromptFieldsProps = {
  draft: DeveloperPromptDraft;
  onChange: (patch: Partial<DeveloperPromptDraft>) => void;
  showValidation?: boolean;
};

function emptyChoiceOptions(count: number): string[] {
  return Array.from({ length: count }, () => "");
}

export function ChoicePromptFields({
  draft,
  onChange,
  showValidation = false,
}: ChoicePromptFieldsProps) {
  const choiceCount = draft.choiceCount ?? 3;
  const choiceOptions = draft.choiceOptions ?? emptyChoiceOptions(choiceCount);

  function handleCountChange(nextCount: number) {
    const current = draft.choiceOptions ?? emptyChoiceOptions(choiceCount);
    let nextOptions: string[];

    if (nextCount > current.length) {
      nextOptions = [...current, ...emptyChoiceOptions(nextCount - current.length)];
    } else {
      nextOptions = current.slice(0, nextCount);
    }

    onChange({
      choiceCount: nextCount,
      choiceOptions: nextOptions,
    });
  }

  function handleOptionChange(index: number, value: string) {
    const nextOptions = [...(draft.choiceOptions ?? emptyChoiceOptions(choiceCount))];
    nextOptions[index] = value;
    onChange({ choiceOptions: nextOptions });
  }

  return (
    <div className="space-y-3">
      <div>
        <label
          htmlFor={`prompt-choice-count-${draft.clientId}`}
          className="text-xs font-medium text-zinc-500"
        >
          選択肢数
        </label>
        <select
          id={`prompt-choice-count-${draft.clientId}`}
          value={choiceCount}
          onChange={(event) => handleCountChange(Number(event.target.value))}
          className={inputClassName}
        >
          {CHOICE_COUNT_OPTIONS.map((count) => (
            <option key={count} value={count}>
              {count}
            </option>
          ))}
        </select>
        <p className="mt-1 text-[11px] text-zinc-600">
          数を減らすと、下の選択肢入力欄が減ります。
        </p>
      </div>

      {Array.from({ length: choiceCount }, (_, index) => {
        const value = choiceOptions[index] ?? "";
        const isEmpty = showValidation && !value.trim();
        const isTooLong = value.length > MAX_CHOICE_LABEL_LENGTH;

        return (
          <div key={`${draft.clientId}-choice-${index}`}>
            <label
              htmlFor={`prompt-choice-${draft.clientId}-${index}`}
              className="text-xs font-medium text-zinc-500"
            >
              選択肢{index + 1}
            </label>
            <input
              id={`prompt-choice-${draft.clientId}-${index}`}
              type="text"
              value={value}
              maxLength={MAX_CHOICE_LABEL_LENGTH}
              onChange={(event) => handleOptionChange(index, event.target.value)}
              className={`${inputClassName} ${
                isEmpty || isTooLong ? "border-red-500/40 focus:border-red-500/50 focus:ring-red-500/30" : ""
              }`}
              placeholder={`例：選択肢${index + 1}`}
            />
            {showValidation && isEmpty && (
              <p className="mt-1 text-[11px] text-red-300/90">
                選択肢{index + 1}を入力してください（2個以上必要です）
              </p>
            )}
            {isTooLong && (
              <p className="mt-1 text-[11px] text-red-300/90">
                {MAX_CHOICE_LABEL_LENGTH}文字以内にしてください
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
