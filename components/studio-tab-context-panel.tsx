"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Copy,
  ExternalLink,
  FileText,
  Link2,
  MessageSquare,
  Pencil,
  Play,
  Sparkles,
} from "lucide-react";
import { GamePlayDestinationModal } from "@/components/game-play-destination-modal";
import { StudioEditSectionSwitcher } from "@/components/studio-edit-section-switcher";
import { StudioOverviewIntroductionEditPanel } from "@/components/studio-overview-introduction-edit-panel";
import { ProjectShareLinkModal } from "@/components/project-share-link-modal";
import { ProjectReleaseStudioPanel } from "@/components/project-release-studio-panel";
import { StudioPlayerFeedbackPanel } from "@/components/studio-improvement-loop";
import { StudioTopPrioritiesPanel } from "@/components/studio-top-priorities-panel";
import { useGames } from "@/components/games-provider";
import { formatDevlogPublishedAt } from "@/hooks/use-game-devlogs-v0";
import { useNurtureVoiceRead } from "@/hooks/use-nurture-feedback-read";
import { useProjectTestPlay } from "@/hooks/use-project-test-play";
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

const menuRowClassName =
  "flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-left text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-800/50 hover:text-zinc-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-orange-500/50";

const menuHintClassName = "px-2 text-[11px] leading-relaxed text-zinc-600";

const SECTION_CONTENT_HEADINGS: Record<GameDetailTab, string> = {
  overview: "公開ページを編集",
  devlog: "開発ログ・更新",
  voices: "フィードバック確認",
};

function StudioEditPaneShell({ children }: { children: ReactNode }) {
  return (
    <aside
      aria-label="Studio編集ペイン"
      className="mt-8 w-full shrink-0 border-t border-zinc-800/60 pt-8 xl:mt-0 xl:w-[360px] xl:self-stretch xl:border-t-0 xl:border-l xl:border-zinc-800/80 xl:bg-zinc-900/70 xl:pt-6 xl:pl-6 xl:-mr-8 xl:pr-8 xl:min-h-[calc(100dvh-6rem)] xl:sticky xl:top-6"
    >
      <div className="space-y-5">{children}</div>
    </aside>
  );
}

function EditMenuGroup({
  title,
  children,
}: {
  title?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1 border-t border-zinc-800/35 pt-4 first:border-t-0 first:pt-0">
      {title ? (
        <h3 className="mb-1.5 px-1 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
          {title}
        </h3>
      ) : null}
      {children}
    </div>
  );
}

