"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Image as ImageIcon, Pencil, Sparkles, Link2, FileText, Eye } from "lucide-react";
import { StudioEditSectionSwitcher } from "@/components/studio-edit-section-switcher";
import { StudioOverviewBasicInfoEditPanel } from "@/components/studio-overview-basic-info-edit-panel";
import { StudioOverviewGenresTagsEditPanel } from "@/components/studio-overview-genres-tags-edit-panel";
import { StudioOverviewImagesEditPanel } from "@/components/studio-overview-images-edit-panel";
import { StudioOverviewVisibilityEditPanel } from "@/components/studio-overview-visibility-edit-panel";
import { StudioOverviewIntroductionEditPanel } from "@/components/studio-overview-introduction-edit-panel";
import { StudioOverviewPlayInfoEditPanel } from "@/components/studio-overview-play-info-edit-panel";
import { StudioDevlogCurrentEditPanel } from "@/components/studio-devlog-current-edit-panel";
import { StudioReleaseAboutBlock } from "@/components/studio-release-about-block";
import { StudioPlayerFeedbackPanel } from "@/components/studio-improvement-loop";
import { StudioTopPrioritiesPanel } from "@/components/studio-top-priorities-panel";
import { useGames } from "@/components/games-provider";
import { formatDevlogPublishedAt } from "@/hooks/use-game-devlogs-v0";
import { useNurtureVoiceRead } from "@/hooks/use-nurture-feedback-read";
import { sortDevlogsNewestFirst } from "@/lib/devlogs";
import type { GameDetailTab } from "@/lib/game-detail-tabs";
import type { Game } from "@/lib/mock-games";
import {
  PROJECT_STUDIO_FEEDBACK_SECTION_ID,
  gamePlayHref,
} from "@/lib/project-nurture-links";
import {
  filterDeepFeedbackForVersion,
  type ProjectGrowthSnapshot,
} from "@/lib/project-growth-state";
import type { ProjectFeedbackEntry } from "@/lib/supabase/user-engagement";
import { resolvePlayableVersion } from "@/lib/playable-version";
import type { StudioEditPreviewPatch } from "@/lib/studio-edit-preview-merge";
import {
  studioOperationPanelAsideClassName,
  studioOperationPanelBlockClassName,
  studioOperationPanelGroupLabelClassName,
  studioOperationPanelGuidanceClassName,
  studioOperationPanelOuterClassName,
  studioOperationPanelScrollBodyClassName,
  studioOperationPanelScrollClassName,
} from "@/lib/studio-operation-panel-styles";
import type { StudioFieldId, StudioPanelFocusRequest } from "@/lib/studio-preview-edit-targets";
import { getVisibilityBadgeLabel, isGamePublic } from "@/lib/project-visibility";
import { scrollStudioPanelToTop } from "@/lib/studio-panel-scroll";
import type { StudioOverviewEditMode } from "@/lib/studio-edit-url";

const primaryButtonClassName =
  "inline-flex w-full min-w-0 max-w-full box-border items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-2.5 text-sm font-semibold text-zinc-950 shadow-sm shadow-orange-500/20 transition-opacity hover:opacity-90";

const panelButtonClassName =
  "inline-flex w-full min-w-0 max-w-full box-border items-center gap-2 rounded-lg border border-zinc-800/60 bg-zinc-950/40 px-3 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:border-zinc-700 hover:bg-zinc-900/70 hover:text-zinc-100";

const SECTION_CONTENT_HEADINGS: Record<GameDetailTab, string> = {
  overview: "公開ページを編集",
  devlog: "開発ログを更新",
  voices: "フィードバックを見る",
};

type DevlogEditMode = null | "current";

function openOverviewEdit(
  mode: StudioOverviewEditMode,
  setMode: (mode: StudioOverviewEditMode) => void,
) {
  setMode(mode);
  scrollStudioPanelToTop();
}

