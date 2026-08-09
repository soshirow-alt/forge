"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AppWindow, Gamepad2, Music2, Package, Wrench } from "lucide-react";
import { StudioMypageBackLink } from "@/components/studio-mypage-back-link";
import { StudioShell } from "@/components/studio-shell";
import { studioOperationPrimaryButtonClassName } from "@/lib/studio-operation-panel-styles";
import type { ProjectCategoryId } from "@/lib/project-categories";
import {
  STUDIO_SUBMIT_CATEGORY_OPTIONS,
  studioSubmitHrefForCategory,
} from "@/lib/studio-submit-category-options";

const ICONS: Record<
  ProjectCategoryId,
  typeof Gamepad2
> = {
  game: Gamepad2,
  audio: Music2,
  asset: Package,
  "dev-tool": Wrench,
  "service-app": AppWindow,
};

/**
 * Category pick only — after choose, hand off to formal submit shell
 * (`/studio/submit` or `/studio/submit?view=category-proto&category=…`).
 */
export function StudioSubmitCategoryPick() {
  const router = useRouter();
  const [picked, setPicked] = useState<ProjectCategoryId | null>(null);

  function start() {
    if (!picked) return;
    router.push(studioSubmitHrefForCategory(picked));
  }

  return (
    <StudioShell activeNav="mypage">
      <div className="mx-auto max-w-2xl space-y-5">
        <header className="border-b border-zinc-800/80 pb-3">
          <StudioMypageBackLink />
          <p className="mt-2 text-sm text-zinc-400">作品を投稿する</p>
        </header>

        <div>
          <h1 className="text-xl font-bold text-white sm:text-2xl">
            投稿するカテゴリを選ぶ
          </h1>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          {STUDIO_SUBMIT_CATEGORY_OPTIONS.map((option) => {
            const Icon = ICONS[option.id];
            const active = picked === option.id;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => setPicked(option.id)}
                className={`rounded-xl border px-4 py-3.5 text-left transition-colors ${
                  active
                    ? "border-violet-500/50 bg-violet-500/15"
                    : "border-zinc-800 bg-zinc-950/40 hover:border-zinc-700"
                }`}
              >
                <span className="flex items-start gap-3">
                  <Icon
                    className={`mt-0.5 size-5 shrink-0 ${
                      active ? "text-violet-300" : "text-zinc-500"
                    }`}
                    aria-hidden
                  />
                  <span>
                    <span className="block text-sm font-semibold text-white">
                      {option.title}
                    </span>
                    <span className="mt-1 block text-xs text-zinc-400">
                      {option.hint}
                    </span>
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          disabled={!picked}
          onClick={start}
          className={studioOperationPrimaryButtonClassName}
        >
          このカテゴリで投稿を始める
        </button>
      </div>
    </StudioShell>
  );
}
