"use client";

import { useState } from "react";
import { Compass, ChevronDown, Sparkles } from "lucide-react";
import type { GameDetailV0 } from "@/lib/game-detail-v0-mock-data";

function FeatureCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-4">
      <div className="flex size-9 items-center justify-center rounded-lg bg-violet-600/15 text-violet-300">
        <Sparkles className="size-4" aria-hidden="true" />
      </div>
      <h3 className="mt-3 text-sm font-semibold text-white">{title}</h3>
      <p className="mt-1.5 text-xs leading-relaxed text-zinc-500">{description}</p>
    </div>
  );
}

export function GameDetailOverviewV0Tab({
  game,
  editable = false,
  hideVersionQuestions = false,
  onSave,
  onFeedback,
  feedbackCtaLabel = "フィードバックする",
}: {
  game: GameDetailV0;
  editable?: boolean;
  /** Studio 概要など — 質問は ver ごとの開発ログ投稿で設定する */
  hideVersionQuestions?: boolean;
  onSave?: () => void;
  onFeedback?: () => void;
  feedbackCtaLabel?: string;
}) {
  const [introExpanded, setIntroExpanded] = useState(false);
  const [introduction, setIntroduction] = useState(game.introduction);
  const [developerWorry, setDeveloperWorry] = useState(game.developerWorry);
  const [wantedVoices, setWantedVoices] = useState(game.wantedVoices.join("\n"));

  const introPreview =
    introduction.length > 120 && !introExpanded
      ? `${introduction.slice(0, 120)}…`
      : introduction;

  const showVersionQuestions = !hideVersionQuestions;

  return (
    <div
      className={
        showVersionQuestions ? "grid gap-6 lg:grid-cols-2" : "mx-auto max-w-3xl space-y-6"
      }
    >
      <div className="space-y-6">
        <section className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-5 sm:p-6">
          <h2 className="text-base font-semibold text-white">作品紹介</h2>
          {editable ? (
            <textarea
              value={introduction}
              onChange={(event) => setIntroduction(event.target.value)}
              rows={6}
              className="mt-3 w-full rounded-xl border border-zinc-800 bg-zinc-950/80 px-3 py-2.5 text-sm leading-relaxed text-zinc-200 focus:border-violet-500/40 focus:outline-none"
            />
          ) : (
            <>
              <p className="mt-3 text-sm leading-relaxed text-zinc-400">{introPreview}</p>
              {introduction.length > 120 && (
                <button
                  type="button"
                  onClick={() => setIntroExpanded((value) => !value)}
                  className="mt-2 inline-flex items-center gap-1 text-sm text-violet-400 transition-colors hover:text-violet-300"
                >
                  {introExpanded ? "閉じる" : "もっと見る"}
                  <ChevronDown
                    className={`size-4 transition-transform ${introExpanded ? "rotate-180" : ""}`}
                    aria-hidden="true"
                  />
                </button>
              )}
            </>
          )}
          {editable && hideVersionQuestions && (
            <button
              type="button"
              onClick={onSave}
              className="mt-4 w-full rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-violet-500"
            >
              概要を保存
            </button>
          )}
        </section>

        <section>
          <h2 className="text-base font-semibold text-white">作品の特徴</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {game.features.map((feature) => (
              <FeatureCard
                key={feature.title}
                title={feature.title}
                description={feature.description}
              />
            ))}
          </div>
        </section>
      </div>

      {showVersionQuestions && (
      <div className="space-y-6">
        <section className="rounded-2xl border border-violet-500/20 bg-violet-500/5 p-5 sm:p-6">
          <h2 className="text-base font-semibold text-white">開発者が聞きたいこと</h2>
          {editable ? (
            <textarea
              value={developerWorry}
              onChange={(event) => setDeveloperWorry(event.target.value)}
              rows={3}
              className="mt-3 w-full rounded-xl border border-zinc-800 bg-zinc-950/80 px-3 py-2.5 text-sm text-zinc-200 focus:border-violet-500/40 focus:outline-none"
            />
          ) : (
            <p className="mt-3 text-sm leading-relaxed text-zinc-400">{game.developerWorry}</p>
          )}
          <h3 className="mt-5 text-sm font-medium text-zinc-300">回答してほしい項目</h3>
          {editable ? (
            <textarea
              value={wantedVoices}
              onChange={(event) => setWantedVoices(event.target.value)}
              rows={5}
              placeholder="1行に1項目"
              className="mt-3 w-full rounded-xl border border-zinc-800 bg-zinc-950/80 px-3 py-2.5 text-sm text-zinc-200 focus:border-violet-500/40 focus:outline-none"
            />
          ) : (
            <ul className="mt-3 space-y-3">
              {game.wantedVoices.map((voice) => (
                <li
                  key={voice}
                  className="flex items-start gap-3 rounded-xl border border-zinc-800/80 bg-zinc-950/40 px-4 py-3 text-sm text-zinc-300"
                >
                  <Compass className="mt-0.5 size-4 shrink-0 text-violet-400" aria-hidden="true" />
                  {voice}
                </li>
              ))}
            </ul>
          )}
        </section>

        {!editable && onFeedback && (
          <button
            type="button"
            onClick={onFeedback}
            className="w-full rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-violet-500"
          >
            {feedbackCtaLabel}
          </button>
        )}

        {editable && (
          <button
            type="button"
            onClick={onSave}
            className="w-full rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-violet-500"
          >
            概要を保存
          </button>
        )}
      </div>
      )}
    </div>
  );
}
