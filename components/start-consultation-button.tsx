"use client";

import Link from "next/link";
import { useRequireAuth } from "@/hooks/use-require-auth";

/**
 * Navigates to a draft message room (no start modal).
 * DB consultation is created on first send in the draft room.
 */
export function StartConsultationButton({
  counterpartId,
  counterpartProjectId,
  label = "メッセージを送る",
  className,
  fullWidth = false,
}: {
  counterpartId: string;
  counterpartProjectId?: string | null;
  /** @deprecated kept for call-site compat; draft room no longer needs owned projects */
  initiatorProjects?: { id: string; title: string }[];
  label?: string;
  className?: string;
  fullWidth?: boolean;
}) {
  const { hydrated, isLoggedIn } = useRequireAuth();
  const params = new URLSearchParams();
  params.set("to", counterpartId);
  if (counterpartProjectId) {
    params.set("project", counterpartProjectId);
  }
  const href = `/messages/new?${params.toString()}`;

  const baseClass =
    className ??
    "rounded-xl border border-violet-500/40 bg-violet-500/10 px-4 py-2.5 text-sm font-medium text-violet-200 hover:bg-violet-500/20 disabled:cursor-not-allowed disabled:opacity-50";

  if (!hydrated) {
    return (
      <button type="button" disabled className={`${baseClass} ${fullWidth ? "w-full" : ""}`}>
        {label}
      </button>
    );
  }

  if (!isLoggedIn) {
    return (
      <button
        type="button"
        disabled
        title="ログインすると利用できます"
        aria-disabled="true"
        className={`${baseClass} ${fullWidth ? "w-full" : ""}`}
      >
        {label}
      </button>
    );
  }

  return (
    <Link
      href={href}
      className={`inline-flex items-center justify-center ${baseClass} ${fullWidth ? "w-full" : ""}`}
    >
      {label}
    </Link>
  );
}
