"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { useGames } from "@/components/games-provider";
import { resolvePlayableVersion } from "@/lib/playable-version";
import type { Game } from "@/lib/mock-games";

type NewPlayableVersionBannerProps = {
  game: Game;
};

export function NewPlayableVersionBanner({ game }: NewPlayableVersionBannerProps) {
  const { user } = useAuth();
  const { isWatching, getNewPlayableVersionBannerState } = useGames();
  const [visible, setVisible] = useState(false);
  const [priorVersion, setPriorVersion] = useState<string | null>(null);
  const currentVersion = resolvePlayableVersion(game.playableVersion);

  useEffect(() => {
    if (!user || !isWatching(game.id)) {
      setVisible(false);
      return;
    }

    void getNewPlayableVersionBannerState(game.id)
      .then((state) => {
        setVisible(state.show);
        setPriorVersion(state.priorVersion ?? null);
      })
      .catch(() => {
        setVisible(false);
      });
  }, [game.id, user, isWatching, getNewPlayableVersionBannerState, currentVersion]);

  if (!visible) {
    return null;
  }

  return (
    <div
      id="new-playable-version-banner"
      className="mt-4 scroll-mt-24 rounded-xl border border-orange-500/30 bg-gradient-to-br from-orange-500/10 via-zinc-950/40 to-zinc-950/40 px-4 py-4 sm:px-5"
    >
      <p className="text-sm font-semibold text-orange-300">
        新しいプレイ可能版 {currentVersion} が公開されました
      </p>
      <p className="mt-2 text-sm leading-relaxed text-zinc-400">
        {priorVersion ? (
          <>
            以前の版（{priorVersion}）向けに回答を送っています。もう一度プレイして、版{" "}
            {currentVersion} 向けの新しい回答を送れます。
          </>
        ) : (
          <>
            もう一度プレイして、版 {currentVersion} 向けの質問に答えられます。
          </>
        )}
      </p>
      <p className="mt-2 text-xs text-zinc-600">
        右側の「プレイする」から再プレイできます。プレイ後、質問への回答を sidebar から送れます。
      </p>
    </div>
  );
}