function HintLine({ children }: { children: ReactNode }) {
  return <p className={menuHintClassName}>{children}</p>;
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
  onEditProject: () => void;
  onEditDistribution: () => void;
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
  onEditProject,
  onEditDistribution,
}: StudioTabContextPanelProps) {
  const { getDevlogsByProject } = useGames();
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [feedbackExpanded, setFeedbackExpanded] = useState(initialOpenFeedback);
  const [introEditOpen, setIntroEditOpen] = useState(false);

  const {
    playDestinations,
    playDestinationPickerOpen,
    setPlayDestinationPickerOpen,
    hasPlayUrl,
    handleTestPlay,
    handlePlayDestinationSelect,
  } = useProjectTestPlay(projectId);

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
      setIntroEditOpen(false);
    }
  }, [activeSection]);

  useEffect(() => {
    if (activeSection === "voices" && (initialOpenFeedback || hasFeedback)) {
      setFeedbackExpanded(true);
    }
  }, [activeSection, initialOpenFeedback, hasFeedback]);

  const playModal = playDestinationPickerOpen ? (
    <GamePlayDestinationModal
      destinations={playDestinations}
      onSelect={handlePlayDestinationSelect}
      onClose={() => setPlayDestinationPickerOpen(false)}
    />
  ) : null;

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
    sectionContent = introEditOpen ? (
      <StudioOverviewIntroductionEditPanel
        projectId={projectId}
        onCancel={() => setIntroEditOpen(false)}
        onSaved={() => setIntroEditOpen(false)}
      />
    ) : (
      <>
        <EditMenuGroup>
          <button type="button" onClick={onEditProject} className={menuRowClassName}>
            <Pencil className="size-4 shrink-0 text-zinc-500" aria-hidden="true" />
            作品情報を編集
          </button>
          <HintLine>タイトル · 1行説明 · ジャンル · 特徴タグ · フェーズ · サムネイル</HintLine>
        </EditMenuGroup>

        <EditMenuGroup>
          <button
            type="button"
            onClick={() => setIntroEditOpen(true)}
            className={menuRowClassName}
          >
            <Sparkles className="size-4 shrink-0 text-zinc-500" aria-hidden="true" />
            作品紹介を編集
          </button>
          <HintLine>作品紹介</HintLine>
        </EditMenuGroup>

        <EditMenuGroup>
          <button type="button" onClick={onEditDistribution} className={menuRowClassName}>
            <Link2 className="size-4 shrink-0 text-zinc-500" aria-hidden="true" />
            プレイ情報・公開先を編集
          </button>
          <HintLine>想定時間 · 対応端末 · 遊び方 · 公開先URL</HintLine>
        </EditMenuGroup>

        <EditMenuGroup title="公開設定">
          <div className="flex items-center justify-between px-2 py-1.5 text-sm">
            <span className="text-zinc-500">公開状態</span>
            <span className="font-medium text-zinc-200">{visibilityLabel}</span>
          </div>
          <HintLine>切り替えは「作品情報を編集」から</HintLine>
        </EditMenuGroup>

        <EditMenuGroup title="共有">
          <Link
            href={gamePlayHref(projectId)}
            target="_blank"
            rel="noopener noreferrer"
            className={menuRowClassName}
          >
            <ExternalLink className="size-4 shrink-0 text-zinc-500" aria-hidden="true" />
            公開ページを見る
          </Link>
          <button type="button" onClick={() => setShareModalOpen(true)} className={menuRowClassName}>
            <Copy className="size-4 shrink-0 text-zinc-500" aria-hidden="true" />
            作品リンクをコピー
          </button>
        </EditMenuGroup>
      </>
    );
  } else if (activeSection === "devlog") {
    sectionContent = (
      <>
        <EditMenuGroup>
          <button
            type="button"
            onClick={handleTestPlay}
            disabled={!hasPlayUrl}
            className={`${menuRowClassName} disabled:cursor-not-allowed disabled:opacity-50`}
          >
            <Play className="size-4 shrink-0 text-zinc-500" aria-hidden="true" />
            テストプレイ
          </button>
          <button type="button" onClick={onOpenNewVersionDevlog} className={primaryButtonClassName}>
            <FileText className="size-4 shrink-0" aria-hidden="true" />
            新verの開発ログを書く
          </button>
        </EditMenuGroup>

        <EditMenuGroup title="最新の開発ログ">
          {latestDevlog ? (
            <div className="space-y-1 px-2 py-1">
              <p className="text-sm font-medium text-zinc-200">{latestDevlog.title}</p>
              <p className="text-xs text-zinc-500">
                {formatDevlogPublishedAt(latestDevlog.date)}
                {latestDevlog.publishedVersion ? ` · ${latestDevlog.publishedVersion}` : ""}
              </p>
              <p className="line-clamp-3 text-xs leading-relaxed text-zinc-400">
                {latestDevlog.content}
              </p>
            </div>
          ) : (
            <p className="px-2 text-xs leading-relaxed text-zinc-500">
              開発ログはまだありません。「新verの開発ログを書く」から最初の更新を記録できます。
            </p>
          )}
        </EditMenuGroup>

        <EditMenuGroup>
          <ProjectReleaseStudioPanel
            projectId={projectId}
            devlogCount={devlogCount}
            playableVersion={versionKey}
            embedded
          />
        </EditMenuGroup>
      </>
    );
  } else {
    sectionContent = (
      <>
        <EditMenuGroup>
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
          <p className="px-2 text-center text-xs text-zinc-600">
            {hasFeedback
              ? `かんたん ${quickFbCount} · 詳しい ${detailedFbCount}`
              : "このverのFBはまだありません"}
          </p>
        </EditMenuGroup>

        {showFeedbackPanel ? (
          <div className="max-h-[24rem] overflow-y-auto border-t border-zinc-800/35 pt-3">
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
          <button type="button" onClick={handleReadFeedback} className={menuRowClassName}>
            届いたFBを読む
          </button>
        ) : null}

        <EditMenuGroup title="次に直すこと">
          <p className="px-2 text-xs leading-relaxed text-zinc-600">
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
        </EditMenuGroup>
      </>
    );
  }

  return (
    <>
      {playModal}
      {shareModal}
      <StudioEditPaneShell>
        <StudioEditSectionSwitcher
          activeSection={activeSection}
          onSectionChange={onSectionChange}
        />

        {introEditOpen && activeSection === "overview" ? null : (
          <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
            {SECTION_CONTENT_HEADINGS[activeSection]}
          </p>
        )}

        {sectionContent}
      </StudioEditPaneShell>
    </>
  );
}
