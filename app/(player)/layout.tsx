import { Suspense, type ReactNode } from "react";
import { PlayerShellLayout } from "@/components/player-shell-layout";
import {
  HeaderSearchFormFallback,
  HeaderSearchFormInner,
} from "@/components/player-header-search-form";

/** Match Vercel Production: avoid static CSR-bailout on player routes with useSearchParams. */
export const dynamic = "force-dynamic";

/**
 * Server Suspense wraps only the header search slot.
 * Header search avoids useSearchParams so /home prerender cannot fail on the shell.
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