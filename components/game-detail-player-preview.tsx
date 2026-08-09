"use client";

import { useMemo } from "react";
import { GameDetailOverviewV0Tab } from "@/components/game-detail-overview-v0-tab";
import { GameDetailPhaseBadge } from "@/components/game-detail-phase-badge";
import { GameDevlogV0Tab } from "@/components/game-devlog-v0-tab";
import { EveryonesVoiceSection } from "@/components/everyones-voice-section";
import { GameSpecialThanksTab } from "@/components/game-special-thanks-tab";
import { GameDetailTabBar } from "@/components/game-detail-tabs-region";
import { ProfileAvatar } from "@/components/profile-avatar";
import { StudioHeroPreviewGallery } from "@/components/studio-hero-preview-gallery";
import { useGames } from "@/components/games-provider";
import { formatDevlogPublishedAt } from "@/hooks/use-game-devlogs-v0";
import { useProjectPublicStats } from "@/hooks/use-project-public-stats";
import type { GameDetailTab } from "@/lib/game-detail-tabs";
import { resolveGameDetailPlayerMeta } from "@/lib/game-detail-player-meta";
import { resolvePlayDestinations, resolvePublicationDisplay } from "@/lib/game-play-destinations";
import {
  resolveGamePublishLinks,
  toRelatedLinkDisplays,
} from "@/lib/project-publish-links";
import type { Game } from "@/lib/mock-games";
import { resolveProjectGenres } from "@/lib/project-genres";
import { resolveProjectThumbnailUrls } from "@/lib/project-thumbnails";
import { publicProjectThumbnailPaths } from "@/lib/public-project-thumbnail";
import { PROJECT_ONE_LINE_DESCRIPTION_HERO_CLASS } from "@/lib/project-one-line-description";
import { PROJECT_TITLE_HERO_CLASS } from "@/lib/project-title";
import {
  resolvePublicProfileDisplay,
  type ResolvedPublicProfileDisplay,
} from "@/lib/public-profile-display";
import { getUserFacingGameTags } from "@/lib/user-labels";
import { gameToDetailV0 } from "@/lib/submitted-game-v0-adapter";
import { Clock } from "lucide-react";
import { StudioPreviewEditTarget } from "@/components/studio-preview-edit-target";
import type { StudioPreviewEditTarget as StudioPreviewEditTargetId } from "@/lib/studio-preview-edit-targets";
import {
  resolveStudioPreviewCategoryChrome,
  studioPreviewPlayInfoCardProp,
} from "@/lib/studio-preview-category-chrome";
import type { ProjectPublicStats } from "@/lib/supabase/project-public-stats-db";

function TagPill({ children }: { children: React.ReactNode }) {
  return (
    <span className="break-words rounded-md border border-zinc-700/80 bg-zinc-800/60 px-2.5 py-1 text-xs text-zinc-300">
      {children}
    </span>
  );
}

const EMPTY_PUBLIC_STATS: ProjectPublicStats = {
  feedbackParticipantCount: 0,
  watchCount: 0,
  witnessGrantCount: 0,
  latestDevlogAt: null,
  playPlayerCount: null,
};

export type GameDetailPlayerPreviewViewProps = {
  /** Edit Studio preview source (category chrome reads game.category). */
  sourceGame: Game;
  activeTab: GameDetailTab;
  onTabChange: (tab: GameDetailTab) => void;
  onTestPlay?: () => void;
  onEditTarget?: (target: StudioPreviewEditTargetId) => void;
  /** Optional owner profile enrich (live edit path). */
  ownerProfileDisplay?: ResolvedPublicProfileDisplay | null;
  publicStats?: ProjectPublicStats;
  publicStatsLoaded?: boolean;
  publicStatsError?: boolean;
};

/**
 * Studio edit preview body — no GamesProvider / network hooks.
 * Production wrapper: {@link GameDetailPlayerPreview}.
 * Behavioral verifies render this tree (same chrome wiring as production).
 */
