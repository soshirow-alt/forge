"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { forgeSidebarPerfShellReady } from "@/lib/forge-sidebar-perf";

/** Logs shell-ready timing when PlayerShell / StudioShell mounts (per route navigation). */
export function useForgePerfSidebarShell(shell: "player" | "studio"): void {
  const pathname = usePathname();

  useEffect(() => {
    forgeSidebarPerfShellReady(pathname, shell);
  }, [pathname, shell]);
}
