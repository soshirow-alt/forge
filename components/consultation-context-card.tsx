/**
 * Compact consultation context marker (not a chat bubble).
 */

import Image from "next/image";
import {
  consultationPurposeStartLabel,
  type CollabConsultationPurpose,
} from "@/lib/collab/consultation-types";

export type ConsultationContextCardProps = {
  title?: string;
  projectTitle?: string | null;
  projectThumbnailUrl?: string | null;
  creatorName?: string | null;
  purpose: CollabConsultationPurpose;
  ownProjectTitle?: string | null;
};

export function ConsultationContextCard({
  title = "この作品について相談",
  projectTitle,
  projectThumbnailUrl,
  creatorName,
  purpose,
  ownProjectTitle,
}: ConsultationContextCardProps) {
  const purposeLabel = consultationPurposeStartLabel(purpose);
  const heading = projectTitle ? title : "相談を開始";

  return (
    <div
      role="note"
      className="mx-auto w-full max-w-md rounded-xl border border-zinc-800/90 bg-zinc-900/50 px-3 py-2.5"
    >
      <p className="text-[11px] font-medium tracking-wide text-zinc-500">{heading}</p>
      {projectTitle ? (
        <div className="mt-2 flex items-center gap-2.5">
          {projectThumbnailUrl ? (
            <span className="relative size-10 shrink-0 overflow-hidden rounded-md border border-zinc-800 bg-zinc-950">
              <Image
                src={projectThumbnailUrl}
                alt=""
                fill
                className="object-cover"
                sizes="40px"
                unoptimized
              />
            </span>
          ) : null}
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-zinc-200">{projectTitle}</p>
            {creatorName ? (
              <p className="truncate text-[11px] text-zinc-500">{creatorName}</p>
            ) : null}
          </div>
        </div>
      ) : null}
      <dl className="mt-2 space-y-1 text-[11px] leading-snug text-zinc-400">
        <div className="flex gap-2">
          <dt className="shrink-0 text-zinc-500">相談内容</dt>
          <dd className="min-w-0 text-zinc-300">{purposeLabel}</dd>
        </div>
        {ownProjectTitle ? (
          <div className="flex gap-2">
            <dt className="shrink-0 text-zinc-500">自分の関連作品</dt>
            <dd className="min-w-0 text-zinc-300">{ownProjectTitle}</dd>
          </div>
        ) : null}
      </dl>
    </div>
  );
}
