"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { type ReactNode, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { FORGE_SHELL_MODE_SWITCH_CLASS } from "@/lib/forge-shell-header";

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
  footer,
}: {
  open: boolean;
  onClose: () => void;
  homeHref: string;
  children: ReactNode;
  /** スクロール外の下部固定（ご意見・ログアウトなど） */
  footer?: ReactNode;
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
        <div className="flex min-h-0 flex-1 flex-col">
          <nav
            className="min-h-0 flex-1 overflow-y-auto px-3 py-4"
            onClick={onClose}
          >
            {children}
          </nav>
          {footer ? (
            <div className="shrink-0 space-y-4 border-t border-zinc-800/80 px-3 py-4">
              {footer}
            </div>
          ) : null}
        </div>
      </aside>
    </div>,
    document.body,
  );
}

type ForgeShellModeSwitchProps = {
  mode: "player" | "studio";
  onNavigate?: () => void;
  onStudioAttempt?: () => void;
  /** Preview/local — Studio へ Link 直遷移 */
  studioHrefBypass?: boolean;
  /** ログイン済み・オンボーディング不要 — Studio へ Link 直遷移 */
  studioDirectHref?: string;
};

export function ForgeShellModeSwitch({
  mode,
  onNavigate,
  onStudioAttempt,
  studioHrefBypass = false,
  studioDirectHref,
}: ForgeShellModeSwitchProps) {
  if (mode === "studio") {
    return (
      <Link
        href="/home"
        onClick={onNavigate}
        title="Explore へ切り替え"
        className={FORGE_SHELL_MODE_SWITCH_CLASS}
      >
        Explore切り替え
      </Link>
    );
  }

  if (studioHrefBypass || studioDirectHref) {
    return (
      <Link
        href={studioDirectHref ?? "/studio"}
        onClick={onNavigate}
        title="Studio へ切り替え"
        className={FORGE_SHELL_MODE_SWITCH_CLASS}
      >
        Studio切り替え
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
      title="Studio へ切り替え（ログインが必要です）"
      className={FORGE_SHELL_MODE_SWITCH_CLASS}
    >
      Studio切り替え
    </button>
  );
}
