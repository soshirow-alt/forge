"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { PublicFeedbackCardView } from "@/components/public-feedback-card";
import { VoiceAggregateBars } from "@/components/voice-aggregate-bars";
import { useAuth } from "@/components/auth-provider";
import { useGames } from "@/components/games-provider";
import type { PublicFeedbackCard } from "@/lib/public-feedback-cards";
import {
  formatPlayableVersionLabel,
  resolvePlayableVersion,
} from "@/lib/playable-version";
import {
  buildVoicePromptAggregates,
  type PublicVoiceAggregateRow,
  type VoicePromptAggregate,
} from "@/lib/voice-aggregates";
import { isFreeTextResponseKind } from "@/lib/version-prompt-types";
import { getOptionalSupabaseClient } from "@/lib/supabase/client";
import { markProjectPublicFeedbackSeen } from "@/lib/supabase/project-feedback-owner-reads-db";

const INITIAL_CARD_COUNT = 3;
const ALL_FILTER_AGGREGATE_PREVIEW = 3;

type VersionFilter = "all" | string;

type VersionedVoicePromptAggregate = VoicePromptAggregate & {
  versionKey: string;
};

type EveryonesVoiceSectionProps = {
  gameId: string;
  playableVersion?: string;
  /** embedded = 旧来の区切り線付き。tab = ゲーム詳細タブ用カード */
  variant?: "embedded" | "tab";
  refreshKey?: number;
  onSendVoice?: () => void;
};

function versionFilterLabel(filter: VersionFilter): string {
  if (filter === "all") {
    return "すべて";
  }
  return formatPlayableVersionLabel(filter);
}

function PromptAggregateCard({
  aggregate,
}: {
  aggregate: VersionedVoicePromptAggregate;
}) {
  const { promptText, totalResponses, responseKind, versionKey } = aggregate;
  const versionLabel = formatPlayableVersionLabel(versionKey);

  if (isFreeTextResponseKind(responseKind)) {
    return (
      <li className="rounded-xl border border-zinc-800/90 bg-zinc-950/50 px-4 py-4 sm:px-5 sm:py-5">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h4 className="text-sm font-semibold text-zinc-100">{promptText}</h4>
          <span className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">
            {versionLabel}
          </span>
        </div>
        <p className="mt-3 text-sm text-zinc-400">
          自由記述{" "}
          <span className="font-semibold text-zinc-100">{totalResponses}</span> 件
        </p>
        <p className="mt-2 text-xs leading-relaxed text-zinc-600">
          文章として読める内容は、下の一覧に表示されます。
        </p>
      </li>
    );
  }

  return (
    <li className="rounded-xl border border-zinc-800/90 bg-zinc-950/50 px-4 py-4 sm:px-5 sm:py-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h4 className="text-sm font-semibold text-zinc-100">{promptText}</h4>
        <span className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">
          {versionLabel}
        </span>
      </div>
      <p className="mt-2 text-xs text-zinc-500">
        回答 <span className="font-semibold text-zinc-300">{totalResponses}</span> 件
      </p>
      <div className="mt-4">
        <VoiceAggregateBars aggregate={aggregate} variant="public" />
      </div>
    </li>
  );
}

