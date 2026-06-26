"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { DeveloperVoiceInsights } from "@/components/developer-voice-insights";
import { ModifyGameExplanationModal, shouldShowModifyGameModal } from "@/components/modify-game-explanation-modal";
import { NurtureDeepFeedbackSection } from "@/components/nurture-deep-feedback-section";
import { OwnerVoiceResponseList } from "@/components/owner-voice-response-list";
import { VoiceAdoptionStudioCount } from "@/components/voice-adoption-studio-count";
import { useGames } from "@/components/games-provider";
import { useNurtureImprovementNote } from "@/hooks/use-nurture-improvement-note";
import { useNurtureVoiceRead } from "@/hooks/use-nurture-feedback-read";
import type { Game } from "@/lib/mock-games";
import { getProjectNurtureActions } from "@/lib/project-nurture-links";
import {
  NURTURE_STEPS,
  buildNurtureDisplayContext,
  getProgressRailVisual,
  getProgressRailStepIds,
  getStudioActionHeadline,
  getStudioCycleBanner,
  getStudioVisualMode,
  type NurtureDisplayContext,
  type NurtureStepId,
  type ProjectGrowthSnapshot,
  type StudioVisualMode,
} from "@/lib/project-growth-state";
import type { OwnerVoiceResponseDetail } from "@/lib/supabase/voice-engagement";
import type { ProjectFeedbackEntry } from "@/lib/supabase/user-engagement";
import { buildVoicePromptAggregates } from "@/lib/voice-aggregates";
import { gamePlayHref } from "@/lib/project-nurture-links";
import { Check, Copy, Link2, MessageSquare, Play, Upload, Wrench } from "lucide-react";

const primaryButtonClassName =
  "inline-flex w-full cursor-pointer items-center justify-center rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 px-6 py-3.5 text-base font-semibold text-zinc-950 transition-opacity hover:opacity-90 sm:w-auto";

const secondaryButtonClassName =
  "inline-flex cursor-pointer items-center justify-center rounded-xl border border-zinc-700 px-4 py-2.5 text-sm font-medium text-zinc-200 transition-colors hover:border-orange-500/40 hover:text-orange-300";

type GameGrowthCycleProps = {
  game: Game;
  growth: ProjectGrowthSnapshot;
  feedbackEntries: ProjectFeedbackEntry[];
  detailPanelId?: string;
  initialSelectedStep?: NurtureStepId | null;
};

function cycleDotMarker(visual: ReturnType<typeof getProgressRailVisual>): string {
  switch (visual) {
    case "done":
      return "✓";
    case "current":
      return "●";
    case "upcoming":
      return "·";
  }
}

function PreCycleVisual() {
  const nodes = [
    { label: "投稿", state: "done" as const },
    { label: "プレイ", state: "current" as const },
    { label: "回答", state: "upcoming" as const },
  ];

  return (
    <div className="mt-5" aria-label="フィードバック待ち — プレイヤーの訪問を待っています">
      <div className="flex items-center gap-0">
        {nodes.map((node, index) => (
          <div key={node.label} className="flex min-w-0 flex-1 items-center">
            <div className="flex flex-1 flex-col items-center gap-2">
              <span
                className={`flex size-9 items-center justify-center rounded-full text-sm font-semibold ${
                  node.state === "done"
                    ? "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30"
                    : node.state === "current"
                      ? "bg-orange-500/20 text-orange-300 ring-2 ring-orange-500/50"
                      : "bg-zinc-900 text-zinc-600 ring-1 ring-zinc-800"
                }`}
              >
                {node.state === "done" ? (
                  <Check className="size-4" aria-hidden="true" />
                ) : node.state === "current" ? (
                  <Play className="size-4" aria-hidden="true" />
                ) : (
                  <MessageSquare className="size-4" aria-hidden="true" />
                )}
              </span>
              <span
                className={`text-xs ${
                  node.state === "current" ? "font-medium text-orange-300" : "text-zinc-500"
                }`}
              >
                {node.label}
              </span>
            </div>
            {index < nodes.length - 1 && (
              <div
                className={`mx-1 h-0.5 flex-1 rounded-full ${
                  node.state === "done" ? "bg-emerald-500/40" : "bg-zinc-800"
                }`}
                aria-hidden="true"
              />
            )}
          </div>
        ))}
      </div>
      <p className="mt-3 text-center text-xs text-zinc-500">
        最初のフィードバックが届いてから始まります
      </p>
    </div>
  );
}

