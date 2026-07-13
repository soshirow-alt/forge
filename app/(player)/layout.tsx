import type { ReactNode } from "react";
import { PlayerShellLayout } from "@/components/player-shell-layout";
import { HeaderSearchForm } from "@/components/player-header-search-form";

/**
 * Player chrome layout. Header search no longer uses useSearchParams
 * (reads query from window on client), so no force-dynamic / whole-shell Suspense.
 */
export default function PlayerRouteLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <PlayerShellLayout headerSearch={<HeaderSearchForm />}>
      {children}
    </PlayerShellLayout>
  );
}
