"use client";

import type { AdoptionVerifyContextRow } from "@/lib/adoption-verify-context";
import { ADOPTION_VERIFY_SECTION_ID } from "@/lib/project-nurture-links";

type AdoptionVerifyBannerProps = {
  context: AdoptionVerifyContextRow;
  onPlayRequest: () => void;
};

export function AdoptionVerifyBanner({
  context,
  onPlayRequest,
}: AdoptionVerifyBannerProps) {
  return (
    <div
      id={ADOPTION_VERIFY_SECTION_ID}
      className="mt-4 scroll-mt-24 rounded-xl border border-violet-500/30 bg-gradient-to-br from-violet-500/10 via-zinc-950/40 to-zinc-950/40 px-4 py-4 sm:px-5"
    >
      <p className="text-sm font-semibold text-violet-200">
        あなたのフィードバックが、今回の更新に届いています
      </p>
      <div className="mt-3 space-y-2 text-sm leading-relaxed text-zinc-400">
        <p>
          あなたは「
          <span className="font-medium text-zinc-200">{context.playerQuote}</span>
          」と答えました。
        </p>
        <p>
          今回の更新で「
          <span className="font-medium text-orange-300/90">
            {context.updateSummary}
          </span>
          」されました。
        </p>
        <p className="text-zinc-500">
          ver {context.publishedVersion} で、変わったか確かめに行きましょう。
        </p>
      </div>
      <button
        type="button"
        onClick={onPlayRequest}
        className="mt-4 inline-flex cursor-pointer items-center justify-center rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-2 text-sm font-semibold text-zinc-950 transition-opacity hover:opacity-90"
      >
        プレイして確認する
      </button>
    </div>
  );
}