function StudioEditPaneShell({ children }: { children: ReactNode }) {
  return (
    <aside aria-label="Studioパネル" className={studioOperationPanelAsideClassName}>
      <div className={`${studioOperationPanelOuterClassName} ${studioOperationPanelScrollClassName}`}>
        <div className={studioOperationPanelScrollBodyClassName}>
          <div className="w-full min-w-0 max-w-full space-y-4">{children}</div>
        </div>
      </div>
    </aside>
  );
}

function PanelBlock({
  title,
  children,
}: {
  title?: string;
  children: ReactNode;
}) {
  return (
    <section className={studioOperationPanelBlockClassName}>
      {title ? (
        <h3 className="text-xs font-semibold uppercase tracking-wide text-orange-300/80">{title}</h3>
      ) : null}
      <div className={title ? "mt-3 space-y-2" : "space-y-2"}>{children}</div>
    </section>
  );
}

function OverviewGroupLabel({ children }: { children: ReactNode }) {
  return <p className={studioOperationPanelGroupLabelClassName}>{children}</p>;
}

export type StudioTabContextPanelProps = {
  projectId: string;
  activeSection: GameDetailTab;
  onSectionChange: (section: GameDetailTab) => void;
  game: Game;
  growth: ProjectGrowthSnapshot;
  feedbackEntries: ProjectFeedbackEntry[];
  devlogCount: number;
  initialOpenFeedback?: boolean;
  onOpenNewVersionDevlog: () => void;
  onPreviewPatchChange?: (patch: StudioEditPreviewPatch | null) => void;
  initialOverviewEditMode?: StudioOverviewEditMode | null;
  onInitialOverviewEditHandled?: () => void;
  panelFocus?: StudioPanelFocusRequest | null;
  onPanelFocusHandled?: () => void;
};

