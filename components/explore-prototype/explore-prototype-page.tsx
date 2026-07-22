"use client";

import { useEffect, useState } from "react";
import { ExplorePrototypeCard } from "@/components/explore-prototype/explore-prototype-card";
import { ExplorePrototypeNav } from "@/components/explore-prototype/explore-prototype-nav";
import {
  getExplorePrototypeCategory,
  getExplorePrototypeShelves,
  type ExplorePrototypeCategorySlug,
} from "@/lib/prototype/explore-prototype";

const DETAIL_TOAST = "作品詳細は次の工程で作成します";

export function ExplorePrototypePage({
  category,
}: {
  category: ExplorePrototypeCategorySlug;
}) {
  const meta = getExplorePrototypeCategory(category);
  const shelves = getExplorePrototypeShelves(category);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = window.setTimeout(() => setToastMessage(null), 3200);
    return () => window.clearTimeout(timer);
  }, [toastMessage]);

  function handleOpen() {
    setToastMessage(DETAIL_TOAST);
  }

  if (!meta) {
    return null;
  }

  return (
    <div className="space-y-8">
      <header className="space-y-4">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wide text-violet-300">
            Explore
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            作品を探す
          </h1>
        </div>

        <ExplorePrototypeNav active={category} />

        <div className="space-y-1 border-t border-zinc-800/80 pt-4">
          <h2 className="text-xl font-semibold text-white sm:text-2xl">
            {meta.label}
          </h2>
          <p className="text-sm text-zinc-400">{meta.description}</p>
        </div>
      </header>

      {shelves.map((shelf) => (
        <section key={shelf.id} aria-labelledby={`shelf-${shelf.id}`}>
          <h2
            id={`shelf-${shelf.id}`}
            className="text-lg font-semibold text-white sm:text-xl"
          >
            {shelf.title}
          </h2>
          <ul className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {shelf.works.map((work) => (
              <li key={`${shelf.id}-${work.id}`} className="min-w-0">
                <ExplorePrototypeCard work={work} onOpen={() => handleOpen()} />
              </li>
            ))}
          </ul>
        </section>
      ))}

      {toastMessage ? (
        <div
          role="status"
          className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm text-zinc-200 shadow-lg"
        >
          {toastMessage}
        </div>
      ) : null}
    </div>
  );
}
