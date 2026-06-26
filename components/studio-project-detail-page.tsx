"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import { GameDetailHeroGallery } from "@/components/game-detail-hero-gallery";
import { GameDetailOverviewV0Tab } from "@/components/game-detail-overview-v0-tab";
import { GameVerHistoryV0Tab } from "@/components/game-ver-history-v0-tab";
import { GameVoicesV0Tab } from "@/components/game-voices-v0-tab";
import { StudioPreviewSampleBanner } from "@/components/studio-preview-sample-banner";
import { StudioProjectTabs, StudioShell } from "@/components/studio-shell";
import { useProjectOverviewV0 } from "@/hooks/use-project-overview-v0";
import {
  applyProjectOverviewV0,
  saveProjectOverview,
} from "@/lib/project-overview-v0-store";
import {
  gameDetailHref,
  getGameDetailV0,
  resolveGameDetailId,
} from "@/lib/game-detail-v0-mock-data";
import { projectStudioPath } from "@/lib/project-nurture-links";
import { studioProjectPhaseLabel } from "@/lib/studio-projects-v0-mock-data";
import {
  getStudioProjectDetail,
  parseStudioProjectTab,
} from "@/lib/studio-project-detail-v0-mock-data";
import { Clock, ExternalLink, MessageSquare, Pencil, Users } from "lucide-react";

function TagPill({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-md border border-zinc-700/80 bg-zinc-800/60 px-2.5 py-1 text-xs text-zinc-300">
      {children}
    </span>
  );
}

function StudioProjectDetailContent({ id }: { id: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const project = getStudioProjectDetail(id);
  const activeTab = parseStudioProjectTab(searchParams.get("tab"));
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const gameId = resolveGameDetailId(id);
  const { revision: overviewRevision } = useProjectOverviewV0(gameId);
  const game = useMemo(() => {
    const detail = getGameDetailV0(id);
    const base = !project
      ? detail
      : {
          ...detail,
          title: project.title,
          introduction: project.description,
          currentVersion: project.version ?? detail.currentVersion,
          witnessCount: project.witnessCount ?? detail.witnessCount,
          voiceCount: project.voiceCount,
          heroImage: project.image,
          galleryImages: [project.image, ...detail.galleryImages.slice(1)],
          tags: project.genresList,
        };
    return applyProjectOverviewV0(base, gameId);
  }, [id, project, gameId, overviewRevision]);

  if (!project) {
    return (
      <StudioShell activeNav="mypage">
        <p className="text-zinc-500">プロジェクトが見つかりません</p>
      </StudioShell>
    );
  }

  function setTab(tab: string) {
    router.push(`/studio/projects/${id}?tab=${tab}`, { scroll: false });
  }

  return (
    <StudioShell activeNav="mypage">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/studio/mypage"
          className="text-sm text-zinc-500 hover:text-violet-400"
        >
          ← プロジェクト一覧
        </Link>

        <div className="mt-4">
          <StudioPreviewSampleBanner compact />
        </div>

        {saveMessage && (
          <p className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
            {saveMessage}
          </p>
        )}

        <section className="mt-4 overflow-hidden rounded-2xl border border-zinc-800/80 bg-zinc-900/30">
          <div className="grid gap-0 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
            <GameDetailHeroGallery images={game.galleryImages} />

            <div className="flex flex-col justify-center p-6 lg:p-8">
              <div className="flex flex-wrap gap-2">
                {game.tags.map((tag) => (
                  <TagPill key={tag}>{tag}</TagPill>
                ))}
              </div>
              <h1 className="mt-4 text-2xl font-bold tracking-tight text-white sm:text-3xl">
                {game.title}
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">{game.lead}</p>
              <p className="mt-2 text-xs text-zinc-500">
                {studioProjectPhaseLabel(project.phase)} · {game.currentVersion}
              </p>

              <div className="mt-5 flex flex-wrap gap-4 text-sm text-zinc-400">
                <span className="inline-flex items-center gap-1.5">
                  <Users className="size-4 text-violet-400" aria-hidden="true" />
                  見届け人 {(game.witnessCount ?? 0).toLocaleString()}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <MessageSquare className="size-4 text-violet-400" aria-hidden="true" />
                  フィードバック {game.voiceCount.toLocaleString()}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="size-4 text-violet-400" aria-hidden="true" />
                  最終更新 {game.lastUpdated}
                </span>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href={projectStudioPath(id)}
                  className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-violet-500"
                >
                  <Pencil className="size-4" aria-hidden="true" />
                  Studio で改善ループ
                </Link>
                <Link
                  href={gameDetailHref(gameId)}
                  className="inline-flex items-center gap-2 rounded-xl border border-zinc-700 px-4 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:border-zinc-600 hover:text-white"
                >
                  <ExternalLink className="size-4" aria-hidden="true" />
                  プレイヤー視点で見る
                </Link>
              </div>
            </div>
          </div>
        </section>

        <div className="mt-8">
          <StudioProjectTabs activeTab={activeTab} onTabChange={setTab} />
        </div>

        <div className="mt-6 pb-8">
          {activeTab === "overview" && (
            <GameDetailOverviewV0Tab
              game={game}
              editable
              hideVersionQuestions
              onSave={(payload) => {
                saveProjectOverview(gameId, payload);
                setSaveMessage("概要を保存しました。");
              }}
            />
          )}
          {activeTab === "voices" && (
            <GameVoicesV0Tab gameId={gameId} currentVersion={game.currentVersion} />
          )}
          {activeTab === "devlog" && (
            <GameVerHistoryV0Tab
              gameId={gameId}
              projectId={id}
              studioMode
            />
          )}
        </div>
      </div>
    </StudioShell>
  );
}

export function StudioProjectDetailPage({ id }: { id: string }) {
  return (
    <Suspense
      fallback={
        <StudioShell activeNav="mypage">
          <p className="text-zinc-500">読み込み中…</p>
        </StudioShell>
      }
    >
      <StudioProjectDetailContent id={id} />
    </Suspense>
  );
}
