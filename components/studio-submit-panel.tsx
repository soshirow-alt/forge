"use client";

import { SlidersHorizontal, Pencil, Sparkles, Image as ImageIcon, Link2 } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { scrollStudioPanelToTop } from "@/lib/studio-panel-scroll";
import { VersionPromptSettingsTrigger } from "@/components/version-prompt-settings-modal";
import {
  StudioSubmitBasicInfoEditPanel,
  StudioSubmitGenresTagsEditPanel,
  StudioSubmitImagesEditPanel,
  StudioSubmitIntroductionEditPanel,
  StudioSubmitPlayInfoEditPanel,
  StudioSubmitVisibilityEditPanel,
} from "@/components/studio-submit-edit-panels";
import type { SubmitValidationEditMode } from "@/lib/studio-submit-draft";
import { getVisibilityBadgeLabel } from "@/lib/project-visibility";
import {
  summarizeSubmitDraftBasic,
  summarizeSubmitDraftGenres,
  summarizeSubmitDraftImages,
  summarizeSubmitDraftIntroduction,
  summarizeSubmitDraftPlayInfo,
  type SubmitDraftState,
} from "@/lib/studio-submit-draft";
import {
  summarizeVersionPromptSettings,
} from "@/components/version-prompt-editor-dialog";
import {
  studioOperationPanelAsideClassName,
  studioOperationPanelBlockClassName,
  studioOperationPanelGroupLabelClassName,
  studioOperationPanelGuidanceClassName,
  studioOperationPanelHeaderAccentClassName,
  studioOperationPanelOuterClassName,
  studioOperationPanelScrollBodyClassName,
  studioOperationPanelScrollClassName,
} from "@/lib/studio-operation-panel-styles";
import type { StudioFieldId, StudioPanelFocusRequest } from "@/lib/studio-preview-edit-targets";

const panelButtonClassName =
  "inline-flex w-full items-center gap-2 rounded-lg border border-zinc-800/60 bg-zinc-950/40 px-3 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:border-zinc-700 hover:bg-zinc-900/70 hover:text-zinc-100";

const primaryButtonClassName =
  "inline-flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-2.5 text-sm font-semibold text-zinc-950 shadow-sm shadow-orange-500/20 transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50";

const submitPanelAsideClassName = studioOperationPanelAsideClassName;

const panelSummaryClassName = "break-words text-sm text-zinc-300";

type SubmitEditMode = SubmitValidationEditMode | "images" | "visibility" | null;

type RequirementBadge = "required" | "optional";

function RequirementLabel({ kind }: { kind: RequirementBadge }) {
  return (
    <span
      className={`rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide ${
        kind === "required"
          ? "bg-orange-500/15 text-orange-300 ring-1 ring-orange-500/25"
          : "bg-zinc-800/80 text-zinc-500"
      }`}
    >
      {kind === "required" ? "必須" : "任意"}
    </span>
  );
}

function PanelBlock({
  title,
  requirement,
  fieldHint,
  children,
}: {
  title?: string;
  requirement?: RequirementBadge;
  fieldHint?: string;
  children: ReactNode;
}) {
  return (
    <section className={studioOperationPanelBlockClassName}>
      {title ? (
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-orange-300/80">
              {title}
            </h3>
            {requirement ? <RequirementLabel kind={requirement} /> : null}
          </div>
          {fieldHint ? <p className="text-[11px] text-zinc-600">{fieldHint}</p> : null}
        </div>
      ) : null}
      <div className={title ? "mt-3 space-y-2" : "space-y-2"}>{children}</div>
    </section>
  );
}

function SubmitValidationAlert({ message }: { message: string }) {
  return (
    <p
      role="alert"
      className="mb-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-200"
    >
      {message}
    </p>
  );
}

function StudioPanelScrollShell({ children }: { children: ReactNode }) {
  return (
    <div className={studioOperationPanelScrollClassName}>
      <div className={studioOperationPanelScrollBodyClassName}>{children}</div>
    </div>
  );
}

function GroupLabel({ children }: { children: ReactNode }) {
  return <p className={studioOperationPanelGroupLabelClassName}>{children}</p>;
}

