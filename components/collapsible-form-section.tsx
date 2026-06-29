"use client";

import { Plus } from "lucide-react";
import { useState, type ReactNode } from "react";

type CollapsibleFormSectionProps = {
  title: string;
  summary: string;
  children: ReactNode;
  defaultOpen?: boolean;
};

export function CollapsibleFormSection({
  title,
  summary,
  children,
  defaultOpen = false,
}: CollapsibleFormSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950/40">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-zinc-900/50"
      >
        <span
          className={`flex size-7 shrink-0 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-900 text-zinc-400 transition-transform ${
            open ? "rotate-45" : ""
          }`}
          aria-hidden="true"
        >
          <Plus className="size-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-medium text-zinc-300">{title}</span>
          {!open ? (
            <span className="mt-0.5 block truncate text-xs text-zinc-600">{summary}</span>
          ) : null}
        </span>
      </button>
      {open ? <div className="border-t border-zinc-800 px-4 py-4">{children}</div> : null}
    </div>
  );
}
