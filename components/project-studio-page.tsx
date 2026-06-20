"use client";

import Link from "next/link";
import { notFound, useRouter } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { StudioShell } from "@/components/studio-shell";
import { GameGrowthCycle } from "@/components/game-growth-cycle";
import { GameThumbnail } from "@/components/game-thumbnail";
import { ProjectReleaseStudioPanel } from "@/components/project-release-studio-panel";
import { ProjectNurtureActions } from "@/components/project-nurture-actions";
import { StudioTopPrioritiesPanel } from "@/components/studio-top-priorities-panel";
import { useGames } from "@/components/games-provider";
import { useOwnedProjectFeedback } from "@/hooks/use-owned-project-feedback";
import { useOwnedProjectVoiceSignals } from "@/hooks/use-owned-project-voice-signals";
import { useNurtureVoiceRead } from "@/hooks/use-nurture-feedback-read";
import {
  PROJECT_STUDIO_FEEDBACK_SECTION_ID,
  gamePlayHref,
} from "@/lib/project-nurture-links";
import {
  buildNurtureDisplayContext,
  buildProjectGrowthSnapshot,
  groupFeedbackByProject,
} from "@/lib/project-growth-state";
import { resolveVoiceSignalForGame } from "@/lib/project-voice-nurture";
import { RELEASE_STATUS_LABELS } from "@/lib/project-release-state";

function ProjectStudioPageContent({ projectId }: { projectId: string }) {
  const router = useRouter();
  const { user, hydrated } = useAuth();
  const { getSubmittedGameById, isProjectOwner, getDevlogsByProject, dataReady } =
    useGames();

  const { entries: feedbackEntries, loaded: feedbackLoaded } =
    useOwnedProjectFeedback(user?.id);
  const { signals: voiceSignals, loaded: voiceLoaded } =
    useOwnedProjectVoiceSignals(user?.id);

  const game = getSubmittedGameById(projectId);
  const isOwner = isProjectOwner(projectId, user?.id);

  const growth = useMemo(() => {
    if (!game) {
      return null;
    }

    return buildProjectGrowthSnapshot(
      game,
      resolveVoiceSignalForGame(game, voiceSignals),
      getDevlogsByProject,
    );
  }, [game, voiceSignals, getDevlogsByProject]);

  const { isRead: voiceRead } = useNurtureVoiceRead(
    projectId,
    growth?.playableVersion ?? "",
  );

  const projectFeedback = useMemo(() => {
    return groupFeedbackByProject(feedbackEntries).get(projectId) ?? [];
  }, [feedbackEntries, projectId]);

  const display = useMemo(() => {
    if (!game || !growth) {
      return null;
    }

    return buildNurtureDisplayContext(growth, voiceRead, game.id);
  }, [game, growth, voiceRead]);

  useEffect(() => {
    if (hydrated && !user) {
      router.replace("/login");
    }
  }, [hydrated, user, router]);

  useEffect(() => {
    if (hydrated && user && game && !isOwner) {
      router.replace(`/games/${projectId}`);
    }
  }, [hydrated, user, game, isOwner, projectId, router]);

  const [openFeedbackPanel, setOpenFeedbackPanel] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (window.location.hash === `#${PROJECT_STUDIO_FEEDBACK_SECTION_ID}`) {
      setOpenFeedbackPanel(true);
    }
  }, []);

  useEffect(() => {
    if (!feedbackLoaded || !voiceLoaded || !growth || !openFeedbackPanel) {
      return;
    }

    const element = document.getElementById(PROJECT_STUDIO_FEEDBACK_SECTION_ID);
    element?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [feedbackLoaded, voiceLoaded, growth, openFeedbackPanel]);

  if (!hydrated || !dataReady) {
    return (
      <StudioShell activeNav="projects">
        <p className="text-zinc-500">読み込み中...</p>
      </StudioShell>
    );
  }

  if (!user) {
    return null;
  }

  if (!game) {
    notFound();
  }

  if (!isOwner) {
    return null;
  }

  const growthSnapshot =
    growth ??
    buildProjectGrowthSnapshot(
      game,
      resolveVoiceSignalForGame(game, voiceSignals),
      getDevlogsByProject,
    );

  const displayContext =
    display ??
    buildNurtureDisplayContext(
      growthSnapshot,
      voiceRead,
      game.id,
    );

  return (
    <StudioShell activeNav="projects">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/mypage?tab=developer"
          className="cursor-pointer text-sm text-zinc-500 transition-colors hover:text-violet-400"
        >
          ← 作品管理（マイページ）
        </Link>

        <header className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-6">
          <div className="h-20 w-28 shrink-0 overflow-hidden rounded-lg border border-zinc-800">
            <GameThumbnail
              thumbnailUrl={game.thumbnailUrl}
              status={game.status}
              projectId={game.id}
              title={game.title}
              genre={game.genre}
              phase={game.phase}
              aspectClassName="aspect-[4/3] h-full w-full"
              showStatus={false}
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-orange-400/90">改善ループ Studio · 実データ</p>
            <p className="text-xs font-medium text-zinc-600">作品育成</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-zinc-50 sm:text-3xl">
              {game.title}
            </h1>
            <p className="mt-2 font-mono text-[10px] text-zinc-600">
              /projects/{game.id}/studio
            </p>
            <p className="mt-2 text-sm text-zinc-500">
              v{growthSnapshot.playableVersion}
              {growthSnapshot.cycleNumber > 0 && ` · サイクル ${growthSnapshot.cycleNumber}`}
              {growthSnapshot.totalVoiceResponseCount > 0 && (
                <span className="ml-2 text-zinc-400">
                  回答 {growthSnapshot.totalVoiceResponseCount}件
                </span>
              )}
              {growthSnapshot.pendingFeedbackCount > 0 && (
                <span className="ml-2 text-orange-400/90">新しい回答あり</span>
              )}
            </p>
            <p className="mt-1 text-xs text-zinc-600">
              いま: {displayContext.phaseLabel}
              {" · "}
              {RELEASE_STATUS_LABELS[game.releaseStatus ?? "in_development"]}
              {" · "}
              <Link
                href={gamePlayHref(game.id)}
                className="cursor-pointer text-zinc-500 transition-colors hover:text-orange-400/90"
              >
                プレイヤー画面をプレビュー
              </Link>
            </p>
          </div>
        </header>

        <StudioTopPrioritiesPanel
          projectId={game.id}
          growth={growthSnapshot}
          feedbackEntries={projectFeedback}
          voiceRead={voiceRead}
        />

        <section className="mt-10">
          <GameGrowthCycle
            game={game}
            growth={growthSnapshot}
            feedbackEntries={projectFeedback}
            detailPanelId={PROJECT_STUDIO_FEEDBACK_SECTION_ID}
            initialSelectedStep={openFeedbackPanel ? "read" : null}
          />
        </section>

        <ProjectReleaseStudioPanel
          projectId={game.id}
          devlogCount={getDevlogsByProject(game.id).length}
          playableVersion={growthSnapshot.playableVersion}
        />

        <ProjectNurtureActions
          projectId={game.id}
          context="studio"
          className="mt-8"
        />
      </div>
    </StudioShell>
  );
}

export function ProjectStudioPage({ projectId }: { projectId: string }) {
  return (
    <Suspense
      fallback={
        <StudioShell activeNav="projects">
          <p className="text-zinc-500">読み込み中...</p>
        </StudioShell>
      }
    >
      <ProjectStudioPageContent projectId={projectId} />
    </Suspense>
  );
}
