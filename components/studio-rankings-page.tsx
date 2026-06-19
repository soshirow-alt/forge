"use client";

import Image from "next/image";
import { useState } from "react";
import { StudioShell } from "@/components/studio-shell";
import {
  getStudioRankingList,
  studioRankingTabs,
  type StudioRankingTabId,
} from "@/lib/studio-rankings-v0-mock-data";

export function StudioRankingsPage() {
  const [activeTab, setActiveTab] = useState<StudioRankingTabId>("witness");
  const entries = getStudioRankingList(activeTab);

  return (
    <StudioShell activeNav="ranking">
      <div className="mx-auto max-w-3xl">
        <header>
          <h1 className="text-2xl font-bold text-white sm:text-3xl">Studio ランキング</h1>
          <p className="mt-2 text-sm text-zinc-400">
            成功事例と成長のヒントを見つける。売上ランキングはありません。
          </p>
        </header>

        <div className="mt-6 flex flex-wrap gap-2">
          {studioRankingTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-lg px-3 py-2 text-sm transition-colors ${
                activeTab === tab.id
                  ? "bg-violet-600/20 text-violet-200 ring-1 ring-violet-500/30"
                  : "border border-zinc-800 text-zinc-400 hover:border-zinc-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <ol className="mt-8 space-y-3">
          {entries.map((entry) => (
            <li
              key={entry.id}
              className="flex items-center gap-4 rounded-2xl border border-zinc-800 bg-zinc-900/40 px-4 py-4"
            >
              <span
                className={`flex size-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold ${
                  entry.rank === 1
                    ? "bg-amber-500/20 text-amber-300"
                    : "bg-zinc-800 text-zinc-400"
                }`}
              >
                {entry.rank}
              </span>
              <div className="relative size-12 shrink-0 overflow-hidden rounded-xl bg-zinc-800">
                <Image src={entry.image} alt="" fill className="object-cover" sizes="48px" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-white">{entry.title}</p>
                <p className="text-xs text-zinc-500">{entry.meta}</p>
              </div>
              <span className="shrink-0 text-sm font-medium text-violet-300">{entry.value}</span>
            </li>
          ))}
        </ol>
      </div>
    </StudioShell>
  );
}
