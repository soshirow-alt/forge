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
        className={`break-words text-[15px] leading-7 ${
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
              <span className="break-words">{feature.description}</span>
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
    return (
      <div className="mt-3 flex flex-col gap-2">
        {destinations.map((destination) => (
          <a
            key={destination.url}
            href={destination.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => onDestinationOpen?.()}
            className="inline-flex w-full items-center justify-between rounded-lg border border-zinc-700/80 bg-zinc-800/40 px-3 py-2 text-left text-xs font-medium text-zinc-200 transition-colors hover:border-violet-500/40 hover:bg-violet-500/10 hover:text-white"
          >
            <span>{destination.actionLabel}</span>
            <span className="text-zinc-500">{destination.label}</span>
          </a>
        ))}
      </div>
    );
  }

  return (
    <div className="mt-3 flex flex-wrap gap-1.5">
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

/**
 * 「最近の動き」はプレイヤー向けの表示専用サマリー。
 * Studio では概要タブから直接編集せず、開発ログ / 新ver公開 / フィードバック件数 /
 * 版ごとの問い（将来）から自動反映する想定。
 */
function RecentActivityPanel({
  activity,
  focusNotes,
}: {
  activity: GameDetailOverviewActivity;
  focusNotes: string | null;
}) {
  return (
    <>
      <ul className="mt-3 space-y-1.5 break-words text-sm leading-relaxed text-zinc-400">
        <li>
          {activity.hasDevlog
            ? `最新の開発ログ：${activity.devlogLabel}`
            : "開発ログはまだありません。"}
        </li>
        <li>{feedbackStatusLabel(activity.voiceCount)}</li>
      </ul>

      {focusNotes ? (
        <p className="mt-4 break-words border-l-2 border-violet-500/30 pl-3 text-sm leading-relaxed text-zinc-300">
          <span className="mb-1 block text-xs font-medium text-violet-300/80">
            いま見てほしいこと
          </span>
          {focusNotes}
        </p>
      ) : null}
    </>
  );
}

type PrimaryPlayAction = {
  label: string;
  href?: string | null;
  onClick: () => void;
  disabled?: boolean;
};

type GameDetailPlayerOverviewProps = {
  game: GameDetailV0;
  heroLead: string;
  playerMeta: GameDetailPlayerMeta;
  activity: GameDetailOverviewActivity;
  publication: PublicationDisplay | null;
  primaryPlayAction?: PrimaryPlayAction | null;
  playUrlMissingMessage?: string | null;
  playDestinations?: PlayDestination[];
  onPlayDestinationOpen?: () => void;
  showUnsetPlayPlaceholders?: boolean;
  mutedIntroduction?: boolean;
};

export function GameDetailPlayerOverview({
  game,
  heroLead,
  playerMeta,
  activity,
  publication,
  primaryPlayAction = null,
  playUrlMissingMessage = null,
  playDestinations = [],
  onPlayDestinationOpen,
  showUnsetPlayPlaceholders = false,
  mutedIntroduction = false,
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

  const showPlayInfoSection =
    showPlayInfoCard ||
    showUnsetPlayPlaceholders ||
    Boolean(primaryPlayAction) ||
    Boolean(playUrlMissingMessage);

  return (
    <div className="grid gap-5 lg:grid-cols-3 lg:gap-6">
      <div className="min-w-0 space-y-5 lg:col-span-2">
        {introText ? (
          <OverviewCard title="作品紹介">
            <IntroBody text={introText} muted={mutedIntroduction} />
          </OverviewCard>
        ) : null}

        <OverviewCard title="最近の動き">
          <RecentActivityPanel
            activity={activity}
            focusNotes={playerMeta.focusNotes}
          />
        </OverviewCard>
      </div>

      <aside className="min-w-0 space-y-4">
        {showPlayInfoSection ? (
          <SidebarCard title="プレイ情報">
            {showPlayInfoCard ? (
              <PlayInfoPanel playerMeta={playerMeta} />
            ) : showUnsetPlayPlaceholders ? (
              <UnsetPlayInfoPanel />
            ) : null}
            {primaryPlayAction ? (
              primaryPlayAction.href && !primaryPlayAction.disabled ? (
                <a
                  href={primaryPlayAction.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={primaryPlayAction.onClick}
                  className="mt-4 block w-full rounded-lg bg-violet-600 px-4 py-2.5 text-center text-sm font-semibold text-white transition-colors hover:bg-violet-500"
                >
                  {primaryPlayAction.label}
                </a>
              ) : (
                <button
                  type="button"
                  onClick={primaryPlayAction.onClick}
                  disabled={primaryPlayAction.disabled}
                  className="mt-4 w-full rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {primaryPlayAction.label}
                </button>
              )
            ) : null}
            {playUrlMissingMessage ? (
              <p className="mt-3 text-xs text-amber-300/90" role="status">
                {playUrlMissingMessage}
              </p>
            ) : null}
          </SidebarCard>
        ) : null}

        {publication ? (
          <SidebarCard title="公開先">
            <PublicationPanel
              publication={publication}
              destinations={playDestinations}
              onDestinationOpen={onPlayDestinationOpen}
            />
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
