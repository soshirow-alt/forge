"use client";

import type { ReactNode } from "react";

type ForgeTabPanelProps = {
  active: boolean;
  children: ReactNode;
  className?: string;
};

/** Keeps tab content mounted to avoid refetch on revisit. */
export function ForgeTabPanel({
  active,
  children,
  className,
}: ForgeTabPanelProps) {
  return (
    <div
      role="tabpanel"
      hidden={!active}
      className={active ? className : `hidden ${className ?? ""}`.trim()}
    >
      {children}
    </div>
  );
}
