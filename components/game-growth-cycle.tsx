"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { DeveloperVoiceInsights } from "@/components/developer-voice-insights";
import { NurtureDeepFeedbackSection } from "@/components/nurture-deep-feedback-section";
import { OwnerVoiceResponseList } from "@/components/owner-voice-response-list";
import { useNurtureVoiceRead } from "@/hooks/use-nurture-feedback-read";
import { useNurtureImprovementNote } from "@/hooks/use-nurture-improvement-note";
import type { Game } from "@/lib/mock-games";
import {
  NURTURE_STEPS,
  buildNurtureDisplayContext,
  getProgressRailStepIds,
  getProgressRailVisual,
  type NurtureDisplayContext,
  type NurtureStepId,
  type ProjectGrowthSnapshot,
} from "@/lib/project-growth-state";
import type { OwnerVoiceResponseDetail } from "@/lib/supabase/voice-engagement";
import type { ProjectFeedbackEntry } from "@/lib/supabase/user-engagement";
import { buildVoicePromptAggregates } from "@/lib/voice-aggregates";
import { useGames } from "@/components/games-provider";

const primaryButtonClassName =
  "inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 px-5 py-3 text-sm font-semibold text-zinc-950 transition-opacity hover:opacity-90";

type GameGrowthCycleProps = {
  game: Game;
  growth: ProjectGrowthSnapshot;
  feedbackEntries: ProjectFeedbackEntry[];
  detailPanelId?: string;
  initialSelectedStep?: NurtureStepId | null;
};

function NurtureHero({ display }: { display: NurtureDisplayContext }) {
  return (
    <div className="pt-1">
      <p className="text-[11px] font-medium tracking-wide text-zinc-600">
        次にやること
      </p>
      <p className="mt-1.5 text-2xl font-bold tracking-tight text-zinc-50 sm:text-3xl">
        {display.heroTitle}
      </p>
      {display.heroSubline && (
        <p className="mt-1 text-xs text-zinc-500">{display.heroSubline}</p>
      )}
    </div>
  );
}

function cycleNodeMarker(visual: ReturnType<typeof getProgressRailVisual>): string {
  switch (visual) {
    case "done":
      return "✓";
    case "current":
      return "●";
    case "upcoming":
      return "○";
  }
}

