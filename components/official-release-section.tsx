"use client";

import Link from "next/link";
import { CreatorLink } from "@/components/creator-link";
import { PlayTypeLabel } from "@/components/play-type-label";
import { usePlayerOfficialReleases } from "@/hooks/use-player-official-releases";
import { RELEASE_STATUS_LABELS } from "@/lib/project-release-state";

export function OfficialReleaseSection() {
  const { items } = usePlayerOfficialReleases();

  return (
    <section
      id="official-release"
      className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 scroll-mt-24"
    >
      <div className="border-l-2 border-emerald-500 pl-3">
        <h2 className="text-base font-semibold tracking-tight text-zinc-100">
          正式版に到達した作品
        </h2>
        <p className="mt-1 text-xs leading-relaxed text-zinc-500">
          あなたがプレイした作品のうち、開発者が正式版（Released）を宣言したものです。
        </p>
      </div>

      {items.length === 0 ? (
        <p className="mt-4 text-sm text-zinc-600">
          まだ正式版に到達したプレイ作品がありません。
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {items.map((item) => (
            <li
              key={item.projectId}
              className="rounded-lg border border-zinc-800/80 bg-zinc-950/40 px-4 py-3"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <Link
                    href={`/games/${item.projectId}`}
                    className="text-sm font-medium text-zinc-100 transition-colors hover:text-orange-400"
                  >
                    {item.game.title}
                  </Link>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-zinc-600">
                    <CreatorLink name={item.game.creator} />
                    <PlayTypeLabel playUrl={item.game.playUrl} />
                  </div>
                </div>
                <span className="shrink-0 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-xs text-emerald-200">
                  {RELEASE_STATUS_LABELS[item.currentStatus]}
                </span>
              </div>

              <dl className="mt-3 grid gap-1 text-xs text-zinc-500">
                {item.firstReleasedLabel ? (
                  <div className="flex gap-2">
                    <dt className="shrink-0 text-zinc-600">初回 Released</dt>
                    <dd>{item.firstReleasedLabel}</dd>
                  </div>
                ) : null}
                <div className="flex gap-2">
                  <dt className="shrink-0 text-zinc-600">履歴</dt>
                  <dd>{item.eventCount} イベント（再調整しても消えません）</dd>
                </div>
              </dl>

              <Link
                href={`/mypage#play-history`}
                className="mt-3 inline-flex text-xs font-medium text-orange-400/90 transition-colors hover:text-orange-300"
              >
                プレイ履歴で詳細を見る →
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