function CycleCompleteVisual() {
  return (
    <div
      className="mt-5 flex flex-col items-center rounded-xl border border-zinc-800/80 bg-zinc-950/40 px-4 py-5"
      aria-label="このverは一通り完了"
    >
      <span className="flex size-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-300 ring-2 ring-emerald-500/25">
        <Check className="size-6" aria-hidden="true" />
      </span>
      <p className="mt-3 text-sm font-medium text-zinc-200">このverは一通り完了</p>
      <p className="mt-1 flex items-center gap-1.5 text-xs text-zinc-500">
        <span className="inline-block size-1.5 animate-pulse rounded-full bg-orange-400" />
        新しい回答が届いたら再開
      </p>
    </div>
  );
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
    <button
      type="button"
      onClick={() => void handleCopy()}
      className={secondaryButtonClassName}
    >
      {copied ? (
        <>
          <Check className="mr-1.5 size-4" aria-hidden="true" />
          URLをコピーしました
        </>
      ) : (
        <>
          <Copy className="mr-1.5 size-4" aria-hidden="true" />
          ページURLをコピー
        </>
      )}
    </button>
  );
}

function CompactCycleProgress({
  display,
  onSelectStep,
  selectedStep,
}: {
  display: NurtureDisplayContext;
  onSelectStep: (id: NurtureStepId) => void;
  selectedStep: NurtureStepId | null;
}) {
  const stepIds = getProgressRailStepIds();
  const waitComplete =
    display.nowStepId === "wait" && !display.newFeedbackArrived;

  return (
    <div className="mt-5">
      <div className="flex items-start justify-between gap-0.5">
        {stepIds.map((stepId, index) => {
          const step = NURTURE_STEPS.find((entry) => entry.id === stepId);
          if (!step) {
            return null;
          }
          const visual = getProgressRailVisual(stepId, display);
          const isCurrent = visual === "current";
          const isSelected = selectedStep === stepId;

          return (
            <div key={stepId} className="flex min-w-0 flex-1 flex-col items-center">
              {index > 0 && (
                <span
                  className="pointer-events-none absolute hidden"
                  aria-hidden
                />
              )}
              <button
                type="button"
                onClick={() => onSelectStep(stepId)}
                aria-pressed={isSelected}
                aria-label={step.label}
                className={`flex flex-col items-center gap-1.5 transition-colors ${
                  isSelected ? "text-zinc-200" : "text-zinc-500 hover:text-zinc-400"
                }`}
              >
                <span
                  className={`flex size-7 items-center justify-center rounded-full text-xs font-medium ${
                    isCurrent
                      ? "bg-orange-500/20 text-orange-300 ring-2 ring-orange-500/50"
                      : visual === "done"
                        ? "bg-zinc-800 text-zinc-400"
                        : "bg-zinc-900 text-zinc-600"
                  }`}
                >
                  {cycleDotMarker(visual)}
                </span>
                <span
                  className={`line-clamp-2 text-center text-[10px] leading-tight sm:text-xs ${
                    isCurrent ? "font-medium text-zinc-300" : ""
                  }`}
                >
                  {step.railLabel}
                </span>
              </button>
            </div>
          );
        })}
      </div>
      {waitComplete && (
        <p className="mt-3 text-center text-xs text-zinc-500">
          新しい回答 → 回答から再開
        </p>
      )}
    </div>
  );
}