function CycleTrack({
  display,
  growth,
  selectedStep,
  onSelectStep,
}: {
  display: NurtureDisplayContext;
  growth: ProjectGrowthSnapshot;
  selectedStep: NurtureStepId | null;
  onSelectStep: (id: NurtureStepId) => void;
}) {
  const stepIds = getProgressRailStepIds();

  return (
    <nav
      aria-label="育成サイクル"
      className="mt-6 overflow-hidden border-t border-zinc-800/50 pt-4"
    >
      <div className="mb-3 flex items-baseline justify-between gap-2">
        <p className="text-xs font-medium text-zinc-600">育成サイクル</p>
        {growth.cycleNumber > 0 && (
          <span
            className="shrink-0 text-xs text-zinc-700"
            title={`改善サイクル ${growth.cycleNumber}`}
          >
            ↺ {growth.cycleNumber}
          </span>
        )}
      </div>
      <div className="relative">
        <div
          className="pointer-events-none absolute inset-x-[8%] top-[13px] h-px bg-zinc-800"
          aria-hidden
        />
        <div className="relative grid grid-cols-5 gap-x-0">
          {stepIds.map((stepId) => {
            const step = NURTURE_STEPS.find((entry) => entry.id === stepId);
            if (!step) {
              return null;
            }

            const visual = getProgressRailVisual(stepId, display);
            const isSelected = selectedStep === stepId;
            const labelTone =
              visual === "current"
                ? "font-medium text-zinc-300"
                : visual === "done"
                  ? "text-zinc-500"
                  : "text-zinc-500";

            return (
              <div key={stepId} className="min-w-0 px-0.5">
                <button
                  type="button"
                  onClick={() => onSelectStep(stepId)}
                  aria-pressed={isSelected}
                  aria-label={`${step.label}（${step.whyLabel}）`}
                  title={`${step.label} — ${step.whyLabel}`}
                  className={`flex w-full flex-col items-center text-center transition-colors hover:text-zinc-400 ${
                    isSelected ? "text-zinc-200" : ""
                  }`}
                >
                  <span
                    className={`relative z-[1] flex h-6 w-6 shrink-0 items-center justify-center rounded border text-xs font-medium ${
                      visual === "current"
                        ? "border-zinc-600 bg-zinc-800/80 text-zinc-300"
                        : visual === "done"
                          ? "border-zinc-800 bg-zinc-900/60 text-zinc-500"
                          : "border-zinc-800/80 bg-zinc-950 text-zinc-500"
                    }`}
                  >
                    {cycleNodeMarker(visual)}
                  </span>
                  <span
                    className={`mt-2 line-clamp-2 text-xs leading-snug md:hidden ${labelTone}`}
                  >
                    {step.railLabel}
                  </span>
                  <span
                    className={`mt-2 hidden line-clamp-2 text-xs leading-snug md:block ${labelTone}`}
                  >
                    {step.label}
                  </span>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </nav>
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
        className="text-xs text-zinc-600 transition-colors hover:text-zinc-400"
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
}) {
  switch (stepId) {
    case "read":
      return (
        <div className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h4 className="text-sm font-semibold text-zinc-300">
                プレイヤーの回答
              </h4>
              {growth.totalVoiceResponseCount > 0 && !voiceRead && (
                <button
                  type="button"
                  onClick={onMarkRead}
                  className="text-xs text-orange-400 hover:text-orange-300"
                >
                  読了にする
                </button>
              )}
              {voiceRead && growth.totalVoiceResponseCount > 0 && (
                <span className="text-xs text-zinc-600">読了済み</span>
              )}
            </div>
            {growth.totalVoiceResponseCount === 0 ? (
              <p className="text-sm text-zinc-500">
                この版への回答はまだありません。
              </p>
            ) : (
              <>
                <p className="text-sm text-zinc-400">
                  v{growth.playableVersion} に回答 {growth.totalVoiceResponseCount}
                  件。集計と解釈は上の「プレイヤーの回答」セクションを参照してください。
                </p>
                <OwnerVoiceResponseList responses={voiceResponses} />
              </>
            )}
          </div>

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
          <h4 className="text-sm font-semibold text-zinc-300">改善する</h4>
          <p className="text-xs text-zinc-600">
            改善中 — 終わったら開発ログに記録します。
          </p>
          <label className="block text-xs text-zinc-500">
            改善メモ（端末内保存）
            <textarea
              value={improvementNote}
              onChange={(event) => onImprovementNoteChange(event.target.value)}
              rows={3}
              placeholder="例: ジャンプの操作感を柔らかくする"
              className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-950/50 px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600"
            />
          </label>
          {growth.cyclePrevious && (
            <p className="text-xs text-zinc-600">前回: {growth.cyclePrevious}</p>
          )}
        </div>
      );

    case "devlog":
      return (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-zinc-300">開発ログ</h4>
          <p className="text-sm text-zinc-400">
            {growth.latestDevlogTitle
              ? `最新: 「${growth.latestDevlogTitle}」`
              : "改善を記録する devlog を書きましょう。"}
          </p>
          <Link
            href={`/projects/${game.id}/devlog/new`}
            className="inline-block text-sm text-orange-400 hover:text-orange-300"
          >
            開発ログを書く →
          </Link>
        </div>
      );

    case "publish":
      return (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-zinc-300">新版公開</h4>
          <dl className="space-y-2 text-sm">
            <div className="flex gap-3">
              <dt className="w-16 shrink-0 text-zinc-500">最新版</dt>
              <dd className="text-zinc-200">{growth.playableVersion}</dd>
            </div>
            {growth.latestDevlogTitle && (
              <div className="flex gap-3">
                <dt className="w-16 shrink-0 text-zinc-500">記録</dt>
                <dd className="text-zinc-300">{growth.latestDevlogTitle}</dd>
              </div>
            )}
          </dl>
          <Link
            href={`/projects/${game.id}/devlog/new`}
            className="inline-block text-sm text-orange-400 hover:text-orange-300"
          >
            新版を公開する →
          </Link>
        </div>
      );

    case "wait":
      return (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-zinc-300">回答待ち</h4>
          <p className="text-sm leading-relaxed text-zinc-400">
            {growth.dataPhase === "no_feedback"
              ? "プレイヤーの初声を待っています。"
              : "新しい回答が届いたら、また回答を見る から始まります。"}
          </p>
          <Link
            href={`/games/${game.id}`}
            className="inline-block text-sm text-orange-400 hover:text-orange-300"
          >
            作品ページを確認する →
          </Link>
        </div>
      );
  }
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

  useEffect(() => {
    if (initialSelectedStep) {
      setSelectedStep(initialSelectedStep);
    }
  }, [initialSelectedStep]);

  const display = useMemo(
    () => buildNurtureDisplayContext(growth, voiceRead, game.id),
    [growth, voiceRead, game.id],
  );

  const { getOwnerVoiceAggregates, getOwnerVoiceResponseDetails } = useGames();
  const [voiceAggregates, setVoiceAggregates] = useState(
    buildVoicePromptAggregates([]),
  );
  const [voiceResponses, setVoiceResponses] = useState<OwnerVoiceResponseDetail[]>(
    [],
  );

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
    markRead();
    setSelectedStep("read");
  }, [markRead]);

  const handleSelectStep = useCallback((stepId: NurtureStepId) => {
    setSelectedStep((current) => (current === stepId ? null : stepId));
  }, []);

  return (
    <div>
      <NurtureHero display={display} />

      {display.primaryCta && (
        <div className="mt-5">
          {display.primaryOpensReadPanel ? (
            <button
              type="button"
              onClick={handlePrimaryRead}
              className={primaryButtonClassName}
            >
              {display.primaryCta.label}
            </button>
          ) : (
            <Link href={display.primaryCta.href} className={primaryButtonClassName}>
              {display.primaryCta.label}
            </Link>
          )}
        </div>
      )}

      <section aria-label="プレイヤーの回答" className="mt-6 space-y-2">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            プレイヤーの回答
          </h3>
          {growth.totalVoiceResponseCount > 0 && (
            <p className="text-xs text-zinc-600">
              v{growth.playableVersion} · 回答 {growth.totalVoiceResponseCount}件
            </p>
          )}
        </div>
        <DeveloperVoiceInsights
          aggregates={voiceAggregates}
          versionKey={growth.playableVersion}
        />
      </section>

      <NurtureDeepFeedbackSection
        feedbackEntries={feedbackEntries}
        playableVersion={growth.playableVersion}
      />

      <CycleTrack
        display={display}
        growth={growth}
        selectedStep={selectedStep}
        onSelectStep={handleSelectStep}
      />

      <PastCyclesPanel growth={growth} />

      {selectedStep && (
        <div
          id={detailPanelId}
          className="mt-4 rounded-lg bg-zinc-950/50 p-4"
        >
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
          />
        </div>
      )}
    </div>
  );
}
