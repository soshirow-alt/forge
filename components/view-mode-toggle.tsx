"use client";

import { Grid3x3, LayoutList } from "lucide-react";

export type ViewMode = "grid" | "list";

export function ViewModeToggle({
  value,
  onChange,
  size = "md",
}: {
  value: ViewMode;
  onChange: (mode: ViewMode) => void;
  size?: "sm" | "md";
}) {
  const iconClass = size === "sm" ? "size-4" : "size-5";
  const buttonClass = size === "sm" ? "p-2" : "p-2";

  return (
    <div className="flex rounded-lg border border-zinc-800 p-0.5">
      <button
        type="button"
        onClick={() => onChange("list")}
        className={`rounded-md ${buttonClass} transition-colors ${
          value === "list"
            ? "bg-violet-600 text-white"
            : "text-zinc-500 hover:text-zinc-300"
        }`}
        aria-label="リスト表示"
        aria-pressed={value === "list"}
      >
        <LayoutList className={iconClass} />
      </button>
      <button
        type="button"
        onClick={() => onChange("grid")}
        className={`rounded-md ${buttonClass} transition-colors ${
          value === "grid"
            ? "bg-violet-600 text-white"
            : "text-zinc-500 hover:text-zinc-300"
        }`}
        aria-label="グリッド表示"
        aria-pressed={value === "grid"}
      >
        <Grid3x3 className={iconClass} />
      </button>
    </div>
  );
}
