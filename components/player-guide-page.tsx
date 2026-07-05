"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { GuideStudioEntrySection } from "@/components/guide-studio-entry-section";
import { PlayerShell } from "@/components/player-shell";
import { RegisteredOnlyLink } from "@/components/registered-account-prompt-provider";
import { playerGuideFaq, playerGuideSteps } from "@/lib/player-guide-v0-content";

function FaqItem({
  question,
  answer,
  open,
  onToggle,
}: {
  question: string;
  answer: string;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left sm:px-5 sm:py-4"
      >
        <span className="text-sm font-medium text-zinc-200">{question}</span>
        <ChevronDown
          className={`size-4 shrink-0 text-zinc-500 transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </button>
      {open && (
        <p className="border-t border-zinc-800/80 px-4 py-3 text-sm leading-relaxed text-zinc-500 sm:px-5">
          {answer}
        </p>
      )}
    </div>
  );
}

export function PlayerGuidePage() {
  const [openFaqId, setOpenFaqId] = useState<string | null>(playerGuideFaq[0]?.id ?? null);

  return (
    <PlayerShell activeNav="guide">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-2xl font-bold text-white">はじめてガイド</h1>
        <p className="mt-2 text-sm leading-relaxed text-zinc-500">
          Forge での遊び方 — 作品を見つけ、フィードバックし、育つ過程を一緒に楽しみましょう。
        </p>

        <section className="mt-8">
          <h2 className="text-lg font-semibold text-white">プレイヤーの流れ</h2>
          <ol className="mt-5 space-y-0">
            {playerGuideSteps.map((step, index) => (
              <li key={step.label} className="relative flex gap-4 pb-8 last:pb-0">
                {index < playerGuideSteps.length - 1 && (
                  <span
                    className="absolute left-4 top-10 h-[calc(100%-2rem)] w-px bg-zinc-800"
                    aria-hidden="true"
                  />
                )}
                <span className="relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full bg-violet-600/20 text-sm font-bold text-violet-200 ring-1 ring-violet-500/30">
                  {index + 1}
                </span>
                <div className="pt-0.5">
                  <p className="font-semibold text-zinc-200">{step.label}</p>
                  <p className="mt-1 text-sm text-zinc-500">{step.description}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <GuideStudioEntrySection />

        <section className="mt-10">
          <h2 className="text-lg font-semibold text-white">よくある質問</h2>
          <div className="mt-4 space-y-2">
            {playerGuideFaq.map((item) => (
              <FaqItem
                key={item.id}
                question={item.question}
                answer={item.answer}
                open={openFaqId === item.id}
                onToggle={() =>
                  setOpenFaqId((current) => (current === item.id ? null : item.id))
                }
              />
            ))}
          </div>
        </section>

        <div className="mt-10 flex flex-wrap gap-3">
          <Link
            href="/search"
            className="rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-violet-500"
          >
            作品を探す
          </Link>
          <RegisteredOnlyLink
            href="/mypage"
            className="rounded-xl border border-zinc-700 px-5 py-2.5 text-sm font-medium text-zinc-300 hover:border-zinc-600"
          >
            マイページへ
          </RegisteredOnlyLink>
        </div>
      </div>
    </PlayerShell>
  );
}
