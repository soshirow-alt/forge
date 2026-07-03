"use client";

import { GameDetailHeroGallery } from "@/components/game-detail-hero-gallery";
import { GameDetailPhaseBadge } from "@/components/game-detail-phase-badge";
import { GameDetailPlayerOverview } from "@/components/game-detail-player-overview";
import { GameDevlogV0Tab } from "@/components/game-devlog-v0-tab";
import { GameVoicesV0Tab } from "@/components/game-voices-v0-tab";
import { PlayerShell } from "@/components/player-shell";
import { screenshotFlagship } from "@/lib/demo/screenshot-catalog";
import {
  SCREENSHOT_FLAGSHIP_GAME_ID,
  screenshotGameHref,
  type ScreenshotGameTab,
} from "@/lib/demo/screenshot-routes";
import type {
  GameDetailOverviewActivity,
  GameDetailPlayerMeta,
} from "@/lib/game-detail-player-meta";
import { getGameDetailV0 } from "@/lib/game-detail-v0-mock-data";
import { PROJECT_TITLE_HERO_CLASS } from "@/lib/project-title";
import { Bookmark, Check, Clock, Heart, Play } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const DETAIL_TABS: { id: ScreenshotGameTab; label: string }[] = [
  { id: "overview", label: "概要" },
  { id: "devlog", label: "開発ログ" },
  { id: "voices", label: "みんなの声" },
];

function noop() {}

function GameDetailDeveloperAvatar({
  name,
  imageSrc,
}: {
  name: string;
  imageSrc: string;
}) {
  if (imageSrc) {
    return (
      <span className="relative block size-8 shrink-0 overflow-hidden rounded-full bg-zinc-800">
        <Image src={imageSrc} alt="" fill className="object-cover" sizes="32px" />
      </span>
    );
  }

  return (
    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-sm font-medium text-zinc-400">
      {name.slice(0, 1) || "?"}
    </span>
  );
}

function TagPill({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-md border border-zinc-700/80 bg-zinc-800/50 px-2.5 py-1 text-xs text-zinc-300">
      {children}
    </span>
  );
}

const screenshotPlayerMeta: GameDetailPlayerMeta = {
  phaseLabel: "通しプレイ版",
  phaseDescription: "最初から最後まで一通りプレイできる版です。",
  estimatedPlayTime: "30分〜1時間",
  environmentLabels: ["ブラウザ"],
  playInfo: {
    playTimeOptions: [
      { label: "15分以内", active: false },
      { label: "30分〜1時間", active: true },
      { label: "1時間以上", active: false },
    ],
    deviceOptions: [
      { label: "PC", active: true },
      { label: "スマホ", active: false },
    ],
    playMethodOptions: [
      { label: "ブラウザで起動", active: true },
      { label: "ダウンロード", active: false },
      { label: "外部サイトで開く", active: false },
    ],
  },
  focusNotes:
    "序盤のチュートリアルが長すぎるかもしれません。最初の「旅の実感」が出るまでの tempo について率直なフィードバックが欲しいです。",
};

const screenshotOverviewActivity: GameDetailOverviewActivity = {
  lastUpdated: screenshotFlagship.lastUpdated,
  hasDevlog: true,
  devlogLabel: "3日前 — チュートリアル短縮と序盤イベント調整",
  voiceCount: screenshotFlagship.voiceCount,
};

