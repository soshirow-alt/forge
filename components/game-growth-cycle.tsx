"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FeedbackStructuredCard } from "@/components/feedback-structured-card";
import { formatFeedbackDate } from "@/lib/feedback-display";
import { useNurtureFeedbackRead } from "@/hooks/use-nurture-feedback-read";
import { useNurtureImprovementNote } from "@/hooks/use-nurture-improvement-note";
import type { Game } from "@/lib/mock-games";
import {
  NURTURE_STEPS,
  buildNurtureDisplayContext,
  getNurtureStepVisualState,
  type NurtureDisplayContext,
  type NurtureStepId,
  type ProjectGrowthSnapshot,
} from "@/lib/project-growth-state";
import type { ProjectFeedbackEntry } from "@/lib/supabase/user-engagement";

const primaryButtonClassName =
  "inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 px-5 py-3 text-sm font-semibold text-zinc-950 transition-opacity hover:opacity-90";

type GameGrowthCycleProps = {
  game: Game;
  growth: ProjectGrowthSnapshot;
  feedbackEntries: ProjectFeedbackEntry[];
  detailPanelId?: string;
  initialSelectedStep?: NurtureStepId | null;
};

function stepChipClassName(
  state: ReturnType<typeof getNurtureStepVisualState>,
): string {
  switch (state) {
    case "next":
      return "min-h-[52px] border-orange-400 bg-orange-500/15 text-orange-100 ring-2 ring-orange-400/50 sm:min-h-[56px]";
    case "now":
      return "min-h-[48px] border-orange-500/50 bg-orange-500/10 text-orange-300 sm:min-h-[52px]";
    case "done":
      return "min-h-[40px] border-zinc-800 bg-zinc-900/40 text-zinc-500 sm:min-h-[44px]";
    case "upcoming":
      return "min-h-[40px] border-dashed border-zinc-800 bg-zinc-950/50 text-zinc-600 sm:min-h-[44px]";
  }
}

function stepBadge(state: ReturnType<typeof getNurtureStepVisualState>): string | null {
  if (state === "next") {
    return "次";
  }
  if (state === "now") {
    return "今";
  }
  return null;
}

function EarlyStepsLine({ growth }: { growth: ProjectGrowthSnapshot }) {
  return (
    <p className="text-[11px] text-zinc-600">
      {growth.earlySteps.map((step, index) => (
        <span key={step.id}>
          {index > 0 && " · "}
          {step.done ? "✓" : "○"}
          {step.label}
        </span>
      ))}
    </p>
  );
}

function NurtureHero({ display }: { display: NurtureDisplayContext }) {
  return (
    <div className="rounded-lg border border-zinc-800/80 bg-zinc-950/40 px-4 py-3">
      <p className="text-xs font-medium text-zinc-500">次にやること</p>
      <p
        className={`mt-1 text-xl font-bold tracking-tight sm:text-2xl ${
          display.newFeedbackArrived ? "text-orange-200" : "text-orange-300"
        }`}
      >
        {display.heroTitle}
      </p>
      {display.heroSubline && (
        <p
          className={`mt-1 text-xs ${
            display.newFeedbackArrived
              ? "text-orange-400/80"
              : "text-zinc-500"
          }`}
        >
          {display.heroSubline}
        </p>
      )}
    </div>
  );
}

function LoopHint({
  display,
}: {
  display: NurtureDisplayContext;
}) {
  return (
    <div
      className={`pointer-events-none mt-2 flex items-center justify-center gap-2 text-[10px] sm:text-xs ${
        display.loopActive ? "text-orange-500/70" : "text-zinc-700"
      }`}
      aria-hidden
    >
      <svg viewBox="0 0 240 20" className="h-4 w-full max-w-xs" fill="none">
        <path
          d="M 4 12 Q 120 2 236 12"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeDasharray={display.loopActive ? "0" : "4 3"}
          className={display.loopActive ? "animate-pulse" : undefined}
        />
        <path
          d="M 228 8 L 236 12 L 228 16"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
      <span className="shrink-0">
        {display.loopActive ? "↺ 次の改善サイクル" : "↺ サイクル"}
      </span>
    </div>
  );
}

