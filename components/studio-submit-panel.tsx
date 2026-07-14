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

const primaryButtonClassName = studioOperationPrimaryButtonClassName;

const submitPanelAsideClassName = studioOperationPanelAsideClassName;

type SubmitEditMode = SubmitValidationEditMode | "images" | "publication" | "visibility" | null;

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
}: StudioSubmitPanelProps) {
  const [editMode, setEditMode] = useState<SubmitEditMode>(null);
  const [highlightFieldId, setHighlightFieldId] = useState<StudioFieldId | null>(null);
  const [scrollOnHighlight, setScrollOnHighlight] = useState(true);
  const promptSummary = summarizeVersionPromptSettings(draft.promptMode, draft.promptDrafts);

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
            highlightFieldId={scrollOnHighlight ? editHighlight : null}
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
              <StudioActionRow
                icon={Tags}
                label="ジャンル・タグを編集"
                summary={summarizeSubmitDraftGenres(draft)}
                required
                onClick={() => openEdit("genres-tags")}
              />
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

            <StudioActionGroup label="遊び方・公開">
              <StudioActionRow
                icon={Gamepad2}
                label="プレイ情報を編集"
                summary={summarizeSubmitDraftPlayInfo(draft)}
                required
                onClick={() => openEdit("play-info")}
              />
              <StudioActionRow
                icon={Globe}
                label="公開先・公開設定を編集"
                summary={summarizeSubmitDraftPublication(draft)}
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
                      <p className="text-sm font-medium text-zinc-100">プレイヤーに聞きたいこと</p>
                      <p className="mt-0.5 text-xs text-zinc-500">{promptSummary}</p>
                    </div>
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
            disabled={isProjectPublishSubmitDisabled({
              submitting,
              thumbnailsBusy,
            })}
            className={primaryButtonClassName}
          >
            {projectPublishSubmitLabel({
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
