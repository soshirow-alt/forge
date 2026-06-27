"use client";

import Link from "next/link";
import { StudioShell } from "@/components/studio-shell";
import { ForgeSettingsForm } from "@/components/forge-settings-form";

export function StudioSettingsPage() {
  return (
    <StudioShell activeNav="settings">
      <div className="mx-auto max-w-3xl space-y-8">
        <header>
          <h1 className="text-2xl font-bold text-white sm:text-3xl">設定</h1>
          <p className="mt-2 text-sm text-zinc-400">
            アカウントと通知の設定。通知は Player / Studio を同じ画面で管理できます。
          </p>
        </header>
        <ForgeSettingsForm context="studio" />
        <p className="text-center text-xs text-zinc-600">
          Player からも同じ設定画面にアクセスできます。{" "}
          <Link href="/settings" className="text-violet-400 hover:text-violet-300">
            /settings
          </Link>
        </p>
      </div>
    </StudioShell>
  );
}
