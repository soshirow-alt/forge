"use client";

import type { ReactNode } from "react";
import { GameTags } from "@/components/game-tags";
import {
  displayPhase,
  getPhasePlayerDescription,
} from "@/lib/development-phases";
import { getPublicGameTags } from "@/lib/play-environment";
import { LABEL_TEST_PLAY_OPEN } from "@/lib/user-labels";
import type { Game } from "@/lib/mock-games";

type GameDetailOverviewProps = {
  game: Game;
};

function OverviewItem({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-zinc-800/80 bg-zinc-950/40 px-3 py-2.5">
      <dt className="text-[11px] font-medium text-zinc-600">{label}</dt>
      <dd className="mt-0.5 text-sm text-zinc-200">{children}</dd>
    </div>
  );
}

function getWhyPlayHook(game: Game): string {
  const phaseDescription = getPhasePlayerDescription(game.phase);
  if (phaseDescription) {
    return phaseDescription;
  }
  if (game.lookingForTesters) {
    return "いま公開中のバージョンを、無料で先行プレイできます。";
  }
  return "Forgeでしか出会えない、開発中のインディーゲームです。";
}

export function GameDetailOverview({ game }: GameDetailOverviewProps) {
  const publicTags = getPublicGameTags(game.tags);
  const phaseLabel = displayPhase(game.phase);
  const phaseDescription = getPhasePlayerDescription(game.phase);

  return (
    <section className="mt-4 rounded-xl border border-orange-500/15 bg-gradient-to-br from-orange-500/[0.06] via-zinc-950/20 to-zinc-950/40 p-4 sm:p-5">
      <p className="text-sm leading-relaxed text-orange-200/90">{getWhyPlayHook(game)}</p>

      <dl className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        <OverviewItem label="開発フェーズ">
          <span>{phaseLabel}</span>
          {phaseDescription && (
            <p className="mt-1 text-xs leading-snug text-zinc-500">
              {phaseDescription}
            </p>
          )}
        </OverviewItem>
        <OverviewItem label="ジャンル">{game.genre}</OverviewItem>
        {game.estimatedPlayTime && (
          <OverviewItem label="想定プレイ時間">{game.estimatedPlayTime}</OverviewItem>
        )}
        {game.lookingForTesters && (
          <OverviewItem label="テストプレイ">{LABEL_TEST_PLAY_OPEN}</OverviewItem>
        )}
      </dl>

      {publicTags.length > 0 && (
        <div className="mt-3">
          <p className="text-[11px] font-medium text-zinc-600">特徴</p>
          <div className="mt-1.5">
            <GameTags tags={publicTags} />
          </div>
        </div>
      )}

      {game.focusNotes && (
        <div className="mt-4 rounded-lg border border-zinc-800/80 bg-zinc-950/50 px-3.5 py-3">
          <p className="text-[11px] font-medium text-zinc-500">
            開発者が特に見てほしい観点
          </p>
          <p className="mt-1 text-sm leading-relaxed text-zinc-300">
            {game.focusNotes}
          </p>
        </div>
      )}
    </section>
  );
}
