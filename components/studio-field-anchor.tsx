"use client";

import { useEffect, useRef, type ReactNode } from "react";
import type { StudioFieldId } from "@/lib/studio-preview-edit-targets";

type StudioFieldAnchorProps = {
  fieldId: StudioFieldId;
  highlight?: boolean;
  children: ReactNode;
  className?: string;
};

export function StudioFieldAnchor({
  fieldId,
  highlight = false,
  children,
  className = "",
}: StudioFieldAnchorProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!highlight || !ref.current) {
      return;
    }

    ref.current.scrollIntoView({ behavior: "smooth", block: "nearest" });

    const timer = window.setTimeout(() => {
      const focusable = ref.current?.querySelector<HTMLElement>(
        "input:not([type=hidden]):not([type=radio]):not([type=checkbox]), textarea, select",
      );
      focusable?.focus({ preventScroll: true });
    }, 320);

    return () => window.clearTimeout(timer);
  }, [highlight]);

  return (
    <div
      ref={ref}
      id={fieldId}
      data-studio-field={fieldId}
      className={`rounded-lg transition-shadow duration-500 ${
        highlight ? "ring-2 ring-orange-500/45 ring-offset-2 ring-offset-zinc-950" : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}
