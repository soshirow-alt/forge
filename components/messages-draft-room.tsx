"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ConsultationStartForm } from "@/components/consultation-start-form";
import { useGames } from "@/components/games-provider";
import type { CollabConsultationSummary } from "@/lib/collab/consultation-types";
import { resolveProjectThumbnailUrls } from "@/lib/project-thumbnails";

function shortUserId(userId: string): string {
  return userId.length > 8 ? `${userId.slice(0, 8)}…` : userId;
}

export function MessagesDraftRoom({
  counterpartId,
  counterpartProjectId = null,
}: {
  counterpartId: string;
  counterpartProjectId?: string | null;
}) {
  const router = useRouter();
  const { getDeveloperProfileByUserId, getGameById } = useGames();
  const [resolving, setResolving] = useState(true);

  const profile = getDeveloperProfileByUserId(counterpartId);
  const displayName = profile?.publicName?.trim() || shortUserId(counterpartId);
  const project = counterpartProjectId ? getGameById(counterpartProjectId) : null;
  const projectThumb = project
    ? resolveProjectThumbnailUrls(project)[0] ?? null
    : null;

  useEffect(() => {
    let cancelled = false;
    void Promise.resolve()
      .then(async () => {
        const response = await fetch("/api/collab/consultations", { cache: "no-store" });
        if (!response.ok) return;
        const result = (await response.json()) as {
          consultations: CollabConsultationSummary[];
        };
        if (cancelled) return;
        // Pair identity: enter existing counterpart thread with start form.
        const match = result.consultations.find(
          (item) => item.counterpartId === counterpartId,
        );
        if (match) {
          const params = new URLSearchParams({ start: "1" });
          if (counterpartProjectId) params.set("project", counterpartProjectId);
          router.replace(`/messages/${match.consultationId}?${params.toString()}`);
          return;
        }
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setResolving(false);
      });
    return () => {
      cancelled = true;
    };
  }, [counterpartId, counterpartProjectId, router]);

  const targetPreview = useMemo(() => {
    if (!project) return null;
    return (
      <div className="mt-4 flex items-center gap-2.5 rounded-lg border border-zinc-800 bg-zinc-900/60 px-2.5 py-2">
        {projectThumb ? (
          <span className="relative size-10 shrink-0 overflow-hidden rounded-md border border-zinc-800">
            <Image
              src={projectThumb}
              alt=""
              fill
              className="object-cover"
              sizes="40px"
              unoptimized
            />
          </span>
        ) : null}
        <div className="min-w-0">
          <p className="text-[11px] text-zinc-500">相談対象作品</p>
          <p className="truncate text-sm text-zinc-200">{project.title}</p>
        </div>
      </div>
    );
  }, [project, projectThumb]);

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/messages" className="text-sm text-violet-300">
        ← メッセージ
      </Link>
      <header className="mt-4 flex items-start gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-sm font-semibold text-zinc-300">
          {displayName.slice(0, 1)}
        </span>
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-bold text-white">{displayName}</h1>
          <Link
            href={`/creators/${counterpartId}`}
            className="mt-0.5 inline-block text-xs text-violet-300 hover:text-violet-200"
          >
            プロフィールを見る
          </Link>
        </div>
      </header>
      {targetPreview}
      {resolving ? (
        <p className="mt-6 text-sm text-zinc-500">既存の会話を確認しています…</p>
      ) : (
        <div className="mt-6">
          <ConsultationStartForm
            counterpartId={counterpartId}
            counterpartName={displayName}
            counterpartProjectId={counterpartProjectId}
            onSuccess={(consultationId) => {
              router.replace(`/messages/${consultationId}`);
            }}
          />
        </div>
      )}
    </div>
  );
}
