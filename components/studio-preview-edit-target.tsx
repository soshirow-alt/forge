"use client";

import { Pencil } from "lucide-react";
import type { ReactNode } from "react";
import type { StudioPreviewEditTarget } from "@/lib/studio-preview-edit-targets";

type StudioPreviewEditTargetProps = {
  target: StudioPreviewEditTarget;
  onEditTarget?: (target: StudioPreviewEditTarget) => void;
  children: ReactNode;
  className?: string;
  inline?: boolean;
};

export function StudioPreviewEditTarget({
  target,
  onEditTarget,
  children,
  className = "",
  inline = false,
}: StudioPreviewEditTargetProps) {
  if (!onEditTarget) {
    return <>{children}</>;
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onEditTarget(target)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onEditTarget(target);
        }
      }}
      className={`group/studio-edit relative min-w-0 max-w-full rounded-lg transition-colors hover:bg-zinc-800/25 hover:outline hover:outline-1 hover:outline-zinc-700/50 focus-visible:outline focus-visible:outline-1 focus-visible:outline-violet-500/40 ${
        inline ? "inline-flex max-w-full cursor-pointer" : "cursor-pointer"
      } ${className}`}
    >
      <span
        className="pointer-events-none absolute right-1.5 top-1.5 z-10 flex size-5 items-center justify-center rounded border border-zinc-700/70 bg-zinc-900/90 text-zinc-500 opacity-70 transition-opacity [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover/studio-edit:opacity-100 [@media(hover:hover)]:group-focus-visible/studio-edit:opacity-100"
        aria-hidden="true"
      >
        <Pencil className="size-2.5" />
      </span>
      {children}
    </div>
  );
}
