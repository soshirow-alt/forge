"use client";

import Link from "next/link";
import { ProjectThumbnail } from "@/components/project-thumbnail";
import type { MypageWatchCardModel } from "@/lib/mypage-watch-cards";

function formatShortDate(iso: string | null): string | null {
  if (!iso) {
    return null;
  }
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}/${m}/${d}`;
}

function chipClass(hasUpdate: boolean, isPrimary: boolean): string {
  if (!hasUpdate) {
    return "rounded-full border border-zinc-800 bg-zinc-900/50 px-2 py-0.5 text-[10px] text-zinc-500";
  }
  if (isPrimary) {
    return "rounded-full border border-violet-500/40 bg-violet-500/15 px-2 py-0.5 text-[10px] font-medium text-violet-200";
  }
  return "rounded-full border border-zinc-700 bg-zinc-900/60 px-2 py-0.5 text-[10px] text-zinc-400";
}

export function MypageWatchCard({
  card,
  highlighted = false,
}: {
  card: MypageWatchCardModel;
  highlighted?: boolean;
}) {
  const updateDate = formatShortDate(card.meaningfulUpdateAt);
  const primaryCta =
    card.fbReflected && card.adoptionHref
      ? { label: "変化を確かめる", href: card.adoptionHref }
      : card.hasUpdate
        ? { label: "もう一度プレイする", href: card.playHref }
        : null;
  const secondaryCta = card.hasUpdate
    ? { label: "更新内容を見る", href: card.updatesHref }
    : { label: "詳細を見る", href: card.detailsHref };

  return (
    <article
      id={`watch-project-${card.projectId}`}
      className={`rounded-lg border px-3 py-2.5 transition-colors ${
        highlighted
          ? "border-violet-500/60 bg-violet-950/30 ring-1 ring-violet-500/30"
          : card.hasUpdate
            ? "border-zinc-700/80 bg-zinc-950/50"
            : "border-zinc-800/70 bg-zinc-950/30"
      }`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
        <div className="flex min-w-0 flex-1 gap-3">
          <div className="relative shrink-0 overflow-hidden rounded-md">
            <ProjectThumbnail
              projectId={card.projectId}
              title={card.game.title}
              genre={card.game.genre}
              version={card.game.playableVersion}
              variant="mini"
            />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <h3 className="truncate text-sm font-semibold text-zinc-100">
                <Link
                  href={card.detailsHref}
                  className="transition-colors hover:text-violet-200"
                >
                  {card.game.title}
                </Link>
              </h3>
              <span className="text-[11px] text-zinc-500">{card.game.genre}</span>
              <span className="text-[11px] text-zinc-600">{card.game.phase}</span>
            </div>

            <ul className="mt-1.5 flex flex-wrap gap-1">
              {card.statusChips.map((chip, index) => (
                <li
                  key={chip.id}
                  className={chipClass(card.hasUpdate, index === 0)}
                >
                  {chip.label}
                </li>
              ))}
            </ul>

            <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-zinc-500">
              {card.latestVersion ? (
                <span>最新 ver {card.latestVersion.replace(/^v/i, "")}</span>
              ) : null}
              {updateDate ? <span>更新 {updateDate}</span> : null}
            </div>

            {card.summary ? (
              <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-zinc-400">
                {card.summary}
              </p>
            ) : null}
          </div>
        </div>

        <div className="flex shrink-0 flex-row gap-2 sm:w-36 sm:flex-col sm:justify-center">
          {primaryCta ? (
            <Link
              href={primaryCta.href}
              className="inline-flex flex-1 items-center justify-center rounded-md bg-violet-600 px-2.5 py-1.5 text-center text-xs font-semibold text-white transition-colors hover:bg-violet-500 sm:flex-none"
            >
              {primaryCta.label}
            </Link>
          ) : null}
          <Link
            href={secondaryCta.href}
            className={`inline-flex flex-1 items-center justify-center rounded-md border px-2.5 py-1.5 text-center text-xs transition-colors sm:flex-none ${
              card.hasUpdate
                ? "border-zinc-600 text-zinc-200 hover:border-violet-500/40 hover:text-violet-200"
                : "border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200"
            }`}
          >
            {secondaryCta.label}
          </Link>
        </div>
      </div>
    </article>
  );
}
