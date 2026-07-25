import { notFound } from "next/navigation";
import { DiscoveryHomePage } from "@/components/discovery-home-page";
import { PlayerShell } from "@/components/player-shell";
import { shouldServeFutureDiscoveryHome } from "@/lib/production-mode";

export const metadata = {
  title: "Production相当ホーム — Forge Preview",
  robots: { index: false, follow: false },
};

/**
 * Preview-only read-only surface for the formal game discovery home
 * (`DiscoveryHomePage` + Staging RPC). Not the future category home.
 */
export default function PrototypeProductionHomePage() {
  if (!shouldServeFutureDiscoveryHome()) {
    notFound();
  }

  return (
    <PlayerShell>
      <div className="space-y-4">
        <p className="inline-flex rounded-md border border-zinc-700 bg-zinc-900/80 px-2 py-0.5 text-[11px] font-medium text-zinc-400">
          Preview · Production相当
        </p>
        <DiscoveryHomePage />
      </div>
    </PlayerShell>
  );
}
