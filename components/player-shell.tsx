"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  Bookmark,
  ChevronDown,
  Flame,
  Gamepad2,
  Search,
  User,
} from "lucide-react";
import { type FormEvent, type ReactNode, useEffect, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import {
  ForgeShellMobileDrawer,
  ForgeShellMobileMenuButton,
  ForgeShellModeSwitch,
} from "@/components/forge-shell-mobile-nav";
import { useGames } from "@/components/games-provider";
import { useStudioEntryGate } from "@/components/studio-entry-gate-provider";
import { PlatformFeedbackSidebarBox } from "@/components/platform-feedback-sidebar-box";
import { useStudioLoginHrefBypass } from "@/lib/forge-deployment-context";
import { buildLoginUrlWithReturn } from "@/lib/login-return-url";
import { WATCH_TAB_LABEL } from "@/lib/watch-ui-labels";

const primaryLinks = [
  { id: "home", href: "/home", label: "ホーム" },
  { id: "search", href: "/search", label: "作品を探す" },
  { id: "creator-search", href: "/search/creators", label: "開発者を探す" },
  { id: "ranking", href: "/rankings/influence", label: "ランキング" },
] as const;

export type PlayerShellNavId =
  | (typeof primaryLinks)[number]["id"]
  | "mypage"
  | "community"
  | "settings"
  | "notifications"
  | "guide";

function SidebarDivider() {
  return <div className="my-3 border-t border-zinc-800/80" role="separator" />;
}

function HeaderSearchForm({ defaultValue }: { defaultValue?: string }) {
  const router = useRouter();
  const [query, setQuery] = useState(defaultValue ?? "");

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmed = query.trim();
    router.push(trimmed ? `/search?q=${encodeURIComponent(trimmed)}` : "/search");
  }

  return (
    <form onSubmit={handleSubmit} className="relative min-w-0 flex-1">
      <Search
        className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-500"
        aria-hidden="true"
      />
      <input
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="ゲームやジャンルを検索（例：RPG、ピクセルアート）"
        className="w-full rounded-xl border border-zinc-800 bg-zinc-900/80 py-2.5 pl-10 pr-4 text-sm text-zinc-200 placeholder:text-zinc-500 focus:border-violet-500/40 focus:outline-none focus:ring-1 focus:ring-violet-500/30"
      />
    </form>
  );
}

function navLinkClass(active: boolean) {
  return `block rounded-lg px-3 py-2 text-sm transition-colors ${
    active
      ? "bg-violet-600/20 font-medium text-violet-200 ring-1 ring-violet-500/30"
      : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
  }`;
}

function subNavLinkClass(active: boolean) {
  return `block rounded-lg px-3 py-2 text-sm transition-colors ${
    active
      ? "bg-violet-600/20 font-medium text-violet-200 ring-1 ring-violet-500/30"
      : "text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300"
  }`;
}

function isPrimaryLinkActive(linkId: (typeof primaryLinks)[number]["id"], pathname: string): boolean {
  switch (linkId) {
    case "home":
      return pathname === "/home";
    case "search":
      return pathname === "/search";
    case "creator-search":
      return pathname.startsWith("/search/creators");
    case "ranking":
      return pathname.startsWith("/rankings");
    default:
      return false;
  }
}

function MypageSidebarGroup() {
  const pathname = usePathname();
  const isMypageProfile = pathname === "/mypage/profile";
  const isMypageHub = pathname === "/mypage";
  const isCommunity = pathname.startsWith("/mypage/community");

  return (
    <div className="space-y-1">
      <Link href="/mypage" className={navLinkClass(isMypageHub)}>
        マイページ
      </Link>
      <Link
        href="/mypage/profile"
        className={`ml-4 block ${subNavLinkClass(isMypageProfile)}`}
      >
        Playerプロフィール
      </Link>
      <Link
        href="/mypage/community"
        className={`ml-4 block ${subNavLinkClass(isCommunity)}`}
      >
        参加コミュニティ
      </Link>
    </div>
  );
}

