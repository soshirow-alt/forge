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
    <article className="flex min-w-0 flex-col overflow-hidden rounded-xl border border-zinc-800/90 bg-zinc-900/40">
      <Link
        href={href}
        className="flex min-w-0 flex-1 flex-col focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-inset"
      >
        <ExplorePrototypeThumb
          src={thumb.src}
          alt={work.thumbnailAlt}
          fit="cover"
          frameClassName="aspect-[16/10]"
        />
        <div className="space-y-1.5 p-3">
          <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-zinc-50">
            {work.title}
          </h3>
          <div className="flex flex-wrap gap-1 text-[10px] text-zinc-400">
            <span className="rounded-md border border-zinc-700/90 px-1.5 py-0.5">
              {work.phase}
            </span>
            <span className="rounded-md border border-zinc-700/90 px-1.5 py-0.5">
              {primaryAttribute(work)}
            </span>
            {tags.shown.map((tag) => (
              <span
                key={tag}
                className="rounded-md border border-zinc-700/90 px-1.5 py-0.5"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </Link>
      <div className="border-t border-zinc-800/80 px-3 py-2">
        <Link
          href={href}
          aria-label={`${work.title}を${cta}`}
          className="inline-flex w-full items-center justify-center rounded-lg bg-violet-600/25 px-3 py-1.5 text-xs font-semibold text-violet-100 ring-1 ring-violet-500/40 transition-colors hover:bg-violet-600/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
        >
          {cta}
        </Link>
      </div>
    </article>
  );
}