export function GameDetailPlayerPreviewView({
  sourceGame,
  activeTab,
  onTabChange,
  onTestPlay,
  onEditTarget,
  ownerProfileDisplay = null,
  publicStats = EMPTY_PUBLIC_STATS,
  publicStatsLoaded = false,
  publicStatsError = true,
}: GameDetailPlayerPreviewViewProps) {
  const chrome = resolveStudioPreviewCategoryChrome({
    category: sourceGame.category,
  });

  const displayGame = useMemo(() => {
    const base = gameToDetailV0(sourceGame);
    if (!ownerProfileDisplay) {
      return base;
    }
    return {
      ...base,
      developer: {
        ...base.developer,
        id: ownerProfileDisplay.routeId,
        name: ownerProfileDisplay.displayName,
        avatar: ownerProfileDisplay.avatarSrc,
        bio: ownerProfileDisplay.bio,
        xAccount: ownerProfileDisplay.xAccount,
      },
    };
  }, [sourceGame, ownerProfileDisplay]);

  const playerMeta = useMemo(
    () => resolveGameDetailPlayerMeta(sourceGame),
    [sourceGame],
  );

  const tabCounts = useMemo(() => {
    if (!publicStatsLoaded || publicStatsError) {
      return undefined;
    }
    return { voices: publicStats.feedbackParticipantCount };
  }, [
    publicStats.feedbackParticipantCount,
    publicStatsError,
    publicStatsLoaded,
  ]);

  const overviewPublication = useMemo(
    () => resolvePublicationDisplay(sourceGame),
    [sourceGame],
  );
  const playDestinations = useMemo(
    () => resolvePlayDestinations(sourceGame),
    [sourceGame],
  );
  const relatedLinkDisplays = useMemo(() => {
    const { relatedLinks } = resolveGamePublishLinks(sourceGame);
    return toRelatedLinkDisplays(relatedLinks);
  }, [sourceGame]);

  const hasDevlogForOverview = Boolean(publicStats.latestDevlogAt);
  const devlogOverviewLabel = publicStats.latestDevlogAt
    ? formatDevlogPublishedAt(publicStats.latestDevlogAt)
    : "";

  const thumbnailUrls = useMemo(() => {
    const count = Math.max(1, resolveProjectThumbnailUrls(sourceGame).length || 1);
    return publicProjectThumbnailPaths(sourceGame.id, count);
  }, [sourceGame]);

  const posterFallback = useMemo(() => {
    const genres = resolveProjectGenres(sourceGame);
    return {
      projectId: sourceGame.id,
      title: sourceGame.title,
      genre: genres[0] ?? "その他",
      phase: sourceGame.phase,
      styleSeed: sourceGame.id,
    };
  }, [sourceGame]);

  const developerUserId = sourceGame.ownerId ?? displayGame.developer.id;
  const projectId = sourceGame.id;

  return (
    <div aria-label="公開ページの見え方" className="min-w-0 space-y-4">
      <h2 className="text-sm font-medium text-zinc-500">公開ページの見え方</h2>

      <section className="overflow-hidden rounded-2xl border border-zinc-800/80 bg-zinc-900/30">
        <div className="grid gap-0 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
          <StudioPreviewEditTarget target="thumbnail" onEditTarget={onEditTarget}>
            <StudioHeroPreviewGallery
              images={thumbnailUrls}
              posterFallback={posterFallback}
            />
          </StudioPreviewEditTarget>

          <div className="flex min-w-0 flex-col justify-center p-6 lg:p-8">
            <div className="flex flex-wrap gap-2">
              {chrome.categoryPillLabel ? (
                <span className="inline-flex flex-wrap gap-2">
                  <TagPill>{chrome.categoryPillLabel}</TagPill>
                </span>
              ) : (
                <StudioPreviewEditTarget target="genres" onEditTarget={onEditTarget} inline>
                  <span className="inline-flex flex-wrap gap-2">
                    {getUserFacingGameTags(displayGame.tags).map((tag) => (
                      <TagPill key={tag}>{tag}</TagPill>
                    ))}
                  </span>
                </StudioPreviewEditTarget>
              )}
            </div>
            <div className="mt-4 flex min-w-0 flex-wrap items-center gap-2">
              <StudioPreviewEditTarget target="title" onEditTarget={onEditTarget} inline>
                <p className={`${PROJECT_TITLE_HERO_CLASS} text-white`}>
                  {displayGame.title}
                </p>
              </StudioPreviewEditTarget>
              {playerMeta ? (
                <GameDetailPhaseBadge
                  meta={playerMeta}
                  onEditTarget={onEditTarget}
                  showPlayAccessBadge={chrome.showPlayAccessEditTarget}
                />
              ) : null}
            </div>
            <StudioPreviewEditTarget target="catch-copy" onEditTarget={onEditTarget}>
              <p className={`${PROJECT_ONE_LINE_DESCRIPTION_HERO_CLASS} text-zinc-400`}>
                {displayGame.lead}
              </p>
            </StudioPreviewEditTarget>
            <div className="mt-4 flex min-w-0 flex-wrap items-center gap-2 text-sm text-zinc-300">
              <ProfileAvatar
                src={displayGame.developer.avatar}
                userId={developerUserId}
                className="size-7 shrink-0"
                size={28}
              />
              <span className="break-words">{displayGame.developer.name}</span>
            </div>
            <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-zinc-500">
              <Clock className="size-3.5 shrink-0" aria-hidden="true" />
              最終更新 {displayGame.lastUpdated}
            </p>
          </div>
        </div>
      </section>

      <GameDetailTabBar
        activeTab={activeTab}
        onTabChange={onTabChange}
        counts={tabCounts}
      />

      {activeTab === "overview" && playerMeta ? (
        <GameDetailOverviewV0Tab
          game={displayGame}
          gameId={projectId}
          heroLead={displayGame.lead}
          playerMeta={playerMeta}
          overviewActivity={{
            lastUpdated: displayGame.lastUpdated,
            hasDevlog: hasDevlogForOverview,
            devlogLabel: devlogOverviewLabel,
            voiceCount: publicStats.feedbackParticipantCount,
          }}
          publication={overviewPublication}
          playDestinations={playDestinations}
          relatedLinks={relatedLinkDisplays}
          showUnsetPlayPlaceholders={chrome.showUnsetPlayPlaceholders}
          prototypeInfoCard={studioPreviewPlayInfoCardProp(chrome)}
          onEditTarget={
            chrome.commonFieldsOnly
              ? (target) => {
                  if (chrome.blockedEditTargets.includes(target)) return;
                  onEditTarget?.(target);
                }
              : onEditTarget
          }
        />
      ) : null}

      {activeTab === "devlog" ? (
        <GameDevlogV0Tab
          gameId={projectId}
          projectId={projectId}
          onPlayLatest={onTestPlay}
        />
      ) : null}

      {activeTab === "voices" ? (
        <EveryonesVoiceSection
          gameId={projectId}
          playableVersion={sourceGame.playableVersion}
          variant="tab"
        />
      ) : null}

      {activeTab === "special-thanks" ? (
        <GameSpecialThanksTab projectId={projectId} />
      ) : null}
    </div>
  );
}

