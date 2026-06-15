"use client";

import { useEffect, useMemo, useState } from "react";
import { VoiceAggregateBars } from "@/components/voice-aggregate-bars";
import { useGames } from "@/components/games-provider";
import { resolvePlayableVersion } from "@/lib/playable-version";
import { buildVoicePromptAggregates } from "@/lib/voice-aggregates";

type EveryonesVoiceSectionProps = {
  gameId: string;
  playableVersion?: string;
};

export function EveryonesVoiceSection({
  gameId,
  playableVersion,
}: EveryonesVoiceSectionProps) {
  const { getGameById, getPublicVoiceAggregates } = useGames();
  const game = getGameById(gameId);
  const version = resolvePlayableVersion(playableVersion ?? game?.playableVersion);
  const [loaded, setLoaded] = useState(false);
  const [aggregates, setAggregates] = useState(
    buildVoicePromptAggregates([]),
  );

  useEffect(() => {
    setLoaded(false);
    void getPublicVoiceAggregates(gameId, version)
      .then((rows) => {
        setAggregates(buildVoicePromptAggregates(rows));
      })
      .catch(() => {
        setAggregates(buildVoicePromptAggregates([]));
      })
      .finally(() => {
        setLoaded(true);
      });
  }, [gameId, version, getPublicVoiceAggregates]);

  const hasResponses = useMemo(
    () => aggregates.some((item) => item.totalResponses > 0),
    [aggregates],
  );

  if (!loaded) {
    return (
      <section className="mt-4 border-t border-zinc-800/80 pt-4">
        <h2 className="text-sm font-medium text-zinc-500">プレイヤーの回答</h2>
        <p className="mt-2 text-sm text-zinc-600">読み込み中...</p>
      </section>
    );
  }

  return (
    <section className="mt-4 border-t border-zinc-800/80 pt-4">
      <h2 className="text-sm font-medium text-zinc-500">プレイヤーの回答</h2>
      <p className="mt-1 text-xs text-zinc-600">
        v{version} への回答の集計です。個別の回答内容は公開されません。
      </p>

      {!hasResponses ? (
        <p className="mt-3 text-sm text-zinc-600">
          まだ回答はありません。プレイ後、開発者の質問に答えるとここに集計が表示されます。
        </p>
      ) : (
        <ul className="mt-3 space-y-4">
          {aggregates
            .filter((item) => item.totalResponses > 0)
            .map((item) => (
              <li
                key={item.promptId}
                className="rounded-lg border border-zinc-800/60 bg-zinc-950/30 px-3.5 py-3"
              >
                <p className="text-sm text-zinc-300">{item.promptText}</p>
                <div className="mt-2">
                  <VoiceAggregateBars aggregate={item} />
                </div>
              </li>
            ))}
        </ul>
      )}
    </section>
  );
}
