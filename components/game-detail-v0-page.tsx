"use client";

import Image from "next/image";
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
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { GameNotFoundPanel } from "@/components/game-not-found-panel";
import { ContentReportButton } from "@/components/content-report-button";
import { GameThumbnail, PlayerShell } from "@/components/player-shell";
import { useGames } from "@/components/games-provider";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { gameDetailReturnPath } from "@/lib/login-return-url";
import {
  parseChangeCheckPreviewOverride,
  resolveChangeCheckPreviewState,
} from "@/lib/change-check-preview-mock";
import { getGameDetailV0, gameDetailIdFromTitle, resolveGameDetailId } from "@/lib/game-detail-v0-mock-data";
import {
  gameToDetailV0,
  isSupabaseProjectId,
} from "@/lib/submitted-game-v0-adapter";
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
import { GamePlayDestinationModal } from "@/components/game-play-destination-modal";
import {
  Bookmark,
  Check,
  Clock,
  Heart,
  Play,
  Users,
} from "lucide-react";

const tabs: { id: GameDetailTab; label: string }[] = [
  { id: "overview", label: "概要" },
  { id: "devlog", label: "開発ログ" },
  { id: "voices", label: "みんなのフィードバック" },
];

function TagPill({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-md border border-zinc-700/80 bg-zinc-800/60 px-2.5 py-1 text-xs text-zinc-300">
      {children}
    </span>
  );
}

function GameDetailDeveloperAvatar({
  name,
  imageSrc,
  sizeClass = "size-7",
  textClassName = "text-xs",
}: {
  name: string;
  imageSrc?: string;
  sizeClass?: string;
  textClassName?: string;
}) {
  const src = imageSrc?.trim();
  if (src) {
    return (
      <span className={`relative ${sizeClass} shrink-0 overflow-hidden rounded-full bg-zinc-800`}>
        <Image src={src} alt="" fill className="object-cover" />
      </span>
    );
  }

  return (
    <span
      className={`flex ${sizeClass} shrink-0 items-center justify-center rounded-full bg-zinc-800 font-medium text-zinc-400 ${textClassName}`}
    >
      {name.slice(0, 1) || "?"}
    </span>
  );
}

function GameDetailV0PageContent({ id }: { id: string }) {
  const { getSubmittedGameById, dataReady } = useGames();
  const hideV0Mock = useHideV0MockContent();
  const submittedGame = dataReady ? getSubmittedGameById(id) : undefined;

  if (hideV0Mock) {
    if (!dataReady) {
      return (
        <PlayerShell>
          <p className="text-sm text-zinc-500">読み込み中...</p>
        </PlayerShell>
      );
    }
    const hasRealProject = Boolean(
      isSupabaseProjectId(id) &&
        submittedGame &&
        isSupabaseProjectId(submittedGame.id),
    );
    if (!hasRealProject) {
      return <GameNotFoundPanel />;
    }
  }

  return <GameDetailV0PageBody id={id} />;
}

