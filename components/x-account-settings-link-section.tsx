"use client";

import Link from "next/link";
import { useOwnXLinkStatus } from "@/hooks/use-own-x-link-status";
import { isXAuthEnabled } from "@/lib/x-auth";

const SETTINGS_PATH = "/settings";

export function XAccountSettingsLinkSection() {
  const { hydrated, user, loaded, handleLabel, isLinked } = useOwnXLinkStatus();
  const xAuthEnabled = isXAuthEnabled();

  if (!hydrated || !user) {
    return null;
  }

  if (!xAuthEnabled && !isLinked) {
    return null;
  }

  return (
    <section className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-5 sm:p-6">
      <h2 className="text-base font-semibold text-white">Xアカウント連携</h2>
      <p className="mt-1 text-sm text-zinc-500">
        Forge上のプロフィールにXの@handleを表示できます。連携と公開表示は別々に設定できます。
      </p>

      <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          {loaded && isLinked && handleLabel ? (
            <p className="text-sm text-sky-200/90">連携済み: {handleLabel}</p>
          ) : loaded && isLinked ? (
            <p className="text-sm text-sky-200/90">連携済み</p>
          ) : loaded ? (
            <p className="text-sm text-zinc-500">未連携</p>
          ) : (
            <p className="text-sm text-zinc-500">確認中…</p>
          )}
        </div>

        <Link
          href={SETTINGS_PATH}
          className="inline-flex shrink-0 items-center justify-center rounded-lg border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-200 transition-colors hover:border-zinc-600 hover:bg-zinc-900"
        >
          {isLinked ? "アカウント設定を開く" : "アカウント設定で連携する"}
        </Link>
      </div>
    </section>
  );
}
