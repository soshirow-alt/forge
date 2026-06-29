"use client";

import { useState } from "react";
import { FORGE_SDK_DETAIL, FORGE_SDK_NOTE } from "@/lib/forge-sdk-note";

type ForgeSdkNoteProps = {
  className?: string;
};

export function ForgeSdkNote({ className = "" }: ForgeSdkNoteProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className={className}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-zinc-300">Forge SDK</span>
            <span className="inline-flex items-center rounded-full border border-zinc-600 bg-zinc-900 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
              Coming soon
            </span>
            <span className="text-[11px] text-zinc-600">（任意）</span>
          </div>
          <p className="mt-1.5 text-xs leading-relaxed text-zinc-500">{FORGE_SDK_NOTE}</p>
        </div>
        <div className="relative shrink-0">
          <button
            type="button"
            aria-label="Forge SDKについて"
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
            className="flex h-5 w-5 items-center justify-center rounded-full border border-zinc-700 text-[11px] font-semibold text-zinc-400 transition-colors hover:border-orange-500/40 hover:text-orange-400"
          >
            ?
          </button>
          {open && (
            <div className="absolute right-0 top-7 z-10 w-64 rounded-lg border border-zinc-700 bg-zinc-900 p-3 text-xs leading-relaxed text-zinc-400 shadow-lg">
              {FORGE_SDK_DETAIL}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
