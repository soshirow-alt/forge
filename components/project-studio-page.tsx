"use client";

import Link from "next/link";
import { notFound, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { StudioShell } from "@/components/studio-shell";
import { ProjectReleaseStudioPanel } from "@/components/project-release-studio-panel";
import { StudioImprovementLoop } from "@/components/studio-improvement-loop";
import { DevlogComposeModal } from "@/components/devlog-compose-modal";
import { ProjectDistributionLinksModal } from "@/components/project-distribution-links-modal";
import { ProjectEditModal } from "@/components/project-edit-modal";
import { GameDetailPlayerPreview } from "@/components/game-detail-player-preview";
import { StudioNurtureRail } from "@/components/studio-nurture-rail";
import { StudioProjectToolbar } from "@/components/studio-project-toolbar";
import { useGames } from "@/components/games-provider";
import { useOwnedProjectFeedback } from "@/hooks/use-owned-project-feedback";
import { useOwnedProjectVoiceSignals } from "@/hooks/use-owned-project-voice-signals";
import { PROJECT_STUDIO_FEEDBACK_SECTION_ID, projectStudioPath } from "@/lib/project-nurture-links";
import { useProjectTestPlay } from "@/hooks/use-project-test-play";
import {
  buildProjectGrowthSnapshot,
  groupFeedbackByProject,
} from "@/lib/project-growth-state";
import { resolveVoiceSignalForGame } from "@/lib/project-voice-nurture";
import { getVisibilityBadgeLabel } from "@/lib/project-visibility";

/** B2 ロールバック用 — true にすると旧 Studio 縦積み UI を再表示 */
const SHOW_LEGACY_STUDIO_UI = false;

function ProjectStudioPageContent({ projectId }: { projectId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
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
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [distributionLinksModalOpen, setDistributionLinksModalOpen] = useState(false);
  const [devlogModalOpen, setDevlogModalOpen] = useState(false);

  useEffect(() => {
    const edit = searchParams.get("edit");
    const devlog = searchParams.get("devlog");
    if (edit === "prompts" || devlog === "1") {
      setDevlogModalOpen(true);
      if (searchParams.toString()) {
        router.replace(projectStudioPath(projectId));
      }
      return;
    }
    if (edit === "project") {
      setEditModalOpen(true);
    }
  }, [searchParams, projectId, router]);

  function closeEditModal() {
    setEditModalOpen(false);
    if (searchParams.get("edit")) {
      router.replace(projectStudioPath(projectId));
    }
  }

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    function syncFromHash() {
      if (window.location.hash === `#${PROJECT_STUDIO_FEEDBACK_SECTION_ID}`) {
        setOpenFeedbackPanel(true);
      }
    }

    syncFromHash();
    window.addEventListener("hashchange", syncFromHash);
    return () => window.removeEventListener("hashchange", syncFromHash);
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

  const devlogCount = getDevlogsByProject(game.id).length;
  const visibilityLabel = getVisibilityBadgeLabel(game.visibility);
  const { handleTestPlay } = useProjectTestPlay(projectId);

  return (
    <StudioShell activeNav="mypage">
      <div className="mx-auto max-w-7xl">
        <header className="border-b border-zinc-800/80 pb-3">
          <Link
            href="/studio"
            className="text-sm text-zinc-500 transition-colors hover:text-violet-400"
          >
            ← Studio ホーム
          </Link>
          <p className="mt-2 text-sm text-zinc-400">Studio編集</p>
          <p className="mt-0.5 text-xs text-zinc-500">
            {visibilityLabel} · v{growthSnapshot.playableVersion}
          </p>
        </header>

        <DevlogComposeModal
          projectId={projectId}
          playableVersion={growthSnapshot.playableVersion}
          open={devlogModalOpen}
          onClose={() => setDevlogModalOpen(false)}
        />
        <ProjectEditModal
          projectId={projectId}
          open={editModalOpen}
          onClose={closeEditModal}
        />
        <ProjectDistributionLinksModal
          projectId={projectId}
          open={distributionLinksModalOpen}
          onClose={() => setDistributionLinksModalOpen(false)}
        />

        <div className="mt-5 grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <GameDetailPlayerPreview projectId={projectId} onTestPlay={handleTestPlay} />

          <StudioNurtureRail
            projectId={projectId}
            game={game}
            growth={growthSnapshot}
            feedbackEntries={projectFeedback}
            devlogCount={devlogCount}
            initialOpenFeedback={openFeedbackPanel}
            onOpenNewVersionDevlog={() => setDevlogModalOpen(true)}
            onEditProject={() => setEditModalOpen(true)}
            onEditDistribution={() => setDistributionLinksModalOpen(true)}
          />
        </div>

        {SHOW_LEGACY_STUDIO_UI ? (
          <>
            <StudioProjectToolbar
              projectId={projectId}
              onOpenNewVersionDevlog={() => setDevlogModalOpen(true)}
              onEditProject={() => setEditModalOpen(true)}
              onEditDistribution={() => setDistributionLinksModalOpen(true)}
            />

            <div className="mt-6">
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
              devlogCount={devlogCount}
              playableVersion={growthSnapshot.playableVersion}
            />
          </>
        ) : null}
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
