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
} from "lucide-react";
import { GamePlayDestinationModal } from "@/components/game-play-destination-modal";
import { ProjectShareLinkModal } from "@/components/project-share-link-modal";
import { ProjectReleaseStudioPanel } from "@/components/project-release-studio-panel";
import { StudioPlayerFeedbackPanel } from "@/components/studio-improvement-loop";
import { StudioTopPrioritiesPanel } from "@/components/studio-top-priorities-panel";
import { useNurtureVoiceRead } from "@/hooks/use-nurture-feedback-read";
import { useProjectTestPlay } from "@/hooks/use-project-test-play";
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

const railButtonClassName =
  "inline-flex w-full items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-950/60 px-3 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:border-zinc-700 hover:bg-zinc-900/80 hover:text-zinc-100";

function RailSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-zinc-800/80 bg-zinc-900/35 p-4">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{title}</h2>
      <div className="mt-3 space-y-2">{children}</div>
    </section>
  );
}

function RailSubheading({ children }: { children: ReactNode }) {
  return (
    <p className="text-xs font-medium text-zinc-400">{children}</p>
  );
}

export type StudioNurtureRailProps = {
  projectId: string;
  game: Game;
  growth: ProjectGrowthSnapshot;
  feedbackEntries: ProjectFeedbackEntry[];
  devlogCount: number;
  initialOpenFeedback?: boolean;
  onOpenNewVersionDevlog: () => void;
  onEditProject: () => void;
  onEditDistribution: () => void;
};

export function StudioNurtureRail({
  projectId,
  game,
  growth,
  feedbackEntries,
  devlogCount,
  initialOpenFeedback = false,
  onOpenNewVersionDevlog,
  onEditProject,
  onEditDistribution,
}: StudioNurtureRailProps) {
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [feedbackExpanded, setFeedbackExpanded] = useState(initialOpenFeedback);

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
  const showWorkPanels =
    getStudioVisualMode(growth) !== "pre_cycle" && hasFeedback;
  const hasUnreadVoice = !voiceRead && quickFbCount > 0;

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
    if (initialOpenFeedback) {
      setFeedbackExpanded(true);
    }
  }, [initialOpenFeedback]);

  const visibilityLabel = getVisibilityBadgeLabel(game.visibility);

  return (
    <>
      <aside
        aria-label="Studio 操作"
        className="w-full shrink-0 space-y-3 xl:w-[320px]"
      >
        {playDestinationPickerOpen ? (
          <GamePlayDestinationModal
            destinations={playDestinations}
            onSelect={handlePlayDestinationSelect}
            onClose={() => setPlayDestinationPickerOpen(false)}
          />
        ) : null}

        <RailSection title="今日やること">
          <button
            type="button"
            onClick={handleTestPlay}
            disabled={!hasPlayUrl}
            className={`${railButtonClassName} disabled:cursor-not-allowed disabled:opacity-50`}
          >
            <Play className="size-4 shrink-0 text-zinc-500" aria-hidden="true" />
            テストプレイ
          </button>
          <button type="button" onClick={onOpenNewVersionDevlog} className={primaryButtonClassName}>
            <FileText className="size-4 shrink-0" aria-hidden="true" />
            新verの開発ログを書く
          </button>
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
          <p className="text-xs leading-relaxed text-zinc-600">
            プレイヤーから届いたフィードバックを確認します。
            {hasFeedback
              ? `（かんたん ${quickFbCount} · 詳しい ${detailedFbCount}）`
              : "（このverのFBはまだありません）"}
          </p>

          {showWorkPanels && feedbackExpanded ? (
            <div className="max-h-[28rem] overflow-y-auto rounded-lg border border-zinc-800/80">
              <StudioPlayerFeedbackPanel
                gameId={game.id}
                playableVersion={versionKey}
                feedbackEntries={feedbackEntries}
                quickFbCount={quickFbCount}
                detailPanelId={PROJECT_STUDIO_FEEDBACK_SECTION_ID}
                emphasize={initialOpenFeedback}
              />
            </div>
          ) : null}

          <div className="border-t border-zinc-800/80 pt-3">
            <RailSubheading>次に直すこと</RailSubheading>
            <p className="mt-1 text-xs leading-relaxed text-zinc-600">
              {hasUnreadVoice
                ? "未確認のフィードバックがあります。上で確認後、次に直すことを整理できます。"
                : "確認した内容から、次に直すことを整理します。"}
            </p>
            <div className="mt-2">
              <StudioTopPrioritiesPanel
                projectId={projectId}
                growth={growth}
                feedbackEntries={feedbackEntries}
                voiceRead={voiceRead}
                embedded
                hideHeading
              />
            </div>
          </div>
        </RailSection>

        <RailSection title="編集する">
          <button type="button" onClick={onEditProject} className={railButtonClassName}>
            <Pencil className="size-4 shrink-0 text-zinc-500" aria-hidden="true" />
            作品情報を編集
          </button>
          <button type="button" onClick={onEditDistribution} className={railButtonClassName}>
            <Link2 className="size-4 shrink-0 text-zinc-500" aria-hidden="true" />
            配布・リンクを編集
          </button>
        </RailSection>

        <RailSection title="公開・共有">
          <div className="flex items-center justify-between rounded-lg border border-zinc-800/80 bg-zinc-950/40 px-3 py-2">
            <span className="text-xs text-zinc-500">公開状態</span>
            <span className="text-sm font-medium text-zinc-200">{visibilityLabel}</span>
          </div>
          <Link
            href={gamePlayHref(projectId)}
            target="_blank"
            rel="noopener noreferrer"
            className={railButtonClassName}
          >
            <ExternalLink className="size-4 shrink-0 text-zinc-500" aria-hidden="true" />
            公開ページを見る
          </Link>
          <button
            type="button"
            onClick={() => setShareModalOpen(true)}
            className={railButtonClassName}
          >
            <Copy className="size-4 shrink-0 text-zinc-500" aria-hidden="true" />
            外部に共有する
          </button>
        </RailSection>

        <ProjectReleaseStudioPanel
          projectId={projectId}
          devlogCount={devlogCount}
          playableVersion={versionKey}
          embedded
        />
      </aside>

      <ProjectShareLinkModal
        projectId={projectId}
        open={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
      />
    </>
  );
}
