"use client";

import { useState } from "react";
import { FORGE_SDK_DETAIL, FORGE_SDK_NOTE } from "@/lib/forge-sdk-note";

type ForgeSdkNoteProps = {
  className?: string;
};

export function ForgeSdkNote({ className = "" }: ForgeSdkNoteProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className={`flex items-start gap-2 ${className}`.trim()}>
      <p className="flex-1 text-xs leading-relaxed text-zinc-500">
        {FORGE_SDK_NOTE}
      </p>
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
  );
}
