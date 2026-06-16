"use client";

import Link from "next/link";
import { useState } from "react";
import { usePlayerVoiceAdoptions } from "@/hooks/use-player-voice-adoptions";
import {
  adoptionVerifyHref,
  VOICE_ADOPTIONS_SECTION_ID,
} from "@/lib/project-nurture-links";
import {
  ADOPTION_VERIFY_CTA_DEFAULT,
  VOICE_ADOPTION_AI_DISCLAIMER,
} from "@/lib/voice-adoption/constants";

const primaryButtonClassName =
  "inline-flex cursor-pointer items-center justify-center rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-2 text-xs font-semibold text-zinc-950 transition-opacity hover:opacity-90 sm:text-sm";

function formatAdoptionDate(iso: string): string {
  return new Date(iso).toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

type VoiceAdoptionsSectionProps = {
  projectId?: string;
  previewLimit?: number;
  compact?: boolean;
};

export function VoiceAdoptionsSection({
  projectId,
  previewLimit,
  compact = false,
}: VoiceAdoptionsSectionProps) {
  const { adoptions, loaded, disputeAdoption } = usePlayerVoiceAdoptions(projectId);
  const [disputingId, setDisputingId] = useState<string | null>(null);

  if (!loaded || adoptions.length === 0) {
    return null;
  }

  const visible = previewLimit ? adoptions.slice(0, previewLimit) : adoptions;

  return (
    <section
      id={VOICE_ADOPTIONS_SECTION_ID}
      className={`scroll-mt-24 ${compact ? "" : "mt-8"}`}
    >
      <div
        className={
          compact
            ? "border-l-2 border-violet-500 pl-3"
            : "border-l-2 border-violet-500 pl-4"
        }
      >
        <h2
          className={
            compact
              ? "text-base font-semibold tracking-tight text-zinc-100"
              : "text-xl font-semibold tracking-tight text-zinc-100"
          }
        >
          あなたの回答から変わったこと
        </h2>
        {!compact && (
          <p className="mt-1 text-sm text-zinc-500">
            あなたの声と、今回の更新内容の対応関係です。
          </p>
        )}
      </div>

      <ul className={compact ? "mt-4 space-y-3" : "mt-5 space-y-4"}>
        {visible.map((adoption) => (
          <li key={adoption.id}>
            <article className="rounded-xl border border-violet-500/20 bg-zinc-900/60 p-4 sm:p-5">
              <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-600">
                <span className="rounded-full bg-violet-500/10 px-2.5 py-0.5 font-medium text-violet-300">
                  あなたの声
                </span>
                <span>v{adoption.publishedVersion}</span>
                <time dateTime={adoption.createdAt}>
                  {formatAdoptionDate(adoption.createdAt)}
                </time>
              </div>

              {!projectId && (
                <p className="mt-2 text-sm font-medium text-zinc-400">
                  {adoption.projectTitle}
                </p>
              )}

              <div className="mt-4 space-y-3">
                <div>
                  <p className="text-xs text-zinc-500">あなたは</p>
                  <p className="mt-1 text-base font-semibold text-zinc-100">
                    「{adoption.playerQuote}」
                  </p>
                  <p className="mt-0.5 text-xs text-zinc-500">と回答しました</p>
                </div>

                <p className="text-center text-lg text-violet-400/80" aria-hidden>
                  ↓
                </p>

                <div>
                  <p className="text-xs text-zinc-500">今回の更新で</p>
                  <p className="mt-1 text-base font-semibold text-orange-300">
                    「{adoption.updateSummary}」
                  </p>
                  <p className="mt-0.5 text-xs text-zinc-500">されました</p>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-3">
                <Link
                  href={adoptionVerifyHref(adoption.projectId, adoption.id)}
                  className={primaryButtonClassName}
                >
                  {ADOPTION_VERIFY_CTA_DEFAULT}
                </Link>
                <button
                  type="button"
                  disabled={disputingId === adoption.id}
                  onClick={() => {
                    setDisputingId(adoption.id);
                    void disputeAdoption(adoption.id).finally(() => {
                      setDisputingId(null);
                    });
                  }}
                  className="cursor-pointer text-xs font-medium text-zinc-500 transition-colors hover:text-zinc-300 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  この関連は違う
                </button>
              </div>
            </article>
          </li>
        ))}
      </ul>

      <p className="mt-4 text-xs leading-relaxed text-zinc-600">
        {VOICE_ADOPTION_AI_DISCLAIMER}
      </p>
    </section>
  );
}
