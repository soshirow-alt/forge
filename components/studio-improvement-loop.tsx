"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { MessageSquare } from "lucide-react";
import { DeveloperVoiceInsights } from "@/components/developer-voice-insights";
import { ModifyGameExplanationModal, shouldShowModifyGameModal } from "@/components/modify-game-explanation-modal";
import { NurtureDeepFeedbackSection } from "@/components/nurture-deep-feedback-section";
import { OwnerVoiceResponseList } from "@/components/owner-voice-response-list";
import { StudioFreeOpinionsDetailModal } from "@/components/studio-free-opinions-detail-modal";
import { StudioQuestionAnswersDetailModal } from "@/components/studio-question-answers-detail-modal";
import { StudioTopPrioritiesPanel } from "@/components/studio-top-priorities-panel";
import { FeedbackStructuredCard } from "@/components/feedback-structured-card";
import { useGames } from "@/components/games-provider";
import { useNurtureVoiceRead } from "@/hooks/use-nurture-feedback-read";
import type { Game } from "@/lib/mock-games";
import {
  PROJECT_STUDIO_FEEDBACK_SECTION_ID,
  projectStudioDevlogHref,
} from "@/lib/project-nurture-links";
import {
  buildNurtureDisplayContext,
  filterDeepFeedbackForVersion,
  getStudioVisualMode,
  type ProjectGrowthSnapshot,
} from "@/lib/project-growth-state";
import type { OwnerVoiceResponseDetail } from "@/lib/supabase/voice-engagement";
import type { ProjectFeedbackEntry } from "@/lib/supabase/user-engagement";
import { buildVoicePromptAggregates } from "@/lib/voice-aggregates";

type FeedbackTabId = "quick" | "detailed" | "summary";

const FREE_OPINION_INLINE_MAX = 2;

const primaryButtonClassName =
  "inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-2 text-sm font-semibold text-zinc-950 transition-opacity hover:opacity-90";

function StudioStatusStrip({
  growth,
  display,
  quickFbCount,
  detailedFbCount,
  onPrimaryRead,
  onOpenModifyGameModal,
  hideReadCta,
}: {
  growth: ProjectGrowthSnapshot;
  display: ReturnType<typeof buildNurtureDisplayContext>;
  quickFbCount: number;
  detailedFbCount: number;
  onPrimaryRead: () => void;
  onOpenModifyGameModal: () => void;
  hideReadCta: boolean;
}) {
  const visualMode = getStudioVisualMode(growth);

  return (
    <section
      aria-label="いまの状態"
      className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-4 sm:px-5"
    >
      <p className="text-sm leading-relaxed text-zinc-300">{display.phaseGuidance}</p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {visualMode === "pre_cycle" ? null : display.primaryOpensReadPanel && !hideReadCta ? (
          <button type="button" onClick={onPrimaryRead} className={primaryButtonClassName}>
            届いたFBを読む
          </button>
        ) : display.primaryOpensModifyGameModal ? (
          <button type="button" onClick={onOpenModifyGameModal} className={primaryButtonClassName}>
            修正の進め方を見る
          </button>
        ) : display.primaryCta?.href && !display.primaryOpensReadPanel ? (
          <Link href={display.primaryCta.href} className={primaryButtonClassName}>
            {display.primaryCta.label}
          </Link>
        ) : null}
      </div>
      <p className="mt-3 text-xs text-zinc-600">
        質問への回答 {quickFbCount}件 · 自由な意見 {detailedFbCount}件 · v
        {growth.playableVersion}
      </p>
    </section>
  );
}

