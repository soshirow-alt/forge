"use client";

import { useEffect } from "react";
import { PageLoadingSkeleton } from "@/components/forge-loading-skeletons";
import { forgeSidebarPerfRouteStart } from "@/lib/forge-sidebar-perf";

export function ForgeSidebarRouteLoading({
  route,
  shell = "player",
}: {
  route: string;
  shell?: "player" | "studio";
}) {
  useEffect(() => {
    forgeSidebarPerfRouteStart(route, "loading.tsx");
  }, [route]);

  return (
    <div className="flex min-h-screen bg-[#0a0a0a] text-zinc-100">
      <aside
        className="hidden h-screen w-56 shrink-0 border-r border-zinc-800/80 bg-zinc-950 lg:block xl:w-60"
        aria-hidden="true"
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <div
          className="h-[57px] shrink-0 border-b border-zinc-800/80 bg-[#0a0a0a]/95"
          aria-hidden="true"
        />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <PageLoadingSkeleton lines={shell === "studio" ? 5 : 6} />
        </main>
      </div>
    </div>
  );
}
