"use client";

import { useEffect, useMemo, useState } from "react";
import { PublicFeedbackCardView } from "@/components/public-feedback-card";
import { VoiceAggregateBars } from "@/components/voice-aggregate-bars";
import { useGames } from "@/components/games-provider";
import type { PublicFeedbackCard } from "@/lib/public-feedback-cards";
import { resolvePlayableVersion } from "@/lib/playable-version";
import {
  buildVoicePromptAggregates,
  canShowPublicVoiceTrend,
  type VoicePromptAggregate,
} from "@/lib/voice-aggregates";
import { isFreeTextResponseKind } from "@/lib/version-prompt-types";

const INITIAL_CARD_COUNT = 3;

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
          文章として読める内容は、下の一覧に表示されます。
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

function PublicFeedbackCardsList({ cards }: { cards: PublicFeedbackCard[] }) {
  const [expanded, setExpanded] = useState(false);
  const visibleCards = expanded ? cards : cards.slice(0, INITIAL_CARD_COUNT);
  const hasMore = cards.length > INITIAL_CARD_COUNT;

  if (cards.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-800 bg-zinc-950/20 px-4 py-6 text-center">
        <p className="text-sm text-zinc-500">まだ公開されているフィードバックはありません</p>
        <p className="mt-2 text-xs leading-relaxed text-zinc-600">
          ひと言コメントや自由記述、詳しい感想が投稿されると、ここに表示されます。
        </p>
      </div>
    );
  }

  return (
    <div>
      <ul className="space-y-4">
        {visibleCards.map((card) => (
          <PublicFeedbackCardView key={card.cardId} card={card} />
        ))}
      </ul>
      {hasMore && !expanded ? (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="mt-4 text-xs font-medium text-orange-400/90 transition-colors hover:text-orange-300"
        >
          すべて見る（{cards.length}件）
        </button>
      ) : null}
    </div>
  );
}

export function EveryonesVoiceSection({
  gameId,
  playableVersion,
  variant = "embedded",
  refreshKey = 0,
  onSendVoice,
}: EveryonesVoiceSectionProps) {
  const { getGameById, getPublicVoiceAggregates, getPublicFeedbackCards } = useGames();
  const game = getGameById(gameId);
  const version = resolvePlayableVersion(playableVersion ?? game?.playableVersion);
  const versionLabel = `v${version}`;
  const [loaded, setLoaded] = useState(false);
  const [aggregates, setAggregates] = useState(buildVoicePromptAggregates([]));
  const [feedbackCards, setFeedbackCards] = useState<PublicFeedbackCard[]>([]);
  const isTab = variant === "tab";

  useEffect(() => {
    void Promise.all([
      getPublicVoiceAggregates(gameId, version),
      getPublicFeedbackCards(gameId, version),
    ])
      .then(([aggregateRows, cards]) => {
        setAggregates(buildVoicePromptAggregates(aggregateRows));
        setFeedbackCards(cards);
      })
      .catch(() => {
        setAggregates(buildVoicePromptAggregates([]));
        setFeedbackCards([]);
      })
      .finally(() => {
        setLoaded(true);
      });
  }, [gameId, version, refreshKey, getPublicVoiceAggregates, getPublicFeedbackCards]);

  const promptsWithResponses = useMemo(
    () => aggregates.filter((item) => item.totalResponses > 0),
    [aggregates],
  );

  const totalAnswerCount = useMemo(
    () => promptsWithResponses.reduce((sum, item) => sum + item.totalResponses, 0),
    [promptsWithResponses],
  );

  const sectionClassName = isTab
    ? "rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-5 sm:p-6"
    : "mt-4 border-t border-zinc-800/80 pt-4";

  if (!loaded) {
    return (
      <section className={sectionClassName}>
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
          ? "選択式回答は集計で表示されます。文章として読めるフィードバックは下の一覧に表示されます。"
          : `${versionLabel} への回答集計と、作品ページに公開されているフィードバックです。`}
      </p>
    </>
  );

  const hasAggregateContent = promptsWithResponses.length > 0;
  const hasPublicCards = feedbackCards.length > 0;
  const hasAnyContent = hasAggregateContent || hasPublicCards;

  if (!hasAnyContent) {
    return (
      <section className={sectionClassName}>
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
    <section className={sectionClassName}>
      {header}

      {(totalAnswerCount > 0 || hasPublicCards) && (
        <div className={`${isTab ? "mt-4" : "mt-3"} flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-500`}>
          {totalAnswerCount > 0 ? (
            <span>
              回答数{" "}
              <span className="font-semibold text-zinc-300">{totalAnswerCount}</span>
            </span>
          ) : null}
          {hasPublicCards ? (
            <span>
              公開FB{" "}
              <span className="font-semibold text-zinc-300">{feedbackCards.length}</span> 件
            </span>
          ) : null}
        </div>
      )}

      {hasAggregateContent ? (
        <div className={`${isTab ? "mt-5" : "mt-3"}`}>
          <h3 className="text-xs font-medium uppercase tracking-wide text-zinc-600">
            回答の傾向
          </h3>
          <ul className="mt-3 space-y-4">
            {promptsWithResponses.map((aggregate) => (
              <PromptAggregateCard
                key={aggregate.promptId}
                aggregate={aggregate}
                versionLabel={versionLabel}
              />
            ))}
          </ul>
        </div>
      ) : null}

      <div className={`${isTab ? "mt-8" : "mt-6"}`}>
        <h3 className="text-xs font-medium uppercase tracking-wide text-zinc-600">
          みんなのフィードバック
        </h3>
        <div className="mt-3">
          <PublicFeedbackCardsList
            key={`${gameId}:${version}:${refreshKey}`}
            cards={feedbackCards}
          />
        </div>
      </div>
    </section>
  );
}