function StudioHeroPanel({
  game,
  display,
  growth,
  selectedStep,
  onSelectStep,
  onPrimaryRead,
  onOpenModifyGameModal,
}: {
  game: Game;
  display: NurtureDisplayContext;
  growth: ProjectGrowthSnapshot;
  selectedStep: NurtureStepId | null;
  onSelectStep: (id: NurtureStepId) => void;
  onPrimaryRead: () => void;
  onOpenModifyGameModal: () => void;
}) {
  const visualMode = getStudioVisualMode(growth);
  const cycleBanner = getStudioCycleBanner(growth, display);
  const actionHeadline = getStudioActionHeadline(display, growth);
  const studioActions = getProjectNurtureActions("studio");
  const [settingsOpen, setSettingsOpen] = useState(false);

  const stepIcon = (stepId: NurtureStepId) => {
    switch (stepId) {
      case "read":
        return MessageSquare;
      case "improving":
        return Wrench;
      case "devlog":
      case "publish":
        return Upload;
      default:
        return Link2;
    }
  };

  const CurrentStepIcon = stepIcon(display.nowStepId);

  return (
    <section
      aria-label="今やること"
      className="rounded-xl border border-orange-500/30 bg-gradient-to-b from-orange-500/5 to-zinc-900/40 p-5 sm:p-6"
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-md bg-zinc-800/80 px-2 py-0.5 text-xs font-medium text-zinc-300">
          v{growth.playableVersion}
        </span>
        <span
          className={`rounded-md px-2 py-0.5 text-xs font-medium ${
            display.newFeedbackArrived
              ? "bg-orange-500/15 text-orange-300"
              : visualMode === "pre_cycle"
                ? "bg-sky-500/10 text-sky-300"
                : visualMode === "cycle_complete"
                  ? "bg-emerald-500/10 text-emerald-300"
                  : "bg-violet-500/10 text-violet-300"
          }`}
        >
          {cycleBanner}
        </span>
      </div>

      <div className="mt-5 flex items-start gap-4">
        <span
          className={`flex size-14 shrink-0 items-center justify-center rounded-2xl ${
            visualMode === "pre_cycle"
              ? "bg-sky-500/10 text-sky-300 ring-1 ring-sky-500/25"
              : visualMode === "cycle_complete"
                ? "bg-emerald-500/10 text-emerald-300 ring-1 ring-emerald-500/25"
                : "bg-orange-500/10 text-orange-300 ring-1 ring-orange-500/25"
          }`}
        >
          <CurrentStepIcon className="size-7" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-bold text-zinc-50 sm:text-2xl">{actionHeadline}</h2>
          {visualMode === "pre_cycle" && (
            <p className="mt-1 text-sm text-zinc-500">
              Forge外 — URLを貼ればプレイヤーが来ます
            </p>
          )}
        </div>
      </div>

      {display.primaryCta && (
        <div className="mt-5 flex flex-wrap gap-3">
          {display.primaryOpensReadPanel ? (
            <button
              type="button"
              onClick={onPrimaryRead}
              className={primaryButtonClassName}
            >
              {display.primaryCta.label}
            </button>
          ) : display.primaryOpensModifyGameModal ? (
            <button
              type="button"
              onClick={onOpenModifyGameModal}
              className={primaryButtonClassName}
            >
              {display.primaryCta.label}
            </button>
          ) : display.primaryCta.href ? (
            <Link href={display.primaryCta.href} className={primaryButtonClassName}>
              {display.primaryCta.label}
            </Link>
          ) : null}
          {visualMode === "pre_cycle" && <CopyGamePageUrlButton gameId={game.id} />}
          {display.secondaryCta?.href && visualMode !== "pre_cycle" && (
            <Link
              href={display.secondaryCta.href}
              className={secondaryButtonClassName}
            >
              {display.secondaryCta.label}
            </Link>
          )}
        </div>
      )}

      {visualMode === "pre_cycle" ? (
        <PreCycleVisual />
      ) : visualMode === "cycle_complete" ? (
        <CycleCompleteVisual />
      ) : (
        <CompactCycleProgress
          display={display}
          selectedStep={selectedStep}
          onSelectStep={onSelectStep}
        />
      )}

      <div className="mt-4 border-t border-zinc-800/60 pt-3">
        <button
          type="button"
          onClick={() => setSettingsOpen((value) => !value)}
          className="text-xs text-zinc-600 transition-colors hover:text-zinc-400"
        >
          作品の設定 {settingsOpen ? "▲" : "▼"}
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
              プレイヤー画面を見る
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}

function PastCyclesPanel({ growth }: { growth: ProjectGrowthSnapshot }) {
  const [expanded, setExpanded] = useState(false);

  if (growth.pastCycles.length === 0) {
    return null;
  }

  return (
    <div className="mt-4">
      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        className="cursor-pointer text-xs text-zinc-600 transition-colors hover:text-zinc-400"
      >
        過去 {growth.pastCycles.length} サイクル {expanded ? "▲" : "▼"}
      </button>
      {expanded && (
        <div className="mt-2 space-y-2">
          {growth.pastCycles.map((cycle) => (
            <div key={cycle.cycleNumber} className="text-xs text-zinc-600">
              <span className="text-zinc-500">サイクル {cycle.cycleNumber}</span>
              {cycle.devlogTitle && (
                <span className="ml-2">{cycle.devlogTitle}</span>
              )}
              {cycle.publishedVersion && (
                <span className="ml-2">v{cycle.publishedVersion}</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StepDetailPanel({
  stepId,
  game,
  growth,
  feedbackEntries,
  voiceRead,
  onMarkRead,
  improvementNote,
  onImprovementNoteChange,
  voiceResponses,
  onOpenModifyGameModal,
}: {
  stepId: NurtureStepId;
  game: Game;
  growth: ProjectGrowthSnapshot;
  feedbackEntries: ProjectFeedbackEntry[];
  voiceRead: boolean;
  onMarkRead: () => void | Promise<void>;
  improvementNote: string;
  onImprovementNoteChange: (value: string) => void;
  voiceResponses: OwnerVoiceResponseDetail[];
  onOpenModifyGameModal: () => void;
}) {
  switch (stepId) {
    case "read":
      return (
        <div className="space-y-4">
          {growth.totalVoiceResponseCount > 0 && (
            <>
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-sm font-semibold text-zinc-300">
                  個別の回答
                </h4>
                {!voiceRead && (
                  <button
                    type="button"
                    onClick={onMarkRead}
                    className="cursor-pointer text-xs text-orange-400 hover:text-orange-300"
                  >
                    読了にする
                  </button>
                )}
                {voiceRead && (
                  <span className="text-xs text-zinc-600">読了済み</span>
                )}
              </div>
              <OwnerVoiceResponseList responses={voiceResponses} />
            </>
          )}
          <NurtureDeepFeedbackSection
            feedbackEntries={feedbackEntries}
            playableVersion={growth.playableVersion}
            compact
          />
        </div>
      );

    case "improving":
      return (
        <div className="space-y-3">
          <button
            type="button"
            onClick={onOpenModifyGameModal}
            className="cursor-pointer inline-flex items-center rounded-lg border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-200 transition-colors hover:border-orange-500/40 hover:text-orange-300"
          >
            修正の進め方を見る
          </button>
          <label className="block text-xs text-zinc-500">
            修正メモ（端末内）
            <textarea
              value={improvementNote}
              onChange={(event) => onImprovementNoteChange(event.target.value)}
              rows={3}
              placeholder="例: ジャンプの操作感を柔らかくする"
              className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-950/50 px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600"
            />
          </label>
        </div>
      );

    case "devlog":
      return (
        <Link
          href={`/projects/${game.id}/devlog/new`}
          className="cursor-pointer inline-flex items-center rounded-lg bg-violet-600/20 px-4 py-2 text-sm font-medium text-violet-200 ring-1 ring-violet-500/30 hover:bg-violet-600/30"
        >
          変更内容を記録する →
        </Link>
      );

    case "publish":
      return (
        <div className="space-y-3">
          <VoiceAdoptionStudioCount
            gameId={game.id}
            latestPublishedDevlogId={growth.latestPublishedDevlogId}
          />
          <Link
            href={`/projects/${game.id}/devlog/new`}
            className="cursor-pointer inline-flex items-center rounded-lg bg-violet-600/20 px-4 py-2 text-sm font-medium text-violet-200 ring-1 ring-violet-500/30 hover:bg-violet-600/30"
          >
            新verを公開する →
          </Link>
        </div>
      );

    case "wait":
      return (
        <Link
          href={gamePlayHref(game.id)}
          className="cursor-pointer inline-flex items-center rounded-lg border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-200 hover:border-orange-500/40"
        >
          作品ページを開く →
        </Link>
      );
  }
}

function PlayerVoiceEmptyState({
  gameId,
  visualMode,
}: {
  gameId: string;
  visualMode: StudioVisualMode;
}) {
  if (visualMode === "pre_cycle") {
    return null;
  }

  return (
    <div className="mt-6 rounded-xl border border-dashed border-zinc-800 bg-zinc-950/30 px-5 py-6 text-center">
      <MessageSquare className="mx-auto size-8 text-zinc-600" aria-hidden="true" />
      <p className="mt-2 text-sm text-zinc-500">このverの声はまだありません</p>
    </div>
  );
}

export function GameGrowthCycle({
  game,
  growth,
  feedbackEntries,
  detailPanelId,
  initialSelectedStep = null,
}: GameGrowthCycleProps) {
  const versionKey = growth.playableVersion;
  const { isRead: voiceRead, markRead } = useNurtureVoiceRead(
    game.id,
    versionKey,
  );
  const { note: improvementNote, updateNote: onImprovementNoteChange } =
    useNurtureImprovementNote(game.id, versionKey);
  const [selectedStep, setSelectedStep] = useState<NurtureStepId | null>(
    initialSelectedStep,
  );
  const [modifyModalOpen, setModifyModalOpen] = useState(false);

  useEffect(() => {
    if (initialSelectedStep) {
      setSelectedStep(initialSelectedStep);
    }
  }, [initialSelectedStep]);

  const display = useMemo(
    () => buildNurtureDisplayContext(growth, voiceRead, game.id),
    [growth, voiceRead, game.id],
  );
  const visualMode = getStudioVisualMode(growth);

  const { getOwnerVoiceAggregates, getOwnerVoiceResponseDetails } = useGames();
  const [voiceAggregates, setVoiceAggregates] = useState(
    buildVoicePromptAggregates([]),
  );
  const [voiceResponses, setVoiceResponses] = useState<OwnerVoiceResponseDetail[]>(
    [],
  );

  const hasVoiceAggregates = voiceAggregates.some((item) => item.totalResponses > 0);
  const hasDeepFeedback = feedbackEntries.some(
    (entry) => entry.item.versionKey === growth.playableVersion,
  );
  const showVoiceSection =
    growth.totalVoiceResponseCount > 0 || hasVoiceAggregates || hasDeepFeedback;

  useEffect(() => {
    void getOwnerVoiceAggregates(game.id, growth.playableVersion)
      .then((rows) => {
        setVoiceAggregates(buildVoicePromptAggregates(rows));
      })
      .catch(() => {
        setVoiceAggregates(buildVoicePromptAggregates([]));
      });
  }, [game.id, growth.playableVersion, getOwnerVoiceAggregates]);

  useEffect(() => {
    if (selectedStep !== "read" || growth.totalVoiceResponseCount === 0) {
      return;
    }

    void getOwnerVoiceResponseDetails(game.id, growth.playableVersion)
      .then(setVoiceResponses)
      .catch(() => {
        setVoiceResponses([]);
      });
  }, [
    game.id,
    getOwnerVoiceResponseDetails,
    growth.playableVersion,
    growth.totalVoiceResponseCount,
    selectedStep,
  ]);

  const handlePrimaryRead = useCallback(() => {
    void markRead();
    setSelectedStep("read");
  }, [markRead]);

  const handleOpenModifyGameModal = useCallback(() => {
    if (shouldShowModifyGameModal()) {
      setModifyModalOpen(true);
      return;
    }

    setSelectedStep("improving");
  }, []);

  const handleSelectStep = useCallback((stepId: NurtureStepId) => {
    setSelectedStep((current) => (current === stepId ? null : stepId));
  }, []);

  return (
    <div>
      <StudioHeroPanel
        game={game}
        display={display}
        growth={growth}
        selectedStep={selectedStep}
        onSelectStep={handleSelectStep}
        onPrimaryRead={handlePrimaryRead}
        onOpenModifyGameModal={handleOpenModifyGameModal}
      />

      {showVoiceSection ? (
        <section aria-label="プレイヤーの声" className="mt-6 space-y-3">
          <h3 className="text-sm font-semibold text-zinc-200">
            プレイヤーの声
            <span className="ml-2 text-xs font-normal text-zinc-500">
              v{growth.playableVersion}
            </span>
          </h3>
          <DeveloperVoiceInsights
            aggregates={voiceAggregates}
            versionKey={growth.playableVersion}
          />
          <NurtureDeepFeedbackSection
            feedbackEntries={feedbackEntries}
            playableVersion={growth.playableVersion}
          />
        </section>
      ) : (
        <PlayerVoiceEmptyState gameId={game.id} visualMode={visualMode} />
      )}

      <PastCyclesPanel growth={growth} />

      {selectedStep && (
        <div
          id={detailPanelId}
          className="mt-4 rounded-lg border border-zinc-800/80 bg-zinc-950/50 p-4"
        >
          <p className="mb-3 text-xs font-medium text-zinc-500">
            {NURTURE_STEPS.find((s) => s.id === selectedStep)?.label}
          </p>
          <StepDetailPanel
            stepId={selectedStep}
            game={game}
            growth={growth}
            feedbackEntries={feedbackEntries}
            voiceRead={voiceRead}
            onMarkRead={markRead}
            improvementNote={improvementNote}
            onImprovementNoteChange={onImprovementNoteChange}
            voiceResponses={voiceResponses}
            onOpenModifyGameModal={handleOpenModifyGameModal}
          />
        </div>
      )}

      <ModifyGameExplanationModal
        open={modifyModalOpen}
        onClose={() => setModifyModalOpen(false)}
      />
    </div>
  );
}
