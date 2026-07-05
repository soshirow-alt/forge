"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { useEntryMode } from "@/components/entry-mode-provider";
import { buildLoginUrlWithReturn } from "@/lib/login-return-url";
import { shouldShowForgeEntryGate } from "@/lib/entry-mode";

/**
 * Client overlay gate for first-time Forge entry (login vs guest).
 * Avoids middleware redirects so crawlers/OGP can still fetch public HTML.
 */
export function ForgeEntryGate() {
  const pathname = usePathname();
  const { user, authResolved } = useAuth();
  const { entryModeResolved, isEntryUnset, setGuestEntryMode } = useEntryMode();

  if (!authResolved || !entryModeResolved || user || !isEntryUnset) {
    return null;
  }

  if (!shouldShowForgeEntryGate(pathname)) {
    return null;
  }

  const returnPath = `${pathname}${typeof window !== "undefined" ? window.location.search : ""}`;
  const loginHref = buildLoginUrlWithReturn(returnPath);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-950/80 px-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="forge-entry-gate-title"
    >
      <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl shadow-black/40">
        <h2
          id="forge-entry-gate-title"
          className="text-xl font-bold tracking-tight text-white"
        >
          Forgeへようこそ
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-zinc-400">
          ログインすると、あとで見る・更新を追う・プレイ履歴などが使えます。
          ゲストのままだと、作品の閲覧と外部プレイ・フィードバック送信ができます。
        </p>
        <div className="mt-6 space-y-3">
          <Link
            href={loginHref}
            className="flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-violet-500/20 transition-opacity hover:opacity-90"
          >
            ログインする
          </Link>
          <button
            type="button"
            onClick={setGuestEntryMode}
            className="w-full rounded-xl border border-zinc-700 bg-zinc-900/60 px-6 py-3.5 text-base font-semibold text-zinc-200 transition-colors hover:border-zinc-600 hover:bg-zinc-900"
          >
            ゲストで参加
          </button>
        </div>
        <p className="mt-4 text-center text-xs leading-relaxed text-zinc-600">
          ゲストの記録は通常ログイン後に引き継がれません。
        </p>
      </div>
    </div>
  );
}
