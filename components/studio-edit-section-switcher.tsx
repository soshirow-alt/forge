"use client";

import { SlidersHorizontal } from "lucide-react";
import type { ReactNode } from "react";
import type { GameDetailTab } from "@/lib/game-detail-tabs";

const STUDIO_EDIT_SECTIONS: { id: GameDetailTab; label: ReactNode }[] = [
  { id: "overview", label: "概要" },
  { id: "devlog", label: "開発ログ" },
  {
    id: "voices",
    label: (
      <span className="block leading-tight">
        フィード
        <br />
        バック
      </span>
    ),
  },
];

export type StudioEditSectionSwitcherProps = {
  activeSection: GameDetailTab;
  onSectionChange: (section: GameDetailTab) => void;
};

export function StudioEditSectionSwitcher({
  activeSection,
  onSectionChange,
}: StudioEditSectionSwitcherProps) {
  return (
    <div className="-mx-4 -mt-4 rounded-t-2xl border-b border-violet-500/15 bg-gradient-to-br from-violet-500/10 via-violet-500/5 to-transparent px-4 pb-4 pt-4">
      <div className="flex items-center gap-2">
        <span
          className="h-4 w-0.5 shrink-0 rounded-full bg-violet-500/80"
          aria-hidden="true"
        />
        <SlidersHorizontal className="size-3.5 shrink-0 text-violet-400/90" aria-hidden="true" />
        <h2 className="text-sm font-semibold tracking-tight text-zinc-100">Studioパネル</h2>
      </div>

      <div
        role="tablist"
        aria-label="Studioのタブ"
        className="mt-2.5 grid grid-cols-3 gap-1.5 rounded-lg border border-violet-500/25 bg-zinc-950/95 p-1 shadow-inner shadow-black/25"
      >
        {STUDIO_EDIT_SECTIONS.map((section) => {
          const selected = activeSection === section.id;

          return (
            <button
              key={section.id}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => onSectionChange(section.id)}
              className={`cursor-pointer rounded-md px-2 py-2.5 text-xs font-semibold transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-violet-500/70 ${
                selected
                  ? "bg-violet-500/25 text-white shadow-sm ring-1 ring-violet-500/45"
                  : "border border-transparent text-zinc-400 hover:border-violet-500/20 hover:bg-violet-500/10 hover:text-zinc-200"
              }`}
            >
              {section.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
