"use client";

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
    <div>
      <p className="text-xs font-medium text-zinc-500">編集する場所</p>
      <div
        role="tablist"
        aria-label="編集する場所"
        className="mt-2 grid grid-cols-3 gap-1 rounded-lg bg-zinc-950/50 p-1 ring-1 ring-inset ring-zinc-800/60"
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
              className={`rounded-md px-2 py-2 text-xs font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-orange-500/60 ${
                selected
                  ? "bg-orange-500/15 text-orange-100 shadow-sm ring-1 ring-orange-500/30"
                  : "text-zinc-400 hover:bg-zinc-800/70 hover:text-zinc-200"
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
