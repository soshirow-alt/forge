"use client";

import type { ReactNode } from "react";
import { PlayerShell } from "@/components/player-shell";

/** Shared Player chrome for (player) route group — mounts once per sidebar navigation. */
export function PlayerShellLayout({
  children,
  headerSearch,
}: {
  children: ReactNode;
  /** Server-Suspense-wrapped header search slot from (player)/layout. */
  headerSearch?: ReactNode;
}) {
  return <PlayerShell headerSearch={headerSearch}>{children}</PlayerShell>;
}
