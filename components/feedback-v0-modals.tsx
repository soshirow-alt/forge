"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { GameThumbnail } from "@/components/player-shell";
import type { GameDetailV0 } from "@/lib/game-detail-v0-mock-data";
import {
  feedbackChoiceQuestions,
  feedbackTextQuestions,
  firstVoiceQuestion,
} from "@/lib/feedback-v0-mock-data";
import { Compass, MessageSquare, Users, X } from "lucide-react";

export type FeedbackFlowStep = "closed" | "play-stub" | "first-voice" | "full-form" | "success";

type ModalShellProps = {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
  size?: "md" | "lg" | "xl";
};

function ModalBackdrop({ onClose }: { onClose: () => void }) {
  return (
    <button
      type="button"
      className="absolute inset-0 bg-black/75 backdrop-blur-sm"
      aria-label="閉じる"
      onClick={onClose}
    />
  );
}

function ModalShell({ title, subtitle, onClose, children, size = "md" }: ModalShellProps) {
  const widthClass =
    size === "xl" ? "max-w-5xl" : size === "lg" ? "max-w-2xl" : "max-w-lg";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <ModalBackdrop onClose={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="feedback-modal-title"
        className={`relative flex max-h-[min(92vh,820px)] w-full ${widthClass} flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-[#0a0a0a] shadow-2xl shadow-black/50`}
      >
        <div className="flex items-start justify-between gap-3 border-b border-zinc-800/80 px-5 py-4 sm:px-6">
          <div>
            <h2 id="feedback-modal-title" className="text-lg font-semibold text-white">
              {title}
            </h2>
            {subtitle && <p className="mt-1 text-sm text-zinc-400">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-zinc-500 transition-colors hover:bg-zinc-900 hover:text-zinc-300"
            aria-label="閉じる"
          >
            <X className="size-5" />
          </button>
        </div>
        <div className="overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

function GameSummaryCard({ game }: { game: GameDetailV0 }) {
  return (
    <div className="flex gap-4 rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-4">
      <GameThumbnail src={game.heroImage} alt={game.title} className="size-20 shrink-0 sm:size-24" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap gap-2">
          <span className="rounded-md border border-violet-500/30 bg-violet-500/10 px-2 py-0.5 text-xs text-violet-300">
            開発中
          </span>
          {game.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="rounded-md border border-zinc-700/80 bg-zinc-800/60 px-2 py-0.5 text-xs text-zinc-400"
            >
              {tag}
            </span>
          ))}
        </div>
        <p className="mt-2 font-semibold text-white">{game.title}</p>
        <p className="mt-1 line-clamp-2 text-xs text-zinc-500">{game.lead}</p>
        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-zinc-500">
          <span className="inline-flex items-center gap-1">
            <span className="relative size-5 overflow-hidden rounded-full bg-zinc-800">
              <Image src={game.developer.avatar} alt="" fill className="object-cover" />
            </span>
            {game.developer.name}
          </span>
          <span className="inline-flex items-center gap-1">
            <Users className="size-3.5 text-violet-400" aria-hidden="true" />
            見届け {game.witnessCount.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
}

function ContextSidebar({ game }: { game: GameDetailV0 }) {
  return (
    <aside className="space-y-5">
      <section className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-4">
        <h3 className="text-sm font-semibold text-white">フィードバックについて</h3>
        <p className="mt-2 text-xs leading-relaxed text-zinc-500">
          あなたのフィードバックは開発のヒントになります。公開され、コミュニティの参考にもなります。
        </p>
      </section>
      <section className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-4">
        <h3 className="text-sm font-semibold text-white">開発者が聞きたいこと</h3>
        <p className="mt-2 text-xs leading-relaxed text-zinc-400">{game.developerWorry}</p>
        <ul className="mt-3 space-y-2">
          {game.wantedVoices.map((voice) => (
            <li
              key={voice}
              className="flex items-start gap-2 text-xs text-zinc-400"
            >
              <Compass className="mt-0.5 size-3.5 shrink-0 text-violet-400" aria-hidden="true" />
              {voice}
            </li>
          ))}
        </ul>
        <button
          type="button"
          className="mt-3 rounded-lg border border-zinc-700 px-3 py-2 text-xs text-zinc-400 transition-colors hover:border-zinc-600 hover:text-zinc-200"
        >
          開発ログを見る
        </button>
      </section>
    </aside>
  );
}

function ScaleRadioGroup({
  name,
  options,
  value,
  onChange,
}: {
  name: string;
  options: { id: string; label: string }[];
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="mt-3 flex flex-wrap gap-2" role="radiogroup" aria-label={name}>
      {options.map((option) => {
        const selected = value === option.id;
        return (
          <label
            key={option.id}
            className={`cursor-pointer rounded-lg border px-3 py-2 text-xs transition-colors ${
              selected
                ? "border-violet-500/50 bg-violet-500/15 text-violet-200"
                : "border-zinc-700 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200"
            }`}
          >
            <input
              type="radio"
              name={name}
              value={option.id}
              checked={selected}
              onChange={() => onChange(option.id)}
              className="sr-only"
            />
            {option.label}
          </label>
        );
      })}
    </div>
  );
}

export function PlayStubV0Modal({
  game,
  onClose,
  onPlayComplete,
}: {
  game: GameDetailV0;
  onClose: () => void;
  onPlayComplete: () => void;
}) {
  return (
    <ModalShell title="プレイを開始" subtitle={game.title} onClose={onClose} size="md">
      <div className="space-y-4 px-5 py-5 sm:px-6 sm:py-6">
        <GameSummaryCard game={game} />
        <p className="text-sm leading-relaxed text-zinc-400">
          この画面でプレイ体験を始めます。本番ではブラウザや Steam など、作品ごとのプレイ環境に移動します。
        </p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={onPlayComplete}
            className="rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-violet-500"
          >
            プレイをはじめる
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-zinc-700 px-5 py-3 text-sm text-zinc-400 transition-colors hover:border-zinc-600 hover:text-zinc-200"
          >
            キャンセル
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

export function FirstVoiceV0Modal({
  game,
  onClose,
  onOpenFullForm,
  onSubmitQuick,
}: {
  game: GameDetailV0;
  onClose: () => void;
  onOpenFullForm: () => void;
  onSubmitQuick: (answerLabel: string) => void;
}) {
  const [answer, setAnswer] = useState("just-right");
  const selectedLabel =
    firstVoiceQuestion.options.find((option) => option.id === answer)?.label ?? "";

  return (
    <ModalShell
      title="プレイありがとう"
      subtitle="開発者から質問があります"
      onClose={onClose}
      size="lg"
    >
      <div className="space-y-5 px-5 py-5 sm:px-6 sm:py-6">
        <p className="rounded-xl border border-zinc-800/80 bg-zinc-900/50 px-4 py-3 text-sm leading-relaxed text-zinc-300">
          「{firstVoiceQuestion.preview}」
        </p>
        <div>
          <p className="text-sm font-medium text-white">{firstVoiceQuestion.question}</p>
          <ScaleRadioGroup
            name="first-voice"
            options={firstVoiceQuestion.options}
            value={answer}
            onChange={setAnswer}
          />
        </div>
        <p className="text-xs text-zinc-500">1つ答えるだけでOK。答えたくなければ閉じて大丈夫です。</p>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <button
            type="button"
            onClick={() => onSubmitQuick(selectedLabel)}
            className="rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-violet-500"
          >
            この回答を送信
          </button>
          <button
            type="button"
            onClick={onOpenFullForm}
            className="rounded-xl border border-violet-500/40 px-5 py-3 text-sm font-medium text-violet-200 transition-colors hover:bg-violet-500/10"
          >
            もっと詳しく伝える
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-5 py-3 text-sm text-zinc-500 transition-colors hover:text-zinc-300"
          >
            あとで
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

export function FeedbackFormV0Modal({
  game,
  onClose,
  onSubmit,
}: {
  game: GameDetailV0;
  onClose: () => void;
  onSubmit: () => void;
}) {
  const [choices, setChoices] = useState<Record<string, string>>({
    "q1-tutorial": "just-right",
    "q2-battle": "just-right",
  });
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [textAnswers, setTextAnswers] = useState<Record<string, string>>({});

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    onSubmit();
  }

  return (
    <ModalShell
      title="フィードバックを送る"
      subtitle="あなたのフィードバックが、開発のヒントになります。"
      onClose={onClose}
      size="xl"
    >
      <form onSubmit={handleSubmit} className="grid gap-6 px-5 py-5 lg:grid-cols-[minmax(0,1fr)_240px] sm:px-6 sm:py-6">
        <div className="space-y-6">
          <GameSummaryCard game={game} />

          <section>
            <h3 className="text-sm font-semibold text-white">質問に答える</h3>
            {feedbackChoiceQuestions.map((question) => (
              <div
                key={question.id}
                className="mt-4 rounded-xl border border-zinc-800/80 bg-zinc-900/30 p-4"
              >
                <p className="text-sm text-zinc-200">
                  {question.question}
                  {question.required && (
                    <span className="ml-1 text-xs text-violet-400">必須</span>
                  )}
                </p>
                <ScaleRadioGroup
                  name={question.id}
                  options={question.options}
                  value={choices[question.id] ?? ""}
                  onChange={(value) =>
                    setChoices((current) => ({ ...current, [question.id]: value }))
                  }
                />
                <textarea
                  value={reasons[question.id] ?? ""}
                  onChange={(event) =>
                    setReasons((current) => ({
                      ...current,
                      [question.id]: event.target.value,
                    }))
                  }
                  placeholder={question.reasonPlaceholder}
                  maxLength={question.reasonMaxLength}
                  rows={2}
                  className="mt-3 w-full resize-none rounded-xl border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:border-violet-500/40 focus:outline-none focus:ring-1 focus:ring-violet-500/30"
                />
                <p className="mt-1 text-right text-xs text-zinc-600">
                  {(reasons[question.id] ?? "").length}/{question.reasonMaxLength}
                </p>
              </div>
            ))}

            {feedbackTextQuestions.map((question) => (
              <div
                key={question.id}
                className="mt-4 rounded-xl border border-zinc-800/80 bg-zinc-900/30 p-4"
              >
                <p className="text-sm text-zinc-200">{question.question}</p>
                <textarea
                  value={textAnswers[question.id] ?? ""}
                  onChange={(event) =>
                    setTextAnswers((current) => ({
                      ...current,
                      [question.id]: event.target.value,
                    }))
                  }
                  placeholder={question.placeholder}
                  maxLength={question.maxLength}
                  rows={4}
                  className="mt-3 w-full resize-none rounded-xl border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:border-violet-500/40 focus:outline-none focus:ring-1 focus:ring-violet-500/30"
                />
                <p className="mt-1 text-right text-xs text-zinc-600">
                  {(textAnswers[question.id] ?? "").length}/{question.maxLength}
                </p>
              </div>
            ))}
          </section>

          <div className="flex flex-col gap-2 border-t border-zinc-800/80 pt-4 sm:flex-row">
            <button
              type="submit"
              className="rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-violet-500"
            >
              フィードバックを送信
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-zinc-700 px-5 py-3 text-sm text-zinc-400 transition-colors hover:border-zinc-600 hover:text-zinc-200"
            >
              キャンセル
            </button>
          </div>
        </div>

        <ContextSidebar game={game} />
      </form>
    </ModalShell>
  );
}

export function FeedbackSuccessV0Modal({
  game,
  onClose,
}: {
  game: GameDetailV0;
  onClose: () => void;
}) {
  return (
    <ModalShell title="フィードバックを送信しました" subtitle={game.title} onClose={onClose} size="md">
      <div className="space-y-5 px-5 py-6 text-center sm:px-6">
        <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-violet-600/15 text-violet-300">
          <MessageSquare className="size-7" aria-hidden="true" />
        </div>
        <p className="text-sm leading-relaxed text-zinc-400">
          開発者の改善の参考になります。反映されたら、見届け中の作品で変化を確認できます。
        </p>
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Link
            href="/mypage?tab=feedback"
            className="rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-violet-500"
            onClick={onClose}
          >
            FB履歴を見る
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-zinc-700 px-5 py-3 text-sm text-zinc-400 transition-colors hover:border-zinc-600 hover:text-zinc-200"
          >
            作品詳細に戻る
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

export function useFeedbackFlowLock(step: FeedbackFlowStep) {
  useEffect(() => {
    if (step === "closed") {
      return;
    }
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [step]);
}