function PlayerSidebarNavBody({ showFeedback = true }: { showFeedback?: boolean }) {
  const pathname = usePathname();

  return (
    <>
      <div className="space-y-1">
        {primaryLinks.map((link) => (
          <Link
            key={link.id}
            href={link.href}
            className={navLinkClass(isPrimaryLinkActive(link.id, pathname))}
          >
            {link.label}
          </Link>
        ))}
      </div>

      <SidebarDivider />

      <MypageSidebarGroup />

      <SidebarDivider />

      <div className="space-y-1">
        <Link href="/settings" className={navLinkClass(pathname === "/settings")}>
          設定
        </Link>
        <Link href="/guide" className={navLinkClass(pathname === "/guide")}>
          はじめてガイド
        </Link>
      </div>

      {showFeedback ? (
        <div className="mt-auto shrink-0 pt-4">
          <PlatformFeedbackSidebarBox viewerMode="player" />
        </div>
      ) : null}
    </>
  );
}

export function PlayerShell({
  children,
  activeNav = "home",
  headerSearchDefault,
  notificationBadge,
}: {
  children: ReactNode;
  activeNav?: PlayerShellNavId;
  headerSearchDefault?: string;
  /** Override header badge; default uses unread DB notifications when logged in. */
  notificationBadge?: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, hydrated, logout } = useAuth();
  const { getUnreadNotificationCount } = useGames();
  const { attemptStudioEntry } = useStudioEntryGate();
  const previewStudioBypass = useStudioLoginHrefBypass();
  const studioLoginHref =
    !previewStudioBypass && (!hydrated || !user)
      ? buildLoginUrlWithReturn("/studio")
      : undefined;
  const resolvedNotificationBadge =
    notificationBadge ?? (user ? getUnreadNotificationCount() : 0);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  function handleLogout() {
    void logout().then(() => {
      router.push("/login");
      router.refresh();
    });
  }

  return (
    <div className="flex min-h-screen bg-[#0a0a0a] text-zinc-100">
      <aside className="sticky top-0 hidden h-screen w-56 shrink-0 flex-col border-r border-zinc-800/80 bg-zinc-950 lg:flex xl:w-60">
        <div className="shrink-0 border-b border-zinc-800/80 px-5 py-5">
          <Link href="/home" className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-xl bg-white/90 text-zinc-950">
              <Flame className="size-5" aria-hidden="true" />
            </span>
            <span className="text-lg font-bold tracking-tight">Forge</span>
          </Link>
        </div>

        <nav className="flex min-h-0 flex-1 flex-col px-3 py-4">
          <PlayerSidebarNavBody />
        </nav>
      </aside>

      <ForgeShellMobileDrawer
        open={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
        homeHref="/home"
        footer={
          <>
            <PlatformFeedbackSidebarBox viewerMode="player" />
            {user ? (
              <button
                type="button"
                onClick={() => {
                  setMobileNavOpen(false);
                  handleLogout();
                }}
                className="w-full rounded-lg border border-zinc-800 px-3 py-2 text-sm font-medium text-zinc-300 transition-colors hover:border-zinc-700 hover:text-zinc-100"
              >
                ログアウト
              </button>
            ) : null}
          </>
        }
      >
        <div className="mb-4 space-y-2 border-b border-zinc-800/80 pb-4">
          <p className="px-1 text-xs font-medium text-zinc-500">表示の切り替え</p>
          <ForgeShellModeSwitch
            mode="player"
            studioHrefBypass={previewStudioBypass}
            studioLoginHref={studioLoginHref}
            onNavigate={() => setMobileNavOpen(false)}
            onStudioAttempt={() => attemptStudioEntry("/studio")}
          />
        </div>
        <PlayerSidebarNavBody showFeedback={false} />
      </ForgeShellMobileDrawer>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center gap-2 border-b border-zinc-800/80 bg-[#0a0a0a]/95 px-4 py-3 backdrop-blur-md sm:gap-3 sm:px-6">
          <ForgeShellMobileMenuButton onClick={() => setMobileNavOpen(true)} />
          <HeaderSearchForm defaultValue={headerSearchDefault} />
          <Link
            href="/notifications"
            className="relative rounded-xl border border-zinc-800 p-2.5 text-zinc-400 transition-colors hover:border-zinc-700 hover:text-zinc-200"
            aria-label="通知"
          >
            <Bell className="size-5" />
            {resolvedNotificationBadge > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                {resolvedNotificationBadge > 9 ? "9+" : resolvedNotificationBadge}
              </span>
            )}
          </Link>
          <Link
            href="/mypage/profile"
            className="rounded-xl border border-zinc-800 p-2.5 text-zinc-400 transition-colors hover:border-zinc-700 hover:text-zinc-200"
            aria-label="Playerプロフィール"
          >
            <User className="size-5" />
          </Link>
          {user ? (
            <button
              type="button"
              onClick={handleLogout}
              className="hidden shrink-0 rounded-xl border border-zinc-800 px-3 py-2 text-sm font-medium text-zinc-300 transition-colors hover:border-zinc-700 hover:text-zinc-100 lg:inline-flex"
            >
              ログアウト
            </button>
          ) : (
            hydrated && (
              <Link
                href="/login"
                className="hidden shrink-0 rounded-xl border border-zinc-800 px-3 py-2 text-sm font-medium text-zinc-300 transition-colors hover:border-zinc-700 hover:text-zinc-100 lg:inline-flex"
              >
                ログイン
              </Link>
            )
          )}
          <ForgeShellModeSwitch
            mode="player"
            studioHrefBypass={previewStudioBypass}
            studioLoginHref={studioLoginHref}
            onStudioAttempt={() => attemptStudioEntry("/studio")}
          />
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}

export function MyPageTabs({
  activeTab,
  onTabChange,
}: {
  activeTab: string;
  onTabChange: (tab: string) => void;
}) {
  const tabs = [
    { id: "witnessing", label: WATCH_TAB_LABEL },
    { id: "saved", label: "保存作品" },
    { id: "play-history", label: "プレイ履歴" },
    { id: "feedback", label: "FB履歴" },
    { id: "achievements", label: "実績" },
    { id: "following", label: "フォロー中開発者" },
  ] as const;

  return (
    <div
      role="tablist"
      aria-label="マイページの表示切替"
      className="flex gap-1 overflow-x-auto border-b border-zinc-800/80 pb-px"
    >
      {tabs.map((tab) => {
        const selected = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onTabChange(tab.id)}
            className={`shrink-0 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
              selected
                ? "border-white text-white"
                : "border-transparent text-zinc-500 hover:text-zinc-300"
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

export function SortDropdown({ label = "更新が新しい順" }: { label?: string }) {
  return (
    <button
      type="button"
      className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-800 px-3 py-2 text-sm text-zinc-400 transition-colors hover:border-zinc-700 hover:text-zinc-200"
    >
      {label}
      <ChevronDown className="size-4" aria-hidden="true" />
    </button>
  );
}

export function SavedBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-zinc-700 bg-zinc-900/80 px-2 py-1 text-xs text-zinc-400">
      <Bookmark className="size-3" aria-hidden="true" />
      保存中
    </span>
  );
}

export function GameThumbnail({
  src,
  alt,
  className = "size-28 shrink-0 sm:size-32",
  contain = false,
  sizes = "(max-width: 640px) 128px, 160px",
}: {
  src: string;
  alt: string;
  className?: string;
  /** true のときサムネ全体を表示（余白は letterbox） */
  contain?: boolean;
  /** next/image の sizes — 表示幅より小さいとぼやける */
  sizes?: string;
}) {
  return (
    <div className={`relative overflow-hidden rounded-xl bg-zinc-800 ${className}`}>
      <Image
        src={src}
        alt={alt}
        fill
        className={contain ? "object-contain" : "object-cover"}
        sizes={sizes}
      />
    </div>
  );
}

export function EmptyTabState({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/30 px-6 py-16 text-center">
      <Gamepad2 className="size-10 text-zinc-600" aria-hidden="true" />
      <h2 className="mt-4 text-lg font-semibold text-zinc-300">{title}</h2>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-zinc-500">{description}</p>
    </div>
  );
}
