"use client";

import type { LucideIcon } from "lucide-react";
import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";

export type StudioActionRowProps = {
  icon: LucideIcon;
  label: string;
  summary?: string;
  required?: boolean;
  onClick: () => void;
  disabled?: boolean;
};

/**
 * v0 StudioActionPanel 相当のクリック可能な操作行。
 * カテゴリ見出しは枠なし・非クリック。行全体が操作対象。
 */
export function StudioActionRow({
  icon: Icon,
  label,
  summary,
  required = false,
  onClick,
  disabled = false,
}: StudioActionRowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="group flex w-full min-w-0 cursor-pointer items-center gap-3 rounded-lg border border-transparent px-2.5 py-2.5 text-left transition-colors hover:border-violet-500/25 hover:bg-violet-500/10 active:bg-violet-500/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-violet-500/70 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <span className="flex size-8 shrink-0 items-center justify-center rounded-md border border-zinc-800/80 bg-zinc-950/60 text-zinc-400 transition-colors group-hover:border-violet-500/30 group-hover:text-violet-200">
        <Icon className="size-3.5" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex min-w-0 flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-zinc-100">{label}</span>
          {required ? (
            <span className="rounded px-1.5 py-0.5 text-[10px] font-medium text-violet-200 ring-1 ring-violet-500/35 bg-violet-500/15">
              必須
            </span>
          ) : null}
        </span>
        {summary ? (
          <span className="mt-0.5 block truncate text-xs text-zinc-500">{summary}</span>
        ) : null}
      </span>
      <ChevronRight
        className="size-4 shrink-0 text-zinc-600 transition-colors group-hover:text-violet-300"
        aria-hidden="true"
      />
    </button>
  );
}

export function StudioActionGroup({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1">
      <p className="px-1 text-[11px] font-medium tracking-wide text-zinc-500">{label}</p>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

/** 公開状態・保存状態など、クリック不可の読み取り専用行 */
export function StudioStatusRow({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 px-1 py-2">
      <span className="text-xs text-zinc-500">{label}</span>
      <div className="min-w-0 text-sm text-zinc-300">{children}</div>
    </div>
  );
}