function GameDetailV0PageBody({ id }: { id: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = parseGameDetailTab(searchParams.get("tab"));
  const {
    getSubmittedGameById,
    getGameById,
    dataReady,
    recordPlay,
    hasPlayedGame,
    isProjectOwner,
    getOwnedProjects,
    isFollowing,
    toggleFollowCreator,
    getFollowerCount,
    refreshFollowerCount,
  } = useGames();
  const submittedGame = dataReady ? getSubmittedGameById(id) : undefined;
  const hideV0Mock = useHideV0MockContent();
  const resolvedId = isSupabaseProjectId(id) ? id : resolveGameDetailId(id);
  const waitingForCatalog = isSupabaseProjectId(id) && !dataReady;

  const isRealProject = Boolean(
    submittedGame && isSupabaseProjectId(submittedGame.id),
  );
  const externalLinkGame = getGameById(resolvedId) ?? submittedGame;
  const playerMeta = useMemo(
    () => resolveGameDetailPlayerMeta(externalLinkGame ?? submittedGame),
    [externalLinkGame, submittedGame],
  );
  const game = useMemo(() => {
    if (submittedGame && isSupabaseProjectId(submittedGame.id)) {
      return gameToDetailV0(submittedGame);
    }
    return getGameDetailV0(id);
  }, [id, submittedGame]);
  const thumbnailUrls = useMemo(
    () =>
      submittedGame && isRealProject
        ? resolveProjectThumbnailUrls(submittedGame)
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
  const developerAvatarSrc = useMemo(() => {
    if (isRealProject) {
      return thumbnailUrls[0] ?? "";
    }
    return game.developer.avatar;
  }, [isRealProject, thumbnailUrls, game.developer.avatar]);
  const { stats: publicStats } = useProjectPublicStats(
    isRealProject ? resolvedId : null,
  );
  const voiceCountForOverview = isRealProject
    ? publicStats.feedbackParticipantCount
    : game.voiceCount;
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
  const playDestinations = useMemo(
    () => resolvePlayDestinations(playSourceGame),
    [playSourceGame],
  );
  const primaryPlayUrl = useMemo(
    () => resolvePrimaryPlayUrl(playSourceGame),
    [playSourceGame],
  );
  const hasPlayDestination = Boolean(primaryPlayUrl);
  const playUnavailableOnPublic =
    hideV0Mock && isRealProject && !hasPlayDestination;
  const primaryPlayActionLabel = useMemo(() => {
    if (!primaryPlayUrl) {
      return "ブラウザで起動";
    }
    return (
      playDestinations.find((destination) => destination.url === primaryPlayUrl)
        ?.actionLabel ?? "ブラウザで起動"
    );
  }, [playDestinations, primaryPlayUrl]);
  const { revision: overviewRevision } = useProjectOverviewV0(resolvedId);
  const displayGame = useMemo(() => {
    if (isRealProject || isProductionReleaseMode()) {
      return game;
    }
    return applyProjectOverviewV0(game, resolvedId);
  }, [game, resolvedId, overviewRevision, isRealProject]);
  const { isLoggedIn, hydrated, requireAuth, user } = useRequireAuth();
  const returnPath = gameDetailReturnPath(resolvedId);
  const detailId = resolveGameDetailId(id);
  const ownerProjectId = useMemo(() => {
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
  }, [user?.id, isProjectOwner, getOwnedProjects, resolvedId, id, detailId]);
  const isOwnerPreview = ownerProjectId !== null;
  const ownerStudioHref = ownerProjectId
    ? isSupabaseProjectId(ownerProjectId)
      ? projectStudioPath(ownerProjectId)
      : `/studio/projects/${encodeURIComponent(ownerProjectId)}`
    : null;
  const setDetailTab = useCallback(
    (tab: GameDetailTab) => {
      router.replace(buildGameDetailTabHref(id, tab, searchParams), { scroll: false });
    },
    [id, router, searchParams],
  );
  const [feedbackStep, setFeedbackStep] = useState<FeedbackFlowStep>("closed");
  const [playDestinationPickerOpen, setPlayDestinationPickerOpen] = useState(false);
  const [playUrlMissingVisible, setPlayUrlMissingVisible] = useState(false);
  const [voicesRefreshKey, setVoicesRefreshKey] = useState(0);
  const [following, setFollowing] = useState(game.developer.following);
  const developerUserId =
    isRealProject && submittedGame?.ownerId ? submittedGame.ownerId : null;
  const creatorRouteKey = game.developer.id;
  const realFollowing = developerUserId ? isFollowing(creatorRouteKey) : following;
  const showDeveloperFollow =
    !isOwnerPreview &&
    (developerUserId ? user?.id !== developerUserId : !hideV0Mock);

  useEffect(() => {
    if (developerUserId) {
      void refreshFollowerCount(developerUserId);
    }
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

  const handlePlay = useCallback(() => {
    requireAuth(() => {
      if (!hasPlayDestination) {
        setPlayUrlMissingVisible(true);
        return;
      }

      // 本番作品: projects.play_url を最優先で確実に開く（公式サイト等との選択モーダルを挟まない）
      if (isRealProject) {
        if (primaryPlayUrl && playSourceGame?.playUrl?.trim()) {
          navigateToPlayDestination(primaryPlayUrl);
          return;
        }

        if (playDestinations.length === 1) {
          navigateToPlayDestination(playDestinations[0].url);
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
        navigateToPlayDestination(primaryPlayUrl);
        return;
      }

      setFeedbackStep("play-stub");
    }, returnPath);
  }, [
    requireAuth,
    returnPath,
    hasPlayDestination,
    isRealProject,
    playSourceGame?.playUrl,
    playDestinations,
    primaryPlayUrl,
    navigateToPlayDestination,
  ]);

  const handlePlayDestinationSelect = useCallback(
    (_destination: PlayDestination) => {
      // <a target="_blank"> が新規タブを開く。ここでは記録のみ（二重 window.open しない）
      setPlayDestinationPickerOpen(false);
      markPlayOpened();
    },
    [markPlayOpened],
  );

  const handlePrimaryPlayAnchorClick = useCallback(() => {
    // ログイン済みの <a> ネイティブ遷移。記録のみ。
    markPlayOpened();
  }, [markPlayOpened]);

  const handleFeedback = useCallback(() => {
    requireAuth(() => {
      if (isRealProject) {
        voiceLayerRef.current?.openForm();
        return;
      }
      setFeedbackStep("full-form");
    }, returnPath);
  }, [requireAuth, returnPath, isRealProject]);

  const handleProtectedAction = useCallback(
    (action: () => void) => {
      requireAuth(action, returnPath);
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
    });
  }, [handleProtectedAction, isRealProject, toggleWatch]);

  const handleToggleDeveloperFollow = useCallback(() => {
    if (developerUserId) {
      handleProtectedAction(() => {
        void toggleFollowCreator(creatorRouteKey);
      });
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

  if (waitingForCatalog) {
    return (
      <PlayerShell>
        <p className="text-sm text-zinc-500">読み込み中...</p>
      </PlayerShell>
    );
  }

  return (
    <PlayerShell>
      {playDestinationPickerOpen ? (
        <GamePlayDestinationModal
          destinations={playDestinations}
          onSelect={handlePlayDestinationSelect}
          onClose={() => setPlayDestinationPickerOpen(false)}
        />
      ) : null}
      {isRealProject ? (
        <GameDetailRealVoiceLayer
          ref={voiceLayerRef}
          gameId={resolvedId}
          played={played}
          onVoiceComplete={handleRealVoiceComplete}
        />
      ) : (
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
      )}

      <div className="flex flex-col gap-8 xl:flex-row xl:items-start">
        <div className="min-w-0 flex-1 space-y-5">
          {isOwnerPreview ? (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-orange-500/25 bg-orange-500/5 px-3 py-2 text-xs">
              <span className="text-orange-200/90">
                Studioプレビュー中：プレイヤーに見えるページを確認しています
              </span>
              {ownerStudioHref ? (
                <Link
                  href={ownerStudioHref}
                  className="shrink-0 font-medium text-orange-200 transition-colors hover:text-white"
                >
                  Studioで編集 →
                </Link>
              ) : null}
            </div>
          ) : null}

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
                  {playerMeta ? <GameDetailPhaseBadge meta={playerMeta} /> : null}
                </div>
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
                <p className="mt-2 break-words text-sm leading-relaxed text-zinc-400">{game.lead}</p>
                <Link
                  href={`/creators/${game.developer.id}`}
                  className="mt-4 inline-flex min-w-0 max-w-full flex-wrap items-center gap-2 break-words text-sm text-zinc-300 transition-colors hover:text-violet-300"
                >
                  <GameDetailDeveloperAvatar
                    name={game.developer.name}
                    imageSrc={developerAvatarSrc}
                  />
                  <span className="break-words">{game.developer.name}</span>
                </Link>
                <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-zinc-500">
                  <Clock className="size-3.5 shrink-0" aria-hidden="true" />
                  最終更新 {game.lastUpdated}
                </p>
              </div>
            </div>
          </section>

          <div className="flex flex-col gap-2">
          <div className="flex flex-wrap gap-3">
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
                className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-violet-500"
              >
                <Play className="size-4" aria-hidden="true" />
                プレイする
              </a>
            ) : (
              <button
                type="button"
                onClick={handlePlay}
                disabled={!hydrated || playUnavailableOnPublic}
                title={
                  playUnavailableOnPublic ? PLAY_URL_MISSING_MESSAGE : undefined
                }
                className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Play className="size-4" aria-hidden="true" />
                {hydrated && !isLoggedIn ? "ログインしてプレイ" : "プレイする"}
              </button>
            )}
            <button
              type="button"
              onClick={handleWatchToggle}
              className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors ${
                watching
                  ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                  : "border-zinc-700 text-zinc-300 hover:border-zinc-600 hover:text-white"
              }`}
            >
              <Check className="size-4" aria-hidden="true" />
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
              className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors ${
                saved
                  ? "border-violet-500/40 bg-violet-500/10 text-violet-200"
                  : "border-zinc-700 text-zinc-300 hover:border-zinc-600 hover:text-white"
              }`}
            >
              <Bookmark className="size-4" aria-hidden="true" />
              {saved ? "保存済み" : "あとで遊ぶ"}
            </button>
            {showDeveloperFollow ? (
              <button
                type="button"
                onClick={handleToggleDeveloperFollow}
                className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors ${
                  realFollowing
                    ? "border-rose-500/40 bg-rose-500/10 text-rose-300"
                    : "border-zinc-700 text-zinc-300 hover:border-zinc-600 hover:text-white"
                }`}
              >
                <Heart className="size-4" aria-hidden="true" />
                {realFollowing ? "開発者フォロー中" : "開発者をフォロー"}
              </button>
            ) : null}
          </div>
          {playUnavailableOnPublic || playUrlMissingVisible ? (
            <p className="text-xs text-amber-300/90" role="status">
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

          <div className="border-b border-zinc-800/80">
            <div className="flex gap-1 overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setDetailTab(tab.id)}
                  className={`shrink-0 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? "border-violet-500 text-violet-200"
                      : "border-transparent text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {activeTab === "overview" && (
            <GameDetailOverviewV0Tab
              game={displayGame}
              gameId={resolvedId}
              heroLead={game.lead}
              playerMeta={playerMeta}
              overviewActivity={
                playerMeta
                  ? {
                      lastUpdated: game.lastUpdated,
                      hasDevlog: hasDevlogForOverview,
                      devlogLabel: devlogOverviewLabel,
                      voiceCount: voiceCountForOverview,
                    }
                  : null
              }
              publication={overviewPublication}
              primaryPlayAction={
                hasPlayDestination
                  ? {
                      label: primaryPlayActionLabel,
                      href:
                        hydrated &&
                        isLoggedIn &&
                        primaryPlayUrl &&
                        !playUnavailableOnPublic
                          ? primaryPlayUrl
                          : null,
                      onClick:
                        hydrated &&
                        isLoggedIn &&
                        primaryPlayUrl &&
                        !playUnavailableOnPublic
                          ? handlePrimaryPlayAnchorClick
                          : handlePlay,
                      disabled: !hydrated || playUnavailableOnPublic,
                    }
                  : null
              }
              playDestinations={playDestinations}
              onPlayDestinationOpen={
                hydrated && isLoggedIn ? markPlayOpened : undefined
              }
              playUrlMissingMessage={
                playUnavailableOnPublic || playUrlMissingVisible
                  ? PLAY_URL_MISSING_MESSAGE
                  : null
              }
              onFeedback={handleFeedback}
              feedbackCtaLabel={
                hydrated && !isLoggedIn
                  ? "ログインしてフィードバックする"
                  : "フィードバックする"
              }
            />
          )}

          {activeTab === "devlog" && (
            <GameDevlogV0Tab
              gameId={resolvedId}
              projectId={isRealProject ? resolvedId : undefined}
              onPlayLatest={handlePlay}
            />
          )}
          {activeTab === "voices" &&
            (isRealProject ? (
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
            ))}
        </div>

        <aside className="w-full shrink-0 space-y-5 xl:w-72">
          <section className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-5">
            <div className="flex items-center gap-3">
              <GameDetailDeveloperAvatar
                name={game.developer.name}
                imageSrc={developerAvatarSrc}
                sizeClass="size-12"
                textClassName="text-sm"
              />
              <div className="min-w-0">
                <p className="truncate font-semibold text-white">{game.developer.name}</p>
                {developerUserId || (!isRealProject && game.developer.followers > 0) ? (
                  <p className="text-xs text-zinc-500">
                    フォロワー{" "}
                    {(developerUserId
                      ? getFollowerCount(creatorRouteKey, 0)
                      : game.developer.followers
                    ).toLocaleString()}
                    人
                  </p>
                ) : null}
              </div>
            </div>
            {game.developer.bio ? (
              <p className="mt-3 text-xs leading-relaxed text-zinc-500">{game.developer.bio}</p>
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
                {realFollowing ? "開発者フォロー中" : "開発者をフォローする"}
              </button>
            ) : null}
            <Link
              href={`/creators/${game.developer.id}`}
              className="mt-2 block text-center text-xs text-violet-400 transition-colors hover:text-violet-300"
            >
              プロフィールを見る →
            </Link>
          </section>

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
                    <GameThumbnail
                      src={related.image}
                      alt={related.title}
                      className="size-14 shrink-0"
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
    </PlayerShell>
  );
}

export function GameDetailV0Page({ id }: { id: string }) {
  return (
    <Suspense
      fallback={
        <PlayerShell>
          <p className="text-sm text-zinc-500">読み込み中...</p>
        </PlayerShell>
      }
    >
      <GameDetailV0PageContent id={id} />
    </Suspense>
  );
}
