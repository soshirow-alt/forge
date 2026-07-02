"use client";

import { SlidersHorizontal, Pencil, Sparkles, Image as ImageIcon, Link2 } from "lucide-react";
import { useState, type ReactNode } from "react";
import { VersionPromptSettingsTrigger } from "@/components/version-prompt-settings-modal";
import {
  StudioSubmitBasicInfoEditPanel,
  StudioSubmitGenresTagsEditPanel,
  StudioSubmitImagesEditPanel,
  StudioSubmitIntroductionEditPanel,
  StudioSubmitPlayInfoEditPanel,
  StudioSubmitVisibilityEditPanel,
} from "@/components/studio-submit-edit-panels";
import { getVisibilityBadgeLabel } from "@/lib/project-visibility";
import {
  summarizeSubmitDraftBasic,
  summarizeSubmitDraftGenres,
  summarizeSubmitDraftImages,
  summarizeSubmitDraftIntroduction,
  summarizeSubmitDraftPlayInfo,
  type SubmitDraftState,
} from "@/lib/studio-submit-draft";
import { summarizeVersionPromptSettings } from "@/components/version-prompt-editor-dialog";

const panelButtonClassName =
  "inline-flex w-full items-center gap-2 rounded-lg border border-zinc-800/60 bg-zinc-950/40 px-3 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:border-zinc-700 hover:bg-zinc-900/70 hover:text-zinc-100";

const primaryButtonClassName =
  "inline-flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-2.5 text-sm font-semibold text-zinc-950 shadow-sm shadow-orange-500/20 transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50";

type SubmitEditMode =
  | null
  | "basic-info"
  | "genres-tags"
  | "introduction"
  | "images"
  | "play-info"
  | "visibility";

function PanelBlock({
  title,
  children,
}: {
  title?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-zinc-800/50 bg-zinc-950/25 p-4">
      {title ? (
        <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{title}</h3>
      ) : null}
      <div className={title ? "mt-3 space-y-2" : "space-y-2"}>{children}</div>
    </section>
  );
}

function GroupLabel({ children }: { children: ReactNode }) {
  return (
    <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-600">
      {children}
    </p>
  );
}

export type StudioSubmitPanelProps = {
  draft: SubmitDraftState;
  onDraftChange: (patch: Partial<SubmitDraftState>) => void;
  onSubmit: () => void;
  submitting: boolean;
  submitError: string | null;
  showPromptValidation: boolean;
};

