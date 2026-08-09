"use client";

import {
  SlidersHorizontal,
  Info,
  Tags,
  Sparkles,
  Image as ImageIcon,
  Gamepad2,
  Globe,
  MessageCircleQuestion,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { scrollStudioPanelToTop } from "@/lib/studio-panel-scroll";
import { VersionPromptSettingsTrigger } from "@/components/version-prompt-settings-modal";
import {
  StudioActionGroup,
  StudioActionRow,
  StudioStatusRow,
} from "@/components/studio-action-row";
import {
  isProjectPublishSubmitDisabled,
  projectPublishSubmitLabel,
} from "@/lib/project-publish-og-gate";
import {
  StudioSubmitBasicInfoEditPanel,
  StudioSubmitGenresTagsEditPanel,
  StudioSubmitImagesEditPanel,
  StudioSubmitIntroductionEditPanel,
  StudioSubmitPlayInfoEditPanel,
  StudioSubmitPrototypeClassificationEditPanel,
  StudioSubmitPrototypePublicationEditPanel,
  StudioSubmitPrototypeUsageEditPanel,
  StudioSubmitPublicationEditPanel,
} from "@/components/studio-submit-edit-panels";
import type { SubmitValidationEditMode } from "@/lib/studio-submit-draft";
import {
  summarizeSubmitDraftBasic,
  summarizeSubmitDraftGenres,
  summarizeSubmitDraftImages,
  summarizeSubmitDraftIntroduction,
  summarizeSubmitDraftPlayInfo,
  summarizeSubmitDraftPublication,
  type SubmitDraftState,
} from "@/lib/studio-submit-draft";
import {
  summarizeVersionPromptSettings,
} from "@/components/version-prompt-editor-dialog";
import {
  studioOperationPanelAsideClassName,
  studioOperationPanelHeaderAccentClassName,
  studioOperationPanelOuterClassName,
  studioOperationPanelScrollBodyClassName,
  studioOperationPanelScrollClassName,
  studioOperationPrimaryButtonClassName,
} from "@/lib/studio-operation-panel-styles";
import type { StudioFieldId, StudioPanelFocusRequest } from "@/lib/studio-preview-edit-targets";
import {
  SUBMIT_PROTOTYPE_CLASSIFICATION_ROW_LABEL,
  SUBMIT_PROTOTYPE_FEEDBACK_ASK_LABEL,
  SUBMIT_PROTOTYPE_IMAGE_COPY,
  SUBMIT_PROTOTYPE_USAGE_ROW_LABEL,
  summarizeSubmitPrototypeClassification,
  summarizeSubmitPrototypePublication,
  summarizeSubmitPrototypeUsage,
  type SubmitPrototypeCategory,
  type SubmitPrototypeCategoryFields,
} from "@/lib/prototype/studio-submit-flow";
import { PROJECT_VISIBILITY_FORM_OPTIONS } from "@/lib/project-visibility";

const primaryButtonClassName = studioOperationPrimaryButtonClassName;

const submitPanelAsideClassName = studioOperationPanelAsideClassName;

type SubmitEditMode =
  | SubmitValidationEditMode
  | "images"
  | "publication"
  | "visibility"
  | null;

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
    <div className={`${studioOperationPanelOuterClassName} ${studioOperationPanelScrollClassName}`}>
      <div className={studioOperationPanelScrollBodyClassName} data-studio-panel-scroll-body>
        <div className="w-full min-w-0 max-w-full space-y-3">{children}</div>
      </div>
    </div>
  );
}

export type StudioSubmitPanelProps = {
  draft: SubmitDraftState;
  onDraftChange: (patch: Partial<SubmitDraftState>) => void;
  onSubmit: () => void;
  submitting: boolean;
  thumbnailsBusy?: boolean;
  onThumbnailsBusyChange?: (busy: boolean) => void;
  submitError: string | null;
  showPromptValidation: boolean;
  focusEditMode?: SubmitValidationEditMode | null;
  onFocusEditModeHandled?: () => void;
  panelFocus?: StudioPanelFocusRequest | null;
  onPanelFocusHandled?: () => void;
  prototypeCategory?: SubmitPrototypeCategory | null;
  prototypeCategoryFields?: SubmitPrototypeCategoryFields;
  onPrototypeCategoryFieldsChange?: (
    patch: Partial<SubmitPrototypeCategoryFields>,
  ) => void;
  /** Asset and similar: shared fields only (no genres / play-info rows). */
  commonFieldsOnly?: boolean;
};

