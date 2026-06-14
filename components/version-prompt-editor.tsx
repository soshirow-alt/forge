"use client";

import {
  createEmptyPromptDraft,
  DEVELOPER_RESPONSE_KIND_OPTIONS,
  type DeveloperPromptDraft,
} from "@/lib/version-prompt-form";
import { MAX_PROMPTS_PER_VERSION } from "@/lib/version-prompt-types";

const inputClassName =
  "mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-zinc-100 placeholder:text-zinc-600 focus:border-orange-500/50 focus:outline-none focus:ring-1 focus:ring-orange-500/50";

type VersionPromptEditorProps = {
  mode: "none" | "custom";
  onModeChange: (mode: "none" | "custom") => void;
  drafts: DeveloperPromptDraft[];
  onDraftsChange: (drafts: DeveloperPromptDraft[]) => void;
  versionLabel?: string;
};

export function VersionPromptEditor({
  mode,
  onModeChange,
  drafts,
  onDraftsChange,
  versionLabel = "現在のプレイ可能版",
}: VersionPromptEditorProps) {
  const activeCount = drafts.filter((draft) => draft.promptText.trim()).length;

  function updateDraft(clientId: string, patch: Partial<DeveloperPromptDraft>) {
    onDraftsChange(
      drafts.map((draft) =>
        draft.clientId === clientId ? { ...draft, ...patch } : draft,
      ),
    );
  }

  function addDraft() {
    if (drafts.length >= MAX_PROMPTS_PER_VERSION) {
      return;
    }
    onDraftsChange([...drafts, createEmptyPromptDraft()]);
  }

  function removeDraft(clientId: string) {
    const next = drafts.filter((draft) => draft.clientId !== clientId);
    onDraftsChange(next.length > 0 ? next : [createEmptyPromptDraft()]);
  }

  return (
    <div className="space-y-4 rounded-lg border border-zinc-800 bg-zinc-950/50 p-4">
      <div>
        <p className="text-sm font-medium text-zinc-400">
          プレイヤーへの問い{" "}
          <span className="font-normal text-zinc-600">（任意）</span>
        </p>
        <p className="mt-1 text-xs leading-relaxed text-zinc-600">
          {versionLabel}向けに、プレイ後に届けてほしい短い問いを設定できます。
          未設定の場合は「もう一度遊びたい？」が表示されます。
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <label
          className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
            mode === "none"
              ? "border-orange-500/40 bg-orange-500/5 text-orange-300"
              : "border-zinc-800 bg-zinc-900/60 text-zinc-300"
          }`}
        >
          <input
            type="radio"
            name="versionPromptMode"
            checked={mode === "none"}
            onChange={() => onModeChange("none")}
            className="h-4 w-4 border-zinc-600 bg-zinc-900 text-orange-500 focus:ring-orange-500/50"
          />
          デフォルト問いを使う
        </label>
        <label
          className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
            mode === "custom"
              ? "border-orange-500/40 bg-orange-500/5 text-orange-300"
              : "border-zinc-800 bg-zinc-900/60 text-zinc-300"
          }`}
        >
          <input
            type="radio"
            name="versionPromptMode"
            checked={mode === "custom"}
            onChange={() => {
              onModeChange("custom");
              if (drafts.length === 0) {
                onDraftsChange([createEmptyPromptDraft()]);
              }
            }}
            className="h-4 w-4 border-zinc-600 bg-zinc-900 text-orange-500 focus:ring-orange-500/50"
          />
          自分で問いを設定する
        </label>
      </div>

      {mode === "custom" && (
        <div className="space-y-4">
          {activeCount >= 3 && (
            <p className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-xs leading-relaxed text-amber-200/90">
              問いが多いほど回答率が下がる可能性があります。1〜2問から始めるのがおすすめです。
            </p>
          )}

          {drafts.map((draft, index) => (
            <div
              key={draft.clientId}
              className="space-y-3 rounded-lg border border-zinc-800/80 bg-zinc-900/40 p-4"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-medium text-zinc-500">問い {index + 1}</p>
                {drafts.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeDraft(draft.clientId)}
                    className="text-xs text-zinc-600 transition-colors hover:text-red-400/90"
                  >
                    削除
                  </button>
                )}
              </div>

              <div>
                <label
                  htmlFor={`prompt-text-${draft.clientId}`}
                  className="text-xs font-medium text-zinc-500"
                >
                  質問文
                </label>
                <input
                  id={`prompt-text-${draft.clientId}`}
                  type="text"
                  value={draft.promptText}
                  maxLength={200}
                  onChange={(event) =>
                    updateDraft(draft.clientId, { promptText: event.target.value })
                  }
                  className={inputClassName}
                  placeholder="例：チュートリアルは分かりやすかった？"
                />
              </div>

              <div>
                <label
                  htmlFor={`prompt-kind-${draft.clientId}`}
                  className="text-xs font-medium text-zinc-500"
                >
                  回答形式
                </label>
                <select
                  id={`prompt-kind-${draft.clientId}`}
                  value={draft.responseKind}
                  onChange={(event) =>
                    updateDraft(draft.clientId, {
                      responseKind: event.target
                        .value as DeveloperPromptDraft["responseKind"],
                    })
                  }
                  className={inputClassName}
                >
                  {DEVELOPER_RESPONSE_KIND_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-[11px] text-zinc-600">
                  {
                    DEVELOPER_RESPONSE_KIND_OPTIONS.find(
                      (option) => option.value === draft.responseKind,
                    )?.hint
                  }
                </p>
              </div>

              {draft.responseKind === "choice" && (
                <div>
                  <label
                    htmlFor={`prompt-choice-${draft.clientId}`}
                    className="text-xs font-medium text-zinc-500"
                  >
                    選択肢（2〜4個・改行またはカンマ区切り）
                  </label>
                  <textarea
                    id={`prompt-choice-${draft.clientId}`}
                    rows={3}
                    value={draft.choiceLabels ?? ""}
                    onChange={(event) =>
                      updateDraft(draft.clientId, {
                        choiceLabels: event.target.value,
                      })
                    }
                    className={`${inputClassName} resize-y`}
                    placeholder={"武器A\n武器B\n武器C"}
                  />
                </div>
              )}
            </div>
          ))}

          {drafts.length < MAX_PROMPTS_PER_VERSION && (
            <button
              type="button"
              onClick={addDraft}
              className="text-sm font-medium text-orange-400/90 transition-colors hover:text-orange-300"
            >
              + 問いを追加（最大 {MAX_PROMPTS_PER_VERSION} 問）
            </button>
          )}
        </div>
      )}
    </div>
  );
}