export function StudioTabContextPanel({
  projectId,
  activeSection,
  onSectionChange,
  game,
  growth,
  feedbackEntries,
  devlogCount,
  initialOpenFeedback = false,
  onOpenNewVersionDevlog,
  onPreviewPatchChange,
  initialOverviewEditMode = null,
  onInitialOverviewEditHandled,
  panelFocus = null,
  onPanelFocusHandled,
}: StudioTabContextPanelProps) {
  const { getDevlogsByProject, getOwnerStudioVoiceResponseCount } = useGames();
  const [overviewEditMode, setOverviewEditMode] = useState<StudioOverviewEditMode | null>(null);
  const [devlogEditMode, setDevlogEditMode] = useState<DevlogEditMode>(null);
  const [highlightFieldId, setHighlightFieldId] = useState<StudioFieldId | null>(null);

  const versionKey = resolvePlayableVersion(growth.playableVersion);
  const versionLabel = `v${versionKey}`;
  const { isRead: voiceRead, markRead } = useNurtureVoiceRead(game.id, versionKey);

  const registeredQuickFbCount = growth.totalVoiceResponseCount;
  const [studioVoiceCount, setStudioVoiceCount] = useState(registeredQuickFbCount);
  const quickFbCount = studioVoiceCount;
  const detailedFbCount = useMemo(
    () => filterDeepFeedbackForVersion(feedbackEntries, versionKey).length,
    [feedbackEntries, versionKey],
  );
  const hasFeedback = quickFbCount > 0 || detailedFbCount > 0;
  const hasUnreadVoice = !voiceRead && registeredQuickFbCount > 0;
  const totalFeedbackCount = quickFbCount + detailedFbCount;

  useEffect(() => {
    void getOwnerStudioVoiceResponseCount(projectId, versionKey)
      .then(setStudioVoiceCount)
      .catch(() => setStudioVoiceCount(registeredQuickFbCount));
  }, [
    projectId,
    versionKey,
    getOwnerStudioVoiceResponseCount,
    registeredQuickFbCount,
  ]);

  const latestDevlog = useMemo(() => {
    const devlogs = sortDevlogsNewestFirst(getDevlogsByProject(projectId));
    return devlogs[0] ?? null;
  }, [getDevlogsByProject, projectId]);

  const visibilityLabel = getVisibilityBadgeLabel(game.visibility);
  const isPublic = isGamePublic(game);
  const publicPageLabel = isPublic ? "公開ページを見る" : "確認用ページを見る";

  useEffect(() => {
    if (!initialOverviewEditMode) {
      return;
    }
    setOverviewEditMode(initialOverviewEditMode);
    scrollStudioPanelToTop();
    onInitialOverviewEditHandled?.();
  }, [initialOverviewEditMode, onInitialOverviewEditHandled]);

  useEffect(() => {
    if (!panelFocus) {
      return;
    }
    onSectionChange("overview");
    setOverviewEditMode(panelFocus.editMode as StudioOverviewEditMode);
    setHighlightFieldId(panelFocus.fieldId);
    scrollStudioPanelToTop();
    onPanelFocusHandled?.();
    const timer = window.setTimeout(() => setHighlightFieldId(null), 2400);
    return () => window.clearTimeout(timer);
  }, [panelFocus, onPanelFocusHandled, onSectionChange]);

  useEffect(() => {
    if (activeSection !== "voices" || !hasFeedback || voiceRead || quickFbCount === 0) {
      return;
    }
    void markRead();
  }, [activeSection, hasFeedback, voiceRead, quickFbCount, markRead]);

  useEffect(() => {
    if (activeSection !== "overview") {
      setOverviewEditMode(null);
      onPreviewPatchChange?.(null);
    }
    if (activeSection !== "devlog") {
      setDevlogEditMode(null);
    }
  }, [activeSection, onPreviewPatchChange]);

  useEffect(() => {
    onPreviewPatchChange?.(null);
  }, [overviewEditMode, onPreviewPatchChange]);

  function closeOverviewEdit() {
    setOverviewEditMode(null);
    onPreviewPatchChange?.(null);
  }

  function closeDevlogEdit() {
    setDevlogEditMode(null);
  }

  function handleOverviewSaved() {
    onPreviewPatchChange?.(null);
    closeOverviewEdit();
  }

  let sectionContent: ReactNode;

  if (activeSection === "overview") {
    if (overviewEditMode === "basic-info") {
      sectionContent = (
        <StudioOverviewBasicInfoEditPanel
          key={`${projectId}-basic-info`}
          projectId={projectId}
          onCancel={closeOverviewEdit}
          onSaved={handleOverviewSaved}
          onPreviewPatchChange={onPreviewPatchChange}
          highlightFieldId={highlightFieldId}
        />
      );
    } else if (overviewEditMode === "genres-tags") {
      sectionContent = (
        <StudioOverviewGenresTagsEditPanel
          key={`${projectId}-genres-tags`}
          projectId={projectId}
          onCancel={closeOverviewEdit}
          onSaved={handleOverviewSaved}
          onPreviewPatchChange={onPreviewPatchChange}
        />
      );
    } else if (overviewEditMode === "images") {
      sectionContent = (
        <StudioOverviewImagesEditPanel
          key={`${projectId}-images`}
          projectId={projectId}
          onCancel={closeOverviewEdit}
          onSaved={handleOverviewSaved}
          onPreviewPatchChange={onPreviewPatchChange}
        />
      );
    } else if (overviewEditMode === "visibility") {
      sectionContent = (
        <StudioOverviewVisibilityEditPanel
          key={`${projectId}-visibility`}
          projectId={projectId}
          onCancel={closeOverviewEdit}
          onSaved={handleOverviewSaved}
          onPreviewPatchChange={onPreviewPatchChange}
        />
      );
    } else if (overviewEditMode === "introduction") {
      sectionContent = (
        <StudioOverviewIntroductionEditPanel
          key={`${projectId}-introduction`}
          projectId={projectId}
          onCancel={closeOverviewEdit}
          onSaved={handleOverviewSaved}
          onPreviewPatchChange={onPreviewPatchChange}
        />
      );
    } else if (overviewEditMode === "play-info") {
      sectionContent = (
        <StudioOverviewPlayInfoEditPanel
          key={`${projectId}-play-info`}
          projectId={projectId}
          onCancel={closeOverviewEdit}
          onSaved={handleOverviewSaved}
          onPreviewPatchChange={onPreviewPatchChange}
          highlightFieldId={highlightFieldId}
        />
      );
    } else {
      sectionContent = (
        <div className="space-y-5">
          <p className={studioOperationPanelGuidanceClassName}>
            右の項目を編集すると、左の公開ページプレビューに反映されます。左のプレビュー上の項目をクリックして、対応する入力欄へ移動することもできます。
          </p>
          <div className="space-y-2">
            <OverviewGroupLabel>ページの内容</OverviewGroupLabel>
            <div className="space-y-2">
              <PanelBlock>
                <button
                  type="button"
                  onClick={() => openOverviewEdit("basic-info", setOverviewEditMode)}
                  className={panelButtonClassName}
                >
                  <Pencil className="size-4 shrink-0 text-zinc-500" aria-hidden="true" />
                  基本情報を編集
                </button>
              </PanelBlock>

              <PanelBlock>
                <button
                  type="button"
                  onClick={() => openOverviewEdit("genres-tags", setOverviewEditMode)}
                  className={panelButtonClassName}
                >
                  <Pencil className="size-4 shrink-0 text-zinc-500" aria-hidden="true" />
                  ジャンル・タグを編集
                </button>
              </PanelBlock>

              <PanelBlock>
                <button
                  type="button"
                  onClick={() => openOverviewEdit("introduction", setOverviewEditMode)}
                  className={panelButtonClassName}
                >
                  <Sparkles className="size-4 shrink-0 text-zinc-500" aria-hidden="true" />
                  作品紹介を編集
                </button>
              </PanelBlock>

              <PanelBlock>
                <button
                  type="button"
                  onClick={() => openOverviewEdit("images", setOverviewEditMode)}
                  className={panelButtonClassName}
                >
                  <ImageIcon className="size-4 shrink-0 text-zinc-500" aria-hidden="true" />
                  画像を編集
                </button>
              </PanelBlock>
            </div>
          </div>

          <div className="space-y-2">
            <OverviewGroupLabel>遊び方・公開</OverviewGroupLabel>
            <div className="space-y-2">
              <PanelBlock>
                <button
                  type="button"
                  onClick={() => openOverviewEdit("play-info", setOverviewEditMode)}
                  className={panelButtonClassName}
                >
                  <Link2 className="size-4 shrink-0 text-zinc-500" aria-hidden="true" />
                  プレイ情報・公開先を編集
                </button>
              </PanelBlock>

              <PanelBlock title="公開設定">
                <div className="flex items-center justify-between rounded-lg border border-zinc-800/60 bg-zinc-950/30 px-3 py-2">
                  <span className="text-xs text-zinc-500">公開状態</span>
                  <span className="text-sm font-medium text-zinc-200">{visibilityLabel}</span>
                </div>
                <button
                  type="button"
                  onClick={() => openOverviewEdit("visibility", setOverviewEditMode)}
                  className={panelButtonClassName}
                >
                  <Pencil className="size-4 shrink-0 text-zinc-500" aria-hidden="true" />
                  公開設定を編集
                </button>
              </PanelBlock>

              <p className="pt-0.5 text-[11px] text-zinc-600">
                <Link
                  href={gamePlayHref(projectId)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-zinc-500 underline-offset-2 hover:text-violet-300 hover:underline"
                >
                  {publicPageLabel}
                </Link>
                <span className="text-zinc-700"> · </span>
                共有はマイページの作品カードから
              </p>
            </div>
          </div>
        </div>
      );
    }
  } else if (activeSection === "devlog") {
    if (devlogEditMode === "current") {
      sectionContent = (
        <StudioDevlogCurrentEditPanel
          key={`${projectId}-devlog-current`}
          projectId={projectId}
          playableVersion={versionKey}
          onCancel={closeDevlogEdit}
          onOpenNewVersionDevlog={onOpenNewVersionDevlog}
          onSaved={closeDevlogEdit}
        />
      );
    } else {
      const currentDevlogMeta = latestDevlog
        ? `${latestDevlog.publishedVersion ?? versionLabel} / ${formatDevlogPublishedAt(latestDevlog.date)}更新`
        : `${versionLabel} / 開発ログ未作成`;
      const currentDevlogExcerpt = latestDevlog
        ? latestDevlog.content.length > 100
          ? `${latestDevlog.content.slice(0, 100)}…`
          : latestDevlog.content
        : null;

      sectionContent = (
        <>
          <PanelBlock title="新verの開発ログを書く">
            <p className="text-xs leading-relaxed text-zinc-600">
              更新内容と、このverでプレイヤーに見てほしいことをまとめます。
            </p>
            <button type="button" onClick={onOpenNewVersionDevlog} className={primaryButtonClassName}>
              <FileText className="size-4 shrink-0" aria-hidden="true" />
              新verの開発ログを書く
            </button>
          </PanelBlock>

          <PanelBlock title={`${versionLabel} の公開ログ`}>
            {latestDevlog ? (
              <>
                <p className="text-sm font-medium text-zinc-200">{latestDevlog.title}</p>
                <p className="text-xs text-zinc-500">{currentDevlogMeta}</p>
                {currentDevlogExcerpt ? (
                  <p className="text-xs leading-relaxed text-zinc-600">{currentDevlogExcerpt}</p>
                ) : null}
              </>
            ) : (
              <p className="text-sm font-medium text-zinc-200">{currentDevlogMeta}</p>
            )}
            <p className="text-xs leading-relaxed text-zinc-600">
              公開済みの本文は変更できません。修正や追記は新verの開発ログで記録してください。
            </p>
            <button
              type="button"
              onClick={() => setDevlogEditMode("current")}
              className={panelButtonClassName}
            >
              <Eye className="size-4 shrink-0 text-zinc-500" aria-hidden="true" />
              詳細を見る
            </button>
          </PanelBlock>

          <StudioReleaseAboutBlock
            projectId={projectId}
            devlogCount={devlogCount}
            playableVersion={versionKey}
          />
        </>
      );
    }
  } else {
    sectionContent = (
      <>
        <PanelBlock title="届いたフィードバック">
          {hasFeedback ? (
            <div className="max-h-[24rem] overflow-y-auto">
              <StudioPlayerFeedbackPanel
                gameId={game.id}
                playableVersion={versionKey}
                feedbackEntries={feedbackEntries}
                quickFbCount={quickFbCount}
                detailPanelId={PROJECT_STUDIO_FEEDBACK_SECTION_ID}
                emphasize={initialOpenFeedback}
                embeddedInStudioPane
                hidePaneHeading
                unreadVoiceCount={hasUnreadVoice ? registeredQuickFbCount : 0}
                totalFeedbackCount={totalFeedbackCount}
              />
            </div>
          ) : (
            <p className="text-xs leading-relaxed text-zinc-500">
              まだフィードバックはありません。
            </p>
          )}
        </PanelBlock>

        <PanelBlock title="フィードバックの傾向">
          <p className="text-xs leading-relaxed text-zinc-600">
            届いたフィードバックの中で、多かった意見や気になる反応を整理します。
          </p>
          <StudioTopPrioritiesPanel
            projectId={projectId}
            growth={growth}
            feedbackEntries={feedbackEntries}
            voiceRead={voiceRead}
            embedded
            hideHeading
          />
        </PanelBlock>
      </>
    );
  }

  return (
    <StudioEditPaneShell>
        <StudioEditSectionSwitcher
          activeSection={activeSection}
          onSectionChange={onSectionChange}
        />

        {overviewEditMode || devlogEditMode ? null : (
          <p className="text-xs font-medium text-zinc-500">
            {SECTION_CONTENT_HEADINGS[activeSection]}
          </p>
        )}

        {sectionContent}
      </StudioEditPaneShell>
  );
}
