"use client";

import Link from "next/link";
import { GameChangeCheckCard } from "@/components/game-change-check-card";
import { GameChangeCheckSection } from "@/components/game-change-check-section";
import {
  GameDetailRealVoiceLayer,
  useGameDetailEngagement,
  type GameDetailRealVoiceHandle,
} from "@/components/game-detail-real-voice-layer";
import { GameDetailHeroGallery } from "@/components/game-detail-hero-gallery";
import { GameHeroPreviewGallery } from "@/components/game-hero-preview-gallery";
import { GameDetailPhaseBadge } from "@/components/game-detail-phase-badge";
import { YourInvolvementCard } from "@/components/your-involvement-card";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PublicXLink } from "@/components/public-x-link";
import { usePlayerProjectInvolvement } from "@/hooks/use-player-project-involvement";
import {
  FeedbackFormV0Modal,
  FeedbackSuccessV0Modal,
  FirstVoiceV0Modal,
  PlayStubV0Modal,
  useFeedbackFlowLock,
  type FeedbackFlowStep,
} from "@/components/feedback-v0-modals";
import { GameDetailOverviewV0Tab } from "@/components/game-detail-overview-v0-tab";
import { GameDevlogV0Tab } from "@/components/game-devlog-v0-tab";
import { EveryonesVoiceSection } from "@/components/everyones-voice-section";
import { GameVoicesV0Tab } from "@/components/game-voices-v0-tab";
import { GameSpecialThanksTab } from "@/components/game-special-thanks-tab";
import { GameDetailOwnerWorksCard } from "@/components/game-detail-owner-works-card";
import { GameNotFoundPanel } from "@/components/game-not-found-panel";
import { ContentReportButton } from "@/components/content-report-button";
import { StartConsultationButton } from "@/components/start-consultation-button";
import { UsageRelationButton } from "@/components/usage-relation-button";
import { PlayerShell } from "@/components/player-shell";
import { AgeGateBarrier } from "@/components/age-gate-barrier";
import { ProjectThumbnail } from "@/components/project-thumbnail";
import { isR18AgeRating } from "@/lib/age-rating";
import { useGames } from "@/components/games-provider";
import { useRequireAuth } from "@/hooks/use-require-auth";
import {
  buildLoginUrlWithReturn,
  gameDetailReturnPath,
  LOGIN_INTENT_REGISTERED,
} from "@/lib/login-return-url";
import {
  parseChangeCheckPreviewOverride,
  resolveChangeCheckPreviewState,
} from "@/lib/change-check-preview-mock";
import { getGameDetailV0, gameDetailIdFromTitle, resolveGameDetailId } from "@/lib/game-detail-v0-mock-data";
import {
  gameToDetailV0,
  isSupabaseProjectId,
} from "@/lib/submitted-game-v0-adapter";
import { resolvePublicProfileDisplay } from "@/lib/public-profile-display";
import { publicProjectThumbnailPaths } from "@/lib/public-project-thumbnail";
import {
  appendSessionVoice,
  createPreviewVoiceEntry,
} from "@/lib/game-voices-v0-mock-data";
import { firstVoiceQuestion } from "@/lib/feedback-v0-mock-data";
import { applyProjectOverviewV0 } from "@/lib/project-overview-v0-store";
import { projectStudioPath } from "@/lib/project-nurture-links";
import { useHideV0MockContent } from "@/lib/forge-deployment-context";
import { isProductionReleaseMode } from "@/lib/production-mode";
import {
  buildGameDetailTabHref,
  parseGameDetailTab,
  type GameDetailTab,
} from "@/lib/game-detail-tabs";
import {
  WATCH_BUTTON_OFF,
  WATCH_BUTTON_ON,
} from "@/lib/watch-ui-labels";
import { useProjectOverviewV0 } from "@/hooks/use-project-overview-v0";
import { formatDevlogPublishedAt } from "@/hooks/use-game-devlogs-v0";
import { getPrimaryPlayCtaLabel } from "@/lib/game-player-display";
import { resolveProjectDetailCategoryChrome } from "@/lib/project-detail-category-chrome";
import { useProjectPublicStats } from "@/hooks/use-project-public-stats";
import { resolveGameDetailPlayerMeta } from "@/lib/game-detail-player-meta";
import { resolveProjectGenres } from "@/lib/project-genres";
import { resolveProjectThumbnailUrls } from "@/lib/project-thumbnails";
import { PROJECT_TITLE_HERO_CLASS } from "@/lib/project-title";
import { getUserFacingGameTags } from "@/lib/user-labels";
import {
  openExternalPlayUrl,
  PLAY_URL_MISSING_MESSAGE,
  resolvePlayDestinations,
  resolvePrimaryPlayUrl,
  resolvePublicationDisplay,
  type PlayDestination,
} from "@/lib/game-play-destinations";
import {
  resolveGamePublishLinks,
  toRelatedLinkDisplays,
} from "@/lib/project-publish-links";
import { GamePlayDestinationModal } from "@/components/game-play-destination-modal";
import { GameDetailSkeleton } from "@/components/forge-loading-skeletons";
import {
  GameDetailTabBar,
  GameDetailTabPanels,
} from "@/components/game-detail-tabs-region";
import { useAuth } from "@/components/auth-provider";
import { useForgePerfRoute } from "@/hooks/use-forge-perf-route";
import { useInstantQueryTab } from "@/hooks/use-instant-query-tab";
import { captureScrollPosition } from "@/lib/preserve-scroll";
import { useGameDetailProject } from "@/hooks/use-game-detail-project";
import { ProfileAvatar } from "@/components/profile-avatar";
import { PublicStatText } from "@/components/public-stat-text";
import {
  Bookmark,
  Check,
  Clock,
  ExternalLink,
  Eye,
  Headphones,
  Play,
  Users,
  Wrench,
} from "lucide-react";
import type { ProjectDetailPrimaryCtaIcon } from "@/lib/project-detail-category-chrome";

