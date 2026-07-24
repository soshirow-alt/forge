import Link from "next/link";
import { ExplorePrototypeThumb } from "@/components/explore-prototype/explore-prototype-thumb";
import type { ExplorePrototypeWork } from "@/lib/prototype/explore-prototype";
import {
  getExplorePrototypeCtaLabel,
  getExplorePrototypeDetailHref,
  resolveExplorePrototypeThumbnail,
  takeChips,
} from "@/lib/prototype/explore-prototype";

function primaryAttribute(work: ExplorePrototypeWork): string {
  if (work.category === "game") return work.genre;
  return work.kind;
}

/**
 * Compact related-work card for detail footers (not the full list card).
 */
export function ExplorePrototypeRelatedCard({
  work,
}: {
  work: ExplorePrototypeWork;
}) {
  const href = getExplorePrototypeDetailHref(work);
  const thumb = resolveExplorePrototypeThumbnail(work);
  const cta = getExplorePrototypeCtaLabel(work.category);
  const tags = takeChips(work.tags, 1);

  return (
    <article className="flex h-full min-w-0 flex-col overflow-hidden rounded-xl border border-zinc-800/80 bg-zinc-900/40 transition-[border-color,background-color] hover:border-zinc-700/90 hover:bg-zinc-900/55">
      <Link
        href={href}
        className="flex min-h-0 min-w-0 flex-1 flex-col focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-inset"
      >
        <ExplorePrototypeThumb
          src={thumb.src}
          alt={work.thumbnailAlt}
          fit="cover"
          frameClassName="aspect-[16/10] w-full shrink-0"
        />
        <div className="flex flex-1 flex-col gap-1.5 p-3">
          <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-semibold leading-snug text-white">
            {work.title}
          </h3>
          <div className="flex min-w-0 flex-nowrap items-center gap-1 overflow-hidden text-[10px] text-zinc-400">
            <span className="shrink-0 truncate rounded-md border border-zinc-800 bg-zinc-900/60 px-1.5 py-0.5">
              {work.phase}
            </span>
            <span className="shrink-0 truncate rounded-md border border-zinc-800 bg-zinc-900/60 px-1.5 py-0.5">
              {primaryAttribute(work)}
            </span>
            {tags.shown.map((tag) => (
              <span
                key={tag}
                className="shrink-0 truncate rounded-md border border-zinc-800 bg-zinc-900/60 px-1.5 py-0.5"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </Link>
      <div className="mt-auto shrink-0 border-t border-zinc-800/80 px-3 py-2">
        <Link
          href={href}
          aria-label={`${work.title}を${cta}`}
          className="inline-flex h-9 w-full items-center justify-center rounded-lg bg-white px-3 text-xs font-medium text-zinc-950 transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
        >
          {cta}
        </Link>
      </div>
    </article>
  );
}
