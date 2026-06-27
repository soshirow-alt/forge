"use client";

import { X } from "lucide-react";
import type { ReactNode } from "react";

type V0SimpleModalProps = {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
  size?: "md" | "lg";
};

export function V0SimpleModal({
  title,
  subtitle,
  onClose,
  children,
  size = "md",
}: V0SimpleModalProps) {
  const widthClass = size === "lg" ? "max-w-lg" : "max-w-md";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <button
        type="button"
        className="absolute inset-0 bg-black/75 backdrop-blur-sm"
        aria-label="閉じる"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="v0-modal-title"
        className={`relative flex max-h-[min(92vh,820px)] w-full ${widthClass} flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-[#0a0a0a] shadow-2xl shadow-black/50`}
      >
        <div className="flex items-start justify-between gap-3 border-b border-zinc-800/80 px-5 py-4">
          <div>
            <h2 id="v0-modal-title" className="text-lg font-semibold text-white">
              {title}
            </h2>
            {subtitle && <p className="mt-1 text-sm text-zinc-400">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-zinc-500 transition-colors hover:bg-zinc-900 hover:text-zinc-300"
            aria-label="閉じる"
          >
            <X className="size-5" />
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-5">{children}</div>
      </div>
    </div>
  );
}
