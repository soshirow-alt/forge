"use client";

import type { ReactNode } from "react";
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
    return "まだフィードバックはありません。";
  }
  if (count === 1) {
    return "1件のフィードバックがあります。";
  }
  return `${count.toLocaleString()}件のフィードバックがあります。`;
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

  const introText = resolveIntroText(game.introduction, heroLead);
  const displayFeatures = game.features.filter(
    (feature) => feature.title.trim() && feature.description.trim(),
  );
  const showTags = game.tags.length > 0;
  const relatedTags = game.relatedTags.filter(
    (tag) => !game.tags.includes(tag),
  );
  const showSidebarTags = relatedTags.length > 0;

  const playMetaChips: ReactNode[] = [];
  if (playerMeta.estimatedPlayTime) {
    playMetaChips.push(
      <MetaChip key="play-time">{playerMeta.estimatedPlayTime}</MetaChip>,
    );
  }
  for (const label of playerMeta.environmentLabels) {
    playMetaChips.push(<MetaChip key={label}>{label}</MetaChip>);
  }

  const showPlayInfoCard =
    playerMeta.phaseLabel ||
    playerMeta.phaseDescription ||
    playMetaChips.length > 0 ||
    activity.lastUpdated;

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
        <OverviewCard title="作品紹介">
          {introText ? (
            <p className="mt-3 text-sm leading-relaxed text-zinc-300">{introText}</p>
          ) : null}
          {showTags ? (
            <p
              className={`text-sm leading-relaxed text-zinc-500 ${introText ? "mt-4" : "mt-3"}`}
            >
              <span className="text-zinc-600">タグ：</span>
              {game.tags.join(" / ")}
            </p>
          ) : null}
        </OverviewCard>

        <OverviewCard title="いまの開発状況">
          <p className="mt-3 text-sm leading-relaxed text-zinc-400">
            この作品はまだ開発中です。
          </p>
          <ul className="mt-3 space-y-1.5 text-sm leading-relaxed text-zinc-400">
            <li>
              {activity.hasDevlog && onOpenDevlog ? (
                <>
                  開発ログの最新更新：
                  <button
                    type="button"
                    onClick={onOpenDevlog}
                    className="ml-1 font-medium text-violet-400 transition-colors hover:text-violet-300"
                  >
                    {activity.devlogLabel}
                  </button>
                </>
              ) : (
                <span className="text-zinc-500">
                  開発ログはまだありません。更新が記録されると、開発ログタブに表示されます。
                </span>
              )}
            </li>
            <li>
              {activity.voiceCount > 0 ? (
                <span>{feedbackStatusLabel(activity.voiceCount)}</span>
              ) : (
                <span className="text-zinc-500">
                  まだフィードバックはありません。遊んで感じたことを共有してみませんか？
                </span>
              )}
            </li>
          </ul>

          {playerMeta.focusNotes ? (
            <p className="mt-4 border-l-2 border-violet-500/30 pl-3 text-sm leading-relaxed text-zinc-300">
              <span className="mb-1 block text-xs font-medium text-violet-300/80">
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
                className="inline-flex items-center rounded-xl border border-zinc-700 bg-zinc-950/50 px-4 py-2 text-sm font-medium text-zinc-200 transition-colors hover:border-violet-500/40 hover:text-violet-200"
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
        </OverviewCard>
      </div>

      <aside className="min-w-0 space-y-4">
        {showPlayInfoCard ? (
          <SidebarCard title="遊ぶ前に知っておくこと">
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
            {playMetaChips.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-2">{playMetaChips}</div>
            ) : null}
            {activity.lastUpdated ? (
              <p className="mt-3 text-xs text-zinc-500">
                最終更新：{activity.lastUpdated}
              </p>
            ) : null}
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
                <MetaChip key={tag}>{tag}</MetaChip>
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
