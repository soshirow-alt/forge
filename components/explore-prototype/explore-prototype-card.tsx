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

/** Forge home featured CTA — white on dark, not orange. */
const LIST_CTA_CLASS =
  "inline-flex h-9 w-full items-center justify-center rounded-lg bg-white px-3 text-xs font-medium text-zinc-950 transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950";

function MetaChip({ label }: { label: string }) {
  return (
    <span className="inline-flex max-w-full truncate rounded-md border border-zinc-800 bg-zinc-900/60 px-1.5 py-0.5 text-[10px] font-medium text-zinc-400">
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
    <div className="flex h-5 min-w-0 items-center gap-2 overflow-hidden">
      <span
        className="inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-violet-600/25 text-[9px] font-semibold text-violet-100 ring-1 ring-violet-500/40"
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
      <div className="flex h-4 min-w-0 flex-nowrap items-center gap-x-2 overflow-hidden text-[11px] text-zinc-500">
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
      <div className="h-4 truncate text-[11px] text-zinc-500">
        再生時間 {work.durationLabel}
      </div>
    );
  }

  if (work.category === "dev-tool") {
    const envs = takeChips(work.environments, 2);
    return (
      <div className="flex h-4 min-w-0 flex-nowrap items-center gap-x-2 overflow-hidden text-[11px] text-zinc-500">
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
    <div className="flex h-4 min-w-0 flex-nowrap items-center gap-x-2 overflow-hidden text-[11px] text-zinc-500">
      {envs.shown.map((item) => (
        <span key={item} className="shrink-0 truncate">
          {item}
        </span>
      ))}
      {envs.overflow > 0 ? <span className="shrink-0">+{envs.overflow}</span> : null}
    </div>
  );
}

/** Phase is beside creator — chips are kind/genre + tags (max 3 + overflow). */
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
    <div className="flex h-5 min-w-0 flex-nowrap items-center gap-1 overflow-hidden">
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
 * Prototype discovery card — Forge-home visual tokens; equal height within a shelf.
 * Width / columns / list thumb height unchanged from prior compact pass.
 */
export function ExplorePrototypeCard({ work }: ExplorePrototypeCardProps) {
  const cta = getExplorePrototypeCtaLabel(work.category);
  const thumb = resolveExplorePrototypeThumbnail(work);
  const href = getExplorePrototypeDetailHref(work);

  return (
    <article className="flex h-full min-w-0 flex-col overflow-hidden rounded-xl border border-zinc-800/80 bg-zinc-900/40 transition-[border-color,background-color] hover:border-zinc-700/90 hover:bg-zinc-900/55">
      <Link
        href={href}
        className="flex min-h-0 w-full min-w-0 flex-1 flex-col text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
        aria-label={`${work.title}の詳細`}
      >
        <ExplorePrototypeThumb
          src={thumb.src}
          alt={work.thumbnailAlt}
          fit="cover"
          objectPosition="object-[center_35%]"
          frameClassName="h-36 w-full shrink-0 xl:h-40"
        />

        <div className="flex min-h-0 flex-1 flex-col gap-1.5 p-3">
          {/* Fixed 2-line slots only — no card-wide min-height */}
          <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-semibold leading-snug text-white">
            {work.title}
          </h3>
          <p className="line-clamp-2 min-h-[2.125rem] text-xs leading-snug text-zinc-400">
            {work.lead}
          </p>

          <CreatorPhaseRow
            name={work.creatorName}
            initials={work.creatorInitials}
            phase={work.phase}
          />

          <KindGenreTags work={work} />
          <CategoryJudgment work={work} />

          <div className="mt-auto flex h-4 min-w-0 flex-nowrap items-center gap-x-2.5 overflow-hidden text-[11px] text-zinc-500">
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

      <div className="mt-auto shrink-0 border-t border-zinc-800/80 px-3 py-2">
        <Link href={href} aria-label={`${work.title}を${cta}`} className={LIST_CTA_CLASS}>
          {cta}
        </Link>
      </div>
    </article>
  );
}
