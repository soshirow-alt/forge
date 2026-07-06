"use client";

import type { ReactNode } from "react";
import { PlayerShell } from "@/components/player-shell";

/** Shared Player chrome for (player) route group — mounts once per sidebar navigation. */
export function PlayerShellLayout({ children }: { children: ReactNode }) {
  return <PlayerShell>{children}</PlayerShell>;
}
