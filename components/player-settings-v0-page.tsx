"use client";

import { ForgeSettingsForm } from "@/components/forge-settings-form";
import { PLAYER_SETTINGS_PATH } from "@/lib/settings-surface";

export function PlayerSettingsV0Page() {
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <header>
        <h1 className="text-2xl font-bold text-white sm:text-3xl">設定</h1>
        <p className="mt-2 text-sm text-zinc-400">
          アカウント・通知・公開設定。Player / Studio で共通です。
        </p>
      </header>
      <ForgeSettingsForm settingsPath={PLAYER_SETTINGS_PATH} />
    </div>
  );
}
