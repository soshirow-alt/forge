"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { MessageSquare } from "lucide-react";
import { DeveloperVoiceInsights } from "@/components/developer-voice-insights";
import { ModifyGameExplanationModal, shouldShowModifyGameModal } from "@/components/modify-game-explanation-modal";
import { NurtureDeepFeedbackSection } from "@/components/nurture-deep-feedback-section";
import { OwnerVoiceResponseList } from "@/components/owner-voice-response-list";
import { StudioTopPrioritiesPanel } from "@/components/studio-top-priorities-panel";
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
        かんたんFB {quickFbCount}件 · 詳しいFB {detailedFbCount}件 · v
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
}: {
  gameId: string;
  playableVersion: string;
  feedbackEntries: ProjectFeedbackEntry[];
  quickFbCount: number;
  detailPanelId: string;
  emphasize?: boolean;
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

  const helpfulMarks = getHelpfulMarksForProject(gameId);
  const helpfulCount = helpfulMarks.size;

  const detailedFb = useMemo(
    () => filterDeepFeedbackForVersion(feedbackEntries, playableVersion),
    [feedbackEntries, playableVersion],
  );
  const detailedFbCount = detailedFb.length;

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

  const tabs: { id: FeedbackTabId; label: string; count?: number }[] = [
    { id: "quick", label: "かんたんFB", count: quickFbCount },
    { id: "detailed", label: "詳しいFB", count: detailedFbCount },
    { id: "summary", label: "集計" },
  ];

  return (
    <section
      id={detailPanelId}
      aria-label="プレイヤーのFBを読む"
      className={`scroll-mt-24 rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 transition-shadow duration-300 sm:p-5 ${
        highlighted
          ? "ring-2 ring-violet-500/70 ring-offset-2 ring-offset-zinc-950"
          : ""
      }`}
    >
      <h2 className="text-sm font-semibold text-zinc-200">
        届いたFBを読む
        {helpfulCount > 0 && (
          <span className="ml-2 text-xs font-normal text-violet-300">
            役立った {helpfulCount}件
          </span>
        )}
      </h2>

      <div className="mt-4 flex flex-wrap gap-2 border-b border-zinc-800 pb-3">
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
        {tab === "quick" && (
          quickFbCount === 0 ? (
            <p className="text-sm text-zinc-500">このverのかんたんFBはまだありません。</p>
          ) : (
            <OwnerVoiceResponseList
              responses={voiceResponses}
              showToggle={false}
              helpfulMarks={helpfulMarks}
              onToggleHelpful={(sourceType, sourceId, marked) =>
                void toggleFeedbackHelpful(gameId, sourceType, sourceId, marked)
              }
            />
          )
        )}
        {tab === "detailed" && (
          detailedFbCount === 0 ? (
            <p className="text-sm text-zinc-500">このverの詳しいFBはまだありません。</p>
          ) : (
            <NurtureDeepFeedbackSection
              feedbackEntries={feedbackEntries}
              playableVersion={playableVersion}
              compact
              helpfulMarks={helpfulMarks}
              onToggleHelpful={(sourceType, sourceId, marked) =>
                void toggleFeedbackHelpful(gameId, sourceType, sourceId, marked)
              }
            />
          )
        )}
        {tab === "summary" && (
          <DeveloperVoiceInsights
            aggregates={voiceAggregates}
            versionKey={playableVersion}
          />
        )}
      </div>
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
            FBが届くと「次に直すこと」と「届いたFBを読む」が表示されます。
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
