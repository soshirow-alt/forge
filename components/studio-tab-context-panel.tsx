"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { Image as ImageIcon, MessageSquare, Pencil, Sparkles, Link2, Copy, ExternalLink, FileText } from "lucide-react";
import { StudioEditSectionSwitcher } from "@/components/studio-edit-section-switcher";
import { StudioOverviewBasicInfoEditPanel } from "@/components/studio-overview-basic-info-edit-panel";
import { StudioOverviewGenresTagsEditPanel } from "@/components/studio-overview-genres-tags-edit-panel";
import { StudioOverviewImagesEditPanel } from "@/components/studio-overview-images-edit-panel";
import { StudioOverviewVisibilityEditPanel } from "@/components/studio-overview-visibility-edit-panel";
import { StudioOverviewIntroductionEditPanel } from "@/components/studio-overview-introduction-edit-panel";
import { StudioOverviewPlayInfoEditPanel } from "@/components/studio-overview-play-info-edit-panel";
import { StudioDevlogCurrentEditPanel } from "@/components/studio-devlog-current-edit-panel";
import { ProjectShareLinkModal } from "@/components/project-share-link-modal";
import { ProjectReleaseStudioPanel } from "@/components/project-release-studio-panel";
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
  getStudioVisualMode,
  type ProjectGrowthSnapshot,
} from "@/lib/project-growth-state";
import type { ProjectFeedbackEntry } from "@/lib/supabase/user-engagement";
import { getVisibilityBadgeLabel } from "@/lib/project-visibility";

const primaryButtonClassName =
  "inline-flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-2.5 text-sm font-semibold text-zinc-950 shadow-sm shadow-orange-500/20 transition-opacity hover:opacity-90";

const secondaryButtonClassName =
  "inline-flex w-full items-center justify-center gap-2 rounded-lg border border-orange-500/30 bg-orange-500/10 px-4 py-2.5 text-sm font-medium text-orange-200 transition-colors hover:border-orange-500/50 hover:bg-orange-500/15";

const panelButtonClassName =
  "inline-flex w-full items-center gap-2 rounded-lg border border-zinc-800/60 bg-zinc-950/40 px-3 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:border-zinc-700 hover:bg-zinc-900/70 hover:text-zinc-100";

const SECTION_CONTENT_HEADINGS: Record<GameDetailTab, string> = {
  overview: "公開ページを編集",
  devlog: "開発ログ・更新",
  voices: "フィードバック確認",
};

type OverviewEditMode =
  | null
  | "basic-info"
  | "genres-tags"
  | "images"
  | "introduction"
  | "play-info"
  | "visibility";

type DevlogEditMode = null | "current";

function StudioEditPaneShell({ children }: { children: ReactNode }) {
  return (
    <aside
      aria-label="Studio編集ペイン"
      className="w-full shrink-0 xl:sticky xl:top-6 xl:w-[340px] xl:self-start"
    >
      <div className="rounded-2xl border border-zinc-800/75 bg-zinc-900/50 px-4 py-4 shadow-sm shadow-black/10">
        <div className="space-y-4">{children}</div>
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
    <section className="rounded-xl border border-zinc-800/50 bg-zinc-950/25 p-4">
      {title ? (
        <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{title}</h3>
      ) : null}
      <div className={title ? "mt-3 space-y-2" : "space-y-2"}>{children}</div>
    </section>
  );
}

