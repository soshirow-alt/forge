"use client";

import { SlidersHorizontal } from "lucide-react";
import type { GameDetailTab } from "@/lib/game-detail-tabs";

const STUDIO_EDIT_SECTIONS: { id: GameDetailTab; label: string }[] = [
  { id: "overview", label: "概要" },
  { id: "devlog", label: "開発ログ" },
  { id: "voices", label: "フィードバック" },
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
    <div className="-mx-4 -mt-4 rounded-t-2xl border-b border-orange-500/15 bg-gradient-to-br from-orange-500/10 via-orange-500/5 to-transparent px-4 pb-4 pt-4">
      <div className="flex items-center gap-2">
        <span
          className="h-4 w-0.5 shrink-0 rounded-full bg-orange-500/80"
          aria-hidden="true"
        />
        <SlidersHorizontal className="size-3.5 shrink-0 text-orange-400/90" aria-hidden="true" />
        <h2 className="text-sm font-semibold tracking-tight text-zinc-100">編集パネル</h2>
      </div>

      <div
        role="tablist"
        aria-label="編集する場所"
        className="mt-2.5 grid grid-cols-3 gap-1.5 rounded-lg border border-orange-500/25 bg-zinc-950/95 p-1 shadow-inner shadow-black/25"
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
              className={`rounded-md px-2 py-2.5 text-xs font-semibold transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-orange-500/70 ${
                selected
                  ? "bg-orange-500/25 text-orange-50 shadow-sm ring-1 ring-orange-500/45"
                  : "border border-transparent text-zinc-400 hover:border-zinc-700/70 hover:bg-zinc-800/80 hover:text-zinc-200"
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
