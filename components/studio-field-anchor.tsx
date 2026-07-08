"use client";

import { useEffect, useRef, type ReactNode } from "react";
import type { StudioFieldId } from "@/lib/studio-preview-edit-targets";

type StudioFieldAnchorProps = {
  fieldId: StudioFieldId;
  highlight?: boolean;
  /** When false, only marks the DOM id; no scrollIntoView */
  scrollOnHighlight?: boolean;
  children: ReactNode;
  className?: string;
};

/**
 * Scroll/focus target for left-preview → right-panel navigation.
 * Layout-neutral: no ring/border/padding that can widen the panel.
 */
export function StudioFieldAnchor({
  fieldId,
  highlight = false,
  scrollOnHighlight = true,
  children,
  className = "",
}: StudioFieldAnchorProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!highlight || !ref.current) {
      return;
    }

    if (scrollOnHighlight) {
      ref.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }

    const timer = window.setTimeout(() => {
      if (!scrollOnHighlight) {
        return;
      }
      const focusable = ref.current?.querySelector<HTMLElement>(
        "input:not([type=hidden]):not([type=radio]):not([type=checkbox]), textarea, select",
      );
      focusable?.focus({ preventScroll: true });
    }, 320);

    return () => window.clearTimeout(timer);
  }, [highlight, scrollOnHighlight]);

  return (
    <div
      ref={ref}
      id={fieldId}
      data-studio-field={fieldId}
      className={`w-full min-w-0 max-w-full ${className}`}
    >
      {children}
    </div>
  );
}
