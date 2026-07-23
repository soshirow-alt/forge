import Link from "next/link";
import { MessageSquare, Users } from "lucide-react";
import { ExplorePrototypeThumb } from "@/components/explore-prototype/explore-prototype-thumb";
import type { ExplorePrototypeWork } from "@/lib/prototype/explore-prototype";
import {
  getExplorePrototypeCtaLabel,
  getExplorePrototypeDetailHref,
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

function CreatorPhaseRow({
  name,
  initials,
  phase,
}: {
  name: string;
  initials: string;
  phase: string;
}) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <span
        className="inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-violet-600/30 text-[9px] font-semibold text-violet-100 ring-1 ring-violet-500/40"
        aria-hidden="true"
      >
        {initials.slice(0, 2)}
      </span>
      <span className="min-w-0 flex-1 truncate text-xs text-zinc-400">{name}</span>
      <MetaChip label={phase} />
    </div>
  );
}

function CategoryJudgment({ work }: { work: ExplorePrototypeWork }) {
  if (work.category === "game") {
    const platforms = takeChips(work.platforms, 2);
    return (
      <div className="flex min-w-0 flex-nowrap items-center gap-x-2 overflow-hidden text-[11px] text-zinc-500">
        {work.estimatedPlayTime ? (
          <span className="shrink-0 truncate">想定 {work.estimatedPlayTime}</span>
        ) : null}
        {platforms.shown.map((item) => (
          <span key={item} className="shrink-0 truncate">
            {item}
          </span>
        ))}
        {platforms.overflow > 0 ? (
          <span className="shrink-0">+{platforms.overflow}</span>
        ) : null}
      </div>
    );
  }

  if (work.category === "audio") {
    return (
      <div className="truncate text-[11px] text-zinc-500">
        再生時間 {work.durationLabel}
      </div>
    );
  }

  if (work.category === "dev-tool") {
    const envs = takeChips(work.environments, 2);
    return (
      <div className="flex min-w-0 flex-nowrap items-center gap-x-2 overflow-hidden text-[11px] text-zinc-500">
        {envs.shown.map((item) => (
          <span key={item} className="shrink-0 truncate">
            {item}
          </span>
        ))}
        {envs.overflow > 0 ? <span className="shrink-0">+{envs.overflow}</span> : null}
        <span className="min-w-0 truncate">{work.usageMethod}</span>
      </div>
    );
  }

  const envs = takeChips(work.environments, 2);
  return (
    <div className="flex min-w-0 flex-nowrap items-center gap-x-2 overflow-hidden text-[11px] text-zinc-500">
      {envs.shown.map((item) => (
        <span key={item} className="shrink-0 truncate">
          {item}
        </span>
      ))}
      {envs.overflow > 0 ? <span className="shrink-0">+{envs.overflow}</span> : null}
    </div>
  );
}

/** Phase is shown beside creator — chips here are kind/genre + tags (max 3 + overflow). */
function KindGenreTags({ work }: { work: ExplorePrototypeWork }) {
  const chips: string[] = [];

  if (work.category === "game") {
    chips.push(work.genre, ...work.tags);
  } else if (work.category === "audio") {
    chips.push(work.kind);
    if (work.genre) chips.push(work.genre);
    chips.push(...work.tags);
  } else {
    chips.push(work.kind, ...work.tags);
  }

  const visible = chips.slice(0, 3);
  const chipOverflow = Math.max(0, chips.length - visible.length);

  return (
    <div className="flex min-w-0 flex-nowrap items-center gap-1 overflow-hidden">
      {visible.map((label, index) => (
        <MetaChip key={`${label}-${index}`} label={label} />
      ))}
      {chipOverflow > 0 ? <MetaChip label={`+${chipOverflow}`} /> : null}
    </div>
  );
}

type ExplorePrototypeCardProps = {
  work: ExplorePrototypeWork;
};

/**
 * Prototype discovery card — compact vertical density; width/columns unchanged.
 * Whole card + CTA link to detail (no nested interactive conflict beyond sibling links).
 */
export function ExplorePrototypeCard({ work }: ExplorePrototypeCardProps) {
  const cta = getExplorePrototypeCtaLabel(work.category);
  const thumb = resolveExplorePrototypeThumbnail(work);
  const href = getExplorePrototypeDetailHref(work);

  return (
    <article className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-zinc-800/90 bg-zinc-900/40 shadow-lg shadow-black/20">
      <Link
        href={href}
        className="flex w-full min-w-0 flex-col text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
        aria-label={`${work.title}の詳細`}
      >
        <ExplorePrototypeThumb
          src={thumb.src}
          alt={work.thumbnailAlt}
          fit="cover"
          objectPosition="object-[center_35%]"
          frameClassName="h-36 w-full shrink-0 xl:h-40"
        />

        <div className="flex flex-col gap-1.5 p-3">
          <div className="min-w-0 space-y-0.5">
            <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-zinc-50">
              {work.title}
            </h3>
            <p className="line-clamp-2 text-xs leading-snug text-zinc-400">{work.lead}</p>
          </div>

          <CreatorPhaseRow
            name={work.creatorName}
            initials={work.creatorInitials}
            phase={work.phase}
          />

          <KindGenreTags work={work} />
          <CategoryJudgment work={work} />

          <div className="flex min-w-0 flex-nowrap items-center gap-x-2.5 overflow-hidden text-[11px] text-zinc-500">
            <span className="inline-flex shrink-0 items-center gap-1">
              <MessageSquare className="size-3 text-violet-400" aria-hidden="true" />
              FB {work.feedbackCount}
            </span>
            <span className="inline-flex shrink-0 items-center gap-1">
              <Users className="size-3 text-violet-400" aria-hidden="true" />
              フォロー {work.followCount}
            </span>
            <span className="min-w-0 truncate">{work.updatedLabel}</span>
          </div>
        </div>
      </Link>

      <div className="border-t border-zinc-800/80 px-3 py-2">
        <Link
          href={href}
          aria-label={`${work.title}を${cta}`}
          className="inline-flex h-9 w-full items-center justify-center rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 px-3 text-xs font-semibold text-zinc-950 transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
        >
          {cta}
        </Link>
      </div>
    </article>
  );
}
