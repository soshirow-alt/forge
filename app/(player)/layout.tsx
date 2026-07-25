import type { ReactNode } from "react";
import { PlayerShellLayout } from "@/components/player-shell-layout";

/**
 * Player chrome layout. Header search mounts client-side inside PlayerShell
 * (or future-home category tabs on Preview `/home`).
 */
export default function PlayerRouteLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <PlayerShellLayout>{children}</PlayerShellLayout>;
}
