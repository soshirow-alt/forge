"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  gameDetailHrefWithTab,
  gamePlayEntryHref,
} from "@/lib/mypage-navigation";
import { MoreVertical } from "lucide-react";

export function MyPageGameActionsMenu({ title }: { title: string }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [open]);

  const detailHref = gamePlayEntryHref(title);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="rounded-lg p-1 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-300"
        aria-label={`${title}のメニュー`}
        aria-expanded={open}
      >
        <MoreVertical className="size-4" />
      </button>
      {open && (
        <div
          className="absolute right-0 z-20 mt-1 min-w-[10rem] rounded-xl border border-zinc-800 bg-zinc-950 py-1 shadow-xl"
          role="menu"
        >
          <Link
            href={detailHref}
            className="block px-3 py-2 text-sm text-zinc-300 transition-colors hover:bg-zinc-900 hover:text-white"
            role="menuitem"
            onClick={() => setOpen(false)}
          >
            ゲーム詳細
          </Link>
          <Link
            href={gameDetailHrefWithTab(title, "devlog")}
            className="block px-3 py-2 text-sm text-zinc-300 transition-colors hover:bg-zinc-900 hover:text-white"
            role="menuitem"
            onClick={() => setOpen(false)}
          >
            更新内容
          </Link>
          <Link
            href={gameDetailHrefWithTab(title, "voices")}
            className="block px-3 py-2 text-sm text-zinc-300 transition-colors hover:bg-zinc-900 hover:text-white"
            role="menuitem"
            onClick={() => setOpen(false)}
          >
            フィードバック
          </Link>
        </div>
      )}
    </div>
  );
}
