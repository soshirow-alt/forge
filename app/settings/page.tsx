import { Suspense } from "react";
import { PlayerSettingsV0Page } from "@/components/player-settings-v0-page";
import { RegisteredAccountGuard } from "@/components/registered-account-guard";

export default function SettingsRoute() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-full items-center justify-center bg-[#0a0a0a] text-zinc-500">
          読み込み中...
        </div>
      }
    >
      <RegisteredAccountGuard>
        <PlayerSettingsV0Page />
      </RegisteredAccountGuard>
    </Suspense>
  );
}
