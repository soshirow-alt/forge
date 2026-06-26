"use client";

import Link from "next/link";
import { notFound, useRouter } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { StudioShell } from "@/components/studio-shell";
import { GameThumbnail } from "@/components/game-thumbnail";
import { ProjectReleaseStudioPanel } from "@/components/project-release-studio-panel";
import { StudioImprovementLoop } from "@/components/studio-improvement-loop";
import { useGames } from "@/components/games-provider";
import { useOwnedProjectFeedback } from "@/hooks/use-owned-project-feedback";
import { useOwnedProjectVoiceSignals } from "@/hooks/use-owned-project-voice-signals";
import { PROJECT_STUDIO_FEEDBACK_SECTION_ID } from "@/lib/project-nurture-links";
import {
  buildProjectGrowthSnapshot,
  filterDeepFeedbackForVersion,
  groupFeedbackByProject,
} from "@/lib/project-growth-state";
import { resolveVoiceSignalForGame } from "@/lib/project-voice-nurture";

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

  const projectFeedback = useMemo(() => {
    return groupFeedbackByProject(feedbackEntries).get(projectId) ?? [];
  }, [feedbackEntries, projectId]);

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
      <StudioShell activeNav="mypage">
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

  const quickFbCount = growthSnapshot.totalVoiceResponseCount;
  const detailedFbCount = filterDeepFeedbackForVersion(
    projectFeedback,
    growthSnapshot.playableVersion,
  ).length;

  return (
    <StudioShell activeNav="mypage">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/studio"
          className="cursor-pointer text-sm text-zinc-500 transition-colors hover:text-violet-400"
        >
          ← Studio ホーム
        </Link>

        <header className="mt-6 flex flex-col gap-4 border-b border-zinc-800/80 pb-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex gap-4">
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
              <p className="text-xs font-medium text-orange-400/90">作品 Studio</p>
              <h1 className="mt-1 text-xl font-bold tracking-tight text-zinc-50 sm:text-2xl">
                {game.title}
              </h1>
              <p className="mt-2 flex flex-wrap items-center gap-2 text-sm text-zinc-500">
                <span className="rounded-md bg-zinc-800 px-2 py-0.5 text-xs text-zinc-300">
                  v{growthSnapshot.playableVersion}
                </span>
                <span>{game.phase}</span>
                <span>最終更新 {game.lastUpdated}</span>
              </p>
            </div>
          </div>

          <dl className="flex shrink-0 flex-wrap gap-3 sm:gap-4">
            <div className="min-w-[88px] rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-center">
              <dt className="text-[10px] text-zinc-500">かんたんFB</dt>
              <dd className="text-lg font-semibold text-zinc-100">{quickFbCount}</dd>
            </div>
            <div className="min-w-[88px] rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-center">
              <dt className="text-[10px] text-zinc-500">詳しいFB</dt>
              <dd className="text-lg font-semibold text-zinc-100">{detailedFbCount}</dd>
            </div>
          </dl>
        </header>

        <div className="mt-8">
          <StudioImprovementLoop
            game={game}
            growth={growthSnapshot}
            feedbackEntries={projectFeedback}
            detailPanelId={PROJECT_STUDIO_FEEDBACK_SECTION_ID}
            initialOpenFeedback={openFeedbackPanel}
          />
        </div>

        <ProjectReleaseStudioPanel
          projectId={game.id}
          devlogCount={getDevlogsByProject(game.id).length}
          playableVersion={growthSnapshot.playableVersion}
        />
      </div>
    </StudioShell>
  );
}

export function ProjectStudioPage({ projectId }: { projectId: string }) {
  return (
    <Suspense
      fallback={
        <StudioShell activeNav="mypage">
          <p className="text-zinc-500">読み込み中...</p>
        </StudioShell>
      }
    >
      <ProjectStudioPageContent projectId={projectId} />
    </Suspense>
  );
}
