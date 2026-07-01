"use client";

import Image from "next/image";
import { useCallback, useMemo, useState } from "react";
import { GameDetailHeroGallery } from "@/components/game-detail-hero-gallery";
import { GameDetailOverviewV0Tab } from "@/components/game-detail-overview-v0-tab";
import { GameDetailPhaseBadge } from "@/components/game-detail-phase-badge";
import { GameDevlogV0Tab } from "@/components/game-devlog-v0-tab";
import { FeatureComingSoonPanel } from "@/components/feature-coming-soon-panel";
import { GamePlayDestinationModal } from "@/components/game-play-destination-modal";
import { useGames } from "@/components/games-provider";
import { formatDevlogPublishedAt } from "@/hooks/use-game-devlogs-v0";
import { useProjectPublicStats } from "@/hooks/use-project-public-stats";
import type { GameDetailTab } from "@/lib/game-detail-tabs";
import { resolveGameDetailPlayerMeta } from "@/lib/game-detail-player-meta";
import {
  resolvePlayDestinations,
  resolvePublicationDisplay,
  type PlayDestination,
} from "@/lib/game-play-destinations";
import { gameToDetailV0 } from "@/lib/submitted-game-v0-adapter";
import { Clock, Play } from "lucide-react";

const previewTabs: { id: GameDetailTab; label: string }[] = [
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

type GameDetailPlayerPreviewProps = {
  projectId: string;
};

/**
 * Studio: プレイヤー詳細ページと同型の読み取り専用プレビュー。
 * /games/[id] の正本 UI は変更せず、Studio 内確認用に最小構成で再利用する。
 */
export function GameDetailPlayerPreview({ projectId }: GameDetailPlayerPreviewProps) {
  const { getSubmittedGameById, recordPlay } = useGames();
  const submittedGame = getSubmittedGameById(projectId);
  const [activeTab, setActiveTab] = useState<GameDetailTab>("overview");
  const [playDestinationPickerOpen, setPlayDestinationPickerOpen] = useState(false);

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

  const playDestinations = useMemo(
    () => resolvePlayDestinations(submittedGame),
    [submittedGame],
  );

  const hasDevlogForOverview = Boolean(publicStats.latestDevlogAt);
  const devlogOverviewLabel = publicStats.latestDevlogAt
    ? formatDevlogPublishedAt(publicStats.latestDevlogAt)
    : "";

  const hasPlayUrl = Boolean(submittedGame?.playUrl?.trim());

  const navigateToPlayDestination = useCallback(
    async (url: string) => {
      await recordPlay(projectId);
      window.open(url, "_blank", "noopener,noreferrer");
    },
    [projectId, recordPlay],
  );

  const handlePlay = useCallback(() => {
    const destinations =
      playDestinations.length > 0
        ? playDestinations
        : submittedGame?.playUrl
          ? [
              {
                label: "外部サイト",
                url: submittedGame.playUrl,
                actionLabel: "外部サイトで開く",
              } satisfies PlayDestination,
            ]
          : [];

    if (destinations.length === 0) {
      return;
    }

    if (destinations.length === 1) {
      void navigateToPlayDestination(destinations[0].url);
      return;
    }

    setPlayDestinationPickerOpen(true);
  }, [navigateToPlayDestination, playDestinations, submittedGame?.playUrl]);

  const handlePlayDestinationSelect = useCallback(
    async (destination: PlayDestination) => {
      setPlayDestinationPickerOpen(false);
      await navigateToPlayDestination(destination.url);
    },
    [navigateToPlayDestination],
  );

  if (!submittedGame || !displayGame) {
    return null;
  }

  return (
    <div aria-label="プレイヤー向け表示" className="min-w-0 space-y-4">
      {playDestinationPickerOpen ? (
        <GamePlayDestinationModal
          destinations={playDestinations}
          onSelect={handlePlayDestinationSelect}
          onClose={() => setPlayDestinationPickerOpen(false)}
        />
      ) : null}

      <p className="text-xs text-zinc-500">プレイヤーに見える表示</p>

      <section className="overflow-hidden rounded-2xl border border-zinc-800/80 bg-zinc-900/30">
        <div className="grid gap-0 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
          <GameDetailHeroGallery images={displayGame.galleryImages} />

          <div className="flex flex-col justify-center p-6 lg:p-8">
            <div className="flex flex-wrap gap-2">
              {displayGame.tags.map((tag) => (
                <TagPill key={tag}>{tag}</TagPill>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                {displayGame.title}
              </h2>
              {playerMeta ? <GameDetailPhaseBadge meta={playerMeta} /> : null}
            </div>
            <p className="mt-2 text-sm leading-relaxed text-zinc-400">{displayGame.lead}</p>
            <div className="mt-4 inline-flex items-center gap-2 text-sm text-zinc-300">
              <span className="relative size-7 overflow-hidden rounded-full bg-zinc-800">
                <Image src={displayGame.developer.avatar} alt="" fill className="object-cover" />
              </span>
              {displayGame.developer.name}
            </div>
            <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-zinc-500">
              <Clock className="size-3.5 shrink-0" aria-hidden="true" />
              最終更新 {displayGame.lastUpdated}
            </p>
          </div>
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handlePlay}
          disabled={!hasPlayUrl}
          className="inline-flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900/50 px-4 py-2 text-sm font-medium text-zinc-200 transition-colors hover:border-violet-500/40 hover:text-violet-200 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Play className="size-4" aria-hidden="true" />
          テストプレイ
        </button>
      </div>

      <div className="border-b border-zinc-800/80">
        <div className="flex gap-1 overflow-x-auto">
          {previewTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
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
        />
      ) : null}

      {activeTab === "devlog" ? (
        <GameDevlogV0Tab
          gameId={projectId}
          projectId={projectId}
          onPlayLatest={handlePlay}
        />
      ) : null}

      {activeTab === "voices" ? (
        <FeatureComingSoonPanel
          title="みんなのフィードバック"
          description="他のプレイヤーのフィードバックの傾向や、よく挙がるテーマがここで見られるようになります。いまは準備中です。"
        />
      ) : null}
    </div>
  );
}
