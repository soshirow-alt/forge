"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  ChevronDown,
  Flame,
  Search,
  User,
} from "lucide-react";
import { type FormEvent, type ReactNode, useState } from "react";
import { useAuth } from "@/components/auth-provider";

const primaryLinks = [
  { id: "home", href: "/studio", label: "ホーム" },
  { id: "ranking", href: "/studio/rankings", label: "ランキング" },
] as const;

export type StudioShellNavId =
  | (typeof primaryLinks)[number]["id"]
  | "mypage"
  | "profile"
  | "community"
  | "notifications"
  | "settings"
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
    router.push(
      trimmed ? `/studio/mypage?q=${encodeURIComponent(trimmed)}` : "/studio/mypage",
    );
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
        placeholder="作品や機能を検索"
        className="w-full rounded-xl border border-zinc-800 bg-zinc-900/80 py-2.5 pl-10 pr-4 text-sm text-zinc-200 placeholder:text-zinc-500 focus:border-violet-500/40 focus:outline-none focus:ring-1 focus:ring-violet-500/30"
      />
    </form>
  );
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
      return pathname === "/studio";
    case "ranking":
      return pathname.startsWith("/studio/rankings");
    default:
      return false;
  }
}

function StudioMypageSidebarGroup() {
  const pathname = usePathname();
  const isMypageHub =
    pathname.startsWith("/studio/mypage") ||
    pathname.startsWith("/studio/projects") ||
    (pathname.startsWith("/projects/") && pathname.endsWith("/studio"));
  const isProfile = pathname === "/studio/profile";
  const isCommunity = pathname.startsWith("/studio/community");

  return (
    <div className="space-y-1">
      <Link href="/studio/mypage" className={navLinkClass(isMypageHub)}>
        マイページ
      </Link>
      <Link
        href="/studio/profile"
        className={`ml-4 block ${subNavLinkClass(isProfile)}`}
      >
        マイプロフィール
      </Link>
      <Link
        href="/studio/community"
        className={`ml-4 block ${subNavLinkClass(isCommunity)}`}
      >
        マイコミュニティ
      </Link>
    </div>
  );
}