export function StudioSubmitPanel({
  draft,
  onDraftChange,
  onSubmit,
  submitting,
  submitError,
  showPromptValidation,
}: StudioSubmitPanelProps) {
  const [editMode, setEditMode] = useState<SubmitEditMode>(null);
  const visibilityLabel = getVisibilityBadgeLabel(draft.visibility);
  const promptSummary = summarizeVersionPromptSettings(draft.promptMode, draft.promptDrafts);

  function applyPatch(patch: Partial<SubmitDraftState>) {
    onDraftChange(patch);
  }

  function closeEdit() {
    setEditMode(null);
  }

  if (editMode === "basic-info") {
    return (
      <StudioSubmitBasicInfoEditPanel draft={draft} onApply={applyPatch} onCancel={closeEdit} />
    );
  }
  if (editMode === "genres-tags") {
    return (
      <StudioSubmitGenresTagsEditPanel draft={draft} onApply={applyPatch} onCancel={closeEdit} />
    );
  }
  if (editMode === "introduction") {
    return (
      <StudioSubmitIntroductionEditPanel draft={draft} onApply={applyPatch} onCancel={closeEdit} />
    );
  }
  if (editMode === "images") {
    return (
      <StudioSubmitImagesEditPanel draft={draft} onApply={applyPatch} onCancel={closeEdit} />
    );
  }
  if (editMode === "play-info") {
    return (
      <StudioSubmitPlayInfoEditPanel draft={draft} onApply={applyPatch} onCancel={closeEdit} />
    );
  }
  if (editMode === "visibility") {
    return (
      <StudioSubmitVisibilityEditPanel draft={draft} onApply={applyPatch} onCancel={closeEdit} />
    );
  }

  return (
    <aside aria-label="Studioパネル" className="w-full shrink-0 xl:sticky xl:top-6 xl:w-[340px] xl:self-start">
      <div className="rounded-2xl border border-zinc-800/75 bg-zinc-900/50 px-4 py-4 shadow-sm shadow-black/10">
        <div className="space-y-4">
          <div className="-mx-4 -mt-4 rounded-t-2xl border-b border-orange-500/15 bg-gradient-to-br from-orange-500/10 via-orange-500/5 to-transparent px-4 pb-4 pt-4">
            <div className="flex items-center gap-2">
              <span
                className="h-4 w-0.5 shrink-0 rounded-full bg-orange-500/80"
                aria-hidden="true"
              />
              <SlidersHorizontal className="size-3.5 shrink-0 text-orange-400/90" aria-hidden="true" />
              <h2 className="text-sm font-semibold tracking-tight text-zinc-100">Studioパネル</h2>
            </div>
          </div>

          <p className="text-xs font-medium text-zinc-500">作品を投稿する</p>

          <div className="space-y-5">
            <div className="space-y-2">
              <GroupLabel>ページの内容</GroupLabel>
              <div className="space-y-2">
                <PanelBlock title="基本情報">
                  <p className="text-sm text-zinc-300">{summarizeSubmitDraftBasic(draft)}</p>
                  <button type="button" onClick={() => setEditMode("basic-info")} className={panelButtonClassName}>
                    <Pencil className="size-4 shrink-0 text-zinc-500" aria-hidden="true" />
                    編集する
                  </button>
                </PanelBlock>

                <PanelBlock title="ジャンル・タグ">
                  <p className="text-sm text-zinc-300">{summarizeSubmitDraftGenres(draft)}</p>
                  <button type="button" onClick={() => setEditMode("genres-tags")} className={panelButtonClassName}>
                    <Pencil className="size-4 shrink-0 text-zinc-500" aria-hidden="true" />
                    編集する
                  </button>
                </PanelBlock>

                <PanelBlock title="作品紹介">
                  <p className="text-sm text-zinc-300">{summarizeSubmitDraftIntroduction(draft)}</p>
                  <button type="button" onClick={() => setEditMode("introduction")} className={panelButtonClassName}>
                    <Sparkles className="size-4 shrink-0 text-zinc-500" aria-hidden="true" />
                    編集する
                  </button>
                </PanelBlock>

                <PanelBlock title="画像">
                  <p className="text-sm text-zinc-300">{summarizeSubmitDraftImages(draft)}</p>
                  <button type="button" onClick={() => setEditMode("images")} className={panelButtonClassName}>
                    <ImageIcon className="size-4 shrink-0 text-zinc-500" aria-hidden="true" />
                    編集する
                  </button>
                </PanelBlock>
              </div>
            </div>

            <div className="space-y-2">
              <GroupLabel>遊び方・公開</GroupLabel>
              <div className="space-y-2">
                <PanelBlock title="プレイ情報・公開先">
                  <p className="text-sm text-zinc-300">{summarizeSubmitDraftPlayInfo(draft)}</p>
                  <button type="button" onClick={() => setEditMode("play-info")} className={panelButtonClassName}>
                    <Link2 className="size-4 shrink-0 text-zinc-500" aria-hidden="true" />
                    編集する
                  </button>
                </PanelBlock>

                <PanelBlock title="公開設定">
                  <div className="flex items-center justify-between rounded-lg border border-zinc-800/60 bg-zinc-950/30 px-3 py-2">
                    <span className="text-xs text-zinc-500">公開状態</span>
                    <span className="text-sm font-medium text-zinc-200">{visibilityLabel}</span>
                  </div>
                  <button type="button" onClick={() => setEditMode("visibility")} className={panelButtonClassName}>
                    <Pencil className="size-4 shrink-0 text-zinc-500" aria-hidden="true" />
                    編集する
                  </button>
                </PanelBlock>
              </div>
            </div>

            <div className="space-y-2">
              <GroupLabel>フィードバック設定</GroupLabel>
              <PanelBlock title="プレイヤーに聞きたいこと（任意）">
                <p className="text-xs leading-relaxed text-zinc-600">
                  未設定の場合は、プレイ後にデフォルトの問いが表示されます。
                </p>
                <p className="text-sm text-zinc-300">{promptSummary}</p>
                <VersionPromptSettingsTrigger
                  mode={draft.promptMode}
                  onModeChange={(promptMode) => onDraftChange({ promptMode })}
                  drafts={draft.promptDrafts}
                  onDraftsChange={(promptDrafts) => onDraftChange({ promptDrafts })}
                  showValidation={showPromptValidation}
                  versionLabel="初回のプレイ可能ver"
                  title="プレイヤーに聞きたいこと"
                  buttonLabel="問いを設定"
                />
              </PanelBlock>
            </div>
          </div>

          {submitError ? (
            <p
              role="alert"
              className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-200"
            >
              {submitError}
            </p>
          ) : null}

          <button
            type="button"
            onClick={onSubmit}
            disabled={submitting}
            className={primaryButtonClassName}
          >
            {submitting ? "投稿中…" : "投稿する"}
          </button>
        </div>
      </div>
    </aside>
  );
}
