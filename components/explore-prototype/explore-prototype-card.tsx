"use client";

import { MessageSquare, Users } from "lucide-react";
import type { ExplorePrototypeWork } from "@/lib/prototype/explore-prototype";
import {
  getExplorePrototypeCtaLabel,
  resolveExplorePrototypeThumbnail,
  takeChips,
} from "@/lib/prototype/explore-prototype";

function MetaChip({ label }: { label: string }) {
  return (
    <span className="inline-flex max-w-full truncate rounded-md border border-zinc-700/90 bg-zinc-900/80 px-1.5 py-0.5 text-[10px] font-medium text-zinc-300">
      {label}
    </span>
  );
}

function CreatorRow({
  name,
  initials,
}: {
  name: string;
  initials: string;
}) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <span
        className="inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-violet-600/30 text-[10px] font-semibold text-violet-100 ring-1 ring-violet-500/40"
        aria-hidden="true"
      >
        {initials.slice(0, 2)}
      </span>
      <span className="truncate text-xs text-zinc-400">{name}</span>
    </div>
  );
}

function CategoryJudgment({ work }: { work: ExplorePrototypeWork }) {
  if (work.category === "game") {
    const platforms = takeChips(work.platforms, 2);
    return (
      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-zinc-500">
        {work.estimatedPlayTime ? (
          <span>想定 {work.estimatedPlayTime}</span>
        ) : null}
        {platforms.shown.map((item) => (
          <span key={item}>{item}</span>
        ))}
        {platforms.overflow > 0 ? <span>+{platforms.overflow}</span> : null}
      </div>
    );
  }

  if (work.category === "audio") {
    return (
      <div className="text-[11px] text-zinc-500">再生時間 {work.durationLabel}</div>
    );
  }

  if (work.category === "dev-tool") {
    const envs = takeChips(work.environments, 2);
    return (
      <div className="space-y-0.5 text-[11px] text-zinc-500">
        <div className="flex flex-wrap gap-x-2 gap-y-0.5">
          {envs.shown.map((item) => (
            <span key={item}>{item}</span>
          ))}
          {envs.overflow > 0 ? <span>+{envs.overflow}</span> : null}
        </div>
        <div>{work.usageMethod}</div>
      </div>
    );
  }

  const envs = takeChips(work.environments, 2);
  return (
    <div className="flex flex-wrap gap-x-2 gap-y-0.5 text-[11px] text-zinc-500">
      {envs.shown.map((item) => (
        <span key={item}>{item}</span>
      ))}
      {envs.overflow > 0 ? <span>+{envs.overflow}</span> : null}
    </div>
  );
}

function KindGenreTags({ work }: { work: ExplorePrototypeWork }) {
  const chips: string[] = [];
  let tagOverflow = 0;

  if (work.category === "game") {
    chips.push(work.genre);
    const tags = takeChips(work.tags, 2);
    chips.push(...tags.shown);
    tagOverflow = tags.overflow;
  } else if (work.category === "audio") {
    chips.push(work.kind);
    if (work.genre) chips.push(work.genre);
    const tags = takeChips(work.tags, 2);
    chips.push(...tags.shown);
    tagOverflow = tags.overflow;
  } else {
    chips.push(work.kind);
    const tags = takeChips(work.tags, 2);
    chips.push(...tags.shown);
    tagOverflow = tags.overflow;
  }

  return (
    <div className="flex flex-wrap items-center gap-1">
      <MetaChip label={work.phase} />
      {chips.map((label, index) => (
        <MetaChip key={`${label}-${index}`} label={label} />
      ))}
      {tagOverflow > 0 ? <MetaChip label={`+${tagOverflow}`} /> : null}
    </div>
  );
}

type ExplorePrototypeCardProps = {
  work: ExplorePrototypeWork;
  onOpen: (work: ExplorePrototypeWork) => void;
};

/**
 * Prototype discovery card — mirrors public card density without touching formal game cards.
 */
export function ExplorePrototypeCard({ work, onOpen }: ExplorePrototypeCardProps) {
  const cta = getExplorePrototypeCtaLabel(work.category);
  const thumb = resolveExplorePrototypeThumbnail(work);

  return (
    <article className="flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-zinc-800/90 bg-zinc-900/40 shadow-lg shadow-black/20">
      <button
        type="button"
        onClick={() => onOpen(work)}
        className="flex w-full min-w-0 flex-1 flex-col text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
        aria-label={`${work.title}の詳細（プロトタイプ）`}
      >
        <div className="relative aspect-video overflow-hidden bg-zinc-950">
          {/* Local SVG assets — img avoids next/image SVG optimizer constraints */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={thumb.src}
            alt={work.thumbnailAlt}
            className="absolute inset-0 h-full w-full object-cover"
          />
        </div>

        <div className="flex flex-1 flex-col gap-2 p-3 sm:p-3.5">
          <div className="min-w-0 space-y-1">
            <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-semibold leading-snug text-zinc-50">
              {work.title}
            </h3>
            <p className="line-clamp-2 min-h-[2.25rem] text-xs leading-relaxed text-zinc-400">
              {work.lead}
            </p>
          </div>

          <CreatorRow name={work.creatorName} initials={work.creatorInitials} />

          <div className="min-h-[3.25rem]">
            <KindGenreTags work={work} />
          </div>
          <div className="min-h-[2rem]">
            <CategoryJudgment work={work} />
          </div>

          <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-zinc-500">
            <span className="inline-flex items-center gap-1">
              <MessageSquare className="size-3.5 text-violet-400" aria-hidden="true" />
              フィードバック {work.feedbackCount}
            </span>
            <span className="inline-flex items-center gap-1">
              <Users className="size-3.5 text-violet-400" aria-hidden="true" />
              フォロー {work.followCount}
            </span>
            <span className="w-full truncate sm:w-auto">{work.updatedLabel}</span>
          </div>
        </div>
      </button>

      <div className="border-t border-zinc-800/80 px-3 py-2.5 sm:px-3.5">
        <button
          type="button"
          onClick={() => onOpen(work)}
          aria-label={`${work.title}を${cta}`}
          className="inline-flex w-full items-center justify-center rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 px-3 py-1.5 text-xs font-semibold text-zinc-950 transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
        >
          {cta}
        </button>
      </div>
    </article>
  );
}
