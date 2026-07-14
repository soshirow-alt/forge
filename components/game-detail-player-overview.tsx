"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import type { GameDetailFeature, GameDetailV0 } from "@/lib/game-detail-v0-mock-data";
import type {
  GameDetailOverviewActivity,
  GameDetailPlayerMeta,
  PlayerOptionChip,
} from "@/lib/game-detail-player-meta";
import type {
  PlayDestination,
  PublicationDisplay,
} from "@/lib/game-play-destinations";
import type { RelatedLinkDisplay } from "@/lib/project-publish-links";
import { DiscoveryCardStatPills } from "@/components/discovery-card-stat-pills";
import { StudioPreviewEditTarget } from "@/components/studio-preview-edit-target";
import type { StudioPreviewEditTarget as StudioPreviewEditTargetId } from "@/lib/studio-preview-edit-targets";

const INTRO_COLLAPSE_THRESHOLD = 200;

function normalizeText(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

/** 長文紹介を優先し、なければヒーローと同じ1行説明でも概要タブ本文として使う */
function resolveIntroText(introduction: string, heroLead: string): string {
  const intro = normalizeText(introduction);
  const lead = normalizeText(heroLead);
  if (intro) {
    return introduction.trim();
  }
  if (lead) {
    return heroLead.trim();
  }
  return "";
}

function OverviewCard({
  title,
  children,
  className = "",
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-2xl border border-zinc-800/80 bg-zinc-900/35 p-5 sm:p-6 ${className}`}
    >
      <h2 className="break-words text-base font-semibold text-white">{title}</h2>
      {children}
    </section>
  );
}

function SidebarCard({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-zinc-800/80 bg-zinc-900/30 p-4 sm:p-5">
      <h2 className="text-sm font-semibold text-zinc-300">{title}</h2>
      {children}
    </section>
  );
}

function OptionChip({ option }: { option: PlayerOptionChip }) {
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2.5 py-1 text-xs ${
        option.active
          ? "border-zinc-600 bg-zinc-800/70 font-medium text-zinc-200"
          : "border-zinc-800/80 bg-zinc-950/40 text-zinc-600"
      }`}
    >
      {option.label}
    </span>
  );
}