export function ScreenshotGameDetailPage({
  gameId,
  activeTab,
}: {
  gameId: string;
  activeTab: ScreenshotGameTab;
}) {
  const resolvedId =
    gameId === SCREENSHOT_FLAGSHIP_GAME_ID ? SCREENSHOT_FLAGSHIP_GAME_ID : gameId;
  const game = getGameDetailV0(resolvedId);

  return (
    <PlayerShell>
      <div className="flex flex-col gap-8 xl:flex-row xl:items-start">
        <div className="min-w-0 flex-1 space-y-5">
          <section className="overflow-hidden rounded-2xl border border-zinc-800/80 bg-zinc-900/30">
            <div className="grid gap-0 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
              <GameDetailHeroGallery images={game.galleryImages} />

              <div className="flex min-w-0 flex-col justify-center p-6 lg:p-8">
                <div className="flex flex-wrap gap-2">
                  {game.tags.map((tag) => (
                    <TagPill key={tag}>{tag}</TagPill>
                  ))}
                </div>
                <div className="mt-4 flex min-w-0 flex-wrap items-center gap-2">
                  <h1 className={`${PROJECT_TITLE_HERO_CLASS} text-white`}>{game.title}</h1>
                  <GameDetailPhaseBadge meta={screenshotPlayerMeta} />
                </div>
                <p className="mt-2 break-words text-sm leading-relaxed text-zinc-400">
                  {game.lead}
                </p>
                <span className="mt-4 inline-flex min-w-0 max-w-full flex-wrap items-center gap-2 break-words text-sm text-zinc-300">
                  <GameDetailDeveloperAvatar
                    name={game.developer.name}
                    imageSrc={game.developer.avatar}
                  />
                  <span className="break-words">{game.developer.name}</span>
                </span>
                <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-zinc-500">
                  <Clock className="size-3.5 shrink-0" aria-hidden="true" />
                  最終更新 {game.lastUpdated}
                </p>
              </div>
            </div>
          </section>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={noop}
              className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-violet-500"
            >
              <Play className="size-4" aria-hidden="true" />
              プレイする
            </button>
            <button
              type="button"
              onClick={noop}
              className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-2.5 text-sm font-medium text-emerald-300"
            >
              <Check className="size-4" aria-hidden="true" />
              見届け中
            </button>
            <button
              type="button"
              onClick={noop}
              className="inline-flex items-center gap-2 rounded-xl border border-zinc-700 px-4 py-2.5 text-sm font-medium text-zinc-300"
            >
              <Bookmark className="size-4" aria-hidden="true" />
              保存
            </button>
            <button
              type="button"
              onClick={noop}
              className="inline-flex items-center gap-2 rounded-xl border border-zinc-700 px-4 py-2.5 text-sm font-medium text-zinc-300"
            >
              <Heart className="size-4" aria-hidden="true" />
              応援
            </button>
          </div>

          <div className="border-b border-zinc-800/80">
            <div className="-mb-px flex gap-1 overflow-x-auto">
              {DETAIL_TABS.map((tab) => (
                <Link
                  key={tab.id}
                  href={screenshotGameHref(resolvedId, tab.id)}
                  className={`shrink-0 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? "border-violet-500 text-violet-200"
                      : "border-transparent text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  {tab.label}
                </Link>
              ))}
            </div>
          </div>

          {activeTab === "overview" && (
            <GameDetailPlayerOverview
              game={game}
              heroLead={game.lead}
              playerMeta={screenshotPlayerMeta}
              activity={screenshotOverviewActivity}
              publication={{
                labels: ["ブラウザでプレイ", "itch.io"],
              }}
            />
          )}

          {activeTab === "devlog" && (
            <GameDevlogV0Tab gameId={resolvedId} onPlayLatest={noop} />
          )}

          {activeTab === "voices" && (
            <GameVoicesV0Tab
              gameId={resolvedId}
              currentVersion={game.currentVersion}
              onSendVoice={noop}
            />
          )}
        </div>

        <aside className="w-full shrink-0 space-y-5 xl:w-72">
          <section className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-5">
            <div className="flex items-center gap-3">
              <GameDetailDeveloperAvatar
                name={game.developer.name}
                imageSrc={game.developer.avatar}
              />
              <div className="min-w-0">
                <p className="truncate font-semibold text-white">{game.developer.name}</p>
                <p className="text-xs text-zinc-500">
                  フォロワー {game.developer.followers.toLocaleString()}
                </p>
              </div>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-zinc-400">{game.developer.bio}</p>
            <button
              type="button"
              onClick={noop}
              className="mt-4 w-full rounded-xl border border-zinc-700 py-2.5 text-sm font-medium text-zinc-200 transition-colors hover:border-violet-500/40 hover:text-white"
            >
              フォロー中
            </button>
          </section>
        </aside>
      </div>
    </PlayerShell>
  );
}
