"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { PlayerShell, GameThumbnail } from "@/components/player-shell";
import { getDeveloperProfileV0 } from "@/lib/developer-profile-v0-mock-data";
import { gameDetailHref } from "@/lib/game-detail-v0-mock-data";
import { BadgeCheck, Globe, MapPin, MessageSquare, Sprout, UserPlus } from "lucide-react";

type DevTab = "overview" | "devlog" | "achievements" | "followers";

const tabs: { id: DevTab; label: string }[] = [
  { id: "overview", label: "概要" },
  { id: "devlog", label: "開発ログ" },
  { id: "achievements", label: "実績" },
  { id: "followers", label: "フォロワー" },
];

export function DeveloperProfileV0Page({ id }: { id: string }) {
  const dev = getDeveloperProfileV0(id);
  const [activeTab, setActiveTab] = useState<DevTab>("overview");

  return (
    <PlayerShell activeNav="search">
      <div className="flex flex-col gap-8 xl:flex-row">
        <div className="min-w-0 flex-1 space-y-6">
          <nav className="text-sm text-zinc-500">
            <Link href="/home" className="hover:text-violet-400">ホーム</Link>
            <span className="mx-2">›</span>
            <Link href="/search/creators" className="hover:text-violet-400">開発者を探す</Link>
            <span className="mx-2">›</span>
            <span className="text-zinc-400">{dev.name}</span>
          </nav>

          <section className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-6 sm:p-8">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
              <span className="relative mx-auto size-24 shrink-0 overflow-hidden rounded-full bg-zinc-800 sm:mx-0">
                <Image src={dev.avatar} alt="" fill className="object-cover" />
              </span>
              <div className="min-w-0 flex-1 text-center sm:text-left">
                <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                  <h1 className="text-2xl font-bold text-white">{dev.name}</h1>
                  {dev.verified && <BadgeCheck className="size-5 text-violet-400" />}
                  {dev.isNew && (
                    <span className="inline-flex items-center gap-1 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-300">
                      <Sprout className="size-3" /> 新規開発者
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-zinc-500">@{dev.handle}</p>
                <p className="mt-1 text-sm font-medium text-zinc-300">
                  {dev.followers.toLocaleString()} フォロワー
                </p>
                <p className="mt-3 text-sm leading-relaxed text-zinc-400">{dev.bio}</p>
                <div className="mt-3 flex flex-wrap items-center justify-center gap-3 text-xs text-zinc-500 sm:justify-start">
                  <span className="inline-flex items-center gap-1"><MapPin className="size-3.5" />{dev.location}</span>
                  {dev.website && (
                    <span className="inline-flex items-center gap-1"><Globe className="size-3.5" />公式サイト</span>
                  )}
                </div>
                <button
                  type="button"
                  className={`mt-5 inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold ${
                    dev.following
                      ? "border border-rose-500/40 bg-rose-500/10 text-rose-300"
                      : "bg-violet-600 text-white hover:bg-violet-500"
                  }`}
                >
                  <UserPlus className="size-4" />
                  {dev.following ? "フォロー中" : "フォロー"}
                </button>
              </div>
            </div>
          </section>

          <div className="border-b border-zinc-800/80">
            <div className="flex gap-1 overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`shrink-0 border-b-2 px-4 py-3 text-sm font-medium ${
                    activeTab === tab.id
                      ? "border-violet-500 text-violet-200"
                      : "border-transparent text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {activeTab === "overview" && (
            <div className="space-y-8">
              <section>
                <h2 className="text-base font-semibold text-white">開発中の作品（{dev.inDevGames.length}）</h2>
                <ul className="mt-4 space-y-4">
                  {dev.inDevGames.map((game) => (
                    <li key={game.id}>
                      <Link href={gameDetailHref(game.id)} className="flex gap-4 rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-4 hover:border-zinc-700">
                        <GameThumbnail src={game.image} alt={game.title} className="size-24 shrink-0" />
                        <div>
                          <span className="rounded-md border border-violet-500/30 bg-violet-500/10 px-2 py-0.5 text-xs text-violet-300">開発中</span>
                          <h3 className="mt-2 font-semibold text-white">{game.title}</h3>
                          <p className="mt-1 text-sm text-zinc-400">{game.description}</p>
                          <p className="mt-2 text-xs text-zinc-500">見届け {game.witnessCount.toLocaleString()} · 最終更新 {game.lastUpdated}</p>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
              {dev.completedGames.length > 0 && (
                <section>
                  <h2 className="text-base font-semibold text-white">完成した作品（{dev.completedGames.length}）</h2>
                  <ul className="mt-4 space-y-4">
                    {dev.completedGames.map((game) => (
                      <li key={game.id}>
                        <div className="flex gap-4 rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-4">
                          <GameThumbnail src={game.image} alt={game.title} className="size-24 shrink-0" />
                          <div>
                            <span className="rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-xs text-amber-300">🏆 完成品</span>
                            <h3 className="mt-2 font-semibold text-white">{game.title}</h3>
                            <p className="mt-2 text-xs text-zinc-500">見届け {game.witnessCount.toLocaleString()}</p>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
              <section>
                <h2 className="text-base font-semibold text-white">最近の開発ログ</h2>
                <ul className="mt-4 space-y-3">
                  {dev.recentDevlogs.map((log) => (
                    <li key={log.id} className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 px-4 py-3">
                      <p className="text-xs text-zinc-500">{log.date} · {log.gameTitle}</p>
                      <p className="mt-1 text-sm font-medium text-white">{log.title}</p>
                      <p className="mt-1 inline-flex items-center gap-1 text-xs text-zinc-500">
                        <MessageSquare className="size-3" /> {log.commentCount}
                      </p>
                    </li>
                  ))}
                </ul>
              </section>
            </div>
          )}
          {activeTab === "devlog" && (
            <ul className="space-y-3">
              {dev.recentDevlogs.map((log) => (
                <li key={log.id} className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 px-4 py-3">
                  <p className="text-xs text-zinc-500">{log.date}</p>
                  <p className="mt-1 font-medium text-white">{log.title}</p>
                </li>
              ))}
            </ul>
          )}
          {activeTab === "achievements" && (
            <div className="grid grid-cols-3 gap-4 sm:grid-cols-4">
              {dev.badges.map((b) => (
                <div key={b.id} className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-4 text-center">
                  <span className="text-2xl">{b.emoji}</span>
                  <p className="mt-2 text-xs text-zinc-400">{b.label}</p>
                </div>
              ))}
            </div>
          )}
          {activeTab === "followers" && (
            <ul className="space-y-3">
              {["しゃねこ", "みかん", "クロノス"].map((name) => (
                <li key={name} className="flex items-center gap-3 rounded-xl border border-zinc-800/80 bg-zinc-900/40 px-4 py-3">
                  <span className="size-10 rounded-full bg-zinc-800" />
                  <span className="text-sm text-zinc-300">{name}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <aside className="w-full shrink-0 space-y-5 xl:w-72">
          <section className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-5">
            <h2 className="text-sm font-semibold text-white">開発者の実績</h2>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-center">
              {[
                ["開発中", dev.stats.inDevelopment],
                ["完成", dev.stats.completed],
                ["フォロワー", dev.stats.followers.toLocaleString()],
                ["総プレイ", dev.stats.totalPlays.toLocaleString()],
              ].map(([label, value]) => (
                <div key={String(label)} className="rounded-lg bg-zinc-950/40 px-2 py-3">
                  <dt className="text-xs text-zinc-500">{label}</dt>
                  <dd className="mt-1 text-lg font-bold text-white">{value}</dd>
                </div>
              ))}
            </dl>
          </section>
          <section className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-5">
            <h2 className="text-sm font-semibold text-white">バッジ</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {dev.badges.map((b) => (
                <span key={b.id} className="rounded-full border border-zinc-700 px-2 py-1 text-xs text-zinc-400">
                  {b.emoji} {b.label}
                </span>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </PlayerShell>
  );
}