function FocusRail({
  growth,
  display,
  selectedStep,
  onSelectStep,
}: {
  growth: ProjectGrowthSnapshot;
  display: NurtureDisplayContext;
  selectedStep: NurtureStepId | null;
  onSelectStep: (id: NurtureStepId) => void;
}) {
  return (
    <div className="relative pb-1">
      <div className="flex items-stretch gap-0.5 sm:gap-1">
        {NURTURE_STEPS.map((step, index) => {
          const visual = getNurtureStepVisualState(step.id, display);
          const badge = stepBadge(visual);

          return (
            <div key={step.id} className="flex min-w-0 flex-1 items-center">
              {index > 0 && (
                <span className="mx-0.5 shrink-0 text-[10px] text-zinc-700 sm:text-xs">
                  →
                </span>
              )}
              <button
                type="button"
                onClick={() => onSelectStep(step.id)}
                aria-pressed={selectedStep === step.id}
                className={`relative flex w-full flex-1 flex-col items-center justify-center rounded-lg border px-0.5 py-1.5 text-center transition-colors sm:px-1 sm:py-2 ${stepChipClassName(visual)} ${
                  selectedStep === step.id ? "ring-1 ring-zinc-500" : "hover:border-zinc-600"
                }`}
              >
                {badge && (
                  <span
                    className={`mb-0.5 text-[9px] font-bold uppercase tracking-wide sm:text-[10px] ${
                      visual === "next" ? "text-orange-300" : "text-orange-400/80"
                    }`}
                  >
                    {badge}
                  </span>
                )}
                <span
                  className={`text-[10px] leading-tight sm:text-xs ${
                    visual === "next"
                      ? "font-bold"
                      : visual === "now"
                        ? "font-semibold"
                        : ""
                  }`}
                >
                  {visual === "done" && "✓ "}
                  <span className="hidden sm:inline">{step.label}</span>
                  <span className="sm:hidden">{step.shortLabel}</span>
                </span>
              </button>
            </div>
          );
        })}
      </div>
      <LoopHint display={display} />
      {growth.cycleNumber > 0 && (
        <p className="mt-1 text-center text-[10px] text-zinc-600">
          今周 · サイクル {growth.cycleNumber}
        </p>
      )}
    </div>
  );
}

