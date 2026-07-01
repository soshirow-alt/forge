"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import type { GameDetailFeature, GameDetailV0 } from "@/lib/game-detail-v0-mock-data";
import type { ExternalLink } from "@/lib/game-links";
import type {
  GameDetailOverviewActivity,
  GameDetailPlayerMeta,
  PlayerPlatformOption,
} from "@/lib/game-detail-player-meta";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { useGames } from "@/components/games-provider";
import { gameDetailReturnPath } from "@/lib/login-return-url";
import { WATCH_BUTTON_OFF, WATCH_BUTTON_ON } from "@/lib/watch-ui-labels";

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
      <h2 className="text-base font-semibold text-white">{title}</h2>
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

function PlatformChip({ option }: { option: PlayerPlatformOption }) {
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2.5 py-1 text-xs ${
        option.supported
          ? "border-zinc-600 bg-zinc-800/70 font-medium text-zinc-200"
          : "border-zinc-800/80 bg-zinc-950/40 text-zinc-600"
      }`}
    >
      {option.label}
    </span>
  );
}

function IntroBody({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  const needsExpand = text.length > INTRO_COLLAPSE_THRESHOLD;

  return (
    <div className="mt-4">
      <p
        className={`text-[15px] leading-7 text-zinc-300 ${
          !expanded && needsExpand ? "line-clamp-4" : ""
        }`}
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
        <li key={feature.title} className="text-xs leading-relaxed text-zinc-400">
          <span className="font-medium text-zinc-300">{feature.title}</span>
          {feature.description ? (
            <>
              <span className="text-zinc-600"> — </span>
              <span>{feature.description}</span>
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

function PlayInfoPanel({ playerMeta }: { playerMeta: GameDetailPlayerMeta }) {
  const { playInfo, phaseDescription } = playerMeta;
  const hasPlatforms = playInfo.platformOptions.some((option) => option.supported);
  const hasPlayMethod = Boolean(playInfo.playMethodLabel);
  const hasPlayTime = Boolean(playInfo.estimatedPlayTime);
  const hasContent =
    phaseDescription || hasPlayTime || hasPlatforms || hasPlayMethod;

  if (!hasContent) {
    return null;
  }

  return (
    <>
      {phaseDescription ? (
        <p className="mt-3 text-sm leading-relaxed text-zinc-400">{phaseDescription}</p>
      ) : null}

      {hasPlayTime ? (
        <p className="mt-3 text-sm text-zinc-400">
          <span className="text-zinc-500">想定時間：</span>
          {playInfo.estimatedPlayTime}
        </p>
      ) : null}

      {hasPlatforms ? (
        <div className="mt-3">
          <p className="text-xs text-zinc-500">対応環境</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {playInfo.platformOptions.map((option) => (
              <PlatformChip key={option.label} option={option} />
            ))}
          </div>
        </div>
      ) : null}

      {hasPlayMethod ? (
        <p className="mt-3 text-sm text-zinc-400">
          <span className="text-zinc-500">プレイ方法：</span>
          {playInfo.playMethodLabel}
        </p>
      ) : null}
    </>
  );
}

type GameDetailPlayerOverviewProps = {
  gameId: string;
  game: GameDetailV0;
  heroLead: string;
  playerMeta: GameDetailPlayerMeta;
  activity: GameDetailOverviewActivity;
  externalLinks: ExternalLink[];
  watching: boolean;
  onWatch?: () => void;
};

export function GameDetailPlayerOverview({
  gameId,
  game,
  heroLead,
  playerMeta,
  activity,
  externalLinks,
  watching,
  onWatch,
}: GameDetailPlayerOverviewProps) {
  const { requireAuth } = useRequireAuth();
  const { recordPlay } = useGames();
  const returnPath = gameDetailReturnPath(gameId);

  const introText = resolveIntroText(game.introduction, heroLead);
  const displayFeatures = game.features.filter(
    (feature) => feature.title.trim() && feature.description.trim(),
  );
  const relatedTags = game.relatedTags.filter(
    (tag) => !game.tags.includes(tag),
  );
  const showSidebarTags = relatedTags.length > 0;

  const showPlayInfoCard = Boolean(
    playerMeta.phaseDescription ||
      playerMeta.playInfo.estimatedPlayTime ||
      playerMeta.playInfo.platformOptions.some((option) => option.supported) ||
      playerMeta.playInfo.playMethodLabel,
  );

  function handleExternalLink(url: string) {
    requireAuth(
      () => {
        void recordPlay(gameId).finally(() => {
          window.open(url, "_blank", "noopener,noreferrer");
        });
      },
      returnPath,
    );
  }

  return (
    <div className="grid gap-5 lg:grid-cols-3 lg:gap-6">
      <div className="min-w-0 space-y-5 lg:col-span-2">
        {introText ? (
          <OverviewCard title="作品紹介">
            <IntroBody text={introText} />
          </OverviewCard>
        ) : null}

        <OverviewCard title="いまの状況">
          <p className="mt-3 text-sm leading-relaxed text-zinc-400">
            この作品はまだ開発中です。
          </p>
          <ul className="mt-3 space-y-1 text-sm leading-relaxed text-zinc-500">
            <li>
              {activity.hasDevlog
                ? `開発ログの最新更新：${activity.devlogLabel}`
                : "開発ログはまだありません。"}
            </li>
            <li>{feedbackStatusLabel(activity.voiceCount)}</li>
          </ul>

          {playerMeta.focusNotes ? (
            <p className="mt-4 border-l-2 border-violet-500/30 pl-3 text-sm leading-relaxed text-zinc-300">
              <span className="mb-1 block text-xs font-medium text-violet-300/80">
                いま見てほしいこと
              </span>
              {playerMeta.focusNotes}
            </p>
          ) : null}

          {onWatch ? (
            <div className="mt-4">
              <button
                type="button"
                onClick={onWatch}
                className={`inline-flex items-center rounded-xl border px-4 py-2 text-sm font-medium transition-colors ${
                  watching
                    ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                    : "border-zinc-700 text-zinc-300 hover:border-zinc-600 hover:text-white"
                }`}
              >
                {watching ? WATCH_BUTTON_ON : WATCH_BUTTON_OFF}
              </button>
            </div>
          ) : null}
        </OverviewCard>
      </div>

      <aside className="min-w-0 space-y-4">
        {showPlayInfoCard ? (
          <SidebarCard title="プレイ情報">
            <PlayInfoPanel playerMeta={playerMeta} />
          </SidebarCard>
        ) : null}

        {externalLinks.length > 0 ? (
          <SidebarCard title="外部リンク">
            <div className="mt-3 flex flex-wrap gap-2">
              {externalLinks.map((link) => (
                <button
                  key={link.url}
                  type="button"
                  onClick={() => handleExternalLink(link.url)}
                  className="rounded-md border border-zinc-700/80 bg-zinc-950/50 px-2.5 py-1 text-xs text-zinc-400 transition-colors hover:border-orange-500/40 hover:text-orange-300"
                >
                  {link.label}
                </button>
              ))}
            </div>
          </SidebarCard>
        ) : null}

        {showSidebarTags ? (
          <SidebarCard title="関連タグ">
            <div className="mt-3 flex flex-wrap gap-1.5">
              {relatedTags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center rounded-md border border-zinc-700/80 bg-zinc-800/50 px-2.5 py-1 text-xs text-zinc-400"
                >
                  {tag}
                </span>
              ))}
            </div>
          </SidebarCard>
        ) : null}

        {displayFeatures.length > 0 ? (
          <SidebarCard title="作品の特徴">
            <CompactFeatureList features={displayFeatures} />
          </SidebarCard>
        ) : null}
      </aside>
    </div>
  );
}