function IntroBody({ text, muted = false }: { text: string; muted?: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const needsExpand = text.length > INTRO_COLLAPSE_THRESHOLD;

  return (
    <div className="mt-4 min-h-[5.25rem]">
      <p
        className={`whitespace-pre-wrap break-words text-[15px] leading-7 ${
          muted ? "text-zinc-600" : "text-zinc-300"
        } ${!expanded && needsExpand ? "line-clamp-4" : ""}`}
      >
        {text}
      </p>
      {needsExpand ? (
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="mt-3 inline-flex items-center gap-1 text-sm text-violet-400 transition-colors hover:text-violet-300"
        >
          {expanded ? "閉じる" : "もっと見る"}
          <ChevronDown
            className={`size-4 transition-transform ${expanded ? "rotate-180" : ""}`}
            aria-hidden="true"
          />
        </button>
      ) : null}
    </div>
  );
}

function CompactFeatureList({ features }: { features: GameDetailFeature[] }) {
  if (features.length === 0) {
    return null;
  }

  return (
    <ul className="mt-3 space-y-2">
      {features.map((feature) => (
        <li key={feature.title} className="break-words text-xs leading-relaxed text-zinc-400">
          <span className="font-medium text-zinc-300">{feature.title}</span>
          {feature.description ? (
            <>
              <span className="text-zinc-600"> — </span>
              <span className="whitespace-pre-wrap break-words">{feature.description}</span>
            </>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

function feedbackStatusLabel(count: number): string {
  if (count <= 0) {
    return "フィードバックはまだありません。";
  }
  if (count === 1) {
    return "1件のフィードバックがあります。";
  }
  return `${count.toLocaleString()}件のフィードバックがあります。`;
}

function UnsetPlayInfoPanel() {
  return (
    <div className="mt-3 space-y-3 text-sm text-zinc-600">
      <div>
        <p className="text-xs text-zinc-500">想定時間</p>
        <p className="mt-1">想定時間未設定</p>
      </div>
      <div>
        <p className="text-xs text-zinc-500">対応端末</p>
        <p className="mt-1">対応端末未設定</p>
      </div>
      <div>
        <p className="text-xs text-zinc-500">遊び方</p>
        <p className="mt-1">遊び方未設定</p>
      </div>
    </div>
  );
}

function PlayInfoPanel({ playerMeta }: { playerMeta: GameDetailPlayerMeta }) {
  const { playInfo } = playerMeta;
  const hasPlayTime = playInfo.playTimeOptions.some((option) => option.active);
  const hasDevice = playInfo.deviceOptions.some((option) => option.active);
  const hasPlayMethod = playInfo.playMethodOptions.some((option) => option.active);
  const hasContent = hasPlayTime || hasDevice || hasPlayMethod;

  if (!hasContent) {
    return null;
  }

  return (
    <>
      <div className="mt-3">
        <p className="text-xs text-zinc-500">想定時間</p>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {playInfo.playTimeOptions.map((option) => (
            <OptionChip key={option.label} option={option} />
          ))}
        </div>
      </div>

      <div className="mt-3">
        <p className="text-xs text-zinc-500">対応端末</p>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {playInfo.deviceOptions.map((option) => (
            <OptionChip key={option.label} option={option} />
          ))}
        </div>
      </div>

      <div className="mt-3">
        <p className="text-xs text-zinc-500">遊び方</p>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {playInfo.playMethodOptions.map((option) => (
            <OptionChip key={option.label} option={option} />
          ))}
        </div>
      </div>
    </>
  );
}

function PublicationPanel({
  publication,
  destinations,
  onDestinationOpen,
}: {
  publication: PublicationDisplay;
  destinations: PlayDestination[];
  /** 外部タブは <a> が開く。ここではプレイ記録など副作用のみ。 */
  onDestinationOpen?: () => void;
}) {
  if (destinations.length > 0) {
    const [primary, ...secondary] = destinations;
    return (
      <div className="mt-3 flex min-w-0 flex-col gap-2">
        <a
          href={primary.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => onDestinationOpen?.()}
          className="inline-flex w-full min-w-0 items-center justify-center rounded-lg border border-violet-500/40 bg-violet-500/15 px-3 py-2.5 text-center text-sm font-semibold text-violet-100 transition-colors hover:border-violet-400/60 hover:bg-violet-500/25 hover:text-white"
        >
          <span className="truncate">{primary.actionLabel}</span>
        </a>
        {secondary.length > 0 ? (
          <ul className="flex min-w-0 flex-col gap-1.5">
            {secondary.map((destination) => (
              <li key={destination.url} className="min-w-0">
                <a
                  href={destination.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => onDestinationOpen?.()}
                  className="inline-flex w-full min-w-0 items-center rounded-md px-1 py-1.5 text-left text-xs font-medium text-zinc-400 transition-colors hover:text-zinc-200"
                >
                  <span className="truncate">{destination.actionLabel}</span>
                </a>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    );
  }

  return (
    <div className="mt-3 flex min-w-0 flex-col gap-1.5 sm:flex-row sm:flex-wrap">
      {publication.labels.map((label) => (
        <span
          key={label}
          className="inline-flex max-w-full items-center break-all rounded-md border border-zinc-700/80 bg-zinc-800/50 px-2.5 py-1 text-xs text-zinc-400"
        >
          {label}
        </span>
      ))}
    </div>
  );
}

function RelatedLinksPanel({ links }: { links: RelatedLinkDisplay[] }) {
  return (
    <ul className="mt-3 flex min-w-0 flex-col gap-2">
      {links.map((link) => (
        <li key={link.id} className="min-w-0">
          <a
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-w-0 flex-col gap-0.5 rounded-md px-1 py-1.5 transition-colors hover:bg-zinc-800/40"
          >
            <span className="truncate text-[11px] text-zinc-500">{link.kindLabel}</span>
            <span className="truncate text-xs font-medium text-zinc-400 hover:text-zinc-200">
              {link.displayLabel}
            </span>
          </a>
        </li>
      ))}
    </ul>
  );
}

/**
 * 「最近の動き」はプレイヤー向けの表示専用サマリー。
 * Studio では概要タブから直接編集せず、開発ログ / 新ver公開 / フィードバック件数 /
 * 版ごとの問い（将来）から自動反映する想定。
 */
function RecentActivityPanel({
  activity,
  focusNotes,
  onFeedback,
  feedbackCtaLabel,
}: {
  activity: GameDetailOverviewActivity;
  focusNotes: string | null;
  onFeedback?: () => void;
  feedbackCtaLabel?: string;
}) {
  return (
    <>
      <div className="mt-3">
        <DiscoveryCardStatPills
          playCount={activity.playPlayerCount ?? null}
          feedbackCount={activity.voiceCount}
          watchCount={activity.watchCount ?? null}
          loaded={activity.statsLoaded !== false}
          compact
        />
      </div>
      <ul className="mt-3 space-y-1.5 break-words text-sm leading-relaxed text-zinc-400">
        <li>
          {activity.hasDevlog
            ? `最新の開発ログ：${activity.devlogLabel}`
            : "開発ログはまだありません。"}
        </li>
        <li>{feedbackStatusLabel(activity.voiceCount)}</li>
      </ul>

      {onFeedback && feedbackCtaLabel ? (
        <button
          type="button"
          onClick={onFeedback}
          className="mt-3 text-sm text-zinc-500 underline-offset-2 transition-colors hover:text-violet-300 hover:underline"
        >
          {feedbackCtaLabel}
        </button>
      ) : null}

      {focusNotes ? (
        <p className="mt-4 break-words border-l-2 border-violet-500/30 pl-3 text-sm leading-relaxed text-zinc-300 whitespace-pre-wrap">
          <span className="mb-1 block text-xs font-medium text-violet-300/80">
            いま見てほしいこと
          </span>
          {focusNotes}
        </p>
      ) : null}
    </>
  );
}

type GameDetailPlayerOverviewProps = {
  game: GameDetailV0;
  heroLead: string;
  playerMeta: GameDetailPlayerMeta;
  activity: GameDetailOverviewActivity;
  publication: PublicationDisplay | null;
  playDestinations?: PlayDestination[];
  relatedLinks?: RelatedLinkDisplay[];
  onPlayDestinationOpen?: () => void;
  showUnsetPlayPlaceholders?: boolean;
  mutedIntroduction?: boolean;
  onFeedback?: () => void;
  feedbackCtaLabel?: string;
  onEditTarget?: (target: StudioPreviewEditTargetId) => void;
};

export function GameDetailPlayerOverview({
  game,
  heroLead,
  playerMeta,
  activity,
  publication,
  playDestinations = [],
  relatedLinks = [],
  onPlayDestinationOpen,
  showUnsetPlayPlaceholders = false,
  mutedIntroduction = false,
  onFeedback,
  feedbackCtaLabel,
  onEditTarget,
}: GameDetailPlayerOverviewProps) {
  const introText = resolveIntroText(game.introduction, heroLead);
  const displayFeatures = game.features.filter(
    (feature) => feature.title.trim() && feature.description.trim(),
  );

  const showPlayInfoCard = Boolean(
    playerMeta.playInfo.playTimeOptions.some((option) => option.active) ||
      playerMeta.playInfo.deviceOptions.some((option) => option.active) ||
      playerMeta.playInfo.playMethodOptions.some((option) => option.active),
  );

  const showPlayInfoSection = showPlayInfoCard || showUnsetPlayPlaceholders;

  return (
    <div className="grid gap-5 lg:grid-cols-3 lg:gap-6">
      <div className="min-w-0 space-y-5 lg:col-span-2">
        {introText ? (
          <StudioPreviewEditTarget target="introduction" onEditTarget={onEditTarget}>
            <OverviewCard title="作品紹介">
              <IntroBody text={introText} muted={mutedIntroduction} />
            </OverviewCard>
          </StudioPreviewEditTarget>
        ) : null}

        <OverviewCard title="最近の動き">
          <RecentActivityPanel
            activity={activity}
            focusNotes={playerMeta.focusNotes}
            onFeedback={onFeedback}
            feedbackCtaLabel={feedbackCtaLabel}
          />
        </OverviewCard>
      </div>

      <aside className="min-w-0 space-y-4">
        {showPlayInfoSection ? (
          <StudioPreviewEditTarget target="play-info" onEditTarget={onEditTarget}>
            <SidebarCard title="プレイ情報">
              {showPlayInfoCard ? (
                <PlayInfoPanel playerMeta={playerMeta} />
              ) : showUnsetPlayPlaceholders ? (
                <UnsetPlayInfoPanel />
              ) : null}
            </SidebarCard>
          </StudioPreviewEditTarget>
        ) : null}

        {publication ? (
          <StudioPreviewEditTarget target="publication" onEditTarget={onEditTarget}>
            <SidebarCard title="公開先">
              <PublicationPanel
                publication={publication}
                destinations={playDestinations}
                onDestinationOpen={onPlayDestinationOpen}
              />
            </SidebarCard>
          </StudioPreviewEditTarget>
        ) : null}

        {relatedLinks.length > 0 ? (
          <SidebarCard title="関連リンク">
            <RelatedLinksPanel links={relatedLinks} />
          </SidebarCard>
        ) : null}

        {displayFeatures.length > 0 ? (
          <SidebarCard title="作品の特徴">
            <CompactFeatureList features={displayFeatures} />
          </SidebarCard>
        ) : null}

        {/*
          Phase B+ 候補: 右カラム下部に「類似の作品」カードを置く余地。
          現時点では作品数が少ないため、空カードは出さない。
        */}
      </aside>
    </div>
  );
}
