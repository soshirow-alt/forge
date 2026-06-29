"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { type ReactNode, useEffect, useState } from "react";
import { createPortal } from "react-dom";

export function ForgeShellMobileMenuButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex shrink-0 rounded-xl border border-zinc-800 p-2.5 text-zinc-400 transition-colors hover:border-zinc-700 hover:text-zinc-200 lg:hidden"
      aria-label="メニューを開く"
    >
      <Menu className="size-5" aria-hidden="true" />
    </button>
  );
}

export function ForgeShellMobileDrawer({
  open,
  onClose,
  homeHref,
  children,
}: {
  open: boolean;
  onClose: () => void;
  homeHref: string;
  children: ReactNode;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  if (!mounted || !open) {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-50 lg:hidden">
      <button
        type="button"
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        aria-label="メニューを閉じる"
        onClick={onClose}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="ナビゲーションメニュー"
        className="absolute inset-y-0 left-0 flex w-[min(18rem,88vw)] flex-col border-r border-zinc-800 bg-zinc-950 shadow-2xl"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-zinc-800/80 px-4 py-4">
          <Link
            href={homeHref}
            onClick={onClose}
            className="text-lg font-bold tracking-tight text-white"
          >
            Forge
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-zinc-900 hover:text-zinc-200"
            aria-label="メニューを閉じる"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>
        <nav
          className="flex min-h-0 flex-1 flex-col overflow-y-auto px-3 py-4"
          onClick={onClose}
        >
          {children}
        </nav>
      </aside>
    </div>,
    document.body,
  );
}

type ForgeShellModeSwitchProps = {
  mode: "player" | "studio";
  onNavigate?: () => void;
  onStudioAttempt?: () => void;
  studioHrefBypass?: boolean;
};

const playerSwitchClassName =
  "inline-flex shrink-0 items-center justify-center rounded-xl border border-violet-500/40 bg-violet-600/15 px-2.5 py-2 text-xs font-medium text-violet-200 transition-colors hover:border-violet-500/60 hover:bg-violet-600/25 sm:px-4 sm:text-sm";

const studioSwitchClassName =
  "inline-flex shrink-0 items-center justify-center rounded-xl border border-zinc-600 px-2.5 py-2 text-xs font-medium text-zinc-200 transition-colors hover:border-zinc-500 sm:px-4 sm:text-sm";

export function ForgeShellModeSwitch({
  mode,
  onNavigate,
  onStudioAttempt,
  studioHrefBypass = false,
}: ForgeShellModeSwitchProps) {
  if (mode === "studio") {
    return (
      <Link
        href="/home"
        onClick={onNavigate}
        title="プレイヤー向け画面へ"
        className={playerSwitchClassName}
      >
        Player
      </Link>
    );
  }

  if (studioHrefBypass) {
    return (
      <Link
        href="/studio"
        onClick={onNavigate}
        title="開発者向け Studio（投稿した作品の管理）"
        className={studioSwitchClassName}
      >
        Studio
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        onNavigate?.();
        onStudioAttempt?.();
      }}
      title="開発者向け Studio（投稿した作品の管理）"
      className={studioSwitchClassName}
    >
      Studio
    </button>
  );
}
