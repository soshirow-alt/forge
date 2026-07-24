import Link from "next/link";
import {
  Gamepad2,
  Headphones,
  MessageSquare,
  Users,
  Wrench,
} from "lucide-react";
import { ExplorePrototypeThumb } from "@/components/explore-prototype/explore-prototype-thumb";
import type { ExplorePrototypeWork } from "@/lib/prototype/explore-prototype";
import {
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
    return <Gamepad2 className="size-3.5 shrink-0 text-violet-400" aria-hidden="true" />;
  }
  if (category === "audio") {
    return (
      <Headphones className="size-3.5 shrink-0 text-violet-400" aria-hidden="true" />
    );
  }
  return <Wrench className="size-3.5 shrink-0 text-violet-400" aria-hidden="true" />;
}

/**
 * Lightweight discovery card — Production HorizontalGameCard hierarchy.
 * No outer border/panel, no lead/author/tags/CTA.
 */
export function ExplorePrototypeDiscoveryCard({
  work,
}: {
  work: ExplorePrototypeWork;
}) {
  const thumb = resolveExplorePrototypeThumbnail(work);
  const href = getExplorePrototypeDetailHref(work);
  const primaryLabel = getExplorePrototypePrimaryUsageLabel(work.category);

  return (
    <Link
      href={href}
      title={work.title}
      className="group block w-full min-w-0 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
      aria-label={`${work.title}の詳細`}
    >
      <article className="min-w-0">
        <ExplorePrototypeThumb
          src={thumb.src}
          alt={work.thumbnailAlt}
          fit="cover"
          objectPosition="object-[center_35%]"
          frameClassName="aspect-video w-full max-w-[380px] rounded-xl"
          className="transition-[filter] group-hover:brightness-110"
        />
        <h3
          className="mt-2 truncate text-sm font-semibold text-white transition-colors group-hover:text-violet-200"
          title={work.title}
        >
          {work.title}
        </h3>
        <p className="mt-0.5 truncate text-xs text-zinc-500">
          {work.phase} · {work.updatedLabel}
        </p>
        <div className="mt-1.5 flex min-w-0 flex-nowrap items-center gap-x-2 overflow-hidden text-xs text-zinc-400">
          <span className="inline-flex shrink-0 items-center gap-1">
            <PrimaryUsageIcon category={work.category} />
            <span className="truncate">
              <span className="sr-only">{primaryLabel} </span>
              {work.primaryUsageCount.toLocaleString()}
            </span>
          </span>
          <span className="inline-flex shrink-0 items-center gap-1">
            <MessageSquare
              className="size-3.5 shrink-0 text-violet-400"
              aria-hidden="true"
            />
            <span>
              <span className="sr-only">フィードバック </span>
              {work.feedbackCount.toLocaleString()}
            </span>
          </span>
          <span className="inline-flex min-w-0 items-center gap-1">
            <Users
              className="size-3.5 shrink-0 text-violet-400"
              aria-hidden="true"
            />
            <span className="truncate">
              <span className="sr-only">フォロー </span>
              {work.followCount.toLocaleString()}
            </span>
          </span>
        </div>
      </article>
    </Link>
  );
}