export function StudioPlayerFeedbackPanel({
  gameId,
  playableVersion,
  feedbackEntries,
  quickFbCount,
  detailPanelId,
  emphasize = false,
  embeddedInStudioPane = false,
  unreadVoiceCount = 0,
  totalFeedbackCount,
}: {
  gameId: string;
  playableVersion: string;
  feedbackEntries: ProjectFeedbackEntry[];
  quickFbCount: number;
  detailPanelId: string;
  emphasize?: boolean;
  embeddedInStudioPane?: boolean;
  unreadVoiceCount?: number;
  totalFeedbackCount?: number;
}) {
  const {
    getOwnerVoiceAggregates,
    getOwnerVoiceResponseDetails,
    loadHelpfulMarksForProject,
    getHelpfulMarksForProject,
    toggleFeedbackHelpful,
  } = useGames();
  const [tab, setTab] = useState<FeedbackTabId>("quick");
  const [highlighted, setHighlighted] = useState(false);
  const [questionDetailOpen, setQuestionDetailOpen] = useState(false);
  const [freeOpinionsDetailOpen, setFreeOpinionsDetailOpen] = useState(false);
  const [voiceAggregates, setVoiceAggregates] = useState(
    buildVoicePromptAggregates([]),
  );
  const [voiceResponses, setVoiceResponses] = useState<OwnerVoiceResponseDetail[]>(
    [],
  );

  useEffect(() => {
    if (!emphasize) {
      return;
    }
    setHighlighted(true);
    const timer = window.setTimeout(() => setHighlighted(false), 2000);
    return () => window.clearTimeout(timer);
  }, [emphasize]);

  useEffect(() => {
    void loadHelpfulMarksForProject(gameId);
  }, [gameId, loadHelpfulMarksForProject]);

  useEffect(() => {
    void getOwnerVoiceAggregates(gameId, playableVersion)
      .then((rows) => setVoiceAggregates(buildVoicePromptAggregates(rows)))
      .catch(() => setVoiceAggregates(buildVoicePromptAggregates([])));
  }, [gameId, playableVersion, getOwnerVoiceAggregates]);

  useEffect(() => {
    if (quickFbCount === 0) {
      setVoiceResponses([]);
      return;
    }
    void getOwnerVoiceResponseDetails(gameId, playableVersion)
      .then(setVoiceResponses)
      .catch(() => setVoiceResponses([]));
  }, [gameId, playableVersion, quickFbCount, getOwnerVoiceResponseDetails]);

  const helpfulMarks = getHelpfulMarksForProject(gameId);
  const helpfulCount = helpfulMarks.size;

  const detailedFb = useMemo(
    () => filterDeepFeedbackForVersion(feedbackEntries, playableVersion),
    [feedbackEntries, playableVersion],
  );
  const detailedFbCount = detailedFb.length;

  const promptsWithAnswers = useMemo(
    () => voiceAggregates.filter((item) => item.totalResponses > 0),
    [voiceAggregates],
  );
  const questionCount = promptsWithAnswers.length;

  const paneButtonClassName =
    "mt-3 w-full rounded-lg border border-orange-500/30 bg-orange-500/10 px-3 py-2.5 text-sm font-medium text-orange-200 transition-colors hover:border-orange-500/50 hover:bg-orange-500/15 disabled:cursor-not-allowed disabled:opacity-50";

  const tabs: { id: FeedbackTabId; label: string; count?: number }[] = embeddedInStudioPane
    ? [
        { id: "quick", label: "質問への回答", count: quickFbCount },
        { id: "detailed", label: "自由な意見", count: detailedFbCount },
      ]
    : [
        { id: "quick", label: "質問への回答", count: quickFbCount },
        { id: "detailed", label: "自由な意見", count: detailedFbCount },
        { id: "summary", label: "集計" },
      ];

  const feedbackTotal = totalFeedbackCount ?? quickFbCount + detailedFbCount;

  return (
    <section
      id={detailPanelId}
      aria-label={embeddedInStudioPane ? "届いたフィードバック" : "プレイヤーのFBを読む"}
      className={`scroll-mt-24 transition-shadow duration-300 ${
        embeddedInStudioPane
          ? highlighted
            ? "rounded-lg ring-2 ring-violet-500/70 ring-offset-2 ring-offset-zinc-950"
            : ""
          : `rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 sm:p-5 ${
              highlighted
                ? "ring-2 ring-violet-500/70 ring-offset-2 ring-offset-zinc-950"
                : ""
            }`
      }`}
    >
      {embeddedInStudioPane ? (
        <div>
          <h2 className="text-sm font-semibold text-zinc-200">届いたフィードバック</h2>
          <p className="mt-1 text-xs text-zinc-500">
            {unreadVoiceCount > 0 ? (
              <>
                <span className="font-medium text-orange-300">未確認 {unreadVoiceCount}件</span>
                <span className="text-zinc-600"> / </span>
              </>
            ) : null}
            <span>合計 {feedbackTotal}件</span>
          </p>
        </div>
      ) : (
        <h2 className="text-sm font-semibold text-zinc-200">
          届いたFBを読む
          {helpfulCount > 0 && (
            <span className="ml-2 text-xs font-normal text-violet-300">
              役立った {helpfulCount}件
            </span>
          )}
        </h2>
      )}

      <div
        className={`flex flex-wrap gap-2 border-b border-zinc-800 pb-3 ${
          embeddedInStudioPane ? "mt-3" : "mt-4"
        }`}
      >
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              tab === item.id
                ? "bg-orange-500/15 text-orange-300 ring-1 ring-orange-500/30"
                : "text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"
            }`}
          >
            {item.label}
            {item.count !== undefined ? ` (${item.count})` : ""}
          </button>
        ))}
      </div>

      <div className="mt-4">
        {tab === "quick" &&
          (quickFbCount === 0 ? (
            <p className="text-sm text-zinc-500">
              このverの質問への回答はまだありません。
            </p>
          ) : embeddedInStudioPane ? (
            <div>
              <p className="text-sm font-medium text-zinc-200">質問への回答</p>
              <p className="mt-1 text-xs text-zinc-500">
                合計 {quickFbCount}件 / 質問 {questionCount}件
                {unreadVoiceCount > 0 ? (
                  <span className="text-orange-300"> · 未確認 {unreadVoiceCount}件</span>
                ) : null}
              </p>
              <p className="mt-2 text-xs leading-relaxed text-zinc-600">
                開発者が設定した質問への回答を集計して確認できます。
              </p>
              <button
                type="button"
                onClick={() => setQuestionDetailOpen(true)}
                className={paneButtonClassName}
              >
                回答を詳しく見る
              </button>
            </div>
          ) : (
            <OwnerVoiceResponseList
              responses={voiceResponses}
              showToggle={false}
              helpfulMarks={helpfulMarks}
              onToggleHelpful={(sourceType, sourceId, marked) =>
                void toggleFeedbackHelpful(gameId, sourceType, sourceId, marked)
              }
            />
          ))}

        {tab === "detailed" &&
          (detailedFbCount === 0 ? (
            <div className="space-y-1">
              <p className="text-sm text-zinc-500">まだ自由な意見はありません。</p>
              <p className="text-xs leading-relaxed text-zinc-600">
                プレイヤーから任意で届いた感想・不具合報告などがここに表示されます。
              </p>
            </div>
          ) : embeddedInStudioPane && detailedFbCount > FREE_OPINION_INLINE_MAX ? (
            <div>
              <p className="text-sm font-medium text-zinc-200">自由な意見</p>
              <p className="mt-1 text-xs text-zinc-500">{detailedFbCount}件</p>
              <ul className="mt-3 space-y-2">
                {detailedFb.slice(0, FREE_OPINION_INLINE_MAX).map(({ item }) => (
                  <li
                    key={item.id}
                    className="rounded-lg border border-zinc-800/60 bg-zinc-950/40 px-3 py-2"
                  >
                    <FeedbackStructuredCard item={item} compact showDate={false} />
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={() => setFreeOpinionsDetailOpen(true)}
                className={paneButtonClassName}
              >
                自由な意見を見る
              </button>
            </div>
          ) : (
            <NurtureDeepFeedbackSection
              feedbackEntries={feedbackEntries}
              playableVersion={playableVersion}
              compact
              studioPane={embeddedInStudioPane}
              helpfulMarks={helpfulMarks}
              onToggleHelpful={(sourceType, sourceId, marked) =>
                void toggleFeedbackHelpful(gameId, sourceType, sourceId, marked)
              }
            />
          ))}

        {!embeddedInStudioPane && tab === "summary" && (
          <DeveloperVoiceInsights
            aggregates={voiceAggregates}
            versionKey={playableVersion}
          />
        )}
      </div>

      {embeddedInStudioPane ? (
        <>
          <StudioQuestionAnswersDetailModal
            open={questionDetailOpen}
            onClose={() => setQuestionDetailOpen(false)}
            playableVersion={playableVersion}
            aggregates={voiceAggregates}
            responses={voiceResponses}
          />
          <StudioFreeOpinionsDetailModal
            open={freeOpinionsDetailOpen}
            onClose={() => setFreeOpinionsDetailOpen(false)}
            playableVersion={playableVersion}
            feedbackEntries={feedbackEntries}
            helpfulMarks={helpfulMarks}
            onToggleHelpful={(sourceType, sourceId, marked) =>
              void toggleFeedbackHelpful(gameId, sourceType, sourceId, marked)
            }
          />
        </>
      ) : null}
    </section>
  );
}

export function StudioImprovementLoop({
  game,
  growth,
  feedbackEntries,
  detailPanelId = PROJECT_STUDIO_FEEDBACK_SECTION_ID,
  initialOpenFeedback = false,
}: {
  game: Game;
  growth: ProjectGrowthSnapshot;
  feedbackEntries: ProjectFeedbackEntry[];
  detailPanelId?: string;
  initialOpenFeedback?: boolean;
}) {
  const versionKey = growth.playableVersion;
  const { isRead: voiceRead, markRead } = useNurtureVoiceRead(game.id, versionKey);
  const [modifyModalOpen, setModifyModalOpen] = useState(false);

  const display = useMemo(
    () => buildNurtureDisplayContext(growth, voiceRead, game.id),
    [growth, voiceRead, game.id],
  );

  const quickFbCount = growth.totalVoiceResponseCount;
  const detailedFbCount = useMemo(
    () => filterDeepFeedbackForVersion(feedbackEntries, versionKey).length,
    [feedbackEntries, versionKey],
  );
  const showWorkPanels =
    getStudioVisualMode(growth) !== "pre_cycle" &&
    (quickFbCount > 0 || detailedFbCount > 0);

  const handlePrimaryRead = useCallback(() => {
    void markRead();
    document.getElementById(detailPanelId)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, [detailPanelId, markRead]);

  const handleOpenModifyGameModal = useCallback(() => {
    if (shouldShowModifyGameModal()) {
      setModifyModalOpen(true);
    }
  }, []);

  return (
    <div className="space-y-6">
      <StudioStatusStrip
        growth={growth}
        display={display}
        quickFbCount={quickFbCount}
        detailedFbCount={detailedFbCount}
        onPrimaryRead={handlePrimaryRead}
        onOpenModifyGameModal={handleOpenModifyGameModal}
        hideReadCta={showWorkPanels}
      />

      {showWorkPanels ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <StudioTopPrioritiesPanel
            projectId={game.id}
            growth={growth}
            feedbackEntries={feedbackEntries}
            voiceRead={voiceRead}
            embedded
          />
          <StudioPlayerFeedbackPanel
            gameId={game.id}
            playableVersion={versionKey}
            feedbackEntries={feedbackEntries}
            quickFbCount={quickFbCount}
            detailPanelId={detailPanelId}
            emphasize={initialOpenFeedback}
          />
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-zinc-800 bg-zinc-950/20 px-5 py-8 text-center">
          <MessageSquare className="mx-auto size-8 text-zinc-600" aria-hidden="true" />
          <p className="mt-2 text-sm font-medium text-zinc-400">まだプレイヤーFBがありません</p>
          <p className="mt-1 text-xs text-zinc-500">
            FBが届くと「フィードバックの傾向」と届いたフィードバックが表示されます。
          </p>
        </div>
      )}

      <ModifyGameExplanationModal
        open={modifyModalOpen}
        onClose={() => setModifyModalOpen(false)}
      />
    </div>
  );
}