const TAB_PARSE = parseGameDetailTab;

function PrimaryCtaIcon({
  name,
  className,
}: {
  name: ProjectDetailPrimaryCtaIcon;
  className?: string;
}) {
  switch (name) {
    case "headphones":
      return <Headphones className={className} aria-hidden="true" />;
    case "eye":
      return <Eye className={className} aria-hidden="true" />;
    case "wrench":
      return <Wrench className={className} aria-hidden="true" />;
    case "external-link":
      return <ExternalLink className={className} aria-hidden="true" />;
    case "play":
    default:
      return <Play className={className} aria-hidden="true" />;
  }
}

function TagPill({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-md border border-zinc-700/80 bg-zinc-800/60 px-2.5 py-1 text-xs text-zinc-300">
      {children}
    </span>
  );
}

function GameDetailDeveloperAvatar({
  name: _name,
  imageSrc,
  userId,
  sizeClass = "size-7",
}: {
  name: string;
  imageSrc?: string;
  userId?: string;
  sizeClass?: string;
  textClassName?: string;
}) {
  return (
    <ProfileAvatar
      src={imageSrc}
      userId={userId}
      className={`${sizeClass} shrink-0`}
      size={28}
    />
  );
}

function GameDetailV0PageContent({ id }: { id: string }) {
  const project = useGameDetailProject(id);
  const hideV0Mock = useHideV0MockContent();
  const isPublicProjectId = isSupabaseProjectId(id);

  useForgePerfRoute({
    route: `/games/${id}`,
    ready: project.loaded && (!hideV0Mock || !project.notFound),
    context: {
      hasGame: Boolean(project.game),
      isOwner: project.isOwner,
      directFetch: isPublicProjectId,
    },
  });

  if (isPublicProjectId && !project.loaded) {
    return (
      <PlayerShell>
        <GameDetailSkeleton />
      </PlayerShell>
    );
  }

  if (hideV0Mock && isPublicProjectId && project.notFound) {
    return <GameNotFoundPanel />;
  }

  return (
    <GameDetailV0PageBody
      id={id}
      detailProject={project.game}
      detailIsOwner={project.isOwner}
    />
  );
}

type GameDetailV0PageBodyProps = {
  id: string;
  detailProject: ReturnType<typeof useGameDetailProject>["game"];
  detailIsOwner: boolean;
};

