"use client";

import Image from "next/image";
import Link from "next/link";
import {
  DOMAIN_EXPANSION_PROTO_BANNER,
  getCategorySurfaceShelves,
  getWorkCategoryNav,
  type PrototypeWorkCard,
  type WorkCategoryId,
} from "@/lib/prototype/domain-expansion";

function CategoryBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex rounded-md border border-zinc-700 bg-zinc-900/80 px-1.5 py-0.5 text-[10px] font-medium text-zinc-300">
      {label}
    </span>
  );
}

function WorkCard({ work }: { work: PrototypeWorkCard }) {
  return (
    <Link href={`/prototype/works/${work.slug}`} className="block min-w-0">
      <article>
        {work.imageUrl ? (
          <div className="relative aspect-video overflow-hidden rounded-xl bg-zinc-800">
            <Image
              src={work.imageUrl}
              alt=""
              fill
              className="object-cover"
              sizes="(max-width: 640px) 50vw, 280px"
            />
          </div>
        ) : work.category === "music" ? (
          <div className="flex aspect-video flex-col items-center justify-center gap-1 rounded-xl border border-zinc-700 bg-gradient-to-br from-zinc-900 to-zinc-800 px-3 text-center">
            <span className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">
              Audio
            </span>
            <span className="line-clamp-2 text-sm font-semibold text-white">
              {work.title}
            </span>
          </div>
        ) : (
          <div className="flex aspect-video flex-col justify-end rounded-xl border border-zinc-800 bg-zinc-900/80 p-3">
            <CategoryBadge label={work.categoryLabel} />
            <p className="mt-2 line-clamp-2 text-sm font-semibold text-white">
              {work.title}
            </p>
          </div>
        )}
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] text-zinc-500">{work.statusLabel}</span>
          {work.metaChips.slice(0, 2).map((chip) => (
            <CategoryBadge key={chip} label={chip} />
          ))}
        </div>
        <h3 className="mt-1 truncate text-sm font-semibold text-white">{work.title}</h3>
        <p className="mt-0.5 truncate text-xs text-zinc-500">{work.creator}</p>
      </article>
    </Link>
  );
}

/**
 * Non-game Explore category surface — fixture shelves only (no feed RPC).
 */
export function ExploreCategorySurface({
  categoryId,
}: {
  categoryId: Exclude<WorkCategoryId, "game">;
}) {
  const nav = getWorkCategoryNav(categoryId);
  const shelves = getCategorySurfaceShelves(categoryId);

  if (!nav) {
    return null;
  }

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-violet-300">
          Explore · カテゴリ面
        </p>
        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
          {nav.label}
        </h1>
        <p className="text-sm text-zinc-400">{nav.surfaceLead}</p>
        <p className="rounded-xl border border-violet-500/25 bg-violet-500/10 px-3 py-2 text-xs text-violet-200">
          {DOMAIN_EXPANSION_PROTO_BANNER}
          <span className="mt-1 block text-zinc-400">
            このカテゴリの作品だけを表示する閲覧面のプロトタイプです。棚構成は未確定です。
          </span>
        </p>
      </header>

      {shelves.map((shelf) => (
        <section key={shelf.title}>
          <h2 className="text-lg font-semibold text-white sm:text-xl">{shelf.title}</h2>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {shelf.works.map((work) => (
              <WorkCard key={`${shelf.title}-${work.id}`} work={work} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