export function StudioSubmitPanel({
  draft,
  onDraftChange,
  onSubmit,
  submitting,
  thumbnailsBusy = false,
  onThumbnailsBusyChange,
  submitError,
  showPromptValidation,
  focusEditMode = null,
  onFocusEditModeHandled,
  panelFocus = null,
  onPanelFocusHandled,
  prototypeCategory = null,
  prototypeCategoryFields,
  onPrototypeCategoryFieldsChange,
  commonFieldsOnly = false,
}: StudioSubmitPanelProps) {
  const [editMode, setEditMode] = useState<SubmitEditMode>(null);
  const [highlightFieldId, setHighlightFieldId] = useState<StudioFieldId | null>(null);
  const [scrollOnHighlight, setScrollOnHighlight] = useState(true);
  const promptSummary = summarizeVersionPromptSettings(draft.promptMode, draft.promptDrafts);
  const isPrototype = Boolean(prototypeCategory);
  const useCommonShell = commonFieldsOnly || isPrototype;
  const imageCopy = prototypeCategory
    ? SUBMIT_PROTOTYPE_IMAGE_COPY[prototypeCategory]
    : null;

  useEffect(() => {
    if (!focusEditMode) {
      return;
    }
    setEditMode(focusEditMode);
    setHighlightFieldId(null);
    setScrollOnHighlight(false);
    scrollStudioPanelToTop();
    onFocusEditModeHandled?.();
  }, [focusEditMode, onFocusEditModeHandled]);

  useEffect(() => {
    if (!panelFocus) {
      return;
    }
    const nextMode = panelFocus.editMode as SubmitEditMode;
    const shouldScrollToField = panelFocus.scrollToField !== false;
    setEditMode(nextMode);
    setScrollOnHighlight(shouldScrollToField);
    setHighlightFieldId(shouldScrollToField ? panelFocus.fieldId : null);
    scrollStudioPanelToTop();
    onPanelFocusHandled?.();
    const timer = window.setTimeout(() => setHighlightFieldId(null), 2400);
    return () => window.clearTimeout(timer);
  }, [panelFocus, onPanelFocusHandled]);

  function openEdit(mode: Exclude<SubmitEditMode, null>) {
    setEditMode(mode);
    setHighlightFieldId(null);
    setScrollOnHighlight(false);
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
            highlightFieldId={scrollOnHighlight ? editHighlight : null}
            titlePlaceholder={useCommonShell ? "作品のタイトル" : "ゲームのタイトル"}
          />
        </StudioPanelScrollShell>
      </aside>
    );
  }
  if (
    editMode === "genres-tags" &&
    !commonFieldsOnly &&
    prototypeCategory &&
    prototypeCategoryFields &&
    onPrototypeCategoryFieldsChange
  ) {
    return (
      <aside aria-label="Studioパネル" className={submitPanelAsideClassName}>
        <StudioPanelScrollShell>
          {submitError ? <SubmitValidationAlert message={submitError} /> : null}
          <StudioSubmitPrototypeClassificationEditPanel
            category={prototypeCategory}
            fields={prototypeCategoryFields}
            draft={draft}
            onFieldsChange={onPrototypeCategoryFieldsChange}
            onDraftChange={onDraftChange}
            onCancel={closeEdit}
          />
        </StudioPanelScrollShell>
      </aside>
    );
  }
  if (editMode === "genres-tags" && !commonFieldsOnly) {
    return (
      <aside aria-label="Studioパネル" className={submitPanelAsideClassName}>
        <StudioPanelScrollShell>
          {submitError ? <SubmitValidationAlert message={submitError} /> : null}
          <StudioSubmitGenresTagsEditPanel
            draft={draft}
            onApply={applyPatch}
            onCancel={closeEdit}
            highlightFieldId={scrollOnHighlight ? editHighlight : null}
          />
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
            onThumbnailsBusyChange={onThumbnailsBusyChange}
            imageLabel={imageCopy?.label}
            imageHint={imageCopy?.hint}
            imageCountHelper={
              imageCopy
                ? (count) =>
                    count === 0 ? imageCopy.helperEmpty : `${count}枚`
                : undefined
            }
          />
        </StudioPanelScrollShell>
      </aside>
    );
  }
  if (
    editMode === "play-info" &&
    !commonFieldsOnly &&
    prototypeCategory &&
    prototypeCategoryFields &&
    onPrototypeCategoryFieldsChange
  ) {
    return (
      <aside aria-label="Studioパネル" className={submitPanelAsideClassName}>
        <StudioPanelScrollShell>
          {submitError ? <SubmitValidationAlert message={submitError} /> : null}
          <StudioSubmitPrototypeUsageEditPanel
            category={prototypeCategory}
            fields={prototypeCategoryFields}
            onChange={onPrototypeCategoryFieldsChange}
            onCancel={closeEdit}
          />
        </StudioPanelScrollShell>
      </aside>
    );
  }
  if (editMode === "play-info" && !commonFieldsOnly) {
    return (
      <aside aria-label="Studioパネル" className={submitPanelAsideClassName}>
        <StudioPanelScrollShell>
          {submitError ? <SubmitValidationAlert message={submitError} /> : null}
          <StudioSubmitPlayInfoEditPanel
            draft={draft}
            onApply={applyPatch}
            onCancel={closeEdit}
            highlightFieldId={scrollOnHighlight ? editHighlight : null}
          />
        </StudioPanelScrollShell>
      </aside>
    );
  }
  if (
    (editMode === "publication" || editMode === "visibility") &&
    !commonFieldsOnly &&
    prototypeCategory &&
    prototypeCategoryFields &&
    onPrototypeCategoryFieldsChange
  ) {
    return (
      <aside aria-label="Studioパネル" className={submitPanelAsideClassName}>
        <StudioPanelScrollShell>
          {submitError ? <SubmitValidationAlert message={submitError} /> : null}
          <StudioSubmitPrototypePublicationEditPanel
            category={prototypeCategory}
            draft={draft}
            fields={prototypeCategoryFields}
            onDraftChange={onDraftChange}
            onFieldsChange={onPrototypeCategoryFieldsChange}
            onCancel={closeEdit}
          />
        </StudioPanelScrollShell>
      </aside>
    );
  }
  if (editMode === "publication" || editMode === "visibility") {
    return (
      <aside aria-label="Studioパネル" className={submitPanelAsideClassName}>
        <StudioPanelScrollShell>
          {submitError ? <SubmitValidationAlert message={submitError} /> : null}
          <StudioSubmitPublicationEditPanel
            draft={draft}
            onApply={applyPatch}
            onCancel={closeEdit}
            highlightFieldId={scrollOnHighlight ? editHighlight : null}
          />
        </StudioPanelScrollShell>
      </aside>
    );
  }

  const feedbackAskLabel = prototypeCategory
    ? SUBMIT_PROTOTYPE_FEEDBACK_ASK_LABEL[prototypeCategory]
    : "プレイヤーに聞きたいこと";
  const feedbackVersionLabel = useCommonShell
    ? "初回の公開ver"
    : "初回のプレイ可能ver";
  const visibilityLabel =
    PROJECT_VISIBILITY_FORM_OPTIONS.find((option) => option.value === draft.visibility)
      ?.label ?? "公開設定";

  return (
    <aside aria-label="Studioパネル" className={submitPanelAsideClassName}>
      <div className={`${studioOperationPanelOuterClassName} ${studioOperationPanelScrollClassName}`}>
        <div className={studioOperationPanelScrollBodyClassName}>
          <div className="w-full min-w-0 max-w-full space-y-4">
            <div className={studioOperationPanelHeaderAccentClassName}>
              <div className="flex min-w-0 items-center gap-2">
                <span
                  className="h-4 w-0.5 shrink-0 rounded-full bg-violet-500/80"
                  aria-hidden="true"
                />
                <SlidersHorizontal className="size-3.5 shrink-0 text-violet-400/90" aria-hidden="true" />
                <h2 className="min-w-0 text-sm font-semibold tracking-tight text-zinc-100">
                  Studioパネル
                </h2>
              </div>
            </div>

            <p className="text-xs font-medium text-zinc-500">作品を投稿する</p>

          <div className="w-full min-w-0 max-w-full space-y-5">
            <StudioActionGroup label="ページの内容">
              <StudioActionRow
                icon={Info}
                label="基本情報を編集"
                summary={summarizeSubmitDraftBasic(draft)}
                required
                onClick={() => openEdit("basic-info")}
              />
              {!commonFieldsOnly ? (
                <StudioActionRow
                  icon={Tags}
                  label={
                    prototypeCategory
                      ? SUBMIT_PROTOTYPE_CLASSIFICATION_ROW_LABEL[prototypeCategory]
                      : "ジャンル・タグを編集"
                  }
                  summary={
                    prototypeCategory && prototypeCategoryFields
                      ? summarizeSubmitPrototypeClassification(
                          prototypeCategory,
                          prototypeCategoryFields,
                          draft.featureTags.length,
                        )
                      : summarizeSubmitDraftGenres(draft)
                  }
                  required
                  onClick={() => openEdit("genres-tags")}
                />
              ) : null}
              <StudioActionRow
                icon={Sparkles}
                label="作品紹介を編集"
                summary={summarizeSubmitDraftIntroduction(draft)}
                required
                onClick={() => openEdit("introduction")}
              />
              <StudioActionRow
                icon={ImageIcon}
                label="画像を編集"
                summary={summarizeSubmitDraftImages(draft)}
                onClick={() => openEdit("images")}
              />
            </StudioActionGroup>

            <StudioActionGroup label={commonFieldsOnly ? "公開" : isPrototype ? "利用・公開" : "遊び方・公開"}>
              {!commonFieldsOnly ? (
                <StudioActionRow
                  icon={Gamepad2}
                  label={
                    prototypeCategory
                      ? SUBMIT_PROTOTYPE_USAGE_ROW_LABEL[prototypeCategory]
                      : "プレイ情報を編集"
                  }
                  summary={
                    prototypeCategory && prototypeCategoryFields
                      ? summarizeSubmitPrototypeUsage(
                          prototypeCategory,
                          prototypeCategoryFields,
                        )
                      : summarizeSubmitDraftPlayInfo(draft)
                  }
                  required={!isPrototype}
                  onClick={() => openEdit("play-info")}
                />
              ) : null}
              <StudioActionRow
                icon={Globe}
                label="公開先・公開設定を編集"
                summary={
                  prototypeCategory && prototypeCategoryFields
                    ? summarizeSubmitPrototypePublication(
                        prototypeCategoryFields,
                        visibilityLabel,
                      )
                    : summarizeSubmitDraftPublication(draft)
                }
                onClick={() => openEdit("publication")}
              />
            </StudioActionGroup>

            <StudioActionGroup label="フィードバック設定">
              <div className="space-y-2 px-1">
                <div className="flex items-start gap-3 rounded-lg px-1.5 py-1">
                  <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md border border-zinc-800/80 bg-zinc-950/60 text-zinc-400">
                    <MessageCircleQuestion className="size-3.5" aria-hidden="true" />
                  </span>
                  <div className="min-w-0 flex-1 space-y-2">
                    <div>
                      <p className="text-sm font-medium text-zinc-100">{feedbackAskLabel}</p>
                      <p className="mt-0.5 text-xs text-zinc-500">{promptSummary}</p>
                    </div>
                    <VersionPromptSettingsTrigger
                      mode={draft.promptMode}
                      onModeChange={(promptMode) => onDraftChange({ promptMode })}
                      drafts={draft.promptDrafts}
                      onDraftsChange={(promptDrafts) => onDraftChange({ promptDrafts })}
                      showValidation={showPromptValidation}
                      versionLabel={feedbackVersionLabel}
                      title={feedbackAskLabel}
                      buttonLabel="問いを設定"
                    />
                  </div>
                </div>
              </div>
            </StudioActionGroup>

            <div className="border-t border-zinc-800/80 pt-2">
              <StudioStatusRow label="保存状態">
                <span className="text-zinc-400">下書き（投稿前）</span>
              </StudioStatusRow>
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

        <div className="w-full min-w-0 max-w-full shrink-0 box-border border-t border-zinc-800/80 bg-zinc-900/95 pt-3">
          <button
            type="button"
            onClick={onSubmit}
            disabled={
              useCommonShell
                ? false
                : isProjectPublishSubmitDisabled({
                    submitting,
                    thumbnailsBusy,
                  })
            }
            className={primaryButtonClassName}
          >
            {useCommonShell
              ? projectPublishSubmitLabel({
                  submitting: false,
                  thumbnailsBusy: false,
                  hasThumbnails: draft.thumbnailUrls.length > 0,
                })
              : projectPublishSubmitLabel({
                  submitting,
                  thumbnailsBusy,
                  hasThumbnails: draft.thumbnailUrls.length > 0,
                })}
          </button>
        </div>
      </div>
    </aside>
  );
}
