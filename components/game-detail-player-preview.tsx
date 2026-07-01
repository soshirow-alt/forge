"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { GameDetailHeroGallery } from "@/components/game-detail-hero-gallery";
import { GameDetailOverviewV0Tab } from "@/components/game-detail-overview-v0-tab";
import { GameDetailPhaseBadge } from "@/components/game-detail-phase-badge";
import { GameDevlogV0Tab } from "@/components/game-devlog-v0-tab";
import { FeatureComingSoonPanel } from "@/components/feature-coming-soon-panel";
import { useGames } from "@/components/games-provider";
import { formatDevlogPublishedAt } from "@/hooks/use-game-devlogs-v0";
import { useProjectPublicStats } from "@/hooks/use-project-public-stats";
import type { GameDetailTab } from "@/lib/game-detail-tabs";
import { resolveGameDetailPlayerMeta } from "@/lib/game-detail-player-meta";
import { resolvePublicationDisplay } from "@/lib/game-play-destinations";
import { gameToDetailV0 } from "@/lib/submitted-game-v0-adapter";
import { Bookmark, Check, Clock, Heart, Play } from "lucide-react";

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

/** プレイヤー詳細と同位置の CTA 見た目（Studio 内では操作不可） */
function PlayerCtaPreviewRow() {
  return (
    <div
      className="flex flex-wrap items-center gap-2 border-b border-zinc-800/60 pb-4"
      aria-hidden="true"
    >
      <span className="inline-flex items-center gap-2 rounded-xl bg-violet-600/90 px-5 py-2.5 text-sm font-semibold text-white">
        <Play className="size-4" />
        プレイする
      </span>
      <span className="inline-flex items-center gap-2 rounded-xl border border-zinc-800 px-4 py-2.5 text-sm text-zinc-600">
        <Check className="size-4" />
        更新を追う
      </span>
      <span className="inline-flex items-center gap-2 rounded-xl border border-zinc-800 px-4 py-2.5 text-sm text-zinc-600">
        <Bookmark className="size-4" />
        あとで遊ぶ
      </span>
      <span className="inline-flex items-center gap-2 rounded-xl border border-zinc-800 px-4 py-2.5 text-sm text-zinc-600">
        <Heart className="size-4" />
        開発者をフォロー
      </span>
    </div>
  );
}

type GameDetailPlayerPreviewProps = {
  projectId: string;
  onTestPlay?: () => void;
};

/**
 * Studio: プレイヤー詳細ページと同型の読み取り専用プレビュー。
 * /games/[id] の正本 UI は変更せず、Studio 内確認用に最小構成で再利用する。
 */
export function GameDetailPlayerPreview({
  projectId,
  onTestPlay,
}: GameDetailPlayerPreviewProps) {
  const { getSubmittedGameById } = useGames();
  const submittedGame = getSubmittedGameById(projectId);
  const [activeTab, setActiveTab] = useState<GameDetailTab>("overview");

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

  if (!submittedGame || !displayGame) {
    return null;
  }

  return (
    <div aria-label="公開ページの見え方" className="min-w-0 space-y-4">
      <h2 className="text-sm font-medium text-zinc-400">公開ページの見え方</h2>

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
              <p className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                {displayGame.title}
              </p>
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

      <PlayerCtaPreviewRow />

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
          onPlayLatest={onTestPlay}
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
