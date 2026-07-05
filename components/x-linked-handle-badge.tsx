"use client";

import { formatXHandleLabel } from "@/lib/x-auth";

export function XLinkedHandleBadge({
  username,
  className = "",
}: {
  username: string;
  className?: string;
}) {
  const label = formatXHandleLabel(username);
  if (!label) {
    return null;
  }

  return (
    <span
      className={`inline-flex max-w-[12rem] items-center truncate rounded-md border border-sky-500/20 bg-sky-500/10 px-2 py-0.5 text-[11px] font-medium text-sky-200/90 ${className}`}
    >
      {label}
    </span>
  );
}