function PastCyclesPanel({ growth }: { growth: ProjectGrowthSnapshot }) {
  const [expanded, setExpanded] = useState(false);

  if (growth.pastCycles.length === 0) {
    return null;
  }

  return (
    <div className="rounded-lg border border-zinc-800/60 bg-zinc-950/30">
      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        className="flex w-full items-center justify-between px-3 py-2 text-left text-sm text-zinc-500 transition-colors hover:text-orange-400"
      >
        <span>サイクル {growth.pastCycles.length} 件の振り返り</span>
        <span>{expanded ? "▲" : "▼"}</span>
      </button>
      {expanded && (
        <div className="space-y-2 border-t border-zinc-800/80 px-3 py-3">
          {growth.pastCycles.map((cycle) => (
            <div
              key={cycle.cycleNumber}
              className="rounded-md border border-zinc-800/80 bg-zinc-900/40 px-3 py-2 text-xs"
            >
              <p className="font-medium text-zinc-400">サイクル {cycle.cycleNumber}</p>
              {cycle.devlogTitle && (
                <p className="mt-1 text-zinc-500">開発ログ: {cycle.devlogTitle}</p>
              )}
              {cycle.publishedVersion && (
                <p className="text-zinc-500">公開版: {cycle.publishedVersion}</p>
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
  feedbackRead,
  onMarkRead,
  improvementNote,
  onImprovementNoteChange,
}: {
  stepId: NurtureStepId;
  game: Game;
  growth: ProjectGrowthSnapshot;
  feedbackEntries: ProjectFeedbackEntry[];
  feedbackRead: boolean;
  onMarkRead: () => void;
  improvementNote: string;
  onImprovementNoteChange: (value: string) => void;
}) {
  const latestFeedback = feedbackEntries[0];
  const pastFeedback = feedbackEntries.slice(1);
  const [showPastFeedback, setShowPastFeedback] = useState(false);
  switch (stepId) {
    case "read":
      return (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-sm font-semibold text-zinc-300">プレイヤーの声</h4>
            {latestFeedback && !feedbackRead && (
              <button
                type="button"
                onClick={onMarkRead}
                className="text-xs text-orange-400 hover:text-orange-300"
              >
                読了にする
              </button>
            )}
            {feedbackRead && (
              <span className="text-xs text-zinc-600">読了済み</span>
            )}
          </div>
          {feedbackEntries.length === 0 ? (
            <p className="text-sm text-zinc-500">まだフィードバックは届いていません。</p>
          ) : (
            <>
              {latestFeedback && (
                <div className="rounded-lg border border-zinc-800 bg-zinc-950/40 p-4">
                  <p className="text-xs text-zinc-600">
                    今周 · プレイ可能版 {latestFeedback.item.versionKey ?? "0.1"} ·{" "}
                    {formatFeedbackDate(latestFeedback.item.createdAt)}
                  </p>
                  <div className="mt-3 border-t border-zinc-800/80 pt-3">
                    <FeedbackStructuredCard item={latestFeedback.item} showDate={false} />
                  </div>
                </div>
              )}
              {pastFeedback.length > 0 && (
                <div>
                  <button
                    type="button"
                    onClick={() => setShowPastFeedback((value) => !value)}
                    className="text-sm text-zinc-500 transition-colors hover:text-orange-400"
                  >
                    過去の声 {pastFeedback.length}件 {showPastFeedback ? "▲" : "▼"}
                  </button>
                  {showPastFeedback && (
                    <div className="mt-3 space-y-3">
                      {pastFeedback.map(({ item }) => (
                        <div
                          key={item.id}
                          className="rounded-lg border border-zinc-800/80 bg-zinc-950/30 p-4"
                        >
                          <p className="text-xs text-zinc-600">
                            プレイ可能版 {item.versionKey ?? "0.1"} ·{" "}
                            {formatFeedbackDate(item.createdAt)}
                          </p>
                          <div className="mt-3 border-t border-zinc-800/80 pt-3">
                            <FeedbackStructuredCard item={item} showDate={false} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      );

    case "improving":
      return (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-zinc-300">改善中</h4>
          <p className="text-xs text-zinc-600">
            何を直すか決めて開発しましょう。終わったら開発ログに記録します。
          </p>
          <label className="block text-xs text-zinc-500">
            改善メモ（暫定・端末内保存 — 将来 DB 化予定）
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
          <p className="text-xs text-zinc-600">全 {growth.devlogCount} 件</p>
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
          <h4 className="text-sm font-semibold text-zinc-300">反応待ち</h4>
          <p className="text-sm leading-relaxed text-zinc-400">
            {growth.dataPhase === "no_feedback"
              ? "プレイヤーに見つけてもらい、最初の声を待っています。"
              : "プレイヤーの再プレイと新しい声を待っています。届いたらまた FBを読む から始まります。"}
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
  const feedbackId = growth.latestFeedbackId ?? feedbackEntries[0]?.item.id;
  const { isRead: feedbackRead, markRead } = useNurtureFeedbackRead(
    game.id,
    feedbackId,
  );
  const { note: improvementNote, updateNote: onImprovementNoteChange } =
    useNurtureImprovementNote(game.id, feedbackId);
  const [selectedStep, setSelectedStep] = useState<NurtureStepId | null>(
    initialSelectedStep,
  );

  useEffect(() => {
    if (initialSelectedStep) {
      setSelectedStep(initialSelectedStep);
    }
  }, [initialSelectedStep]);

  const display = useMemo(
    () => buildNurtureDisplayContext(growth, feedbackRead, game.id),
    [growth, feedbackRead, game.id],
  );

  const handlePrimaryRead = useCallback(() => {
    markRead();
    setSelectedStep("read");
  }, [markRead]);

  const handleSelectStep = useCallback((stepId: NurtureStepId) => {
    setSelectedStep((current) => (current === stepId ? null : stepId));
  }, []);

  return (
    <div className="space-y-4">
      <EarlyStepsLine growth={growth} />
      <NurtureHero display={display} />
      <FocusRail
        growth={growth}
        display={display}
        selectedStep={selectedStep}
        onSelectStep={handleSelectStep}
      />

      {display.primaryCta && (
        <div>
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

      <PastCyclesPanel growth={growth} />

      {selectedStep && (
        <div
          id={detailPanelId}
          className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-4"
        >
          <StepDetailPanel
            stepId={selectedStep}
            game={game}
            growth={growth}
            feedbackEntries={feedbackEntries}
            feedbackRead={feedbackRead}
            onMarkRead={markRead}
            improvementNote={improvementNote}
            onImprovementNoteChange={onImprovementNoteChange}
          />
        </div>
      )}

      {!selectedStep && (
        <p className="text-xs text-zinc-600">
          ステップをクリックすると詳細が表示されます（完了したステップも振り返れます）
        </p>
      )}
    </div>
  );
}