export function StudioMyPageTabs({
  activeTab,
  onTabChange,
}: {
  activeTab: string;
  onTabChange: (tab: "projects" | "achievements" | "followers") => void;
}) {
  const tabs = [
    { id: "projects", label: "プロジェクト一覧" },
    { id: "achievements", label: "実績" },
    { id: "followers", label: "フォロワー" },
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

function navLinkClass(active: boolean) {
  return `block rounded-lg px-3 py-2 text-sm transition-colors ${
    active
      ? "bg-violet-600/20 font-medium text-violet-200 ring-1 ring-violet-500/30"
      : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
  }`;
}

export function StudioShell({
  children,
  activeNav = "home",
  headerSearchDefault,
  notificationBadge = 3,
}: {
  children: ReactNode;
  activeNav?: StudioShellNavId;
  headerSearchDefault?: string;
  notificationBadge?: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, hydrated, logout } = useAuth();

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
          <Link href="/studio" className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-xl bg-white/90 text-zinc-950">
              <Flame className="size-5" aria-hidden="true" />
            </span>
            <span className="text-lg font-bold tracking-tight">Forge</span>
          </Link>
        </div>

        <nav className="flex min-h-0 flex-1 flex-col px-3 py-4">
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

          <StudioMypageSidebarGroup />

          <SidebarDivider />

          <div className="space-y-1">
            <Link href="/studio/settings" className={navLinkClass(pathname === "/studio/settings")}>
              設定
            </Link>
            <Link href="/studio/guide" className={navLinkClass(pathname === "/studio/guide")}>
              はじめてガイド
            </Link>
          </div>
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-zinc-800/80 bg-[#0a0a0a]/95 px-4 py-3 backdrop-blur-md sm:px-6">
          <HeaderSearchForm defaultValue={headerSearchDefault} />
          <Link
            href="/studio/notifications"
            className="relative rounded-xl border border-zinc-800 p-2.5 text-zinc-400 transition-colors hover:border-zinc-700 hover:text-zinc-200"
            aria-label="通知"
          >
            <Bell className="size-5" />
            {notificationBadge > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                {notificationBadge > 9 ? "9+" : notificationBadge}
              </span>
            )}
          </Link>
          <Link
            href="/studio/profile"
            className="rounded-xl border border-zinc-800 p-2.5 text-zinc-400 transition-colors hover:border-zinc-700 hover:text-zinc-200"
            aria-label="マイプロフィール"
          >
            <User className="size-5" />
          </Link>
          {user ? (
            <button
              type="button"
              onClick={handleLogout}
              className="shrink-0 rounded-xl border border-zinc-800 px-3 py-2 text-sm font-medium text-zinc-300 transition-colors hover:border-zinc-700 hover:text-zinc-100"
            >
              ログアウト
            </button>
          ) : (
            hydrated && (
              <Link
                href="/login"
                className="shrink-0 rounded-xl border border-zinc-800 px-3 py-2 text-sm font-medium text-zinc-300 transition-colors hover:border-zinc-700 hover:text-zinc-100"
              >
                ログイン
              </Link>
            )
          )}
          <Link
            href="/home"
            className="hidden rounded-xl border border-violet-500/40 bg-violet-600/15 px-4 py-2 text-sm font-medium text-violet-200 transition-colors hover:border-violet-500/60 hover:bg-violet-600/25 sm:inline-flex"
          >
            Player
          </Link>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}

export function StudioSectionHeader({
  title,
  href,
  icon,
}: {
  title: string;
  href?: string;
  icon?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        {icon}
        <h2 className="text-lg font-semibold text-white sm:text-xl">{title}</h2>
      </div>
      {href && (
        <Link href={href} className="text-sm text-violet-400 transition-colors hover:text-violet-300">
          すべて見る →
        </Link>
      )}
    </div>
  );
}

export function StudioSortDropdown({
  label = "更新が新しい順",
  onClick,
}: {
  label?: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-800 px-3 py-2 text-sm text-zinc-400 transition-colors hover:border-zinc-700 hover:text-zinc-200"
    >
      {label}
      <ChevronDown className="size-4" aria-hidden="true" />
    </button>
  );
}

export function StudioProjectTabs({
  activeTab,
  onTabChange,
}: {
  activeTab: string;
  onTabChange: (tab: string) => void;
}) {
  const tabs = [
    { id: "overview", label: "概要" },
    { id: "voices", label: "みんなのフィードバック" },
    { id: "versions", label: "verの履歴" },
  ] as const;

  return (
    <div
      role="tablist"
      aria-label="プロジェクトの表示切替"
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
                ? "border-violet-400 text-violet-100"
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

export function StudioFilterPills({
  options,
  active,
  onChange,
}: {
  options: { id: string; label: string }[];
  active: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          onClick={() => onChange(option.id)}
          className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
            active === option.id
              ? "bg-violet-600/20 text-violet-200 ring-1 ring-violet-500/30"
              : "border border-zinc-800 text-zinc-400 hover:border-zinc-700"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export function StudioInlineSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { id: string; label: string }[];
  onChange: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.id === value);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900/80 px-3 py-2 text-sm text-zinc-300 transition-colors hover:border-zinc-700"
        aria-expanded={open}
      >
        <span className="text-zinc-500">{label}</span>
        <span>{selected?.label ?? value}</span>
        <ChevronDown className="size-4 text-zinc-500" aria-hidden="true" />
      </button>
      {open && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-20 cursor-default"
            aria-label="メニューを閉じる"
            onClick={() => setOpen(false)}
          />
          <div className="absolute left-0 z-30 mt-1 min-w-[12rem] rounded-xl border border-zinc-800 bg-zinc-950 py-1 shadow-xl">
            {options.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => {
                  onChange(option.id);
                  setOpen(false);
                }}
                className={`block w-full px-3 py-2 text-left text-sm transition-colors hover:bg-zinc-900 ${
                  option.id === value ? "text-violet-200" : "text-zinc-300"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
