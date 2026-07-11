"use client";

import Image from "next/image";
import { useMemo } from "react";
import { GameDetailOverviewV0Tab } from "@/components/game-detail-overview-v0-tab";
import { GameDetailPhaseBadge } from "@/components/game-detail-phase-badge";
import { FeatureComingSoonPanel } from "@/components/feature-coming-soon-panel";
import { GameSpecialThanksTab } from "@/components/game-special-thanks-tab";
import { GameDetailTabBar } from "@/components/game-detail-tabs-region";
import { StudioHeroPreviewGallery } from "@/components/studio-hero-preview-gallery";
import type { GameDetailTab } from "@/lib/game-detail-tabs";
import { resolvePlayDestinations, resolvePublicationDisplay } from "@/lib/game-play-destinations";
import {
  resolveGamePublishLinks,
  toRelatedLinkDisplays,
} from "@/lib/project-publish-links";
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
import { PROJECT_TITLE_HERO_CLASS } from "@/lib/project-title";
import { getUserFacingGameTags } from "@/lib/user-labels";
import {
  buildInitialProjectDevlogContent,
  INITIAL_PROJECT_DEVLOG_PUBLISHED_VERSION,
  INITIAL_PROJECT_DEVLOG_TITLE,
} from "@/lib/initial-project-devlog";
import { Clock } from "lucide-react";
import { StudioPreviewEditTarget } from "@/components/studio-preview-edit-target";
import type { StudioPreviewEditTarget as StudioPreviewEditTargetId } from "@/lib/studio-preview-edit-targets";

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
  onEditTarget?: (target: StudioPreviewEditTargetId) => void;
};

/** /studio/submit 専用 — 既存 Studio 編集プレビューとは完全分離 */
export function StudioSubmitPlayerPreview({
  submitDraft,
  submitOwner,
  activeTab,
  onTabChange,
  onEditTarget,
}: StudioSubmitPlayerPreviewProps) {
  const displayGame = useMemo(
    () => buildSubmitDraftDetailV0(submitDraft, submitOwner),
    [submitDraft, submitOwner],
  );

  const playerMeta = useMemo(
    () => resolveSubmitDraftPreviewPlayerMeta(submitDraft),
    [submitDraft],
  );

  const draftGame = useMemo(
    () => buildDraftGame(submitDraft, submitOwner),
    [submitDraft, submitOwner],
  );
  const playDestinations = useMemo(
    () => resolvePlayDestinations(draftGame),
    [draftGame],
  );
  const relatedLinkDisplays = useMemo(() => {
    const { relatedLinks } = resolveGamePublishLinks(draftGame);
    return toRelatedLinkDisplays(relatedLinks);
  }, [draftGame]);
  const overviewPublication = useMemo(() => {
    if (playDestinations.length === 0) {
      return { labels: ["公開先未設定"] };
    }
    return resolvePublicationDisplay(draftGame);
  }, [draftGame, playDestinations.length]);

  const titleIsPlaceholder = !submitDraft.title.trim();
  const leadIsPlaceholder = !submitDraft.description.trim();
  const introIsPlaceholder = !submitDraft.introduction.trim();
  const phaseIsPlaceholder = !submitDraft.phase.trim();
  const genreIsPlaceholder = submitDraft.genres.length === 0;
  const initialDevlogExcerpt = useMemo(() => {
    const content = buildInitialProjectDevlogContent(submitDraft.introduction);
    if (!content) {
      return "作品紹介を入力すると、ここに初回開発ログの本文プレビューが表示されます。";
    }
    return content.length > 160 ? `${content.slice(0, 160)}…` : content;
  }, [submitDraft.introduction]);
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
          <StudioPreviewEditTarget target="thumbnail" onEditTarget={onEditTarget}>
            <StudioHeroPreviewGallery
              images={hasGalleryImages ? displayGame.galleryImages : []}
              posterFallback={posterFallback}
            />
          </StudioPreviewEditTarget>

          <div className="flex min-w-0 flex-col justify-center p-6 lg:p-8">
            <div className="flex flex-wrap gap-2">
              <StudioPreviewEditTarget target="genres" onEditTarget={onEditTarget} inline>
                <span className="inline-flex flex-wrap gap-2">
                  {getUserFacingGameTags(displayGame.tags).map((tag) => (
                    <TagPill key={tag} muted={genreIsPlaceholder && tag === displayGame.tags[0]}>
                      {tag}
                    </TagPill>
                  ))}
                </span>
              </StudioPreviewEditTarget>
            </div>
            <div className="mt-4 flex min-w-0 flex-wrap items-center gap-2">
              <StudioPreviewEditTarget target="title" onEditTarget={onEditTarget} inline>
                <p
                  className={
                    titleIsPlaceholder
                      ? `${PROJECT_TITLE_HERO_CLASS} text-zinc-500`
                      : `${PROJECT_TITLE_HERO_CLASS} text-white`
                  }
                >
                  {displayGame.title}
                </p>
              </StudioPreviewEditTarget>
              <GameDetailPhaseBadge
                meta={playerMeta}
                muted={phaseIsPlaceholder}
                onEditTarget={onEditTarget}
              />
            </div>
            <StudioPreviewEditTarget target="catch-copy" onEditTarget={onEditTarget}>
              <p
                className={
                  leadIsPlaceholder
                    ? `${PROJECT_ONE_LINE_DESCRIPTION_HERO_CLASS} text-zinc-600`
                    : `${PROJECT_ONE_LINE_DESCRIPTION_HERO_CLASS} text-zinc-400`
                }
              >
                {displayGame.lead}
              </p>
            </StudioPreviewEditTarget>
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

      <GameDetailTabBar activeTab={activeTab} onTabChange={onTabChange} />

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
          playDestinations={playDestinations}
          relatedLinks={relatedLinkDisplays}
          showUnsetPlayPlaceholders
          mutedIntroduction={introIsPlaceholder}
          onEditTarget={onEditTarget}
        />
      ) : null}

      {activeTab === "devlog" ? (
        <div className="rounded-xl border border-dashed border-violet-500/20 bg-violet-500/5 px-4 py-6 text-left">
          <p className="text-xs font-medium text-violet-200/90">
            投稿すると「{INITIAL_PROJECT_DEVLOG_TITLE}」として記録されます
          </p>
          <p className="mt-2 text-sm font-medium text-zinc-200">
            v{INITIAL_PROJECT_DEVLOG_PUBLISHED_VERSION}
          </p>
          <p className="mt-3 text-sm font-semibold text-white">
            {INITIAL_PROJECT_DEVLOG_TITLE}
          </p>
          <p
            className={`mt-2 text-sm leading-relaxed ${
              introIsPlaceholder ? "text-zinc-600" : "text-zinc-400"
            }`}
          >
            {initialDevlogExcerpt}
          </p>
        </div>
      ) : null}

      {activeTab === "voices" ? (
        <FeatureComingSoonPanel
          title="みんなのフィードバック"
          description="他のプレイヤーのフィードバックの傾向や、よく挙がるテーマがここで見られるようになります。いまは準備中です。"
        />
      ) : null}

      {activeTab === "special-thanks" ? (
        <GameSpecialThanksTab projectId={undefined} />
      ) : null}
    </div>
  );
}
