"use client";

import type { ReactNode } from "react";
import { FileText, MessageSquare, Sprout } from "lucide-react";
import type { GameDetailPlayerMeta } from "@/lib/game-detail-player-meta";

type GameGrowthStatusStripProps = {
  meta: GameDetailPlayerMeta;
  lastUpdated: string;
  hasDevlog: boolean;
  devlogLabel: string;
  voiceCount: number;
  onDevlogClick?: () => void;
  onVoicesClick?: () => void;
};

function StatusItem({
  label,
  value,
  onClick,
}: {
  label: string;
  value: ReactNode;
  onClick?: () => void;
}) {
  const className =
    "rounded-lg border border-zinc-800/80 bg-zinc-950/40 px-3 py-2.5 text-left";

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={`${className} transition-colors hover:border-violet-500/30 hover:bg-zinc-900/60`}>
        <dt className="text-[11px] font-medium text-zinc-600">{label}</dt>
        <dd className="mt-0.5 text-sm text-zinc-200">{value}</dd>
      </button>
    );
  }

  return (
    <div className={className}>
      <dt className="text-[11px] font-medium text-zinc-600">{label}</dt>
      <dd className="mt-0.5 text-sm text-zinc-200">{value}</dd>
    </div>
  );
}

export function GameGrowthStatusStrip({
  meta,
  lastUpdated,
  hasDevlog,
  devlogLabel,
  voiceCount,
  onDevlogClick,
  onVoicesClick,
}: GameGrowthStatusStripProps) {
  const voiceLabel =
    voiceCount > 0 ? `${voiceCount.toLocaleString()}人が届けた` : "まだありません";

  return (
    <section
      aria-label="この作品の状況"
      className="rounded-2xl border border-orange-500/20 bg-gradient-to-br from-orange-500/[0.07] via-zinc-950/30 to-zinc-950/50 p-4 sm:p-5"
    >
      <div className="flex items-center gap-2">
        <Sprout className="size-4 shrink-0 text-orange-300/90" aria-hidden="true" />
        <h2 className="text-sm font-semibold text-orange-100/95">この作品の状況</h2>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-zinc-500">
        開発中のゲームが、プレイヤーの声を受けながら育っていく様子です。
      </p>

      <dl className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        <StatusItem label="現在の開発フェーズ" value={meta.phaseLabel} />
        <StatusItem label="最新更新" value={lastUpdated} />
        <StatusItem
          label="開発ログ"
          value={
            <span className="inline-flex items-center gap-1.5">
              <FileText className="size-3.5 text-violet-400" aria-hidden="true" />
              {hasDevlog ? devlogLabel : "まだありません"}
            </span>
          }
          onClick={onDevlogClick}
        />
        <StatusItem
          label="プレイヤーの声"
          value={
            <span className="inline-flex items-center gap-1.5">
              <MessageSquare className="size-3.5 text-violet-400" aria-hidden="true" />
              {voiceLabel}
            </span>
          }
          onClick={voiceCount > 0 ? onVoicesClick : undefined}
        />
        {meta.focusNotes ? (
          <div className="rounded-lg border border-violet-500/20 bg-violet-500/5 px-3 py-2.5 sm:col-span-2 lg:col-span-3">
            <dt className="text-[11px] font-medium text-violet-300/80">いま見てほしいところ</dt>
            <dd className="mt-1 text-sm leading-relaxed text-zinc-300">{meta.focusNotes}</dd>
          </div>
        ) : null}
      </dl>
    </section>
  );
}
