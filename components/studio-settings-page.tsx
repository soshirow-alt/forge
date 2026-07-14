"use client";

/**
 * Legacy Studio settings page — route redirects to /settings.
 * Kept only for typecheck if imported; prefer ForgeSettingsForm via PlayerSettingsV0Page.
 */
import { ForgeSettingsForm } from "@/components/forge-settings-form";

export function StudioSettingsPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <header>
        <h1 className="text-2xl font-bold text-white sm:text-3xl">設定</h1>
      </header>
      <ForgeSettingsForm />
    </div>
  );
}
