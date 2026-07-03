"use client";

import Image from "next/image";
import { MyPageTabs, PlayerShell } from "@/components/player-shell";
import { screenshotPlayHistory } from "@/lib/demo/screenshot-catalog";
import { screenshotGameHref } from "@/lib/demo/screenshot-routes";
import Link from "next/link";
import { useState } from "react";

function PlayHistoryCard({
  entry,
  defaultExpanded = false,
}: {
  entry: (typeof screenshotPlayHistory)[number];
  defaultExpanded?: boolean;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <div className="rounded-lg border border-zinc-800/80 bg-zinc-950/40">
      <button
        type="button"
        onClick={() => setExpanded((current) => !current)}
        className="flex w-full items-start gap-3 px-3 py-2.5 text-left transition-colors hover:bg-zinc-900/40"
        aria-expanded={expanded}
      >
        <div className="relative size-20 shrink-0 overflow-hidden rounded-md bg-zinc-800">
          <Image src={entry.image} alt="" fill className="object-cover" sizes="80px" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-sm font-semibold text-white">{entry.title}</h3>
            <span className="text-xs text-zinc-500">{entry.version}</span>
          </div>
          <p className="mt-1 line-clamp-2 text-xs text-zinc-500">{entry.description}</p>
          <ul className="mt-1.5 flex flex-wrap gap-1">
            {entry.tags.map((tag) => (
              <li
                key={tag}
                className="inline-flex rounded-full border border-zinc-800 bg-zinc-900/60 px-2 py-0.5 text-[10px] text-zinc-400"
              >
                {tag}
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-zinc-600">
            最終プレイ {entry.lastPlay} · {entry.playCount}回プレイ
          </p>
        </div>
        <span aria-hidden="true" className="pt-1 text-zinc-600">
          {expanded ? "▼" : "▶"}
        </span>
      </button>

      {expanded ? (
        <div className="border-t border-zinc-800/80 px-4 py-3">
          <ol className="space-y-3">
            {entry.timeline.map((line) => (
              <li key={line} className="text-sm leading-relaxed text-zinc-300">
                {line}
              </li>
            ))}
          </ol>
          <Link
            href={screenshotGameHref()}
            className="mt-3 inline-flex text-xs font-medium text-violet-400 transition-colors hover:text-violet-300"
          >
            作品を見る →
          </Link>
        </div>
      ) : null}
    </div>
  );
}

export function ScreenshotMypagePlayHistoryPage() {
  return (
    <PlayerShell activeNav="mypage">
      <MyPageTabs activeTab="play-history" onTabChange={() => {}} />
      <div role="tabpanel" className="space-y-6">
        <section
          id="play-history"
          className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 scroll-mt-24"
        >
          <div className="border-l-2 border-violet-500 pl-3">
            <h2 className="text-base font-semibold tracking-tight text-zinc-100">
              プレイ履歴
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-zinc-500">
              プレイした作品と、verごとの関わりがここに残ります。
            </p>
          </div>

          <div className="mt-4 space-y-3">
            {screenshotPlayHistory.map((entry, index) => (
              <PlayHistoryCard key={entry.title} entry={entry} defaultExpanded={index === 0} />
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
          <div className="border-l-2 border-emerald-500 pl-3">
            <h2 className="text-base font-semibold tracking-tight text-zinc-100">
              正式verに到達した作品
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-zinc-500">
              見届け人として、正式ver到達を一緒に祝えた作品です。
            </p>
          </div>
          <div className="mt-4 rounded-lg border border-zinc-800/80 bg-zinc-950/40 p-4">
            <div className="flex gap-3">
              <div className="relative size-16 shrink-0 overflow-hidden rounded-md bg-zinc-800">
                <Image
                  src="/images/landing/game-5.png"
                  alt=""
                  fill
                  className="object-cover"
                  sizes="64px"
                />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full border border-zinc-800 bg-zinc-900/60 px-2 py-0.5 text-[10px] text-zinc-400">
                    🏅 見届け人
                  </span>
                  <span className="rounded-full border border-zinc-800 bg-zinc-900/60 px-2 py-0.5 text-[10px] text-zinc-400">
                    正式ver
                  </span>
                </div>
                <h3 className="mt-2 text-sm font-semibold text-white">深淵ノート</h3>
                <p className="mt-1 text-xs text-zinc-500">v1.0.0 到達 · 1週間前</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </PlayerShell>
  );
}