function HintList({ items }: { items: string[] }) {
  return (
    <ul className="list-inside list-disc text-xs leading-relaxed text-zinc-600">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
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
}: StudioTabContextPanelProps) {
  const { getDevlogsByProject } = useGames();
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [feedbackExpanded, setFeedbackExpanded] = useState(initialOpenFeedback);
  const [overviewEditMode, setOverviewEditMode] = useState<OverviewEditMode>(null);
  const [devlogEditMode, setDevlogEditMode] = useState<DevlogEditMode>(null);

  const versionKey = growth.playableVersion;
  const { isRead: voiceRead, markRead } = useNurtureVoiceRead(game.id, versionKey);

  const quickFbCount = growth.totalVoiceResponseCount;
  const detailedFbCount = useMemo(
    () => filterDeepFeedbackForVersion(feedbackEntries, versionKey).length,
    [feedbackEntries, versionKey],
  );
  const hasFeedback = quickFbCount > 0 || detailedFbCount > 0;
  const hasUnreadVoice = !voiceRead && quickFbCount > 0;

  const latestDevlog = useMemo(() => {
    const devlogs = sortDevlogsNewestFirst(getDevlogsByProject(projectId));
    return devlogs[0] ?? null;
  }, [getDevlogsByProject, projectId]);

  const visibilityLabel = getVisibilityBadgeLabel(game.visibility);

  const handleReadFeedback = useCallback(() => {
    void markRead();
    setFeedbackExpanded(true);
    requestAnimationFrame(() => {
      document.getElementById(PROJECT_STUDIO_FEEDBACK_SECTION_ID)?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  }, [markRead]);

  useEffect(() => {
    if (activeSection !== "overview") {
      setOverviewEditMode(null);
    }
    if (activeSection !== "devlog") {
      setDevlogEditMode(null);
    }
  }, [activeSection]);

  function closeOverviewEdit() {
    setOverviewEditMode(null);
  }

  function closeDevlogEdit() {
    setDevlogEditMode(null);
  }

  useEffect(() => {
    if (activeSection === "voices" && (initialOpenFeedback || hasFeedback)) {
      setFeedbackExpanded(true);
    }
  }, [activeSection, initialOpenFeedback, hasFeedback]);

  const shareModal = (
    <ProjectShareLinkModal
      projectId={projectId}
      open={shareModalOpen}
      onClose={() => setShareModalOpen(false)}
    />
  );

  const showFeedbackPanel =
    activeSection === "voices" &&
    getStudioVisualMode(growth) !== "pre_cycle" &&
    hasFeedback &&
    feedbackExpanded;

  let sectionContent: ReactNode;

  if (activeSection === "overview") {
    if (overviewEditMode === "basic-info") {
      sectionContent = (
        <StudioOverviewBasicInfoEditPanel
          key={`${projectId}-basic-info`}
          projectId={projectId}
          onCancel={closeOverviewEdit}
          onSaved={closeOverviewEdit}
        />
      );
    } else if (overviewEditMode === "genres-tags") {
      sectionContent = (
        <StudioOverviewGenresTagsEditPanel
          key={`${projectId}-genres-tags`}
          projectId={projectId}
          onCancel={closeOverviewEdit}
          onSaved={closeOverviewEdit}
        />
      );
    } else if (overviewEditMode === "images") {
      sectionContent = (
        <StudioOverviewImagesEditPanel
          key={`${projectId}-images`}
          projectId={projectId}
          onCancel={closeOverviewEdit}
          onSaved={closeOverviewEdit}
        />
      );
    } else if (overviewEditMode === "visibility") {
      sectionContent = (
        <StudioOverviewVisibilityEditPanel
          key={`${projectId}-visibility`}
          projectId={projectId}
          onCancel={closeOverviewEdit}
          onSaved={closeOverviewEdit}
        />
      );
    } else if (overviewEditMode === "introduction") {
      sectionContent = (
        <StudioOverviewIntroductionEditPanel
          key={`${projectId}-introduction`}
          projectId={projectId}
          onCancel={closeOverviewEdit}
          onSaved={closeOverviewEdit}
        />
      );
    } else if (overviewEditMode === "play-info") {
      sectionContent = (
        <StudioOverviewPlayInfoEditPanel
          key={`${projectId}-play-info`}
          projectId={projectId}
          onCancel={closeOverviewEdit}
          onSaved={closeOverviewEdit}
        />
      );
    } else {
      sectionContent = (
        <>
          <PanelBlock>
            <button
              type="button"
              onClick={() => setOverviewEditMode("basic-info")}
              className={panelButtonClassName}
            >
              <Pencil className="size-4 shrink-0 text-zinc-500" aria-hidden="true" />
              基本情報を編集
            </button>
            <HintList items={["タイトル", "1行説明", "開発フェーズ"]} />
          </PanelBlock>

          <PanelBlock>
            <button
              type="button"
              onClick={() => setOverviewEditMode("genres-tags")}
              className={panelButtonClassName}
            >
              <Pencil className="size-4 shrink-0 text-zinc-500" aria-hidden="true" />
              ジャンル・タグを編集
            </button>
            <HintList items={["ジャンル", "特徴タグ"]} />
          </PanelBlock>

          <PanelBlock>
            <button
              type="button"
              onClick={() => setOverviewEditMode("images")}
              className={panelButtonClassName}
            >
              <ImageIcon className="size-4 shrink-0 text-zinc-500" aria-hidden="true" />
              画像を編集
            </button>
            <HintList items={["サムネイル", "スクリーンショット"]} />
          </PanelBlock>

          <PanelBlock>
            <button
              type="button"
              onClick={() => setOverviewEditMode("introduction")}
              className={panelButtonClassName}
            >
              <Sparkles className="size-4 shrink-0 text-zinc-500" aria-hidden="true" />
              作品紹介を編集
            </button>
            <HintList items={["作品紹介"]} />
          </PanelBlock>

          <PanelBlock>
            <button
              type="button"
              onClick={() => setOverviewEditMode("play-info")}
              className={panelButtonClassName}
            >
              <Link2 className="size-4 shrink-0 text-zinc-500" aria-hidden="true" />
              プレイ情報・公開先を編集
            </button>
            <HintList items={["想定時間", "対応端末", "遊び方", "公開先URL"]} />
          </PanelBlock>

          <PanelBlock title="公開設定">
            <div className="flex items-center justify-between rounded-lg border border-zinc-800/60 bg-zinc-950/30 px-3 py-2">
              <span className="text-xs text-zinc-500">公開状態</span>
              <span className="text-sm font-medium text-zinc-200">{visibilityLabel}</span>
            </div>
            <button
              type="button"
              onClick={() => setOverviewEditMode("visibility")}
              className={panelButtonClassName}
            >
              <Pencil className="size-4 shrink-0 text-zinc-500" aria-hidden="true" />
              公開設定を編集
            </button>
          </PanelBlock>

          <PanelBlock title="共有">
            <Link
              href={gamePlayHref(projectId)}
              target="_blank"
              rel="noopener noreferrer"
              className={panelButtonClassName}
            >
              <ExternalLink className="size-4 shrink-0 text-zinc-500" aria-hidden="true" />
              公開ページを見る
            </Link>
            <button
              type="button"
              onClick={() => setShareModalOpen(true)}
              className={panelButtonClassName}
            >
              <Copy className="size-4 shrink-0 text-zinc-500" aria-hidden="true" />
              作品リンクをコピー
            </button>
          </PanelBlock>
        </>
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
      sectionContent = (
        <>
          <PanelBlock>
            <button type="button" onClick={onOpenNewVersionDevlog} className={primaryButtonClassName}>
              <FileText className="size-4 shrink-0" aria-hidden="true" />
              新verの開発ログを書く
            </button>
            <button
              type="button"
              onClick={() => setDevlogEditMode("current")}
              className={panelButtonClassName}
            >
              <Pencil className="size-4 shrink-0 text-zinc-500" aria-hidden="true" />
              現在の開発ログを編集
            </button>
          </PanelBlock>

          <PanelBlock title="最新の開発ログ">
          {latestDevlog ? (
            <div className="rounded-lg border border-zinc-800/60 bg-zinc-950/30 px-3 py-2.5">
              <p className="text-sm font-medium text-zinc-200">{latestDevlog.title}</p>
              <p className="mt-1 text-xs text-zinc-500">
                {formatDevlogPublishedAt(latestDevlog.date)}
                {latestDevlog.publishedVersion ? ` · ${latestDevlog.publishedVersion}` : ""}
              </p>
              <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-zinc-400">
                {latestDevlog.content}
              </p>
            </div>
          ) : (
            <p className="text-xs leading-relaxed text-zinc-500">
              開発ログはまだありません。「新verの開発ログを書く」から最初の更新を記録できます。
            </p>
          )}
        </PanelBlock>

        <ProjectReleaseStudioPanel
          projectId={projectId}
          devlogCount={devlogCount}
          playableVersion={versionKey}
          embedded
        />
      </>
      );
    }
  } else {
    sectionContent = (
      <>
        <PanelBlock>
          <button
            type="button"
            onClick={handleReadFeedback}
            disabled={!hasFeedback}
            className={`${secondaryButtonClassName} disabled:cursor-not-allowed disabled:opacity-50`}
          >
            <MessageSquare className="size-4 shrink-0" aria-hidden="true" />
            新しいFBを確認する
            {hasUnreadVoice ? (
              <span className="rounded-full bg-orange-500/90 px-1.5 py-0.5 text-[10px] font-semibold text-zinc-950">
                未確認
              </span>
            ) : null}
          </button>
          <p className="text-center text-xs text-zinc-600">
            {hasFeedback
              ? `かんたん ${quickFbCount} · 詳しい ${detailedFbCount}`
              : "このverのFBはまだありません"}
          </p>
        </PanelBlock>

        {showFeedbackPanel ? (
          <div className="max-h-[24rem] overflow-y-auto rounded-xl border border-zinc-800/45 bg-zinc-950/20">
            <StudioPlayerFeedbackPanel
              gameId={game.id}
              playableVersion={versionKey}
              feedbackEntries={feedbackEntries}
              quickFbCount={quickFbCount}
              detailPanelId={PROJECT_STUDIO_FEEDBACK_SECTION_ID}
              emphasize={initialOpenFeedback}
            />
          </div>
        ) : hasFeedback ? (
          <button type="button" onClick={handleReadFeedback} className={panelButtonClassName}>
            届いたFBを読む
          </button>
        ) : null}

        <PanelBlock title="次に直すこと">
          <p className="text-xs leading-relaxed text-zinc-600">
            {hasUnreadVoice
              ? "未確認のフィードバックがあります。確認後、次に直すことを整理できます。"
              : "確認した内容から、次に直すことを整理します。"}
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
    <>
      {shareModal}
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
    </>
  );
}
