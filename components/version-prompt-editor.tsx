"use client";

import { ChoicePromptFields } from "@/components/choice-prompt-fields";
import { DeveloperChoicePreview } from "@/components/developer-choice-preview";
import {
  applyQuestionTemplate,
  createDefaultChoiceDraftPatch,
  createEmptyPromptDraft,
  createPresetPromptDraft,
  DEVELOPER_PRESET_QUESTION_TEMPLATES,
  DEVELOPER_RESPONSE_FORMAT_OPTIONS,
  inferTemplateFromDraft,
  resolveOptionsForDraft,
  type DeveloperPromptDraft,
  type QuestionTemplateId,
} from "@/lib/version-prompt-form";
import { MAX_PROMPTS_PER_VERSION } from "@/lib/version-prompt-types";

const inputClassName =
  "mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-zinc-100 placeholder:text-zinc-600 focus:border-violet-500/50 focus:outline-none focus:ring-1 focus:ring-violet-500/50";

const modeSelectedClassName =
  "border-violet-500/40 bg-violet-500/5 text-violet-300";
const modeIdleClassName =
  "border-zinc-800 bg-zinc-900/60 text-zinc-300";
const radioClassName =
  "h-4 w-4 border-zinc-600 bg-zinc-900 text-violet-500 focus:ring-violet-500/50";

type VersionPromptEditorProps = {
  mode: "none" | "custom";
  onModeChange: (mode: "none" | "custom") => void;
  drafts: DeveloperPromptDraft[];
  onDraftsChange: (drafts: DeveloperPromptDraft[]) => void;
  versionLabel?: string;
  showValidation?: boolean;
  /** モーダル内 — 見出し・外枠を省略 */
  embeddedInModal?: boolean;
};

function responseFormatSelectValue(
  draft: DeveloperPromptDraft,
): DeveloperPromptDraft["responseKind"] {
  return draft.responseKind === "replay_intent" ? "yes_no" : draft.responseKind;
}

function draftsForCustomMode(
  drafts: DeveloperPromptDraft[],
): DeveloperPromptDraft[] {
  const next = drafts.map((draft) => ({
    ...draft,
    templateId: "custom" as const,
    responseKind:
      draft.responseKind === "replay_intent" ? "yes_no" : draft.responseKind,
  }));
  return next.length > 0 ? next : [createEmptyPromptDraft()];
}

function draftsForPresetMode(
  drafts: DeveloperPromptDraft[],
): DeveloperPromptDraft[] {
  const presetDrafts = drafts
    .map((draft) => {
      const templateId = inferTemplateFromDraft(draft);
      if (templateId === "custom") {
        return null;
      }
      return {
        ...draft,
        ...applyQuestionTemplate(templateId),
      };
    })
    .filter((draft): draft is DeveloperPromptDraft => draft != null);

  return presetDrafts.length > 0
    ? presetDrafts
    : [createPresetPromptDraft("replay")];
}

