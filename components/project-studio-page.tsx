"use client";

import Link from "next/link";
import { notFound, useRouter } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { ForgeHeader } from "@/components/forge-header";
import { GameGrowthCycle } from "@/components/game-growth-cycle";
import { GameThumbnail } from "@/components/game-thumbnail";
import { ProjectNurtureActions } from "@/components/project-nurture-actions";
import { useGames } from "@/components/games-provider";
import { useOwnedProjectFeedback } from "@/hooks/use-owned-project-feedback";
import { useOwnedProjectVoiceSignals } from "@/hooks/use-owned-project-voice-signals";
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

  const display = useMemo(() => {
    if (!game || !growth) {
      return null;
    }

    return buildNurtureDisplayContext(growth, false, game.id);
  }, [game, growth]);

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

  if (!hydrated || !dataReady || !feedbackLoaded || !voiceLoaded) {
    return (
      <div className="min-h-full bg-zinc-950 text-zinc-100">
        <ForgeHeader />
        <main className="mx-auto max-w-3xl px-6 py-12">
          <p className="text-zinc-500">読み込み中...</p>
        </main>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (!game || !growth || !display) {
    notFound();
  }

  if (!isOwner) {
    return null;
  }

  return (
    <div className="min-h-full bg-zinc-950 text-zinc-100">
      <ForgeHeader />

      <main className="mx-auto max-w-3xl px-6 py-12">
        <Link
          href="/my-projects"
          className="text-sm text-zinc-500 transition-colors hover:text-orange-400"
        >
          ← 開発マイページ
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
            <p className="text-xs font-medium text-zinc-600">作品育成</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-zinc-50 sm:text-3xl">
              {game.title}
            </h1>
            <p className="mt-2 text-sm text-zinc-500">
              v{growth.playableVersion}
              {growth.cycleNumber > 0 && ` · サイクル ${growth.cycleNumber}`}
              {growth.totalVoiceResponseCount > 0 && (
                <span className="ml-2 text-zinc-400">
                  回答 {growth.totalVoiceResponseCount}件
                </span>
              )}
              {growth.pendingFeedbackCount > 0 && (
                <span className="ml-2 text-orange-400/90">新しい回答あり</span>
              )}
            </p>
            <p className="mt-1 text-xs text-zinc-600">
              現在: {display.heroTitle}
              {display.heroSubline ? ` — ${display.heroSubline}` : ""}
            </p>
          </div>
        </header>

        <section className="mt-10">
          <GameGrowthCycle
            game={game}
            growth={growth}
            feedbackEntries={projectFeedback}
            detailPanelId={PROJECT_STUDIO_FEEDBACK_SECTION_ID}
            initialSelectedStep={openFeedbackPanel ? "read" : null}
          />
        </section>

        <ProjectNurtureActions projectId={game.id} className="mt-8" />

        <p className="mt-8 text-center text-xs text-zinc-600">
          <Link
            href={gamePlayHref(game.id)}
            className="transition-colors hover:text-zinc-400"
          >
            プレイヤー向けページをプレビュー →
          </Link>
        </p>
      </main>
    </div>
  );
}

export function ProjectStudioPage({ projectId }: { projectId: string }) {
  return (
    <Suspense
      fallback={
        <div className="min-h-full bg-zinc-950 text-zinc-100">
          <ForgeHeader />
          <main className="mx-auto max-w-3xl px-6 py-12">
            <p className="text-zinc-500">読み込み中...</p>
          </main>
        </div>
      }
    >
      <ProjectStudioPageContent projectId={projectId} />
    </Suspense>
  );
}
