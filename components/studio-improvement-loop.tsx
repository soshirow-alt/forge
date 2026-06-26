"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Check,
  ChevronDown,
  ClipboardList,
  Copy,
  ExternalLink,
  Lightbulb,
  MessageSquare,
  RefreshCw,
  Upload,
  Wrench,
} from "lucide-react";
import { DeveloperVoiceInsights } from "@/components/developer-voice-insights";
import { ModifyGameExplanationModal, shouldShowModifyGameModal } from "@/components/modify-game-explanation-modal";
import { NurtureDeepFeedbackSection } from "@/components/nurture-deep-feedback-section";
import { OwnerVoiceResponseList } from "@/components/owner-voice-response-list";
import { StudioTopPrioritiesPanel } from "@/components/studio-top-priorities-panel";
import { useGames } from "@/components/games-provider";
import { useNurtureVoiceRead } from "@/hooks/use-nurture-feedback-read";
import {
  IMPROVEMENT_LOOP_STEPS,
  getActiveImprovementLoopStepId,
  getImprovementLoopStepStates,
  type ImprovementLoopStepId,
} from "@/lib/improvement-loop-steps";
import type { Game } from "@/lib/mock-games";
import { getProjectNurtureActions } from "@/lib/project-nurture-links";
import {
  PROJECT_STUDIO_FEEDBACK_SECTION_ID,
  gamePlayHref,
} from "@/lib/project-nurture-links";
import {
  buildNurtureDisplayContext,
  filterDeepFeedbackForVersion,
  getStudioActionHeadline,
  getStudioVisualMode,
  type ProjectGrowthSnapshot,
} from "@/lib/project-growth-state";
import type { OwnerVoiceResponseDetail } from "@/lib/supabase/voice-engagement";
import type { ProjectFeedbackEntry } from "@/lib/supabase/user-engagement";
import { buildVoicePromptAggregates } from "@/lib/voice-aggregates";

type FeedbackTabId = "quick" | "detailed" | "summary";

const primaryButtonClassName =
  "inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 px-5 py-2.5 text-sm font-semibold text-zinc-950 transition-opacity hover:opacity-90";

const secondaryButtonClassName =
  "inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-zinc-700 px-4 py-2.5 text-sm font-medium text-zinc-200 transition-colors hover:border-orange-500/40 hover:text-orange-300";

function stepIcon(id: ImprovementLoopStepId) {
  switch (id) {
    case "collect":
      return MessageSquare;
    case "decide":
      return ClipboardList;
    case "improve":
      return Wrench;
    case "publish":
      return Upload;
    case "wait":
      return RefreshCw;
  }
}

function CopyGamePageUrlButton({ gameId }: { gameId: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    const path = gamePlayHref(gameId);
    const url =
      typeof window !== "undefined" ? `${window.location.origin}${path}` : path;

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  }, [gameId]);

  return (
    <button type="button" onClick={() => void handleCopy()} className={secondaryButtonClassName}>
      {copied ? (
        <>
          <Check className="size-4" aria-hidden="true" />
          URLをコピーしました
        </>
      ) : (
        <>
          <Copy className="size-4" aria-hidden="true" />
          ページURLをコピー
        </>
      )}
    </button>
  );
}