function GameDetailV0PageBody({
  id,
  detailProject,
  detailIsOwner,
}: GameDetailV0PageBodyProps) {
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { activeTab, setActiveTab } = useInstantQueryTab<GameDetailTab>({
    parse: TAB_PARSE,
    buildHref: (tab, params) => buildGameDetailTabHref(id, tab, params),
    perfScope: "game-detail-tab",
  });
  const [visitedTabs, setVisitedTabs] = useState<Set<GameDetailTab>>(() => {
    const initial = TAB_PARSE(searchParams.get("tab"));
    return new Set([initial]);
  });
  const setDetailTab = useCallback(
    (tab: GameDetailTab) => {
      const restoreScroll = captureScrollPosition();
      setActiveTab(tab);
      setVisitedTabs((prev) => {
        if (prev.has(tab)) {
          return prev;
        }
        const next = new Set(prev);
        next.add(tab);
        return next;
      });
      restoreScroll();
      requestAnimationFrame(restoreScroll);
    },
    [setActiveTab],
  );
  const {
    recordPlay,
    hasPlayedGame,
    isProjectOwner,
    getOwnedProjects,
    isFollowing,
    toggleFollowCreator,
    getFollowerCount,
    refreshFollowerCount,
    getDeveloperProfileByUserId,
  } = useGames();
  const submittedGame = detailProject ?? undefined;
  const hideV0Mock = useHideV0MockContent();
  const resolvedId = isSupabaseProjectId(id) ? id : resolveGameDetailId(id);
  const isRealProject = Boolean(
    submittedGame && isSupabaseProjectId(submittedGame.id),
  );
  const externalLinkGame = submittedGame;
  const playerMeta = useMemo(
    () => resolveGameDetailPlayerMeta(externalLinkGame ?? submittedGame),
    [externalLinkGame, submittedGame],
  );
  const game = useMemo(() => {
    if (submittedGame && isSupabaseProjectId(submittedGame.id)) {
      const base = gameToDetailV0(submittedGame);
      const ownerId = submittedGame.ownerId;
      if (!ownerId) return base;
      const profile = getDeveloperProfileByUserId(ownerId);
      const display = resolvePublicProfileDisplay(profile, {
        userId: ownerId,
        fallbackName: base.developer.name,
      });
      return {
        ...base,
        developer: {
          ...base.developer,
          id: display.routeId,
          name: display.displayName,
          avatar: display.avatarSrc,
          bio: display.bio,
          xAccount: display.xAccount,
        },
      };
    }
    return getGameDetailV0(id);
  }, [id, submittedGame, getDeveloperProfileByUserId]);
  const thumbnailUrls = useMemo(
    () =>
      submittedGame && isRealProject
        ? publicProjectThumbnailPaths(
            submittedGame.id,
            Math.max(1, resolveProjectThumbnailUrls(submittedGame).length || 1),
          )
        : [],
    [submittedGame, isRealProject],
  );
  const posterFallback = useMemo(() => {
    if (!submittedGame || !isRealProject) {
      return null;
    }
    const genres = resolveProjectGenres(submittedGame);
    return {
      projectId: submittedGame.id,
      title: submittedGame.title,
      genre: genres[0] ?? "その他",
      phase: submittedGame.phase,
      styleSeed: submittedGame.id,
    };
  }, [submittedGame, isRealProject]);
  const developerAvatarSrc = game.developer.avatar;
  const {
    stats: publicStats,
    loaded: publicStatsLoaded,
    error: publicStatsError,
  } = useProjectPublicStats(isRealProject ? resolvedId : null);
  const voiceCountForOverview = isRealProject
    ? publicStats.feedbackParticipantCount
    : game.voiceCount;
  /**
   * タブ件数: 取得成功後の実数のみ（0 含む）。
   * 未取得・取得中・失敗・非実プロジェクトはバッジ非表示（便宜的な 0 にしない）。
   */
  const tabCounts = useMemo(() => {
    if (!isRealProject || !publicStatsLoaded || publicStatsError) {
      return undefined;
    }
    return { voices: publicStats.feedbackParticipantCount };
  }, [
    isRealProject,
    publicStats.feedbackParticipantCount,
    publicStatsError,
    publicStatsLoaded,
  ]);
  const hasDevlogForOverview = isRealProject
    ? Boolean(publicStats.latestDevlogAt)
    : Boolean(game.devlogUpdatedAgo && game.devlogUpdatedAgo !== "—");
  const devlogOverviewLabel =
    isRealProject && publicStats.latestDevlogAt
      ? formatDevlogPublishedAt(publicStats.latestDevlogAt)
      : !isRealProject && hasDevlogForOverview
        ? game.devlogUpdatedAgo
        : "";
  const overviewPublication = useMemo(
    () => resolvePublicationDisplay(externalLinkGame ?? submittedGame),
    [externalLinkGame, submittedGame],
  );
  const playSourceGame = externalLinkGame ?? submittedGame;
  const categoryChrome = useMemo(
    () =>
      resolveProjectDetailCategoryChrome({
        category: playSourceGame?.category ?? submittedGame?.category,
        game: playSourceGame ?? submittedGame ?? null,
      }),
    [playSourceGame, submittedGame],
  );
  const playDestinations = useMemo(
    () => resolvePlayDestinations(playSourceGame),
    [playSourceGame],
  );
  const relatedLinkDisplays = useMemo(() => {
    if (!playSourceGame) {
      return [];
    }
    const { relatedLinks } = resolveGamePublishLinks(playSourceGame);
    return toRelatedLinkDisplays(relatedLinks);
  }, [playSourceGame]);
  const primaryPlayUrl = useMemo(
    () => resolvePrimaryPlayUrl(playSourceGame),
    [playSourceGame],
  );
  const primaryPlayCtaLabel = useMemo(() => {
    if (!playSourceGame) {
      return categoryChrome.primaryCtaLabel;
    }
    if (categoryChrome.category === "game") {
      return getPrimaryPlayCtaLabel(playSourceGame);
    }
    return categoryChrome.primaryCtaLabel;
  }, [playSourceGame, categoryChrome]);
  const hasPlayDestination = Boolean(primaryPlayUrl);
  const playUnavailableOnPublic =
    hideV0Mock && isRealProject && !hasPlayDestination;
  const { revision: overviewRevision } = useProjectOverviewV0(resolvedId);
  const displayGame = useMemo(() => {
    if (isRealProject || isProductionReleaseMode()) {
      return game;
    }
    return applyProjectOverviewV0(game, resolvedId);
  }, [game, resolvedId, overviewRevision, isRealProject]);
  const { isLoggedIn, isGuestEntry, hydrated, requireAuth } = useRequireAuth();
  const returnPath = gameDetailReturnPath(resolvedId);
  const detailId = resolveGameDetailId(id);
  const ownerProjectId = useMemo(() => {
    if (detailIsOwner && submittedGame?.id) {
      return submittedGame.id;
    }
    if (!user?.id) {
      return null;
    }
    if (isProjectOwner(resolvedId, user.id)) {
      return resolvedId;
    }
    if (isProjectOwner(id, user.id)) {
      return id;
    }
    const owned = getOwnedProjects(user.id);
    const match = owned.find((project) => {
      if (project.id === id || project.id === resolvedId) {
        return true;
      }
      return gameDetailIdFromTitle(project.title) === detailId;
    });
    return match?.id ?? null;
  }, [
    detailIsOwner,
    submittedGame?.id,
    user?.id,
    isProjectOwner,
    getOwnedProjects,
    resolvedId,
    id,
    detailId,
  ]);
  const isOwnerPreview = ownerProjectId !== null;
  const ownerStudioHref = ownerProjectId
    ? isSupabaseProjectId(ownerProjectId)
      ? projectStudioPath(ownerProjectId)
      : `/studio/projects/${encodeURIComponent(ownerProjectId)}`
    : null;
  const [feedbackStep, setFeedbackStep] = useState<FeedbackFlowStep>("closed");
  const [playDestinationPickerOpen, setPlayDestinationPickerOpen] = useState(false);
  const [playUrlMissingVisible, setPlayUrlMissingVisible] = useState(false);
  const [voicesRefreshKey, setVoicesRefreshKey] = useState(0);
  const [following, setFollowing] = useState(game.developer.following);
  const [followersLoaded, setFollowersLoaded] = useState(false);
  const developerUserId =
    isRealProject && submittedGame?.ownerId ? submittedGame.ownerId : null;
  const developerPublicX =
    "xAccount" in game.developer ? game.developer.xAccount : undefined;
  const creatorRouteKey = game.developer.id;
  const realFollowing = developerUserId ? isFollowing(creatorRouteKey) : following;
  const showDeveloperFollow =
    !isOwnerPreview &&
    (developerUserId ? user?.id !== developerUserId : !hideV0Mock);

  useEffect(() => {
    if (!developerUserId) {
      setFollowersLoaded(false);
      return;
    }
    let cancelled = false;
    setFollowersLoaded(false);
    void refreshFollowerCount(developerUserId).finally(() => {
      if (!cancelled) {
        setFollowersLoaded(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [developerUserId, refreshFollowerCount]);

  const [mockWatching, setMockWatching] = useState(game.watching);
  const [mockSaved, setMockSaved] = useState(game.saved);
  const [played, setPlayed] = useState(false);
  const voiceLayerRef = useRef<GameDetailRealVoiceHandle>(null);
  const {
    watching: realWatching,
    saved: realSaved,
    toggleWatch,
    toggleSaved,
  } = useGameDetailEngagement(resolvedId, isRealProject);
  const watching = isRealProject ? realWatching : mockWatching;
  const saved = isRealProject ? realSaved : mockSaved;
  const {
    involvement,
    loaded: involvementLoaded,
  } = usePlayerProjectInvolvement({
    projectId: isRealProject ? resolvedId : null,
    playableVersion: submittedGame?.playableVersion ?? game.currentVersion,
    watching,
    enabled: isRealProject && hydrated && isLoggedIn,
  });
  const involvementLoginHref = buildLoginUrlWithReturn(returnPath, {
    intent: LOGIN_INTENT_REGISTERED,
  });

  const changeCheckOverride = parseChangeCheckPreviewOverride(
    searchParams.get("changeCheck"),
  );
  const previewChangeCheckState = resolveChangeCheckPreviewState(
    resolvedId,
    changeCheckOverride,
  );
  const returningPreview = searchParams.get("returning") === "1";
  const isReturningPlayer =
    returningPreview || (hydrated && isLoggedIn && hasPlayedGame(resolvedId));
  const showPreviewChangeCheck = Boolean(
    !isRealProject && isReturningPlayer && previewChangeCheckState,
  );

  useEffect(() => {
    if (isRealProject && hydrated && isLoggedIn) {
      setPlayed(hasPlayedGame(resolvedId));
    }
  }, [isRealProject, hydrated, isLoggedIn, hasPlayedGame, resolvedId]);

  const completePlaySession = useCallback(() => {
    if (isRealProject) {
      setPlayed(true);
      voiceLayerRef.current?.notifyPlayComplete();
      return;
    }
    setFeedbackStep("first-voice");
  }, [isRealProject]);

  const markGuestPlayOpened = useCallback(() => {
    setPlayUrlMissingVisible(false);
  }, []);

  const recordPlayInBackground = useCallback(() => {
    const projectId = submittedGame?.id ?? (isRealProject ? resolvedId : null);
    if (!projectId) {
      return;
    }
    void recordPlay(projectId).catch(() => undefined);
  }, [submittedGame?.id, isRealProject, resolvedId, recordPlay]);

  const markPlayOpened = useCallback(() => {
    setPlayUrlMissingVisible(false);
    recordPlayInBackground();
    completePlaySession();
  }, [recordPlayInBackground, completePlaySession]);

  const navigateToPlayDestination = useCallback(
    (url: string) => {
      // await せず同期で開く（recordPlay 待ちだと popup blocker で無反応になる）
      const opened = openExternalPlayUrl(url);
      if (!opened) {
        setPlayUrlMissingVisible(true);
        return;
      }
      markPlayOpened();
    },
    [markPlayOpened],
  );

  const openGuestPlayUrl = useCallback(
    (url: string) => {
      const opened = openExternalPlayUrl(url);
      if (!opened) {
        setPlayUrlMissingVisible(true);
        return;
      }
      markGuestPlayOpened();
    },
    [markGuestPlayOpened],
  );

  const resolveAndOpenPlay = useCallback(
    (recordSession: boolean) => {
      if (!hasPlayDestination) {
        setPlayUrlMissingVisible(true);
        return;
      }

      const openUrl = recordSession ? navigateToPlayDestination : openGuestPlayUrl;

      if (isRealProject) {
        if (primaryPlayUrl && playSourceGame?.playUrl?.trim()) {
          openUrl(primaryPlayUrl);
          return;
        }

        if (playDestinations.length === 1) {
          openUrl(playDestinations[0].url);
          return;
        }

        if (playDestinations.length > 1) {
          setPlayDestinationPickerOpen(true);
          return;
        }

        setPlayUrlMissingVisible(true);
        return;
      }

      if (primaryPlayUrl) {
        openUrl(primaryPlayUrl);
        return;
      }

      setFeedbackStep("play-stub");
    },
    [
      hasPlayDestination,
      isRealProject,
      primaryPlayUrl,
      playSourceGame?.playUrl,
      playDestinations,
      navigateToPlayDestination,
      openGuestPlayUrl,
    ],
  );

  const handlePlay = useCallback(() => {
    if (isGuestEntry) {
      resolveAndOpenPlay(false);
      return;
    }

    requireAuth(
      () => {
        resolveAndOpenPlay(true);
      },
      returnPath,
      { variant: "play" },
    );
  }, [isGuestEntry, requireAuth, returnPath, resolveAndOpenPlay]);

  const handlePlayDestinationSelect = useCallback(
    (_destination: PlayDestination) => {
      // <a target="_blank"> が新規タブを開く。ここでは記録のみ（二重 window.open しない）
      setPlayDestinationPickerOpen(false);
      if (isGuestEntry) {
        markGuestPlayOpened();
        return;
      }
      markPlayOpened();
    },
    [isGuestEntry, markPlayOpened, markGuestPlayOpened],
  );

  const handlePrimaryPlayAnchorClick = useCallback(() => {
    // ログイン済みの <a> ネイティブ遷移。記録のみ。
    markPlayOpened();
  }, [markPlayOpened]);

  const handleFeedback = useCallback(() => {
    // ゲストは DB へ FB を書き込めない。登録ログインへ誘導する。
    requireAuth(
      () => {
        if (isRealProject) {
          voiceLayerRef.current?.openForm();
          return;
        }
        setFeedbackStep("full-form");
      },
      returnPath,
      { variant: "feedback" },
    );
  }, [requireAuth, returnPath, isRealProject]);

  const handleProtectedAction = useCallback(
    (
      action: () => void,
      variant: "follow" | "watch" | "default" = "default",
    ) => {
      requireAuth(action, returnPath, { variant });
    },
    [requireAuth, returnPath],
  );

  const handleWatchToggle = useCallback(() => {
    handleProtectedAction(() => {
      if (isRealProject) {
        void toggleWatch();
        return;
      }
      setMockWatching((value) => !value);
    }, "watch");
  }, [handleProtectedAction, isRealProject, toggleWatch]);

  const handleToggleDeveloperFollow = useCallback(() => {
    if (developerUserId) {
      handleProtectedAction(() => {
        void toggleFollowCreator(creatorRouteKey);
      }, "follow");
      return;
    }
    handleProtectedAction(() => setFollowing((value) => !value));
  }, [
    creatorRouteKey,
    developerUserId,
    handleProtectedAction,
    toggleFollowCreator,
  ]);

  const handleFeedbackSuccess = useCallback(
    (body?: string) => {
      if (isRealProject) {
        return;
      }
      const defaultBody = `${firstVoiceQuestion.question}：ちょうどよい。世界観がとても良かったです。最終章が楽しみです。`;
      appendSessionVoice(game.id, createPreviewVoiceEntry(body?.trim() || defaultBody));
      setVoicesRefreshKey((value) => value + 1);
      setDetailTab("voices");
      setFeedbackStep("success");
    },
    [game.id, isRealProject, setDetailTab],
  );

  const handleRealVoiceComplete = useCallback(() => {
    setVoicesRefreshKey((value) => value + 1);
    setDetailTab("voices");
  }, [setDetailTab]);

  useFeedbackFlowLock(isRealProject ? "closed" : feedbackStep);

  const overviewActivity = useMemo(
    () =>
      playerMeta
        ? {
            lastUpdated: game.lastUpdated,
            hasDevlog: hasDevlogForOverview,
            devlogLabel: devlogOverviewLabel,
            voiceCount: voiceCountForOverview,
            playPlayerCount: isRealProject
              ? publicStats.playPlayerCount
              : null,
            watchCount: isRealProject ? publicStats.watchCount : null,
            statsLoaded: isRealProject ? publicStatsLoaded : true,
          }
        : null,
    [
      playerMeta,
      game.lastUpdated,
      hasDevlogForOverview,
      devlogOverviewLabel,
      voiceCountForOverview,
      isRealProject,
      publicStats.playPlayerCount,
      publicStats.watchCount,
      publicStatsLoaded,
    ],
  );

  const onPlayDestinationOpen =
    hydrated && isLoggedIn
      ? markPlayOpened
      : hydrated && isGuestEntry
        ? markGuestPlayOpened
        : undefined;

  const feedbackCtaLabel =
    hydrated && !isLoggedIn
      ? categoryChrome.feedbackCtaLabelGuest
      : categoryChrome.feedbackCtaLabelLoggedIn;

  const heroLeadText = game.lead.trim();
  const phaseDescription = playerMeta?.phaseDescription?.trim() ?? "";
  const heroDescriptionText = heroLeadText || phaseDescription;
  const showPhaseHintBelowTitle = Boolean(heroLeadText && phaseDescription);

  const overviewPanel = useMemo(
    () => (
      <GameDetailOverviewV0Tab
        game={displayGame}
        gameId={resolvedId}
        heroLead={game.lead}
        playerMeta={playerMeta}
        overviewActivity={overviewActivity}
        publication={overviewPublication}
        playDestinations={playDestinations}
        relatedLinks={relatedLinkDisplays}
        onPlayDestinationOpen={onPlayDestinationOpen}
        onFeedback={handleFeedback}
        feedbackCtaLabel={feedbackCtaLabel}
        prototypeInfoCard={
          categoryChrome.showGamePlayInfo
            ? undefined
            : categoryChrome.infoCard
        }
        primaryCtaLabel={
          categoryChrome.category === "game"
            ? undefined
            : categoryChrome.primaryCtaLabel
        }
      />
    ),
    [
      displayGame,
      resolvedId,
      game.lead,
      playerMeta,
      overviewActivity,
      overviewPublication,
      playDestinations,
      relatedLinkDisplays,
      onPlayDestinationOpen,
      handleFeedback,
      feedbackCtaLabel,
      categoryChrome,
    ],
  );

  const devlogPanel = useMemo(
    () => (
      <GameDevlogV0Tab
        gameId={resolvedId}
        projectId={isRealProject ? resolvedId : undefined}
        onPlayLatest={handlePlay}
      />
    ),
    [resolvedId, isRealProject, handlePlay],
  );

  const voicesPanel = useMemo(
    () =>
      isRealProject ? (
        <EveryonesVoiceSection
          gameId={resolvedId}
          playableVersion={submittedGame?.playableVersion}
          variant="tab"
          refreshKey={voicesRefreshKey}
          onSendVoice={handleFeedback}
        />
      ) : (
        <GameVoicesV0Tab
          gameId={resolvedId}
          currentVersion={game.currentVersion}
          refreshKey={voicesRefreshKey}
          onSendVoice={handleFeedback}
        />
      ),
    [
      isRealProject,
      resolvedId,
      submittedGame?.playableVersion,
      voicesRefreshKey,
      handleFeedback,
      game.currentVersion,
    ],
  );

  const specialThanksPanel = useMemo(
    () => (
      <GameSpecialThanksTab
        projectId={isRealProject ? resolvedId : undefined}
      />
    ),
    [isRealProject, resolvedId],
  );

  return (
    <PlayerShell>
      <AgeGateBarrier
        ageRating={submittedGame?.ageRating ?? (game as { ageRating?: string }).ageRating}
        bypass={
          isOwnerPreview ||
          resolvedId === "submit-draft-preview" ||
          !isRealProject
        }
      >
      {playDestinationPickerOpen ? (
        <GamePlayDestinationModal
          destinations={playDestinations}
          onSelect={handlePlayDestinationSelect}
          onClose={() => setPlayDestinationPickerOpen(false)}
        />
      ) : null}
      {isRealProject && !isGuestEntry ? (
        <GameDetailRealVoiceLayer
          ref={voiceLayerRef}
          gameId={resolvedId}
          played={played}
          onVoiceComplete={handleRealVoiceComplete}
        />
      ) : null}
      {!isRealProject ? (
        <>
          {feedbackStep === "play-stub" && (
            <PlayStubV0Modal
              game={game}
              onClose={() => setFeedbackStep("closed")}
              onPlayComplete={() => setFeedbackStep("first-voice")}
            />
          )}
          {feedbackStep === "first-voice" && (
            <FirstVoiceV0Modal
              game={game}
              onClose={() => setFeedbackStep("closed")}
              onOpenFullForm={() => setFeedbackStep("full-form")}
              onSubmitQuick={(answerLabel) =>
                handleFeedbackSuccess(
                  `${firstVoiceQuestion.question}：${answerLabel}。プレイしてみて感じたことを開発者に届けました。`,
                )
              }
            />
          )}
          {feedbackStep === "full-form" && (
            <FeedbackFormV0Modal
              game={game}
              onClose={() => setFeedbackStep("closed")}
              onSubmit={handleFeedbackSuccess}
            />
          )}
          {feedbackStep === "success" && (
            <FeedbackSuccessV0Modal game={game} onClose={() => setFeedbackStep("closed")} />
          )}
        </>
      ) : null}

      <div className="flex flex-col gap-8 xl:flex-row xl:items-start">
        <div className="min-w-0 flex-1 space-y-5">
          <section className="overflow-hidden rounded-2xl border border-zinc-800/80 bg-zinc-900/30">
            <div className="grid gap-0 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
              {isRealProject && posterFallback ? (
                <GameHeroPreviewGallery
                  images={thumbnailUrls}
                  posterFallback={posterFallback}
                />
              ) : (
                <GameDetailHeroGallery images={game.galleryImages} />
              )}

              <div className="flex min-w-0 flex-col justify-center p-6 lg:p-8">
                <div className="flex flex-wrap gap-2">
                  {getUserFacingGameTags(game.tags).map((tag) => (
                    <TagPill key={tag}>{tag}</TagPill>
                  ))}
                </div>
                <div className="mt-4 flex min-w-0 flex-wrap items-center gap-2">
                  <h1 className={`${PROJECT_TITLE_HERO_CLASS} text-white`}>
                    {game.title}
                  </h1>
                  {isR18AgeRating(submittedGame?.ageRating) ? (
                    <span className="mt-2 inline-flex rounded-md border border-rose-500/35 bg-rose-500/10 px-2 py-0.5 text-[11px] font-semibold text-rose-200">
                      R18
                    </span>
                  ) : null}
                  {playerMeta ? <GameDetailPhaseBadge meta={playerMeta} /> : null}
                </div>
                {showPhaseHintBelowTitle ? (
                  <p className="mt-1 text-xs leading-relaxed text-zinc-500">
                    {phaseDescription}
                  </p>
                ) : null}
                {isRealProject && !isOwnerPreview ? (
                  <div className="mt-2">
                    <ContentReportButton
                      target={{
                        targetType: "project",
                        targetId: resolvedId,
                        contextLabel: game.title,
                      }}
                      returnPath={returnPath}
                    />
                  </div>
                ) : null}
                {heroDescriptionText ? (
                  <p className="mt-2 break-words text-sm leading-relaxed text-zinc-400">
                    {heroDescriptionText}
                  </p>
                ) : null}
                <Link
                  href={`/creators/${game.developer.id}`}
                  className="mt-4 inline-flex min-w-0 max-w-full flex-wrap items-center gap-2 break-words text-sm text-zinc-300 transition-colors hover:text-violet-300"
                >
                  <GameDetailDeveloperAvatar
                    name={game.developer.name}
                    imageSrc={developerAvatarSrc}
                    userId={developerUserId ?? game.developer.id}
                  />
                  <span className="break-words">{game.developer.name}</span>
                  {developerPublicX ? (
                    <PublicXLink accountOrUrl={developerPublicX} />
                  ) : null}
                </Link>
                <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-zinc-500">
                  <Clock className="size-3.5 shrink-0" aria-hidden="true" />
                  最終更新 {game.lastUpdated}
                </p>
              </div>
            </div>
          </section>

          <div className="flex flex-col gap-2.5">
            {/*
              Always one row: left = primary+FB, right = watch+save.
              Narrow widths scroll horizontally (no wrap / no second action row).
            */}
            <div className="-mx-1 flex min-w-0 flex-nowrap items-center gap-x-2.5 overflow-x-auto px-1">
              <div className="flex shrink-0 flex-nowrap items-center gap-1.5">
                {hydrated &&
                isLoggedIn &&
                primaryPlayUrl &&
                !playUnavailableOnPublic &&
                (isRealProject ? Boolean(playSourceGame?.playUrl?.trim()) : true) ? (
                  <a
                    href={primaryPlayUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={handlePrimaryPlayAnchorClick}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-violet-600 px-3.5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-violet-500"
                  >
                    <PrimaryCtaIcon
                      name={categoryChrome.primaryCtaIcon}
                      className="size-4"
                    />
                    {primaryPlayCtaLabel}
                  </a>
                ) : (
                  <button
                    type="button"
                    onClick={handlePlay}
                    disabled={!hydrated || playUnavailableOnPublic}
                    title={
                      playUnavailableOnPublic
                        ? PLAY_URL_MISSING_MESSAGE
                        : undefined
                    }
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-violet-600 px-3.5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <PrimaryCtaIcon
                      name={categoryChrome.primaryCtaIcon}
                      className="size-4"
                    />
                    {hydrated && (isLoggedIn || isGuestEntry)
                      ? primaryPlayCtaLabel
                      : `ログインして${primaryPlayCtaLabel}`}
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleFeedback}
                  className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-zinc-700/80 bg-transparent px-2.5 py-2 text-xs font-medium text-zinc-400 transition-colors hover:border-zinc-600 hover:text-zinc-200"
                >
                  {feedbackCtaLabel}
                </button>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <div
                  className="h-5 w-px shrink-0 bg-zinc-800"
                  aria-hidden="true"
                />
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={handleWatchToggle}
                    className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1.5 text-xs font-medium transition-colors ${
                      watching
                        ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-400/90 hover:bg-emerald-500/10"
                        : "border-zinc-800/70 bg-transparent text-zinc-500 hover:border-zinc-700 hover:bg-zinc-900/40 hover:text-zinc-300"
                    }`}
                  >
                    <Check className="size-3.5 shrink-0" aria-hidden="true" />
                    {watching ? WATCH_BUTTON_ON : WATCH_BUTTON_OFF}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleProtectedAction(() => {
                        if (isRealProject) {
                          void toggleSaved();
                          return;
                        }
                        setMockSaved((value) => !value);
                      })
                    }
                    className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1.5 text-xs font-medium transition-colors ${
                      saved
                        ? "border-violet-500/30 bg-violet-500/5 text-violet-300/90 hover:bg-violet-500/10"
                        : "border-zinc-800/70 bg-transparent text-zinc-500 hover:border-zinc-700 hover:bg-zinc-900/40 hover:text-zinc-300"
                    }`}
                  >
                    <Bookmark
                      className="size-3.5 shrink-0"
                      aria-hidden="true"
                    />
                    {saved
                      ? categoryChrome.saveButtonLabelOn
                      : categoryChrome.saveButtonLabel}
                  </button>
                </div>
              </div>
            </div>
            {playUnavailableOnPublic || playUrlMissingVisible ? (
              <p className="text-xs text-zinc-500" role="status">
                {PLAY_URL_MISSING_MESSAGE}
              </p>
            ) : null}
          </div>

          {isRealProject && !isOwnerPreview ? (
            <GameChangeCheckSection
              gameId={resolvedId}
              playableVersion={submittedGame?.playableVersion}
              onTryVersion={handlePlay}
              onViewUpdate={() => setDetailTab("devlog")}
            />
          ) : null}

          {showPreviewChangeCheck && previewChangeCheckState ? (
            <GameChangeCheckCard
              state={previewChangeCheckState}
              currentVersion={game.currentVersion}
              onViewUpdate={() => setDetailTab("devlog")}
              onTryVersion={handlePlay}
            />
          ) : null}

          <GameDetailTabBar
            activeTab={activeTab}
            onTabChange={setDetailTab}
            counts={tabCounts}
          />

          <GameDetailTabPanels
            activeTab={activeTab}
            visitedTabs={visitedTabs}
            overview={overviewPanel}
            devlog={devlogPanel}
            voices={voicesPanel}
            specialThanks={specialThanksPanel}
          />
        </div>

        <aside className="w-full shrink-0 space-y-5 xl:w-72">
          {isOwnerPreview && ownerProjectId && ownerStudioHref ? (
            <GameDetailOwnerWorksCard
              projectId={ownerProjectId}
              title={game.title}
              visibility={submittedGame?.visibility}
              studioHref={ownerStudioHref}
            />
          ) : (
            <YourInvolvementCard
              hydrated={hydrated}
              isLoggedIn={isLoggedIn}
              loginHref={involvementLoginHref}
              involvement={involvement}
              loaded={involvementLoaded}
              watching={watching}
              playableVersion={
                submittedGame?.playableVersion ?? game.currentVersion
              }
              onPlayLatest={handlePlay}
              playDisabled={!hydrated || playUnavailableOnPublic}
              showPlaySemantics={categoryChrome.category === "game"}
            />
          )}

          <section className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-5">
            <Link
              href={`/creators/${game.developer.id}`}
              className="flex items-center gap-3 rounded-xl transition-colors hover:text-violet-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500/70"
            >
              <GameDetailDeveloperAvatar
                name={game.developer.name}
                imageSrc={developerAvatarSrc}
                userId={developerUserId ?? game.developer.id}
                sizeClass="size-12"
                textClassName="text-sm"
              />
              <div className="min-w-0">
                <p className="truncate font-semibold text-white transition-colors">
                  {game.developer.name}
                </p>
                {developerPublicX ? (
                  <PublicXLink accountOrUrl={developerPublicX} className="mt-1" />
                ) : null}
                {developerUserId ? (
                  <p className="text-xs text-zinc-500">
                    <PublicStatText
                      loaded={followersLoaded}
                      value={getFollowerCount(creatorRouteKey, 0)}
                      label="フォロワー"
                      className="text-xs text-zinc-500"
                    />
                  </p>
                ) : !isRealProject && game.developer.followers > 0 ? (
                  <p className="text-xs text-zinc-500">
                    フォロワー {game.developer.followers.toLocaleString()}人
                  </p>
                ) : null}
              </div>
            </Link>
            {game.developer.bio ? (
              <p className="mt-3 whitespace-pre-wrap break-words text-xs leading-relaxed text-zinc-500">
                {game.developer.bio}
              </p>
            ) : null}
            {showDeveloperFollow ? (
              <button
                type="button"
                onClick={handleToggleDeveloperFollow}
                className={`mt-4 w-full rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors ${
                  realFollowing
                    ? "border-rose-500/40 bg-rose-500/10 text-rose-300"
                    : "border-zinc-700 text-zinc-300 hover:border-zinc-600"
                }`}
              >
                {realFollowing
                  ? categoryChrome.followCreatorLabelOn
                  : categoryChrome.followCreatorLabel}
              </button>
            ) : null}
          </section>

          {developerUserId && user?.id !== developerUserId ? (
            <section className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-5">
              <h2 className="text-sm font-semibold text-white">制作・利用について</h2>
              <div className="mt-4 space-y-2">
                <StartConsultationButton
                  counterpartId={developerUserId}
                  counterpartProjectId={resolvedId}
                  label="利用・コラボについてメッセージ"
                  fullWidth
                />
                {isRealProject && !isOwnerPreview ? (
                  <UsageRelationButton
                    focusProject={{ id: resolvedId, title: game.title }}
                    candidateProjects={getOwnedProjects(user?.id)
                      .filter((project) => project.id !== resolvedId)
                      .map((project) => ({ id: project.id, title: project.title }))}
                    fullWidth
                    className="w-full rounded-xl border border-zinc-700 px-4 py-2.5 text-sm font-medium text-zinc-300 hover:border-zinc-600 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-zinc-700"
                  />
                ) : null}
              </div>
            </section>
          ) : null}

          {/*
            Phase B+ 候補: 右サイドバーに「類似の作品」カードを置く余地。
            関連タグはヒーロー上部と重複するため表示しない。
          */}

          {game.relatedGames.length > 0 ? (
          <section className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-5">
            <h2 className="text-sm font-semibold text-white">関連作品</h2>
            <ul className="mt-4 space-y-4">
              {game.relatedGames.map((related) => (
                <li key={related.id}>
                  <Link
                    href={`/games/${related.id}`}
                    className="flex gap-3 rounded-xl transition-colors hover:bg-zinc-800/40"
                  >
                    <ProjectThumbnail
                      projectId={related.id}
                      title={related.title}
                      genre={related.genre}
                      variant="chip"
                      className="size-14 shrink-0"
                      sizes="56px"
                    />
                    <div className="min-w-0 py-0.5">
                      <p className="truncate text-sm font-medium text-white">{related.title}</p>
                      <p className="text-xs text-zinc-500">{related.genre}</p>
                      <p className="mt-1 inline-flex items-center gap-1 text-xs text-zinc-500">
                        <Users className="size-3" aria-hidden="true" />
                        見届け人 {related.witnessCount.toLocaleString()}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
            <Link
              href="/search"
              className="mt-4 block text-xs text-violet-400 transition-colors hover:text-violet-300"
            >
              関連作品をすべて見る →
            </Link>
          </section>
          ) : null}
        </aside>
      </div>
      </AgeGateBarrier>
    </PlayerShell>
  );
}

export function GameDetailV0Page({ id }: { id: string }) {
  return (
    <Suspense
      fallback={
        <PlayerShell>
          <GameDetailSkeleton />
        </PlayerShell>
      }
    >
      <GameDetailV0PageContent id={id} />
    </Suspense>
  );
}
