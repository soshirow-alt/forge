"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { StudioShell } from "@/components/studio-shell";
import { DevlogComposeModal } from "@/components/devlog-compose-modal";
import { GameDetailPlayerPreview } from "@/components/game-detail-player-preview";
import { StudioMypageBackLink } from "@/components/studio-mypage-back-link";
import { StudioTabContextPanel } from "@/components/studio-tab-context-panel";
import { useGames } from "@/components/games-provider";
import { useOwnedProjectFeedback } from "@/hooks/use-owned-project-feedback";
import { useOwnedProjectVoiceSignals } from "@/hooks/use-owned-project-voice-signals";
import { mergeGameForStudioPreview, type StudioEditPreviewPatch } from "@/lib/studio-edit-preview-merge";
import {
  PROJECT_STUDIO_FEEDBACK_SECTION_ID,
  projectStudioPath,
} from "@/lib/project-nurture-links";
import { parseGameDetailTab, type GameDetailTab } from "@/lib/game-detail-tabs";
import { useProjectTestPlay } from "@/hooks/use-project-test-play";
import {
  buildProjectGrowthSnapshot,
  groupFeedbackByProject,
} from "@/lib/project-growth-state";
import { resolveVoiceSignalForGame } from "@/lib/project-voice-nurture";
import { useRedirectToLoginWhenLoggedOut } from "@/hooks/use-redirect-to-login-when-logged-out";
import { getVisibilityBadgeLabel } from "@/lib/project-visibility";
import { parseStudioOverviewEditMode } from "@/lib/studio-edit-url";
import { scrollStudioPanelToTop } from "@/lib/studio-panel-scroll";
import {
  STUDIO_PREVIEW_EDIT_ROUTES,
  type StudioPanelFocusRequest,
  type StudioPreviewEditTarget,
} from "@/lib/studio-preview-edit-targets";

type StudioOwnerAccess = "loading" | "owner" | "notOwner";

function ProjectStudioPageContent({ projectId }: { projectId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, hydrated } = useAuth();
  const { getOwnedProjectById, getDevlogsByProject, dataReady } = useGames();
  const { handleTestPlay } = useProjectTestPlay(projectId);

  const { entries: feedbackEntries, loaded: feedbackLoaded } =
    useOwnedProjectFeedback(user?.id);
  const { signals: voiceSignals, loaded: voiceLoaded } =
    useOwnedProjectVoiceSignals(user?.id);

  const game = getOwnedProjectById(projectId);

  const ownerAccess: StudioOwnerAccess = useMemo(() => {
    if (!hydrated || !dataReady || !user) {
      return "loading";
    }
    if (!game) {
      return "notOwner";
    }
    return game.ownerId === user.id ? "owner" : "notOwner";
  }, [hydrated, dataReady, user, game]);

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

  useRedirectToLoginWhenLoggedOut();

  useEffect(() => {
    if (ownerAccess !== "notOwner") {
      return;
    }
    router.replace(`/games/${projectId}`);
  }, [ownerAccess, projectId, router]);

  const [openFeedbackPanel, setOpenFeedbackPanel] = useState(false);
  const initialTab = parseGameDetailTab(searchParams.get("tab"));
  const [activeSection, setActiveSection] = useState<GameDetailTab>(initialTab);
  const [devlogModalOpen, setDevlogModalOpen] = useState(false);
  const [previewPatch, setPreviewPatch] = useState<StudioEditPreviewPatch | null>(null);
  const [panelFocus, setPanelFocus] = useState<StudioPanelFocusRequest | null>(null);
  const [panelFocusRequestId, setPanelFocusRequestId] = useState(0);

  const initialOverviewEditMode = parseStudioOverviewEditMode(searchParams.get("edit"));

  function handlePreviewEditTarget(target: StudioPreviewEditTarget) {
    setActiveSection("overview");
    setPanelFocusRequestId((current) => {
      const next = current + 1;
      const route = STUDIO_PREVIEW_EDIT_ROUTES[target];
      setPanelFocus({
        editMode: route.editMode,
        fieldId: route.fieldId,
        requestId: next,
        scrollToField: route.scrollToField,
      });
      return next;
    });
  }

  const previewGame = useMemo(() => {
    if (!game) {
      return null;
    }
    return mergeGameForStudioPreview(game, previewPatch);
  }, [game, previewPatch]);

  useEffect(() => {
    const edit = searchParams.get("edit");
    const devlog = searchParams.get("devlog");
    const tab = parseGameDetailTab(searchParams.get("tab"));
    if (edit === "prompts" || devlog === "1") {
      setDevlogModalOpen(true);
      if (searchParams.toString()) {
        router.replace(projectStudioPath(projectId));
      }
      return;
    }
    if (tab !== "overview") {
      setActiveSection(tab);
      return;
    }
    if (parseStudioOverviewEditMode(edit)) {
      setActiveSection("overview");
      scrollStudioPanelToTop();
    }
  }, [searchParams, projectId, router]);

  function clearOverviewEditQuery() {
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
        setActiveSection("voices");
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

  if (ownerAccess === "loading") {
    return (
      <StudioShell activeNav="mypage">
        <p className="text-zinc-500">読み込み中...</p>
      </StudioShell>
    );
  }

  if (!user) {
    return null;
  }

  if (ownerAccess === "notOwner") {
    return null;
  }

  if (!game) {
    return (
      <StudioShell activeNav="mypage">
        <p className="text-zinc-500">読み込み中...</p>
      </StudioShell>
    );
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

  return (
    <StudioShell activeNav="mypage">
      <DevlogComposeModal
        projectId={projectId}
        playableVersion={growthSnapshot.playableVersion}
        open={devlogModalOpen}
        onClose={() => setDevlogModalOpen(false)}
      />

      <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:gap-8">
        <div className="min-w-0 flex-1">
          <header className="border-b border-zinc-800/80 pb-3">
            <StudioMypageBackLink />
            <p className="mt-2 text-sm text-zinc-400">Studio編集</p>
            <p className="mt-0.5 text-xs text-zinc-500">
              {visibilityLabel} · v{growthSnapshot.playableVersion}
            </p>
          </header>

          <div className="mt-5">
            <GameDetailPlayerPreview
              projectId={projectId}
              sourceGame={previewGame ?? game}
              activeTab={activeSection}
              onTabChange={setActiveSection}
              onTestPlay={handleTestPlay}
              onEditTarget={handlePreviewEditTarget}
            />
          </div>
        </div>

        <StudioTabContextPanel
          projectId={projectId}
          activeSection={activeSection}
          onSectionChange={setActiveSection}
          game={game}
          growth={growthSnapshot}
          feedbackEntries={projectFeedback}
          devlogCount={devlogCount}
          initialOpenFeedback={openFeedbackPanel}
          onOpenNewVersionDevlog={() => setDevlogModalOpen(true)}
          onPreviewPatchChange={setPreviewPatch}
          initialOverviewEditMode={initialOverviewEditMode}
          onInitialOverviewEditHandled={clearOverviewEditQuery}
          panelFocus={panelFocus}
          onPanelFocusHandled={() => setPanelFocus(null)}
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
