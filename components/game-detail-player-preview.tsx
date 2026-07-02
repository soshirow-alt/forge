"use client";

import Image from "next/image";
import { useMemo } from "react";
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
import type { Game } from "@/lib/mock-games";
import {
  buildDraftGame,
  buildSubmitDraftDetailV0,
  resolveSubmitDraftPreviewPlayerMeta,
  SUBMIT_DRAFT_PREVIEW_ID,
  type SubmitDraftOwner,
  type SubmitDraftState,
} from "@/lib/studio-submit-draft";
import { gameToDetailV0 } from "@/lib/submitted-game-v0-adapter";
import { Clock } from "lucide-react";

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

type GameDetailPlayerPreviewBaseProps = {
  activeTab: GameDetailTab;
  onTabChange: (tab: GameDetailTab) => void;
  onTestPlay?: () => void;
};

type GameDetailPlayerPreviewProjectProps = GameDetailPlayerPreviewBaseProps & {
  previewMode?: false;
  projectId: string;
  previewGame?: never;
  submitDraft?: never;
  submitOwner?: never;
};

type GameDetailPlayerPreviewDraftProps = GameDetailPlayerPreviewBaseProps & {
  previewMode: true;
  previewGame?: Game;
  submitDraft: SubmitDraftState;
  submitOwner: SubmitDraftOwner;
  projectId?: never;
};

export type GameDetailPlayerPreviewProps =
  | GameDetailPlayerPreviewProjectProps
  | GameDetailPlayerPreviewDraftProps;

/**
 * Studio: プレイヤー詳細ページと同型の読み取り専用プレビュー。
 * /games/[id] の正本 UI は変更せず、Studio 内確認用に最小構成で再利用する。
 */
export function GameDetailPlayerPreview(props: GameDetailPlayerPreviewProps) {
  const { activeTab, onTabChange, onTestPlay } = props;
  const previewMode = props.previewMode === true;
  const submitDraft = previewMode ? props.submitDraft : null;
  const submitOwner = previewMode ? props.submitOwner : null;
  const projectId = previewMode ? SUBMIT_DRAFT_PREVIEW_ID : props.projectId;

  const { getSubmittedGameById } = useGames();
  const submittedGame = previewMode ? null : getSubmittedGameById(props.projectId);
  const { stats: publicStats } = useProjectPublicStats(previewMode ? null : props.projectId);

  const previewGame = previewMode
    ? props.previewGame ?? (submitDraft && submitOwner
        ? buildDraftGame(submitDraft, submitOwner)
        : null)
    : submittedGame;

  const displayGame = useMemo(() => {
    if (!previewGame) {
      return null;
    }
    if (previewMode && submitDraft && submitOwner) {
      return buildSubmitDraftDetailV0(submitDraft, submitOwner);
    }
    return gameToDetailV0(previewGame);
  }, [previewGame, previewMode, submitDraft, submitOwner]);

  const playerMeta = useMemo(() => {
    if (!previewGame) {
      return null;
    }
    if (previewMode && submitDraft) {
      return resolveSubmitDraftPreviewPlayerMeta(submitDraft, previewGame);
    }
    return resolveGameDetailPlayerMeta(previewGame);
  }, [previewGame, previewMode, submitDraft]);

  const overviewPublication = useMemo(() => {
    if (!previewGame) {
      return null;
    }
    const publication = resolvePublicationDisplay(previewGame);
    if (previewMode && !publication) {
      return { labels: ["公開先未設定"] };
    }
    return publication;
  }, [previewGame, previewMode]);

  const hasDevlogForOverview = previewMode ? false : Boolean(publicStats.latestDevlogAt);
  const devlogOverviewLabel = previewMode
    ? ""
    : publicStats.latestDevlogAt
      ? formatDevlogPublishedAt(publicStats.latestDevlogAt)
      : "";

  if (!previewGame || !displayGame || !playerMeta) {
    return null;
  }

  const heroTitleClassName =
    previewMode && submitDraft && !submitDraft.title.trim()
      ? "text-2xl font-bold tracking-tight text-zinc-500 sm:text-3xl"
      : "text-2xl font-bold tracking-tight text-white sm:text-3xl";

  const heroLeadClassName =
    previewMode && submitDraft && !submitDraft.introduction.trim()
      ? "mt-2 text-sm leading-relaxed text-zinc-600"
      : "mt-2 text-sm leading-relaxed text-zinc-400";

  return (
    <div aria-label="公開ページの見え方" className="min-w-0 space-y-4">
      <h2 className="text-sm font-medium text-zinc-500">公開ページの見え方</h2>

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
              <p className={heroTitleClassName}>{displayGame.title}</p>
              <GameDetailPhaseBadge meta={playerMeta} />
            </div>
            <p className={heroLeadClassName}>{displayGame.lead}</p>
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

      {activeTab === "overview" ? (
        <GameDetailOverviewV0Tab
          game={displayGame}
          gameId={projectId}
          heroLead={displayGame.lead}
          playerMeta={playerMeta}
          overviewActivity={{
            lastUpdated: displayGame.lastUpdated,
            hasDevlog: hasDevlogForOverview,
            devlogLabel: devlogOverviewLabel,
            voiceCount: previewMode ? 0 : publicStats.feedbackParticipantCount,
          }}
          publication={overviewPublication}
        />
      ) : null}

      {activeTab === "devlog" ? (
        previewMode ? (
          <div className="rounded-xl border border-dashed border-zinc-800/80 bg-zinc-950/20 px-4 py-8 text-center">
            <p className="text-sm text-zinc-500">まだ開発ログはありません。</p>
            <p className="mt-1 text-xs text-zinc-600">
              投稿後、Studioの開発ログタブから最初の更新を記録できます。
            </p>
          </div>
        ) : (
          <GameDevlogV0Tab
            gameId={projectId}
            projectId={projectId}
            onPlayLatest={onTestPlay}
          />
        )
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
