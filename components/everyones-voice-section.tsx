"use client";

import { useEffect, useMemo, useState } from "react";
import { VoiceAggregateBars } from "@/components/voice-aggregate-bars";
import { useGames } from "@/components/games-provider";
import { resolvePlayableVersion } from "@/lib/playable-version";
import {
  buildVoicePromptAggregates,
  canShowPublicVoiceTrend,
  type VoicePromptAggregate,
} from "@/lib/voice-aggregates";
import { isFreeTextResponseKind } from "@/lib/version-prompt-types";

type EveryonesVoiceSectionProps = {
  gameId: string;
  playableVersion?: string;
  /** embedded = 旧来の区切り線付き。tab = ゲーム詳細タブ用カード */
  variant?: "embedded" | "tab";
  refreshKey?: number;
  onSendVoice?: () => void;
};

function PromptAggregateCard({
  aggregate,
  versionLabel,
}: {
  aggregate: VoicePromptAggregate;
  versionLabel: string;
}) {
  const { promptText, totalResponses, responseKind } = aggregate;

  if (isFreeTextResponseKind(responseKind)) {
    return (
      <li className="rounded-xl border border-zinc-800/80 bg-zinc-950/30 px-4 py-4 sm:px-5 sm:py-5">
        <h3 className="text-sm font-medium text-zinc-200">{promptText}</h3>
        <p className="mt-2 text-sm text-zinc-400">
          自由記述のフィードバック{" "}
          <span className="font-semibold text-zinc-200">{totalResponses}</span> 件
        </p>
        <p className="mt-2 text-xs leading-relaxed text-zinc-600">
          自由記述の内容は開発者だけが確認できます。個別の回答は公開されません。
        </p>
      </li>
    );
  }

  if (!canShowPublicVoiceTrend(totalResponses)) {
    return (
      <li className="rounded-xl border border-zinc-800/80 bg-zinc-950/30 px-4 py-4 sm:px-5 sm:py-5">
        <h3 className="text-sm font-medium text-zinc-200">{promptText}</h3>
        <p className="mt-2 text-sm text-zinc-400">
          回答 <span className="font-semibold text-zinc-200">{totalResponses}</span> 件
        </p>
        <p className="mt-2 text-xs leading-relaxed text-zinc-600">
          まだ回答が集まりはじめたところです。もう少し回答が集まると、傾向が表示されます。
        </p>
      </li>
    );
  }

  return (
    <li className="rounded-xl border border-zinc-800/80 bg-zinc-950/30 px-4 py-4 sm:px-5 sm:py-5">
      <h3 className="text-sm font-medium text-zinc-200">{promptText}</h3>
      <p className="mt-1 text-xs text-zinc-600">
        {versionLabel} · 回答 {totalResponses} 件
      </p>
      <div className="mt-3">
        <VoiceAggregateBars aggregate={aggregate} variant="public" />
      </div>
    </li>
  );
}

export function EveryonesVoiceSection({
  gameId,
  playableVersion,
  variant = "embedded",
  refreshKey = 0,
  onSendVoice,
}: EveryonesVoiceSectionProps) {
  const { getGameById, getPublicVoiceAggregates } = useGames();
  const game = getGameById(gameId);
  const version = resolvePlayableVersion(playableVersion ?? game?.playableVersion);
  const versionLabel = `v${version}`;
  const [loaded, setLoaded] = useState(false);
  const [aggregates, setAggregates] = useState(buildVoicePromptAggregates([]));
  const isTab = variant === "tab";

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
  }, [gameId, version, refreshKey, getPublicVoiceAggregates]);

  const promptsWithResponses = useMemo(
    () => aggregates.filter((item) => item.totalResponses > 0),
    [aggregates],
  );

  if (!loaded) {
    return (
      <section
        className={
          isTab
            ? "rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-5 sm:p-6"
            : "mt-4 border-t border-zinc-800/80 pt-4"
        }
      >
        <h2 className="text-sm font-medium text-zinc-500">みんなのフィードバック</h2>
        <p className="mt-2 text-sm text-zinc-600">読み込み中...</p>
      </section>
    );
  }

  const header = (
    <>
      <h2
        className={
          isTab
            ? "text-lg font-semibold text-white"
            : "text-sm font-medium text-zinc-500"
        }
      >
        みんなのフィードバック
      </h2>
      <p className={`${isTab ? "mt-2" : "mt-1"} text-xs leading-relaxed text-zinc-600`}>
        {isTab
          ? "プレイヤーの反応の傾向。個別の回答内容は公開されません。開発者には改善のヒントとして届きます。"
          : `${versionLabel} への回答の集計です。個別の回答内容は公開されません。開発者には改善のヒントとして届きます。`}
      </p>
    </>
  );

  if (promptsWithResponses.length === 0) {
    return (
      <section
        className={
          isTab
            ? "rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-5 sm:p-6"
            : "mt-4 border-t border-zinc-800/80 pt-4"
        }
      >
        {header}
        <div className={`${isTab ? "mt-6" : "mt-3"} rounded-xl border border-dashed border-zinc-800 bg-zinc-950/20 px-4 py-8 text-center`}>
          <p className="text-sm text-zinc-400">まだフィードバックが集まりはじめたところです</p>
          <p className="mt-2 text-xs leading-relaxed text-zinc-600">
            プレイ後、開発者の質問に答えると、ここに反応の傾向が表示されます。
          </p>
          {onSendVoice ? (
            <button
              type="button"
              onClick={onSendVoice}
              className="mt-5 inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 px-5 py-2.5 text-sm font-semibold text-zinc-950 transition-opacity hover:opacity-90"
            >
              フィードバックする
            </button>
          ) : null}
        </div>
      </section>
    );
  }

  return (
    <section
      className={
        isTab
          ? "rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-5 sm:p-6"
          : "mt-4 border-t border-zinc-800/80 pt-4"
      }
    >
      {header}
      <ul className={`${isTab ? "mt-5" : "mt-3"} space-y-4`}>
        {promptsWithResponses.map((aggregate) => (
          <PromptAggregateCard
            key={aggregate.promptId}
            aggregate={aggregate}
            versionLabel={versionLabel}
          />
        ))}
      </ul>
    </section>
  );
}