function VersionFilterBar({
  availableVersions,
  versionCounts,
  allCount,
  value,
  onChange,
}: {
  availableVersions: string[];
  versionCounts: Record<string, number>;
  allCount: number;
  value: VersionFilter;
  onChange: (next: VersionFilter) => void;
}) {
  const options: VersionFilter[] = ["all", ...availableVersions];

  return (
    <div
      className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1"
      role="group"
      aria-label="フィードバックのバージョン絞り込み"
    >
      {options.map((option) => {
        const selected = value === option;
        const count = option === "all" ? allCount : (versionCounts[option] ?? 0);
        return (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            aria-pressed={selected}
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
              selected
                ? "border-violet-500/40 bg-violet-500/10 text-violet-200"
                : count === 0
                  ? "border-zinc-800/70 bg-zinc-950/40 text-zinc-600 hover:text-zinc-400"
                  : "border-zinc-700/80 bg-zinc-900/60 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200"
            }`}
          >
            <span>{versionFilterLabel(option)}</span>
            <span className="tabular-nums text-[10px] opacity-75">{count}</span>
          </button>
        );
      })}
    </div>
  );
}

function PublicFeedbackCardsList({
  cards,
  totalCount,
  projectId,
  selectedVersion,
  selectedVersionHasFeedback,
  onShowAll,
}: {
  cards: PublicFeedbackCard[];
  totalCount: number;
  projectId: string;
  selectedVersion: string | null;
  selectedVersionHasFeedback: boolean;
  onShowAll: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const visibleCards = expanded ? cards : cards.slice(0, INITIAL_CARD_COUNT);
  const hasMore = cards.length > INITIAL_CARD_COUNT;

  if (cards.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-800 bg-zinc-950/20 px-4 py-8 text-center">
        <p className="text-sm text-zinc-500">
          {selectedVersion && !selectedVersionHasFeedback
            ? `${formatPlayableVersionLabel(selectedVersion)}にはまだフィードバックがありません`
            : "個別表示できるフィードバックはありません"}
        </p>
        {selectedVersion && !selectedVersionHasFeedback ? (
          <button
            type="button"
            onClick={onShowAll}
            className="mt-4 text-xs font-medium text-violet-400 transition-colors hover:text-violet-300"
          >
            すべてのフィードバックを見る
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <div>
      <ul className="space-y-4">
        {visibleCards.map((card) => (
          <PublicFeedbackCardView key={card.cardId} card={card} projectId={projectId} />
        ))}
      </ul>
      {hasMore && !expanded ? (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="mt-4 text-xs font-medium text-violet-400/90 transition-colors hover:text-violet-300"
        >
          すべて見る（{totalCount}件）
        </button>
      ) : null}
    </div>
  );
}

function buildVersionedAggregates(
  rows: PublicVoiceAggregateRow[],
  versionKey: string,
): VersionedVoicePromptAggregate[] {
  return buildVoicePromptAggregates(rows).map((aggregate) => ({
    ...aggregate,
    versionKey,
  }));
}

export function EveryonesVoiceSection({
  gameId,
  playableVersion,
  variant = "embedded",
  refreshKey = 0,
  onSendVoice,
}: EveryonesVoiceSectionProps) {
  const { user } = useAuth();
  const { getGameById, getPublicFeedbackCards } = useGames();
  const game = getGameById(gameId);
  const latestVersion = resolvePlayableVersion(playableVersion ?? game?.playableVersion);
  const [loaded, setLoaded] = useState(false);
  const [versionFilter, setVersionFilter] = useState<VersionFilter>("all");
  const [aggregatesExpanded, setAggregatesExpanded] = useState(false);
  const markedSeenForFetchRef = useRef<string | null>(null);

  const isOwner = Boolean(user && game?.ownerId && game.ownerId === user.id);
  const isTab = variant === "tab";

  function handleVersionFilterChange(next: VersionFilter) {
    setVersionFilter(next);
    setAggregatesExpanded(false);
  }
  const [availableVersions, setAvailableVersions] = useState<string[]>([]);
  const [aggregates, setAggregates] = useState<VersionedVoicePromptAggregate[]>([]);
  const [feedbackCards, setFeedbackCards] = useState<PublicFeedbackCard[]>([]);
  const [participantCount, setParticipantCount] = useState(0);
  const [versionCounts, setVersionCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const cardsResult = await getPublicFeedbackCards(gameId, "all", { limit: 100 });
        if (cancelled) {
          return;
        }

        setFeedbackCards(cardsResult.cards);
        setParticipantCount(cardsResult.participantCount);
        setVersionCounts(cardsResult.versionCounts);
        const versions =
          cardsResult.availableVersions.length > 0
            ? cardsResult.availableVersions
            : [latestVersion];
        setAvailableVersions(versions);
        setAggregates(
          versions.flatMap((version) =>
            buildVersionedAggregates(
              cardsResult.aggregatesByVersion[version] ?? [],
              version,
            ),
          ),
        );

        if (isTab && isOwner) {
          const fetchKey = `${gameId}:${refreshKey}:all`;
          if (markedSeenForFetchRef.current !== fetchKey) {
            markedSeenForFetchRef.current = fetchKey;
            const supabase = getOptionalSupabaseClient();
            if (supabase) {
              void markProjectPublicFeedbackSeen(supabase, gameId).catch(() => {
                markedSeenForFetchRef.current = null;
              });
            }
          }
        }
      } catch {
        if (!cancelled) {
          setAggregates([]);
          setFeedbackCards([]);
          setParticipantCount(0);
          setVersionCounts({});
        }
      } finally {
        if (!cancelled) {
          setLoaded(true);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [
    gameId,
    latestVersion,
    refreshKey,
    getPublicFeedbackCards,
    isTab,
    isOwner,
  ]);

  const filteredCards = useMemo(
    () =>
      versionFilter === "all"
        ? feedbackCards
        : feedbackCards.filter((card) => card.versionKey === versionFilter),
    [feedbackCards, versionFilter],
  );

  const filteredAggregates = useMemo(
    () =>
      versionFilter === "all"
        ? aggregates
        : aggregates.filter((aggregate) => aggregate.versionKey === versionFilter),
    [aggregates, versionFilter],
  );

  const promptsWithResponses = useMemo(
    () => filteredAggregates.filter((item) => item.totalResponses > 0),
    [filteredAggregates],
  );

  const visibleAggregates = useMemo(() => {
    if (versionFilter !== "all" || aggregatesExpanded) {
      return promptsWithResponses;
    }

    return [...promptsWithResponses]
      .sort((a, b) => b.totalResponses - a.totalResponses)
      .slice(0, ALL_FILTER_AGGREGATE_PREVIEW);
  }, [aggregatesExpanded, promptsWithResponses, versionFilter]);

  const totalAnswerCount = useMemo(
    () => promptsWithResponses.reduce((sum, item) => sum + item.totalResponses, 0),
    [promptsWithResponses],
  );

  /** 通算公開FB件数 — 登録ユーザー1人あたり1件（カード行数ではない） */
  const publicFeedbackCount = participantCount;

  const activeVersionLabel =
    versionFilter === "all"
        ? "すべてのバージョン"
        : formatPlayableVersionLabel(versionFilter);

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
        {versionFilter === "all"
          ? "全バージョンの回答を集計"
          : `${activeVersionLabel}の回答を集計`}
      </p>
      <div className={`${isTab ? "mt-4" : "mt-3"}`}>
        <VersionFilterBar
          availableVersions={
            availableVersions.length > 0 ? availableVersions : [latestVersion]
          }
          versionCounts={versionCounts}
          allCount={participantCount}
          value={versionFilter}
          onChange={handleVersionFilterChange}
        />
      </div>
    </>
  );

  const hasAggregateContent = promptsWithResponses.length > 0;
  const hasPublicCards = filteredCards.length > 0;
  const hasAnyContent = hasAggregateContent || hasPublicCards;

  if (!hasAnyContent && versionFilter === "all") {
    return (
      <section className={sectionClassName}>
        {header}
        <div
          className={`${isTab ? "mt-6" : "mt-3"} rounded-xl border border-dashed border-zinc-800 bg-zinc-950/20 px-4 py-8 text-center`}
        >
          <p className="text-sm text-zinc-400">まだフィードバックが集まりはじめたところです</p>
          <p className="mt-2 text-xs leading-relaxed text-zinc-600">
            プレイ後、開発者の質問に答えると、ここに反応の傾向が表示されます。
          </p>
          {onSendVoice ? (
            <button
              type="button"
              onClick={onSendVoice}
              className="mt-5 inline-flex items-center justify-center rounded-xl border border-zinc-700 bg-zinc-900/60 px-5 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:border-violet-500/40 hover:text-violet-200"
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

      {(totalAnswerCount > 0 || publicFeedbackCount > 0) && (
        <div
          className={`${isTab ? "mt-4" : "mt-3"} flex flex-wrap gap-x-4 gap-y-1 rounded-lg border border-zinc-800/60 bg-zinc-950/30 px-3 py-2 text-xs text-zinc-500`}
        >
          <span>
            表示中{" "}
            <span className="font-semibold text-zinc-300">{activeVersionLabel}</span>
          </span>
          {(versionFilter === "all"
            ? publicFeedbackCount
            : (versionCounts[versionFilter] ?? 0)) > 0 ? (
            <span>
              公開FB{" "}
              <span className="font-semibold text-zinc-300">
                {versionFilter === "all"
                  ? publicFeedbackCount
                  : (versionCounts[versionFilter] ?? 0)}
              </span>{" "}
              件
            </span>
          ) : null}
        </div>
      )}

      {hasAggregateContent ? (
        <div
          className={`${isTab ? "mt-6" : "mt-5"} rounded-xl border border-zinc-800/70 bg-zinc-950/35 p-4 sm:p-5`}
        >
          <div className="border-b border-zinc-800/70 pb-3">
            <h3 className="text-sm font-semibold text-zinc-100">回答の傾向</h3>
            <p className="mt-1 text-xs text-zinc-500">選択式回答の集計</p>
          </div>
          <ul className="mt-4 space-y-4">
            {visibleAggregates.map((aggregate) => (
              <PromptAggregateCard
                key={`${aggregate.versionKey}:${aggregate.promptId}`}
                aggregate={aggregate}
              />
            ))}
          </ul>
          {versionFilter === "all" &&
          promptsWithResponses.length > ALL_FILTER_AGGREGATE_PREVIEW &&
          !aggregatesExpanded ? (
            <button
              type="button"
              onClick={() => setAggregatesExpanded(true)}
              className="mt-4 text-xs font-medium text-violet-400/90 transition-colors hover:text-violet-300"
            >
              もっと見る（{promptsWithResponses.length}問）
            </button>
          ) : null}
        </div>
      ) : null}

      <div
        className={`${isTab ? "mt-8" : "mt-6"} rounded-xl border border-zinc-800/70 bg-zinc-950/20 p-4 sm:p-5`}
      >
        <div className="border-b border-zinc-800/70 pb-3">
          <h3 className="text-sm font-semibold text-zinc-100">個別のフィードバック</h3>
          <p className="mt-1 text-xs text-zinc-500">ひと言コメント・自由記述・詳しい感想</p>
        </div>
        <div className="mt-4">
          <PublicFeedbackCardsList
            key={`${gameId}:${versionFilter}:${refreshKey}`}
            cards={filteredCards}
            totalCount={filteredCards.length}
            projectId={gameId}
            selectedVersion={versionFilter === "all" ? null : versionFilter}
            selectedVersionHasFeedback={
              versionFilter !== "all" && (versionCounts[versionFilter] ?? 0) > 0
            }
            onShowAll={() => handleVersionFilterChange("all")}
          />
        </div>
      </div>
    </section>
  );
}
