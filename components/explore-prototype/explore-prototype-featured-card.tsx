"use client";

import Link from "next/link";
import { ArrowRight, Gamepad2, Headphones, MessageSquare, Users, Wrench } from "lucide-react";
import { ExplorePrototypeThumb } from "@/components/explore-prototype/explore-prototype-thumb";
import type { ExplorePrototypeWork } from "@/lib/prototype/explore-prototype";
import {
  getExplorePrototypeCategory,
  getExplorePrototypeDetailHref,
  getExplorePrototypePrimaryUsageLabel,
  resolveExplorePrototypeThumbnail,
} from "@/lib/prototype/explore-prototype";

function PrimaryUsageIcon({
  category,
}: {
  category: ExplorePrototypeWork["category"];
}) {
  if (category === "game") {
    return <Gamepad2 className="size-3.5 text-violet-400" aria-hidden="true" />;
  }
  if (category === "audio") {
    return <Headphones className="size-3.5 text-violet-400" aria-hidden="true" />;
  }
  return <Wrench className="size-3.5 text-violet-400" aria-hidden="true" />;
}

/**
 * Explore Prototype featured center card — Production FeaturedGameCard hierarchy,
 * without fake extra screenshot slots.
 */
export function ExplorePrototypeFeaturedCard({
  work,
}: {
  work: ExplorePrototypeWork;
}) {
  const meta = getExplorePrototypeCategory(work.category);
  const thumb = resolveExplorePrototypeThumbnail(work);
  const href = getExplorePrototypeDetailHref(work);
  const primaryLabel = getExplorePrototypePrimaryUsageLabel(work.category);
  const categoryLabel = meta?.label ?? work.category;

  return (
    <div className="flex w-full flex-col overflow-hidden rounded-xl border border-zinc-800/80 bg-zinc-900/40 shadow-xl md:h-[350px] md:flex-row">
      <div className="aspect-video w-full shrink-0 bg-black md:aspect-auto md:h-full md:w-[620px]">
        <ExplorePrototypeThumb
          src={thumb.src}
          alt={work.thumbnailAlt}
          fit="contain"
          objectPosition="object-center"
          frameClassName="h-full w-full rounded-none bg-black"
        />
      </div>

      <div className="flex flex-1 flex-col gap-4 p-5">
        <div className="flex min-h-0 flex-1 flex-col gap-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-violet-400">
            {categoryLabel}
          </p>
          <h2 className="text-pretty text-lg font-bold leading-tight text-white">
            {work.title}
          </h2>
          <p className="text-xs text-zinc-500">
            {work.phase} · {work.updatedLabel}
          </p>
          <p className="line-clamp-2 text-sm leading-relaxed text-zinc-400">
            {work.shortDescription || work.lead}
          </p>

          <div className="mt-auto flex flex-wrap gap-x-2 gap-y-1 pt-1 text-xs text-zinc-400">
            <span className="inline-flex items-center gap-1">
              <PrimaryUsageIcon category={work.category} />
              <span>
                <span className="sr-only">{primaryLabel} </span>
                {primaryLabel} {work.primaryUsageCount.toLocaleString()}人
              </span>
            </span>
            <span className="inline-flex items-center gap-1">
              <MessageSquare className="size-3.5 text-violet-400" aria-hidden="true" />
              <span>
                <span className="sr-only">フィードバック </span>
                FB {work.feedbackCount.toLocaleString()}
              </span>
            </span>
            <span className="inline-flex items-center gap-1">
              <Users className="size-3.5 text-violet-400" aria-hidden="true" />
              <span>
                <span className="sr-only">フォロー </span>
                フォロー {work.followCount.toLocaleString()}
              </span>
            </span>
          </div>
        </div>

        <Link
          href={href}
          className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-white px-3 py-2 text-sm font-medium text-zinc-950 transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
        >
          詳しく見る
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}
