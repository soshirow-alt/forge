"use client";

import { useEffect, useMemo, useState } from "react";
import { FeedbackStructuredCard } from "@/components/feedback-structured-card";
import { useGames } from "@/components/games-provider";
import { getDemoCommunityData } from "@/lib/demo-community";
import type { GameFeedbackItem } from "@/lib/game-feedback-storage";

type GameCommunityVoicesSectionProps = {
  gameId: string;
};

const DETAIL_FEEDBACK_LIMIT = 3;

export function GameCommunityVoicesSection({
  gameId,
}: GameCommunityVoicesSectionProps) {
  const { getProjectFeedback } = useGames();
  const [storedFeedback, setStoredFeedback] = useState<GameFeedbackItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const demo = getDemoCommunityData(gameId);

  useEffect(() => {
    void getProjectFeedback(gameId)
      .then((items) => {
        setStoredFeedback(items);
      })
      .catch(() => {
        setStoredFeedback([]);
      })
      .finally(() => {
        setLoaded(true);
      });
  }, [gameId, getProjectFeedback]);

  const visibleFeedback = useMemo(
    () => storedFeedback.slice(0, DETAIL_FEEDBACK_LIMIT),
    [storedFeedback],
  );

  const sampleComments = useMemo(() => {
    if (!demo || storedFeedback.length > 0) {
      return [];
    }
    return demo.communityComments.slice(0, 2);
  }, [demo, storedFeedback.length]);

  if (!loaded) {
    return (
      <section className="mt-4 border-t border-zinc-800/80 pt-4">
        <h2 className="text-sm font-medium text-zinc-500">プレイヤーからの改善材料</h2>
        <p className="mt-2 text-sm text-zinc-600">読み込み中...</p>
      </section>
    );
  }

  if (storedFeedback.length === 0 && sampleComments.length === 0) {
    return (
      <section className="mt-4 border-t border-zinc-800/80 pt-4">
        <h2 className="text-sm font-medium text-zinc-500">プレイヤーからの改善材料</h2>
        <p className="mt-1 text-xs text-zinc-600">
          プレイ後に届いた感想が、開発の参考になります
        </p>
        <p className="mt-2 text-sm text-zinc-600">まだフィードバックはありません</p>
      </section>
    );
  }

  return (
    <section className="mt-4 border-t border-zinc-800/80 pt-4">
      <h2 className="text-sm font-medium text-zinc-500">プレイヤーからの改善材料</h2>
      <p className="mt-1 text-xs text-zinc-600">
        レビューではなく、開発者への改善ヒントとして届いています
      </p>

      {storedFeedback.length > 0 ? (
        <ul className="mt-3 space-y-2.5">
          {visibleFeedback.map((item) => (
            <li
              key={item.id}
              className="rounded-lg border border-zinc-800/60 bg-zinc-950/30 px-3 py-2.5"
            >
              <FeedbackStructuredCard item={item} />
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-3 space-y-2">
          <p className="text-[11px] text-zinc-600">（サンプル表示）</p>
          {sampleComments.map((comment) => (
            <div
              key={comment.id}
              className="rounded-lg border border-dashed border-zinc-800/80 bg-zinc-950/20 px-3 py-2.5"
            >
              <time
                dateTime={comment.date}
                className="text-xs tabular-nums text-zinc-600"
              >
                {comment.date}
              </time>
              <p className="mt-1 text-sm leading-relaxed text-zinc-500">
                {comment.text}
              </p>
            </div>
          ))}
        </div>
      )}

      {storedFeedback.length > DETAIL_FEEDBACK_LIMIT && (
        <p className="mt-2 text-xs text-zinc-600">
          ほか {storedFeedback.length - DETAIL_FEEDBACK_LIMIT} 件のフィードバックがあります
        </p>
      )}
    </section>
  );
}
