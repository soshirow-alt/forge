"use client";

import Link from "next/link";
import { notFound } from "next/navigation";
import { DevlogComposeForm } from "@/components/devlog-compose-form";
import { StudioShell } from "@/components/studio-shell";
import { useGames } from "@/components/games-provider";
import { projectStudioPath } from "@/lib/project-nurture-links";
import { useRouter } from "next/navigation";

export function DevlogNewPage({ projectId }: { projectId: string }) {
  const router = useRouter();
  const { getGameById } = useGames();
  const game = getGameById(projectId);

  if (!game) {
    notFound();
  }

  return (
    <StudioShell activeNav="mypage">
      <main className="mx-auto max-w-2xl">
        <Link
          href={projectStudioPath(projectId)}
          className="text-sm text-zinc-500 transition-colors hover:text-violet-400"
        >
          ← Studio に戻る
        </Link>

        <h1 className="mt-8 text-3xl font-bold tracking-tight">新verの開発ログ</h1>
        <p className="mt-2 text-zinc-500">{game.title}</p>

        <div className="mt-8 rounded-xl border border-zinc-800 bg-zinc-900/80 p-6 sm:p-8">
          <DevlogComposeForm
            projectId={projectId}
            onSaved={() => router.push(projectStudioPath(projectId))}
          />
        </div>
      </main>
    </StudioShell>
  );
}