function StudioPanelGuidance() {
  return (
    <p className={studioOperationPanelGuidanceClassName}>
      右の項目を編集すると、左の公開ページプレビューに反映されます。左のプレビュー上の項目をクリックして、対応する入力欄へ移動することもできます。
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
  focusEditMode?: SubmitValidationEditMode | null;
  onFocusEditModeHandled?: () => void;
  panelFocus?: StudioPanelFocusRequest | null;
  onPanelFocusHandled?: () => void;
};

export function StudioSubmitPanel({
  draft,
  onDraftChange,
  onSubmit,
  submitting,
  submitError,
  showPromptValidation,
  focusEditMode = null,
  onFocusEditModeHandled,
  panelFocus = null,
  onPanelFocusHandled,
}: StudioSubmitPanelProps) {
  const [editMode, setEditMode] = useState<SubmitEditMode>(null);
  const [highlightFieldId, setHighlightFieldId] = useState<StudioFieldId | null>(null);
  const visibilityLabel = getVisibilityBadgeLabel(draft.visibility);
  const promptSummary = summarizeVersionPromptSettings(draft.promptMode, draft.promptDrafts);

  useEffect(() => {
    if (!focusEditMode) {
      return;
    }
    setEditMode(focusEditMode);
    scrollStudioPanelToTop();
    onFocusEditModeHandled?.();
  }, [focusEditMode, onFocusEditModeHandled]);

  useEffect(() => {
    if (!panelFocus) {
      return;
    }
    setEditMode(panelFocus.editMode as SubmitEditMode);
    setHighlightFieldId(panelFocus.fieldId);
    scrollStudioPanelToTop();
    onPanelFocusHandled?.();
    const timer = window.setTimeout(() => setHighlightFieldId(null), 2400);
    return () => window.clearTimeout(timer);
  }, [panelFocus, onPanelFocusHandled]);

  function openEdit(mode: Exclude<SubmitEditMode, null>) {
    setEditMode(mode);
    setHighlightFieldId(null);
    scrollStudioPanelToTop();
  }

  function applyPatch(patch: Partial<SubmitDraftState>) {
    onDraftChange(patch);
  }

  function closeEdit() {
    setEditMode(null);
    setHighlightFieldId(null);
  }

  const editHighlight = highlightFieldId;

  if (editMode === "basic-info") {
    return (
      <aside aria-label="Studioパネル" className={submitPanelAsideClassName}>
        <StudioPanelScrollShell>
          {submitError ? <SubmitValidationAlert message={submitError} /> : null}
          <StudioSubmitBasicInfoEditPanel
            draft={draft}
            onApply={applyPatch}
            onCancel={closeEdit}
            highlightFieldId={editHighlight}
          />
        </StudioPanelScrollShell>
      </aside>
    );
  }
  if (editMode === "genres-tags") {
    return (
      <aside aria-label="Studioパネル" className={submitPanelAsideClassName}>
        <StudioPanelScrollShell>
          {submitError ? <SubmitValidationAlert message={submitError} /> : null}
          <StudioSubmitGenresTagsEditPanel draft={draft} onApply={applyPatch} onCancel={closeEdit} />
        </StudioPanelScrollShell>
      </aside>
    );
  }
  if (editMode === "introduction") {
    return (
      <aside aria-label="Studioパネル" className={submitPanelAsideClassName}>
        <StudioPanelScrollShell>
          {submitError ? <SubmitValidationAlert message={submitError} /> : null}
          <StudioSubmitIntroductionEditPanel
            draft={draft}
            onApply={applyPatch}
            onCancel={closeEdit}
            highlightFieldId={editHighlight}
          />
        </StudioPanelScrollShell>
      </aside>
    );
  }
  if (editMode === "images") {
    return (
      <aside aria-label="Studioパネル" className={submitPanelAsideClassName}>
        <StudioPanelScrollShell>
          <StudioSubmitImagesEditPanel
            draft={draft}
            onApply={applyPatch}
            onCancel={closeEdit}
            highlightFieldId={editHighlight}
          />
        </StudioPanelScrollShell>
      </aside>
    );
  }
  if (editMode === "play-info") {
    return (
      <aside aria-label="Studioパネル" className={submitPanelAsideClassName}>
        <StudioPanelScrollShell>
          {submitError ? <SubmitValidationAlert message={submitError} /> : null}
          <StudioSubmitPlayInfoEditPanel
            draft={draft}
            onApply={applyPatch}
            onCancel={closeEdit}
            highlightFieldId={editHighlight}
          />
        </StudioPanelScrollShell>
      </aside>
    );
  }
  if (editMode === "visibility") {
    return (
      <aside aria-label="Studioパネル" className={submitPanelAsideClassName}>
        <StudioPanelScrollShell>
          <StudioSubmitVisibilityEditPanel draft={draft} onApply={applyPatch} onCancel={closeEdit} />
        </StudioPanelScrollShell>
      </aside>
    );
  }

  return (
    <aside aria-label="Studioパネル" className={submitPanelAsideClassName}>
      <div className={`${studioOperationPanelOuterClassName} ${studioOperationPanelScrollClassName}`}>
        <div className={studioOperationPanelScrollBodyClassName}>
          <div className="space-y-4">
            <div className={studioOperationPanelHeaderAccentClassName}>
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
            <StudioPanelGuidance />

          <div className="space-y-5">
            <div className="space-y-2">
              <GroupLabel>ページの内容</GroupLabel>
              <div className="space-y-2">
                <PanelBlock
                  title="基本情報"
                  requirement="required"
                  fieldHint="タイトル・キャッチコピー・開発フェーズ"
                >
                  <p className={panelSummaryClassName}>{summarizeSubmitDraftBasic(draft)}</p>
                  <button type="button" onClick={() => openEdit("basic-info")} className={panelButtonClassName}>
                    <Pencil className="size-4 shrink-0 text-zinc-500" aria-hidden="true" />
                    編集する
                  </button>
                </PanelBlock>

                <PanelBlock
                  title="ジャンル・タグ"
                  requirement="required"
                  fieldHint="ジャンル（必須）・特徴タグ（任意）"
                >
                  <p className={panelSummaryClassName}>{summarizeSubmitDraftGenres(draft)}</p>
                  <button type="button" onClick={() => openEdit("genres-tags")} className={panelButtonClassName}>
                    <Pencil className="size-4 shrink-0 text-zinc-500" aria-hidden="true" />
                    編集する
                  </button>
                </PanelBlock>

                <PanelBlock title="作品紹介" requirement="required">
                  <p className={panelSummaryClassName}>{summarizeSubmitDraftIntroduction(draft)}</p>
                  <button type="button" onClick={() => openEdit("introduction")} className={panelButtonClassName}>
                    <Sparkles className="size-4 shrink-0 text-zinc-500" aria-hidden="true" />
                    編集する
                  </button>
                </PanelBlock>

                <PanelBlock title="画像" requirement="optional" fieldHint="未設定でも投稿できます">
                  <p className={panelSummaryClassName}>{summarizeSubmitDraftImages(draft)}</p>
                  <button type="button" onClick={() => openEdit("images")} className={panelButtonClassName}>
                    <ImageIcon className="size-4 shrink-0 text-zinc-500" aria-hidden="true" />
                    編集する
                  </button>
                </PanelBlock>
              </div>
            </div>

            <div className="space-y-2">
              <GroupLabel>遊び方・公開</GroupLabel>
              <div className="space-y-2">
                <PanelBlock
                  title="プレイ情報・公開先"
                  requirement="required"
                  fieldHint="料金・公開形態・配布形式・プレイURL"
                >
                  <p className={panelSummaryClassName}>{summarizeSubmitDraftPlayInfo(draft)}</p>
                  <button type="button" onClick={() => openEdit("play-info")} className={panelButtonClassName}>
                    <Link2 className="size-4 shrink-0 text-zinc-500" aria-hidden="true" />
                    編集する
                  </button>
                </PanelBlock>

                <PanelBlock title="公開設定" requirement="optional">
                  <div className="flex items-center justify-between rounded-lg border border-zinc-800/60 bg-zinc-950/30 px-3 py-2">
                    <span className="text-xs text-zinc-500">公開状態</span>
                    <span className="text-sm font-medium text-zinc-200">{visibilityLabel}</span>
                  </div>
                  <button type="button" onClick={() => openEdit("visibility")} className={panelButtonClassName}>
                    <Pencil className="size-4 shrink-0 text-zinc-500" aria-hidden="true" />
                    編集する
                  </button>
                </PanelBlock>
              </div>
            </div>

            <div className="space-y-2">
              <GroupLabel>フィードバック設定</GroupLabel>
              <PanelBlock title="プレイヤーに聞きたいこと" requirement="optional">
                <p className="text-xs leading-relaxed text-zinc-600">
                  未設定の場合は、プレイ後にデフォルトの問いが表示されます。
                </p>
                <p className={panelSummaryClassName}>{promptSummary}</p>
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
          </div>
        </div>

        <div className="sticky bottom-0 shrink-0 border-t border-zinc-800/80 bg-zinc-900/95 pt-3">
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
