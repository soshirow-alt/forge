import { Suspense } from "react";
import { PageLoadingSkeleton } from "@/components/forge-loading-skeletons";
import { PlayerSettingsV0Page } from "@/components/player-settings-v0-page";
import { RegisteredAccountGuard } from "@/components/registered-account-guard";

export default function SettingsRoute() {
  return (
    <Suspense fallback={<PageLoadingSkeleton lines={4} />}>
      <RegisteredAccountGuard>
        <PlayerSettingsV0Page />
      </RegisteredAccountGuard>
    </Suspense>
  );
}
