import Link from "next/link";
import { notFound } from "next/navigation";
import { ProfileAvatar } from "@/components/profile-avatar";
import { PlayerShell } from "@/components/player-shell";
import { getPlayerPublicProfile } from "@/lib/community-player-profile-v0-mock-data";
import { Sparkles } from "lucide-react";

export function PlayerPublicProfileV0Page({
  handle,
  returnHref,
}: {
  handle: string;
  returnHref?: string;
}) {
  const profile = getPlayerPublicProfile(handle);
  if (!profile) {
    notFound();
  }

  const backHref = returnHref ?? "/home";
  const backLabel = returnHref?.includes("community") ? "コミュニティへ戻る" : "ホーム";

  return (
    <PlayerShell>
      <div className="mx-auto max-w-4xl space-y-8">
        <Link href={backHref} className="text-sm text-zinc-500 transition-colors hover:text-violet-400">
          ← {backLabel}
        </Link>

        <div>
          <p className="text-xs font-medium text-violet-300">プレイヤー・プロフィール</p>
          <h1 className="mt-1 text-2xl font-bold text-white sm:text-3xl">{profile.displayName}</h1>
          <p className="mt-2 text-sm text-zinc-500">@{profile.handle}</p>
        </div>

        <section className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-6 sm:p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
            <ProfileAvatar
              src={profile.avatar}
              alt=""
              className="mx-auto size-24 sm:mx-0 sm:size-28"
              size={112}
            />
            <div className="min-w-0 flex-1 text-center sm:text-left">
              <h2 className="text-xl font-bold text-white">{profile.displayName}</h2>
              <p className="mt-3 text-sm leading-relaxed text-zinc-400">{profile.bio}</p>
              <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-zinc-500 sm:justify-start">
                <span>Forge参加 {profile.joinedAt}</span>
                {profile.lastLogin ? <span>最終ログイン {profile.lastLogin}</span> : null}
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
          <section className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-5 sm:col-span-2">
            <h3 className="text-sm font-semibold text-white">ハイライト実績</h3>
            <div className="mt-4 grid grid-cols-4 gap-3 sm:max-w-md">
              {profile.highlightBadges.map((badge) => (
                <div key={badge.id} className="text-center">
                  <span className="mx-auto flex size-12 items-center justify-center rounded-full border border-zinc-700 bg-zinc-800/60 text-lg">
                    {badge.emoji}
                  </span>
                  <p className="mt-2 text-[10px] leading-tight text-zinc-500">{badge.label}</p>
                </div>
              ))}
            </div>
          </section>
        </div>

        <section className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-5 sm:p-6">
          <h3 className="text-sm font-semibold text-white">最近の活動</h3>
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
