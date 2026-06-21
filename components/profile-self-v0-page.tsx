"use client";

import Image from "next/image";
import Link from "next/link";
import { PlayerShell } from "@/components/player-shell";
import { profileSelfMock } from "@/lib/profile-v0-mock-data";
import { MapPin, Pencil, Sparkles } from "lucide-react";

export function ProfileSelfV0Page() {
  const profile = profileSelfMock;

  return (
    <PlayerShell activeNav="mypage">
      <div className="mx-auto max-w-4xl space-y-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-violet-300">プロフィール（自分用）</p>
            <h1 className="mt-1 text-2xl font-bold text-white sm:text-3xl">マイプロフィール</h1>
          </div>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-xl border border-zinc-700 px-4 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:border-zinc-600 hover:text-white"
          >
            <Pencil className="size-4" aria-hidden="true" />
            プロフィールを編集
          </button>
        </div>

        <section className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-6 sm:p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
            <span className="relative mx-auto size-24 shrink-0 overflow-hidden rounded-full bg-zinc-800 sm:mx-0 sm:size-28">
              <Image src={profile.avatar} alt="" fill className="object-cover" />
            </span>
            <div className="min-w-0 flex-1 text-center sm:text-left">
              <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                <h2 className="text-xl font-bold text-white">{profile.displayName}</h2>
                <span className="rounded-full border border-violet-500/40 bg-violet-500/10 px-2.5 py-0.5 text-xs font-semibold text-violet-200">
                  Lv.{profile.level}
                </span>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-zinc-400">{profile.bio}</p>
              <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-zinc-500 sm:justify-start">
                <span className="inline-flex items-center gap-1">
                  <MapPin className="size-3.5" aria-hidden="true" />
                  {profile.location}
                </span>
                <span>Forge参加 {profile.joinedAt}</span>
                <span>最終ログイン {profile.lastLogin}</span>
              </div>
            </div>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "送ったFB", value: profile.stats.feedbackCount },
              { label: "共感された回数", value: profile.stats.voicesReceived },
              { label: "フォロー中開発者", value: profile.stats.followingDevelopers },
              { label: "見届け中", value: profile.stats.witnessingGames },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl border border-zinc-800/80 bg-zinc-950/40 px-4 py-3 text-center"
              >
                <p className="text-lg font-bold text-white">{stat.value}</p>
                <p className="mt-1 text-xs text-zinc-500">{stat.label}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="grid gap-4 sm:grid-cols-2">
          <section className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-5">
            <h3 className="text-sm font-semibold text-white">自己紹介</h3>
            <p className="mt-3 text-sm leading-relaxed text-zinc-400">{profile.bio}</p>
          </section>
          <section className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-5">
            <h3 className="text-sm font-semibold text-white">好きなジャンル</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {profile.favoriteGenres.map((genre) => (
                <span
                  key={genre}
                  className="rounded-md border border-zinc-700/80 bg-zinc-800/60 px-2.5 py-1 text-xs text-zinc-300"
                >
                  {genre}
                </span>
              ))}
            </div>
          </section>
          <section className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-5">
            <h3 className="text-sm font-semibold text-white">よく使うタグ</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {profile.frequentTags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-md border border-violet-500/20 bg-violet-500/5 px-2.5 py-1 text-xs text-violet-200"
                >
                  {tag}
                </span>
              ))}
            </div>
          </section>
          <section className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-5">
            <h3 className="text-sm font-semibold text-white">ハイライト実績</h3>
            <div className="mt-4 grid grid-cols-4 gap-3">
              {profile.highlightBadges.map((badge) => (
                <div key={badge.id} className="text-center">
                  <span className="flex size-12 items-center justify-center rounded-full border border-zinc-700 bg-zinc-800/60 text-lg mx-auto">
                    {badge.emoji}
                  </span>
                  <p className="mt-2 text-[10px] leading-tight text-zinc-500">{badge.label}</p>
                </div>
              ))}
            </div>
            <Link
              href="/mypage?tab=achievements"
              className="mt-4 inline-block text-xs text-violet-400 transition-colors hover:text-violet-300"
            >
              すべて見る →
            </Link>
          </section>
        </div>

        <section className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">最近の活動</h3>
            <Link
              href="/mypage?tab=feedback"
              className="text-xs text-violet-400 transition-colors hover:text-violet-300"
            >
              すべて見る
            </Link>
          </div>
          <ul className="mt-4 divide-y divide-zinc-800/80">
            {profile.recentActivity.map((entry) => (
              <li
                key={entry.id}
                className="flex items-start gap-3 py-3 first:pt-0 last:pb-0"
              >
                <Sparkles className="mt-0.5 size-4 shrink-0 text-violet-400" aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-zinc-300">{entry.label}</p>
                  <p className="mt-0.5 text-xs text-zinc-600">{entry.relativeTime}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </PlayerShell>
  );
}