export function VersionPromptEditor({
  mode,
  onModeChange,
  drafts,
  onDraftsChange,
  versionLabel = "現在のプレイ可能ver",
  showValidation = false,
  embeddedInModal = false,
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
    onDraftsChange([
      ...drafts,
      mode === "none"
        ? createPresetPromptDraft("replay")
        : createEmptyPromptDraft(),
    ]);
  }

  function removeDraft(clientId: string) {
    const next = drafts.filter((draft) => draft.clientId !== clientId);
    if (next.length > 0) {
      onDraftsChange(next);
      return;
    }
    onDraftsChange(
      mode === "none"
        ? [createPresetPromptDraft("replay")]
        : [createEmptyPromptDraft()],
    );
  }

  function handleModeChange(nextMode: "none" | "custom") {
    if (nextMode === mode) {
      return;
    }
    onModeChange(nextMode);
    onDraftsChange(
      nextMode === "none"
        ? draftsForPresetMode(drafts)
        : draftsForCustomMode(drafts),
    );
  }

  function handlePresetTemplateChange(
    clientId: string,
    templateId: Exclude<QuestionTemplateId, "custom">,
  ) {
    const applied = applyQuestionTemplate(templateId);
    const patch: Partial<DeveloperPromptDraft> = { ...applied };
    if (applied.responseKind === "choice") {
      Object.assign(patch, createDefaultChoiceDraftPatch());
    }
    updateDraft(clientId, patch);
  }

  return (
    <div
      id="version-prompts"
      className={
        embeddedInModal
          ? "space-y-4"
          : "scroll-mt-24 space-y-4 rounded-lg border border-zinc-800 bg-zinc-950/50 p-4"
      }
    >
      {!embeddedInModal ? (
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
      ) : null}

      <div className="flex flex-wrap gap-2">
        <label
          className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
            mode === "custom" ? modeSelectedClassName : modeIdleClassName
          }`}
        >
          <input
            type="radio"
            name="versionPromptMode"
            checked={mode === "custom"}
            onChange={() => handleModeChange("custom")}
            className={radioClassName}
          />
          自分で問いを設定する
        </label>
        <label
          className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
            mode === "none" ? modeSelectedClassName : modeIdleClassName
          }`}
        >
          <input
            type="radio"
            name="versionPromptMode"
            checked={mode === "none"}
            onChange={() => handleModeChange("none")}
            className={radioClassName}
          />
          デフォルト問いを使う
        </label>
      </div>

      {(mode === "none" || mode === "custom") && (
        <div className="space-y-4">
          {activeCount >= 3 && (
            <p className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-xs leading-relaxed text-amber-200/90">
              問いが多いほど回答率が下がる可能性があります。1〜2問から始めるのがおすすめです。
            </p>
          )}

          {drafts.map((draft, index) => {
            const presetTemplateId = inferTemplateFromDraft(draft);
            const selectTemplateId =
              presetTemplateId === "custom" ? "replay" : presetTemplateId;

            return (
              <div
                key={draft.clientId}
                className="space-y-3 rounded-lg border border-zinc-800/80 bg-zinc-900/40 p-4"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-medium text-zinc-500">
                    問い {index + 1}
                  </p>
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

                {mode === "none" ? (
                  <div>
                    <label
                      htmlFor={`prompt-template-${draft.clientId}`}
                      className="text-xs font-medium text-zinc-500"
                    >
                      質問テンプレート
                    </label>
                    <select
                      id={`prompt-template-${draft.clientId}`}
                      value={selectTemplateId}
                      onChange={(event) =>
                        handlePresetTemplateChange(
                          draft.clientId,
                          event.target
                            .value as Exclude<QuestionTemplateId, "custom">,
                        )
                      }
                      className={inputClassName}
                    >
                      {DEVELOPER_PRESET_QUESTION_TEMPLATES.map((template) => (
                        <option key={template.id} value={template.id}>
                          {template.label}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
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
                        updateDraft(draft.clientId, {
                          promptText: event.target.value,
                          templateId: "custom",
                        })
                      }
                      className={inputClassName}
                      placeholder="例：チュートリアルは分かりやすかった？"
                    />
                  </div>
                )}

                <div>
                  <label
                    htmlFor={`prompt-kind-${draft.clientId}`}
                    className="text-xs font-medium text-zinc-500"
                  >
                    回答形式
                  </label>
                  <select
                    id={`prompt-kind-${draft.clientId}`}
                    value={responseFormatSelectValue(draft)}
                    onChange={(event) => {
                      let responseKind = event.target
                        .value as DeveloperPromptDraft["responseKind"];
                      if (
                        mode === "none" &&
                        selectTemplateId === "replay" &&
                        responseKind === "yes_no"
                      ) {
                        responseKind = "replay_intent";
                      }
                      const patch: Partial<DeveloperPromptDraft> = {
                        responseKind,
                        templateId:
                          mode === "none" ? selectTemplateId : "custom",
                      };
                      if (
                        responseKind === "choice" &&
                        !draft.choiceOptions?.length
                      ) {
                        Object.assign(patch, createDefaultChoiceDraftPatch());
                      }
                      updateDraft(draft.clientId, patch);
                    }}
                    className={inputClassName}
                  >
                    {DEVELOPER_RESPONSE_FORMAT_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-[11px] text-zinc-600">
                    {
                      DEVELOPER_RESPONSE_FORMAT_OPTIONS.find(
                        (option) =>
                          option.value === responseFormatSelectValue(draft),
                      )?.hint
                    }
                  </p>
                </div>

                {draft.responseKind === "choice" && (
                  <div className="space-y-3">
                    <ChoicePromptFields
                      draft={draft}
                      showValidation={showValidation}
                      onChange={(patch) => updateDraft(draft.clientId, patch)}
                    />
                    <DeveloperChoicePreview
                      promptText={draft.promptText}
                      options={resolveOptionsForDraft(draft) ?? []}
                    />
                  </div>
                )}
              </div>
            );
          })}

          {drafts.length > MAX_PROMPTS_PER_VERSION ? (
            <p className="text-xs text-amber-200/90">
              問いが最大{MAX_PROMPTS_PER_VERSION}問を超えています。保存するには
              {MAX_PROMPTS_PER_VERSION}問以下にしてください（既存の問いは自動削除しません）。
            </p>
          ) : null}

          {drafts.length < MAX_PROMPTS_PER_VERSION && (
            <button
              type="button"
              onClick={addDraft}
              className="text-sm font-medium text-violet-400 transition-colors hover:text-violet-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50"
            >
              + 問いを追加（最大{MAX_PROMPTS_PER_VERSION}問）
            </button>
          )}
        </div>
      )}
    </div>
  );
}
