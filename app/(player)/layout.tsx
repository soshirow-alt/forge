import { Suspense, type ReactNode } from "react";
import { PlayerShellLayout } from "@/components/player-shell-layout";
import {
  HeaderSearchFormFallback,
  HeaderSearchFormInner,
} from "@/components/player-header-search-form";

/**
 * Server Suspense wraps only the header search (useSearchParams).
 * Client-nested Suspense alone failed Vercel Production prerender of /home.
 */
export default function PlayerRouteLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <PlayerShellLayout
      headerSearch={
        <Suspense fallback={<HeaderSearchFormFallback />}>
          <HeaderSearchFormInner />
        </Suspense>
      }
    >
      {children}
    </PlayerShellLayout>
  );
}
