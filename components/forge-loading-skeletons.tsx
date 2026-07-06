"use client";

export function DiscoveryHomeSkeleton() {
  return (
    <div className="space-y-10">
      <div className="aspect-[21/9] animate-pulse rounded-2xl bg-zinc-800/70" />
      {["最近更新された作品", "新着作品", "人気の作品"].map((title) => (
        <section key={title}>
          <div className="flex items-center justify-between">
            <div className="h-6 w-40 animate-pulse rounded bg-zinc-800/70" />
            <div className="h-4 w-16 animate-pulse rounded bg-zinc-800/50" />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="space-y-2">
                <div className="aspect-[4/3] animate-pulse rounded-xl bg-zinc-800/70" />
                <div className="h-4 w-3/4 animate-pulse rounded bg-zinc-800/60" />
                <div className="h-3 w-1/2 animate-pulse rounded bg-zinc-800/50" />
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

export function GameDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="aspect-[16/9] animate-pulse rounded-2xl bg-zinc-800/70" />
      <div className="space-y-3">
        <div className="h-8 w-2/3 animate-pulse rounded bg-zinc-800/70" />
        <div className="h-4 w-full animate-pulse rounded bg-zinc-800/50" />
        <div className="h-4 w-5/6 animate-pulse rounded bg-zinc-800/50" />
      </div>
      <div className="flex gap-2 border-b border-zinc-800/80 pb-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="h-8 w-24 animate-pulse rounded bg-zinc-800/60" />
        ))}
      </div>
      <div className="space-y-3">
        <div className="h-4 w-full animate-pulse rounded bg-zinc-800/50" />
        <div className="h-4 w-11/12 animate-pulse rounded bg-zinc-800/50" />
        <div className="h-4 w-4/5 animate-pulse rounded bg-zinc-800/50" />
      </div>
    </div>
  );
}

export function PageLoadingSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: lines }).map((_, index) => (
        <div
          key={index}
          className="h-4 animate-pulse rounded bg-zinc-800/60"
          style={{ width: `${100 - index * 12}%` }}
        />
      ))}
    </div>
  );
}
