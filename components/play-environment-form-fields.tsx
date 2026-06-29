"use client";

import {
  DISTRIBUTION_TYPE_HINTS,
  DISTRIBUTION_TYPE_LABELS,
  type DistributionType,
  type PlayEnvironmentFormState,
} from "@/lib/play-environment";

type PlayEnvironmentFormFieldsProps = {
  value: PlayEnvironmentFormState;
  onChange: (value: PlayEnvironmentFormState) => void;
};

const distributionOptions: {
  value: Exclude<DistributionType, "">;
  label: string;
  hint: string;
}[] = (
  ["browser", "download", "external"] as const
).map((value) => ({
  value,
  label: DISTRIBUTION_TYPE_LABELS[value],
  hint: DISTRIBUTION_TYPE_HINTS[value],
}));

export function PlayEnvironmentFormFields({
  value,
  onChange,
}: PlayEnvironmentFormFieldsProps) {
  return (
    <div className="space-y-5 rounded-xl border border-zinc-800 bg-zinc-950/40 p-5">
      <div>
        <p className="text-sm font-medium text-zinc-400">
          対応環境 <span className="text-zinc-600">（任意）</span>
        </p>
        <div className="mt-3 flex flex-wrap gap-3">
          {(
            [
              { key: "pc" as const, label: "PC" },
              { key: "mobile" as const, label: "スマホ" },
              { key: "browser" as const, label: "ブラウザ" },
            ] as const
          ).map((option) => (
            <label
              key={option.key}
              className="flex cursor-pointer items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2"
            >
              <input
                type="checkbox"
                checked={value[option.key]}
                onChange={(event) =>
                  onChange({ ...value, [option.key]: event.target.checked })
                }
                className="h-4 w-4 rounded border-zinc-600 bg-zinc-900 text-orange-500 focus:ring-orange-500/50"
              />
              <span className="text-sm text-zinc-300">{option.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <p className="text-sm font-medium text-zinc-400">
          配布形式 <span className="text-zinc-600">（任意）</span>
        </p>
        <p className="mt-1 text-xs text-zinc-600">
          テスターが遊ぶ方法の目安です。下の「関連リンク」とは別です
        </p>
        <div className="mt-3 space-y-2">
          {distributionOptions.map((option) => (
            <label
              key={option.value}
              className="flex cursor-pointer gap-3 rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2"
            >
              <input
                type="radio"
                name="distribution"
                checked={value.distribution === option.value}
                onChange={() =>
                  onChange({ ...value, distribution: option.value })
                }
                className="mt-0.5 h-4 w-4 shrink-0 border-zinc-600 bg-zinc-900 text-orange-500 focus:ring-orange-500/50"
              />
              <span>
                <span className="block text-sm text-zinc-300">{option.label}</span>
                <span className="mt-0.5 block text-xs text-zinc-600">
                  {option.hint}
                </span>
              </span>
            </label>
          ))}
        </div>
      </div>

    </div>
  );
}
