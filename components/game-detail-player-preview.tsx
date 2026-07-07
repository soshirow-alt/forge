"use client";

import Image from "next/image";
import { useMemo } from "react";
import { GameDetailOverviewV0Tab } from "@/components/game-detail-overview-v0-tab";
import { GameDetailPhaseBadge } from "@/components/game-detail-phase-badge";
import { GameDevlogV0Tab } from "@/components/game-devlog-v0-tab";
import { EveryonesVoiceSection } from "@/components/everyones-voice-section";
import { StudioHeroPreviewGallery } from "@/components/studio-hero-preview-gallery";
import { useGames } from "@/components/games-provider";
import { formatDevlogPublishedAt } from "@/hooks/use-game-devlogs-v0";
import { useProjectPublicStats } from "@/hooks/use-project-public-stats";
import type { GameDetailTab } from "@/lib/game-detail-tabs";
import { resolveGameDetailPlayerMeta } from "@/lib/game-detail-player-meta";
import { resolvePublicationDisplay } from "@/lib/game-play-destinations";
import type { Game } from "@/lib/mock-games";
import { resolveProjectGenres } from "@/lib/project-genres";
import { resolveProjectThumbnailUrls } from "@/lib/project-thumbnails";
import { PROJECT_ONE_LINE_DESCRIPTION_HERO_CLASS } from "@/lib/project-one-line-description";
import { PROJECT_TITLE_HERO_CLASS } from "@/lib/project-title";
import { getUserFacingGameTags } from "@/lib/user-labels";
import { gameToDetailV0 } from "@/lib/submitted-game-v0-adapter";
import { Clock } from "lucide-react";
import { StudioPreviewEditTarget } from "@/components/studio-preview-edit-target";
import type { StudioPreviewEditTarget as StudioPreviewEditTargetId } from "@/lib/studio-preview-edit-targets";

const previewTabs: { id: GameDetailTab; label: string }[] = [
  { id: "overview", label: "概要" },
  { id: "devlog", label: "開発ログ" },
  { id: "voices", label: "みんなのフィードバック" },
];

function TagPill({ children }: { children: React.ReactNode }) {
  return (
    <span className="break-words rounded-md border border-zinc-700/80 bg-zinc-800/60 px-2.5 py-1 text-xs text-zinc-300">
      {children}
    </span>
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
  const { getSubmittedGameById } = useGames();
  const submittedGame = sourceGame ?? getSubmittedGameById(projectId);

  const displayGame = useMemo(
    () => (submittedGame ? gameToDetailV0(submittedGame) : null),
    [submittedGame],
  );

  const playerMeta = useMemo(
    () => resolveGameDetailPlayerMeta(submittedGame),
    [submittedGame],
  );

  const { stats: publicStats } = useProjectPublicStats(projectId);

  const overviewPublication = useMemo(
    () => resolvePublicationDisplay(submittedGame),
    [submittedGame],
  );

  const hasDevlogForOverview = Boolean(publicStats.latestDevlogAt);
  const devlogOverviewLabel = publicStats.latestDevlogAt
    ? formatDevlogPublishedAt(publicStats.latestDevlogAt)
    : "";

  const thumbnailUrls = useMemo(
    () => (submittedGame ? resolveProjectThumbnailUrls(submittedGame) : []),
    [submittedGame],
  );

  const posterFallback = useMemo(() => {
    if (!submittedGame) {
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
  }, [submittedGame]);

  const hasCustomThumbnails = thumbnailUrls.length > 0;

  if (!submittedGame || !displayGame || !posterFallback) {
    return null;
  }

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
              {getUserFacingGameTags(displayGame.tags).map((tag) => (
                <TagPill key={tag}>{tag}</TagPill>
              ))}
            </div>
            <div className="mt-4 flex min-w-0 flex-wrap items-center gap-2">
              <StudioPreviewEditTarget target="title" onEditTarget={onEditTarget} inline>
                <p className={`${PROJECT_TITLE_HERO_CLASS} text-white`}>
                  {displayGame.title}
                </p>
              </StudioPreviewEditTarget>
              {playerMeta ? (
                <GameDetailPhaseBadge meta={playerMeta} onEditTarget={onEditTarget} />
              ) : null}
            </div>
            <StudioPreviewEditTarget target="catch-copy" onEditTarget={onEditTarget}>
              <p className={`${PROJECT_ONE_LINE_DESCRIPTION_HERO_CLASS} text-zinc-400`}>
                {displayGame.lead}
              </p>
            </StudioPreviewEditTarget>
            <div className="mt-4 flex min-w-0 flex-wrap items-center gap-2 text-sm text-zinc-300">
              {hasCustomThumbnails ? (
                <span className="relative size-7 shrink-0 overflow-hidden rounded-full bg-zinc-800">
                  <Image src={displayGame.developer.avatar} alt="" fill className="object-cover" />
                </span>
              ) : (
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-xs font-medium text-zinc-400">
                  {displayGame.developer.name.slice(0, 1) || "?"}
                </span>
              )}
              <span className="break-words">{displayGame.developer.name}</span>
            </div>
            <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-zinc-500">
              <Clock className="size-3.5 shrink-0" aria-hidden="true" />
              最終更新 {displayGame.lastUpdated}
            </p>
          </div>
        </div>
      </section>

      <div className="border-b border-zinc-800/60">
        <div className="flex gap-1 overflow-x-auto" role="tablist" aria-label="公開ページタブ">
          {previewTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`shrink-0 border-b-2 px-4 py-3 text-sm transition-colors ${
                activeTab === tab.id
                  ? "border-zinc-600 font-medium text-zinc-400"
                  : "border-transparent font-normal text-zinc-600 hover:text-zinc-500"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

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
          onEditTarget={onEditTarget}
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
          playableVersion={submittedGame?.playableVersion}
          variant="tab"
        />
      ) : null}
    </div>
  );
}
