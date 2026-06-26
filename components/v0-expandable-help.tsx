"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";

export function V0ExpandableHelp({
  prompt,
  teaser,
  children,
}: {
  prompt: string;
  teaser: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-4 rounded-xl border border-zinc-800/80 bg-zinc-900/30 px-4 py-3">
      <p className="text-sm text-zinc-400">{teaser}</p>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="mt-2 inline-flex items-center gap-1 text-sm text-violet-400 transition-colors hover:text-violet-300"
      >
        {prompt}
        <ChevronDown
          className={`size-4 transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </button>
      {open && (
        <div className="mt-3 border-t border-zinc-800/80 pt-3 text-sm leading-relaxed text-zinc-400">
          {children}
        </div>
      )}
    </div>
  );
}
