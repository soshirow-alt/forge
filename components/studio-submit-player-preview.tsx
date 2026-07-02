"use client";

import Image from "next/image";
import { useMemo } from "react";
import { GameDetailOverviewV0Tab } from "@/components/game-detail-overview-v0-tab";
import { GameDetailPhaseBadge } from "@/components/game-detail-phase-badge";
import { FeatureComingSoonPanel } from "@/components/feature-coming-soon-panel";
import { StudioHeroPreviewGallery } from "@/components/studio-hero-preview-gallery";
import type { GameDetailTab } from "@/lib/game-detail-tabs";
import { resolvePublicationDisplay } from "@/lib/game-play-destinations";
import {
  buildDraftGame,
  buildSubmitDraftDetailV0,
  resolveSubmitDraftPreviewPlayerMeta,
  SUBMIT_DRAFT_PREVIEW_ID,
  type SubmitDraftOwner,
  type SubmitDraftState,
} from "@/lib/studio-submit-draft";
import { sanitizeProjectGenresForSave } from "@/lib/project-genres";
import {
  PROJECT_ONE_LINE_DESCRIPTION_HERO_CLASS,
} from "@/lib/project-one-line-description";
import { Clock } from "lucide-react";

const previewTabs: { id: GameDetailTab; label: string }[] = [
  { id: "overview", label: "概要" },
  { id: "devlog", label: "開発ログ" },
  { id: "voices", label: "みんなのフィードバック" },
];

function TagPill({
  children,
  muted = false,
}: {
  children: React.ReactNode;
  muted?: boolean;
}) {
  return (
    <span
      className={`break-words rounded-md border px-2.5 py-1 text-xs ${
        muted
          ? "border-zinc-800/80 bg-zinc-950/40 text-zinc-600"
          : "border-zinc-700/80 bg-zinc-800/60 text-zinc-300"
      }`}
    >
      {children}
    </span>
  );
}

export type StudioSubmitPlayerPreviewProps = {
  submitDraft: SubmitDraftState;
  submitOwner: SubmitDraftOwner;
  activeTab: GameDetailTab;
  onTabChange: (tab: GameDetailTab) => void;
};

/** /studio/submit 専用 — 既存 Studio 編集プレビューとは完全分離 */
export function StudioSubmitPlayerPreview({
  submitDraft,
  submitOwner,
  activeTab,
  onTabChange,
}: StudioSubmitPlayerPreviewProps) {
  const displayGame = useMemo(
    () => buildSubmitDraftDetailV0(submitDraft, submitOwner),
    [submitDraft, submitOwner],
  );

  const playerMeta = useMemo(
    () => resolveSubmitDraftPreviewPlayerMeta(submitDraft),
    [submitDraft],
  );

  const overviewPublication = useMemo(() => {
    const hasPlayDestination =
      Boolean(submitDraft.playUrl.trim()) ||
      Boolean(submitDraft.playEnvironment.distribution);
    if (!hasPlayDestination) {
      return { labels: ["公開先未設定"] };
    }
    return resolvePublicationDisplay(buildDraftGame(submitDraft, submitOwner));
  }, [submitDraft, submitOwner]);

  const titleIsPlaceholder = !submitDraft.title.trim();
  const leadIsPlaceholder = !submitDraft.description.trim();
  const introIsPlaceholder = !submitDraft.introduction.trim();
  const phaseIsPlaceholder = !submitDraft.phase.trim();
  const genreIsPlaceholder = submitDraft.genres.length === 0;
  const hasGalleryImages = submitDraft.thumbnailUrls.length > 0;
  const primaryGenre = sanitizeProjectGenresForSave(submitDraft.genres)[0] ?? "その他";

  const posterFallback = useMemo(
    () => ({
      projectId: SUBMIT_DRAFT_PREVIEW_ID,
      title: submitDraft.title.trim() || "タイトル未入力",
      genre: primaryGenre,
      phase: submitDraft.phase,
      styleSeed: SUBMIT_DRAFT_PREVIEW_ID,
    }),
    [submitDraft.title, submitDraft.phase, primaryGenre],
  );

  return (
    <div aria-label="公開ページの見え方" className="min-w-0 space-y-4">
      <h2 className="text-sm font-medium text-zinc-500">公開ページの見え方</h2>

      <section className="overflow-hidden rounded-2xl border border-zinc-800/80 bg-zinc-900/30">
        <div className="grid gap-0 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
          <StudioHeroPreviewGallery
            images={hasGalleryImages ? displayGame.galleryImages : []}
            posterFallback={posterFallback}
          />

          <div className="flex min-w-0 flex-col justify-center p-6 lg:p-8">
            <div className="flex flex-wrap gap-2">
              {displayGame.tags.map((tag) => (
                <TagPill key={tag} muted={genreIsPlaceholder && tag === displayGame.tags[0]}>
                  {tag}
                </TagPill>
              ))}
            </div>
            <div className="mt-4 flex min-w-0 flex-wrap items-center gap-2">
              <p
                className={
                  titleIsPlaceholder
                    ? "min-w-0 break-words text-2xl font-bold tracking-tight text-zinc-500 sm:text-3xl"
                    : "min-w-0 break-words text-2xl font-bold tracking-tight text-white sm:text-3xl"
                }
              >
                {displayGame.title}
              </p>
              <GameDetailPhaseBadge meta={playerMeta} muted={phaseIsPlaceholder} />
            </div>
            <p
              className={
                leadIsPlaceholder
                  ? `${PROJECT_ONE_LINE_DESCRIPTION_HERO_CLASS} text-zinc-600`
                  : `${PROJECT_ONE_LINE_DESCRIPTION_HERO_CLASS} text-zinc-400`
              }
            >
              {displayGame.lead}
            </p>
            <div className="mt-4 flex min-w-0 flex-wrap items-center gap-2 text-sm text-zinc-300">
              {hasGalleryImages ? (
                <span className="relative size-7 overflow-hidden rounded-full bg-zinc-800">
                  <Image
                    src={displayGame.developer.avatar}
                    alt=""
                    fill
                    className="object-cover"
                  />
                </span>
              ) : (
                <span className="flex size-7 items-center justify-center rounded-full bg-zinc-800 text-xs font-medium text-zinc-400">
                  {submitOwner.ownerName.slice(0, 1) || "?"}
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

      {activeTab === "overview" ? (
        <GameDetailOverviewV0Tab
          game={displayGame}
          gameId={SUBMIT_DRAFT_PREVIEW_ID}
          heroLead={displayGame.lead}
          playerMeta={playerMeta}
          overviewActivity={{
            lastUpdated: displayGame.lastUpdated,
            hasDevlog: false,
            devlogLabel: "",
            voiceCount: 0,
          }}
          publication={overviewPublication}
          showUnsetPlayPlaceholders
          mutedIntroduction={introIsPlaceholder}
        />
      ) : null}

      {activeTab === "devlog" ? (
        <div className="rounded-xl border border-dashed border-zinc-800/80 bg-zinc-950/20 px-4 py-8 text-center">
          <p className="text-sm text-zinc-500">まだ開発ログはありません。</p>
          <p className="mt-1 text-xs text-zinc-600">
            投稿後、Studioの開発ログタブから最初の更新を記録できます。
          </p>
        </div>
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