function LoopStepper({
  stepStates,
}: {
  stepStates: ReturnType<typeof getImprovementLoopStepStates>;
}) {
  return (
    <section
      aria-label="改善ループの進行状況"
      className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 sm:p-5"
    >
      <h2 className="text-sm font-semibold text-zinc-200">改善ループの進行状況</h2>
      <ol className="mt-4 grid gap-2 sm:grid-cols-5">
        {IMPROVEMENT_LOOP_STEPS.map((step, index) => {
          const state = stepStates[index];
          const Icon = stepIcon(step.id);
          const isCurrent = state === "current";
          const isDone = state === "done";

          return (
            <li
              key={step.id}
              className={`rounded-lg border px-3 py-3 ${
                isCurrent
                  ? "border-orange-500/50 bg-orange-500/5 ring-1 ring-orange-500/20"
                  : isDone
                    ? "border-zinc-800 bg-zinc-950/30"
                    : "border-zinc-800/80 bg-zinc-950/20 opacity-70"
              }`}
            >
              <div className="flex items-start gap-2">
                <span
                  className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${
                    isCurrent
                      ? "bg-orange-500/15 text-orange-300"
                      : isDone
                        ? "bg-emerald-500/10 text-emerald-400"
                        : "bg-zinc-800 text-zinc-500"
                  }`}
                >
                  {isDone ? (
                    <Check className="size-4" aria-hidden="true" />
                  ) : (
                    <Icon className="size-4" aria-hidden="true" />
                  )}
                </span>
                <div className="min-w-0">
                  <p className="text-[10px] font-medium text-zinc-500">{step.number}</p>
                  <p
                    className={`text-xs font-semibold leading-snug ${
                      isCurrent ? "text-orange-200" : "text-zinc-300"
                    }`}
                  >
                    {step.label}
                  </p>
                  <p className="mt-0.5 hidden text-[10px] leading-tight text-zinc-500 sm:block">
                    {step.sublabel}
                  </p>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function CurrentStepPanel({
  game,
  growth,
  display,
  activeStepId,
  quickFbCount,
  detailedFbCount,
  onPrimaryRead,
  onOpenModifyGameModal,
}: {
  game: Game;
  growth: ProjectGrowthSnapshot;
  display: ReturnType<typeof buildNurtureDisplayContext>;
  activeStepId: ImprovementLoopStepId;
  quickFbCount: number;
  detailedFbCount: number;
  onPrimaryRead: () => void;
  onOpenModifyGameModal: () => void;
}) {
  const visualMode = getStudioVisualMode(growth);
  const activeStep = IMPROVEMENT_LOOP_STEPS.find((step) => step.id === activeStepId);
  const headline = getStudioActionHeadline(display, growth);
  const StepIcon = stepIcon(activeStepId);

  const stepTitle =
    activeStepId === "collect"
      ? visualMode === "pre_cycle"
        ? "プレイヤーFBを集めています"
        : "プレイヤーFBを確認しています"
      : activeStepId === "decide"
        ? "次に直すことを決めましょう"
        : activeStepId === "improve"
          ? "ゲームを改善・修正しましょう"
          : activeStepId === "publish"
            ? "変更を記録して公開しましょう"
            : "次のプレイヤーFBを待っています";

  const stepDescription =
    activeStepId === "collect"
      ? "かんたんFBと詳しいFBが届くと、改善のヒントが見えてきます。"
      : activeStepId === "decide"
        ? "下の「次に直すこと」を見て、優先順位を決めましょう。"
        : activeStepId === "improve"
          ? "Forge外でゲームを直し、終わったら変更を記録します。"
          : activeStepId === "publish"
            ? "Devlogを書いて、プレイ可能verを公開しましょう。"
            : "このverのループは一通り完了です。新しいFBが届いたら再開します。";

  return (
    <section
      aria-label="現在の工程"
      className="rounded-xl border border-orange-500/30 bg-gradient-to-b from-orange-500/5 to-zinc-900/40 p-5 sm:p-6"
    >
      <div className="grid gap-5 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <div className="flex items-start gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-orange-500/10 text-orange-300 ring-1 ring-orange-500/25">
              <StepIcon className="size-5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-xs font-medium text-orange-400/90">現在の工程</p>
              <h3 className="mt-1 text-lg font-bold text-zinc-50">{stepTitle}</h3>
              <p className="mt-1 text-sm text-zinc-500">{stepDescription}</p>
            </div>
          </div>

          <div className="mt-5">
            <p className="text-xs font-medium text-zinc-500">今やるべきこと</p>
            <p className="mt-1 text-sm font-medium text-zinc-200">{headline}</p>
            {visualMode === "pre_cycle" && (
              <p className="mt-1 text-xs text-zinc-500">
                プレイヤー向けページのURLを配布して、FBを集めましょう。
              </p>
            )}
            <div className="mt-4 flex flex-wrap gap-2">
              {display.primaryOpensReadPanel ? (
                <button type="button" onClick={onPrimaryRead} className={primaryButtonClassName}>
                  {display.primaryCta?.label ?? "FBを見る"}
                </button>
              ) : display.primaryOpensModifyGameModal ? (
                <button
                  type="button"
                  onClick={onOpenModifyGameModal}
                  className={primaryButtonClassName}
                >
                  {display.primaryCta?.label ?? "修正の進め方を見る"}
                </button>
              ) : display.primaryCta?.href ? (
                <Link href={display.primaryCta.href} className={primaryButtonClassName}>
                  {display.primaryCta.label}
                  {activeStepId === "collect" && (
                    <ExternalLink className="size-4" aria-hidden="true" />
                  )}
                </Link>
              ) : null}
              {visualMode === "pre_cycle" && <CopyGamePageUrlButton gameId={game.id} />}
              {display.secondaryCta?.href && (
                <Link href={display.secondaryCta.href} className={secondaryButtonClassName}>
                  {display.secondaryCta.label}
                </Link>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-zinc-800/80 bg-zinc-950/30 p-4">
          <p className="text-xs font-medium text-zinc-500">この工程の現状</p>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex items-center justify-between gap-2">
              <dt className="text-zinc-400">かんたんFB</dt>
              <dd className="font-medium text-zinc-200">{quickFbCount}件</dd>
            </div>
            <div className="flex items-center justify-between gap-2">
              <dt className="text-zinc-400">詳しいFB</dt>
              <dd className="font-medium text-zinc-200">{detailedFbCount}件</dd>
            </div>
            {activeStep && (
              <div className="flex items-center justify-between gap-2 border-t border-zinc-800/60 pt-2">
                <dt className="text-zinc-500">工程</dt>
                <dd className="text-xs text-zinc-400">{activeStep.label}</dd>
              </div>
            )}
          </dl>
        </div>

        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4">
          <div className="flex items-start gap-2">
            <Lightbulb className="mt-0.5 size-4 shrink-0 text-emerald-400" aria-hidden="true" />
            <div>
              <p className="text-xs font-medium text-emerald-300/90">ヒント</p>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                {visualMode === "pre_cycle"
                  ? "まずはプレイヤーにURLを渡して、FBが届くのを待ちましょう。数件届くと次に直すことが見え始めます。"
                  : activeStepId === "decide"
                    ? "「次に直すこと」の上位3件を手がかりに、直す順番を決めましょう。"
                    : "FBは改善の材料です。かんたんFBで傾向を、詳しいFBで具体例を確認できます。"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function StudioPlayerFeedbackPanel({
  gameId,
  playableVersion,
  feedbackEntries,
  quickFbCount,
  detailPanelId,
}: {
  gameId: string;
  playableVersion: string;
  feedbackEntries: ProjectFeedbackEntry[];
  quickFbCount: number;
  detailPanelId: string;
}) {
  const {
    getOwnerVoiceAggregates,
    getOwnerVoiceResponseDetails,
    loadHelpfulMarksForProject,
    getHelpfulMarksForProject,
    toggleFeedbackHelpful,
  } = useGames();
  const [tab, setTab] = useState<FeedbackTabId>("quick");
  const [voiceAggregates, setVoiceAggregates] = useState(
    buildVoicePromptAggregates([]),
  );
  const [voiceResponses, setVoiceResponses] = useState<OwnerVoiceResponseDetail[]>(
    [],
  );

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
      className="scroll-mt-24 rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 sm:p-5"
    >
      <h2 className="text-sm font-semibold text-zinc-200">
        プレイヤーのFBを読む
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
  const [settingsOpen, setSettingsOpen] = useState(false);

  const display = useMemo(
    () => buildNurtureDisplayContext(growth, voiceRead, game.id),
    [growth, voiceRead, game.id],
  );

  const stepStates = useMemo(
    () => getImprovementLoopStepStates(growth, display, voiceRead),
    [growth, display, voiceRead],
  );
  const activeStepId = useMemo(
    () => getActiveImprovementLoopStepId(stepStates),
    [stepStates],
  );

  const quickFbCount = growth.totalVoiceResponseCount;
  const detailedFbCount = useMemo(
    () => filterDeepFeedbackForVersion(feedbackEntries, versionKey).length,
    [feedbackEntries, versionKey],
  );
  const showWorkPanels =
    getStudioVisualMode(growth) !== "pre_cycle" &&
    (quickFbCount > 0 || detailedFbCount > 0);

  const studioActions = getProjectNurtureActions("studio");

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
      return;
    }
  }, []);

  return (
    <div className="space-y-6">
      <LoopStepper stepStates={stepStates} />

      <CurrentStepPanel
        game={game}
        growth={growth}
        display={display}
        activeStepId={activeStepId}
        quickFbCount={quickFbCount}
        detailedFbCount={detailedFbCount}
        onPrimaryRead={handlePrimaryRead}
        onOpenModifyGameModal={handleOpenModifyGameModal}
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
          />
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-zinc-800 bg-zinc-950/20 px-5 py-8 text-center">
          <MessageSquare className="mx-auto size-8 text-zinc-600" aria-hidden="true" />
          <p className="mt-2 text-sm font-medium text-zinc-400">まだプレイヤーFBがありません</p>
          <p className="mt-1 text-xs text-zinc-500">
            FBが届くと「次に直すこと」と「プレイヤーのFBを読む」が表示されます。
          </p>
        </div>
      )}

      <div className="border-t border-zinc-800/60 pt-3">
        <button
          type="button"
          onClick={() => setSettingsOpen((value) => !value)}
          className="inline-flex items-center gap-1 text-xs text-zinc-600 transition-colors hover:text-zinc-400"
        >
          作品の設定
          <ChevronDown
            className={`size-3.5 transition-transform ${settingsOpen ? "rotate-180" : ""}`}
            aria-hidden="true"
          />
        </button>
        {settingsOpen && (
          <div className="mt-2 flex flex-wrap gap-2">
            {studioActions.map((action) => (
              <Link
                key={action.id}
                href={action.href(game.id)}
                className="rounded-lg border border-zinc-800 bg-zinc-950/50 px-3 py-1.5 text-xs font-medium text-zinc-400 transition-colors hover:border-zinc-700 hover:text-zinc-200"
              >
                {action.label}
              </Link>
            ))}
            <Link
              href={gamePlayHref(game.id)}
              className="rounded-lg border border-zinc-800 bg-zinc-950/50 px-3 py-1.5 text-xs font-medium text-zinc-400 transition-colors hover:border-zinc-700 hover:text-zinc-200"
            >
              プレイヤー向けページを見る
            </Link>
          </div>
        )}
      </div>

      <ModifyGameExplanationModal
        open={modifyModalOpen}
        onClose={() => setModifyModalOpen(false)}
      />
    </div>
  );
}
