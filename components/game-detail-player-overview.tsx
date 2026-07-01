"use client";

import type { ReactNode } from "react";
import { Sprout } from "lucide-react";
import type { GameDetailFeature, GameDetailV0 } from "@/lib/game-detail-v0-mock-data";
import type { ExternalLink } from "@/lib/game-links";
import type {
  GameDetailOverviewActivity,
  GameDetailPlayerMeta,
} from "@/lib/game-detail-player-meta";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { useGames } from "@/components/games-provider";
import { gameDetailReturnPath } from "@/lib/login-return-url";
import { WATCH_BUTTON_OFF, WATCH_BUTTON_ON } from "@/lib/watch-ui-labels";

function normalizeText(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

function introductionAddsBeyondLead(introduction: string, heroLead: string): boolean {
  const intro = normalizeText(introduction);
  const lead = normalizeText(heroLead);
  if (!intro) {
    return false;
  }
  if (!lead) {
    return intro.length > 0;
  }
  if (intro === lead) {
    return false;
  }
  if (lead.includes(intro) || intro.includes(lead)) {
    return intro.length > lead.length + 20;
  }
  return true;
}

function MetaChip({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "muted";
}) {
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2.5 py-1 text-xs ${
        tone === "muted"
          ? "border-zinc-800 bg-zinc-950/50 text-zinc-500"
          : "border-zinc-700/80 bg-zinc-800/50 text-zinc-300"
      }`}
    >
      {children}
    </span>
  );
}

function CompactFeatureList({ features }: { features: GameDetailFeature[] }) {
  if (features.length === 0) {
    return null;
  }

  return (
    <ul className="mt-4 space-y-2">
      {features.map((feature) => (
        <li key={`${feature.title}-${feature.description}`} className="text-sm leading-relaxed">
          <span className="font-medium text-zinc-200">{feature.title}</span>
          <span className="text-zinc-500"> — </span>
          <span className="text-zinc-400">{feature.description}</span>
        </li>
      ))}
    </ul>
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
  onOpenDevlog?: () => void;
  onOpenVoices?: () => void;
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
  onOpenDevlog,
  onOpenVoices,
  onWatch,
}: GameDetailPlayerOverviewProps) {
  const { requireAuth } = useRequireAuth();
  const { recordPlay } = useGames();
  const returnPath = gameDetailReturnPath(gameId);

  const introduction = game.introduction.trim();
  const showIntroBody = introductionAddsBeyondLead(introduction, heroLead);
  const displayFeatures = game.features.filter(
    (feature) => feature.title.trim() && feature.description.trim(),
  );
  const showTags = game.tags.length > 0;
  const showIntroCard = showIntroBody || showTags || displayFeatures.length > 0;
  const introCardPadding = showIntroBody || displayFeatures.length > 0 ? "p-5 sm:p-6" : "p-4";

  const metaChips: ReactNode[] = [];
  if (playerMeta.estimatedPlayTime) {
    metaChips.push(<MetaChip key="play-time">{playerMeta.estimatedPlayTime}</MetaChip>);
  }
  for (const label of playerMeta.environmentLabels) {
    metaChips.push(<MetaChip key={label}>{label}</MetaChip>);
  }
  if (activity.lastUpdated) {
    metaChips.push(
      <MetaChip key="updated" tone="muted">
        最終更新 {activity.lastUpdated}
      </MetaChip>,
    );
  }

  const showPlayInfoCard =
    playerMeta.phaseLabel ||
    playerMeta.phaseDescription ||
    metaChips.length > 0;

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
    <div className="mx-auto max-w-3xl space-y-4">
      {showIntroCard ? (
        <section
          className={`rounded-2xl border border-zinc-800/80 bg-zinc-900/35 ${introCardPadding}`}
        >
          <h2 className="text-base font-semibold text-white">作品紹介</h2>
          {showIntroBody ? (
            <p className="mt-3 text-sm leading-relaxed text-zinc-300">{introduction}</p>
          ) : null}
          {showTags ? (
            <p className={`text-sm leading-relaxed text-zinc-500 ${showIntroBody ? "mt-4" : "mt-3"}`}>
              <span className="text-zinc-600">タグ：</span>
              {game.tags.join(" / ")}
            </p>
          ) : null}
          <CompactFeatureList features={displayFeatures} />
        </section>
      ) : null}

      {showPlayInfoCard ? (
        <section className="rounded-2xl border border-zinc-800/80 bg-zinc-900/30 p-4 sm:p-5">
          <h2 className="text-sm font-semibold text-zinc-300">遊ぶ前に知っておくこと</h2>
          {playerMeta.phaseLabel ? (
            <div className="mt-3">
              <span className="inline-flex rounded-md border border-orange-500/35 bg-orange-500/10 px-2.5 py-1 text-xs font-semibold text-orange-200">
                {playerMeta.phaseLabel}
              </span>
              {playerMeta.phaseDescription ? (
                <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                  {playerMeta.phaseDescription}
                </p>
              ) : null}
            </div>
          ) : null}
          {metaChips.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">{metaChips}</div>
          ) : null}
        </section>
      ) : null}

      <section className="rounded-2xl border border-orange-500/20 bg-gradient-to-br from-orange-500/[0.08] via-zinc-900/45 to-zinc-950/80 p-5 sm:p-6">
        <div className="flex items-center gap-2">
          <Sprout className="size-4 shrink-0 text-orange-300/90" aria-hidden="true" />
          <h2 className="text-sm font-semibold text-orange-100/95">いまの開発状況</h2>
        </div>
        <p className="mt-2 text-sm text-zinc-300">この作品はいま開発中です</p>

        <dl className="mt-4 space-y-2 text-sm text-zinc-400">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <dt className="text-zinc-500">開発ログ</dt>
            <dd>
              {activity.hasDevlog && onOpenDevlog ? (
                <button
                  type="button"
                  onClick={onOpenDevlog}
                  className="font-medium text-violet-400 transition-colors hover:text-violet-300"
                >
                  最新あり（{activity.devlogLabel}）
                </button>
              ) : (
                <span>まだありません</span>
              )}
            </dd>
          </div>
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <dt className="text-zinc-500">プレイヤーの声</dt>
            <dd>
              {activity.voiceCount > 0 ? (
                <span>
                  <span className="font-medium text-zinc-200">
                    {activity.voiceCount.toLocaleString()}件
                  </span>
                  が届いています
                </span>
              ) : (
                <span>まだ少ない作品です。遊んで感じたことを届けてみませんか？</span>
              )}
            </dd>
          </div>
        </dl>

        {playerMeta.focusNotes ? (
          <p className="mt-4 border-l-2 border-violet-500/35 pl-3 text-sm leading-relaxed text-zinc-300">
            <span className="block text-xs font-medium text-violet-300/80">
              いま見てほしいこと
            </span>
            {playerMeta.focusNotes}
          </p>
        ) : null}

        <div className="mt-5 flex flex-wrap gap-2">
          {onOpenVoices ? (
            <button
              type="button"
              onClick={onOpenVoices}
              className="inline-flex items-center rounded-xl border border-violet-500/35 bg-violet-500/10 px-4 py-2 text-sm font-medium text-violet-200 transition-colors hover:border-violet-400/50 hover:bg-violet-500/15"
            >
              みんなのフィードバックを見る
            </button>
          ) : null}
          {onWatch ? (
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
          ) : null}
        </div>

        {externalLinks.length > 0 ? (
          <div className="mt-4 border-t border-zinc-800/70 pt-3">
            <p className="text-[11px] font-medium text-zinc-600">外部リンク</p>
            <div className="mt-2 flex flex-wrap gap-2">
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
          </div>
        ) : null}
      </section>
    </div>
  );
}