export type GameDetailPlayerPreviewProps = {
  projectId: string;
  activeTab: GameDetailTab;
  onTabChange: (tab: GameDetailTab) => void;
  onTestPlay?: () => void;
  /** Studio 編集画面: 親の最新 game を渡すと保存後の左プレビュー更新を確実にする */
  sourceGame?: Game;
  onEditTarget?: (target: StudioPreviewEditTargetId) => void;
};

/**
 * Studio: プレイヤー詳細ページと同型の読み取り専用プレビュー。
 * /games/[id] の正本 UI は変更せず、Studio 内確認用に最小構成で再利用する。
 */
export function GameDetailPlayerPreview({
  projectId,
  activeTab,
  onTabChange,
  onTestPlay,
  sourceGame,
  onEditTarget,
}: GameDetailPlayerPreviewProps) {
  const { getSubmittedGameById, getDeveloperProfileByUserId } = useGames();
  const submittedGame = sourceGame ?? getSubmittedGameById(projectId);

  const ownerProfileDisplay = useMemo(() => {
    if (!submittedGame?.ownerId) {
      return null;
    }
    const profile = getDeveloperProfileByUserId(submittedGame.ownerId);
    const base = gameToDetailV0(submittedGame);
    return resolvePublicProfileDisplay(profile, {
      userId: submittedGame.ownerId,
      fallbackName: base.developer.name,
    });
  }, [submittedGame, getDeveloperProfileByUserId]);

  const {
    stats: publicStats,
    loaded: publicStatsLoaded,
    error: publicStatsError,
  } = useProjectPublicStats(projectId);

  if (!submittedGame) {
    return null;
  }

  return (
    <GameDetailPlayerPreviewView
      sourceGame={submittedGame}
      activeTab={activeTab}
      onTabChange={onTabChange}
      onTestPlay={onTestPlay}
      onEditTarget={onEditTarget}
      ownerProfileDisplay={ownerProfileDisplay}
      publicStats={publicStats}
      publicStatsLoaded={publicStatsLoaded}
      publicStatsError={publicStatsError}
    />
  );
}
