"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { useGames } from "@/components/games-provider";

export function ForgeHeader() {
  const router = useRouter();
  const { user, hydrated, logout } = useAuth();
  const { getUnreadNotificationCount } = useGames();
  const unreadCount = getUnreadNotificationCount();

  function handleLogout() {
    void logout().then(() => {
      router.push("/");
      router.refresh();
    });
  }

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link href="/" className="text-xl font-bold tracking-tight">
          <span className="bg-gradient-to-r from-orange-400 to-amber-500 bg-clip-text text-transparent">
            Forge
          </span>
        </Link>
        <div className="flex items-center gap-3">
          <Link
            href="/demo"
            className="text-xs text-zinc-500 transition-colors hover:text-orange-400"
          >
            デモ作成
          </Link>
          {hydrated && user ? (
            <>
              <div className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/80 px-3 py-2">
                <span
                  aria-hidden="true"
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-orange-500 to-amber-500 text-sm font-semibold text-zinc-950"
                >
                  {user.avatarInitial}
                </span>
                <span className="text-sm font-medium text-zinc-200">{user.name}</span>
              </div>
              <Link
                href="/mypage"
                className="rounded-lg border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:border-orange-500/50 hover:bg-zinc-900 hover:text-white"
              >
                マイページ
              </Link>
              <Link
                href="/notifications"
                className="rounded-lg border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:border-orange-500/50 hover:bg-zinc-900 hover:text-white"
              >
                {unreadCount > 0 ? `通知 (${unreadCount})` : "通知"}
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-lg border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:border-orange-500/50 hover:bg-zinc-900 hover:text-white"
              >
                ログアウト
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="rounded-lg border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:border-orange-500/50 hover:bg-zinc-900 hover:text-white"
            >
              ログイン
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
