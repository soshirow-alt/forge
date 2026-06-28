"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { ProjectListCard } from "@/components/project-list-card";
import { V0SimpleModal } from "@/components/v0-simple-modal";
import { useGames } from "@/components/games-provider";
import { useOwnedProjectVoiceSignals } from "@/hooks/use-owned-project-voice-signals";
import {
  buildProjectGrowthSnapshot,
  sortProjectsForGrowthHub,
} from "@/lib/project-growth-state";
import { resolveVoiceSignalForGame } from "@/lib/project-voice-nurture";
import { projectStudioPath } from "@/lib/project-nurture-links";
import { isPreviewV0Deployment, shouldBypassStudioLoginOnPreview } from "@/lib/preview-v0";

type StudioOwnedProjectsSectionProps = {
  /** 一覧ページでは検索 UI を出さない */
  variant?: "home" | "list";
};

export function StudioOwnedProjectsSection({
  variant = "home",
}: StudioOwnedProjectsSectionProps) {
  const { user, hydrated } = useAuth();
  const {
    getOwnedProjects,
    deleteSubmittedGame,
    getSupportCount,
    getDevlogsByProject,
    dataReady,
  } = useGames();
  const { signals: voiceSignals, loaded: voiceLoaded } =
    useOwnedProjectVoiceSignals(user?.id);

  const showProjectDelete = isPreviewV0Deployment();
  const [pendingDelete, setPendingDelete] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function handleConfirmDelete() {
    if (!pendingDelete) {
      return;
    }

    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteSubmittedGame(pendingDelete.id);
      setPendingDelete(null);
    } catch {
      setDeleteError("削除に失敗しました。時間をおいて再度お試しください。");
    } finally {
      setDeleting(false);
    }
  }

  const ownedGames = useMemo(
    () => (user ? getOwnedProjects(user.id) : []),
    [getOwnedProjects, user],
  );

  const sortedGames = useMemo(
    () =>
      voiceLoaded
        ? sortProjectsForGrowthHub(ownedGames, voiceSignals, getDevlogsByProject)
        : ownedGames,
    [ownedGames, voiceSignals, voiceLoaded, getDevlogsByProject],
  );

  const gamesWithGrowth = useMemo(
    () =>
      sortedGames.map((game) => ({
        game,
        growth: buildProjectGrowthSnapshot(
          game,
          resolveVoiceSignalForGame(game, voiceSignals),
          getDevlogsByProject,
        ),
      })),
    [sortedGames, voiceSignals, getDevlogsByProject],
  );

  if (!hydrated || !dataReady) {
    return null;
  }

  if (!user && !shouldBypassStudioLoginOnPreview()) {
    return (
      <section
        className={`rounded-2xl border p-5 sm:p-6 ${
          variant === "home"
            ? "border-orange-500/30 bg-orange-500/5"
            : "border-zinc-800 bg-zinc-900/20"
        }`}
      >
        <h2 className="text-lg font-semibold text-zinc-100">あなたの作品</h2>
        <p className="mt-2 text-sm text-zinc-400">
          ログインすると、投稿した作品がここに表示されます。
        </p>
        <Link
          href="/login?return=/studio"
          className="mt-4 inline-flex rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-2 text-sm font-semibold text-zinc-950 transition-opacity hover:opacity-90"
        >
          ログインして作品を管理
        </Link>
      </section>
    );
  }

  if (ownedGames.length === 0) {
    return (
      <section
        className={`rounded-2xl border p-5 sm:p-6 ${
          variant === "home"
            ? "border-orange-500/30 bg-orange-500/5"
            : "border-zinc-800 bg-zinc-900/20"
        }`}
      >
        <h2 className="text-lg font-semibold text-zinc-100">あなたの作品</h2>
        <p className="mt-2 text-sm text-zinc-400">
          まだ投稿した作品がありません。投稿後、ここから各作品の Studio を開けます。
        </p>
        <Link
          href="/submit"
          className="mt-4 inline-flex rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-2 text-sm font-semibold text-zinc-950 transition-opacity hover:opacity-90"
        >
          最初の作品を投稿
        </Link>
      </section>
    );
  }

  const topGame = gamesWithGrowth[0];

  return (
    <section
      className={`rounded-2xl border p-5 sm:p-6 ${
        variant === "home"
          ? "border-orange-500/30 bg-orange-500/5"
          : "border-zinc-800 bg-zinc-900/20"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-orange-400/90">
            {variant === "home" ? "Studio · あなたの作品" : "あなたの作品"}
          </p>
          <h2 className="mt-1 text-lg font-semibold text-zinc-100">
            {variant === "home" ? "あなたの作品" : `${ownedGames.length}件`}
          </h2>
          {variant === "home" && (
            <p className="mt-2 text-sm text-zinc-400">
              フィードバック確認・devlog・ver公開はここから。
            </p>
          )}
          {variant === "list" && (
            <p className="mt-2 text-sm text-zinc-500">
              新着の回答や公開待ちがある作品にワッペンが付きます。
            </p>
          )}
        </div>
        {variant === "home" && topGame && (
          <Link
            href={projectStudioPath(topGame.game.id)}
            className="inline-flex shrink-0 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-2 text-sm font-semibold text-zinc-950 transition-opacity hover:opacity-90"
          >
            {topGame.growth.pendingFeedbackCount > 0
              ? "新着あり · 作品 Studio を開く"
              : "作品 Studio を開く"}
          </Link>
        )}
      </div>

      <div className={`space-y-3 ${variant === "list" ? "mt-6" : "mt-5"}`}>
        {(variant === "home" ? gamesWithGrowth.slice(0, 3) : gamesWithGrowth).map(
          ({ game, growth }) => (
            <ProjectListCard
              key={game.id}
              game={game}
              growth={growth}
              supportCount={getSupportCount(game.id)}
              showDelete={showProjectDelete}
              onDelete={
                showProjectDelete
                  ? () => setPendingDelete({ id: game.id, title: game.title })
                  : undefined
              }
              compact
              layout="directory"
            />
          ),
        )}
      </div>

      {variant === "home" && ownedGames.length > 3 && (
        <p className="mt-4 text-center text-sm text-zinc-500">
          <Link href="/studio/mypage" className="text-violet-300 hover:text-violet-200">
            すべての作品を見る（{ownedGames.length}件）
          </Link>
        </p>
      )}

      {pendingDelete && (
        <V0SimpleModal
          title="作品を削除"
          onClose={() => {
            if (!deleting) {
              setPendingDelete(null);
              setDeleteError(null);
            }
          }}
        >
          <p className="text-sm leading-relaxed text-zinc-300">
            「{pendingDelete.title}」を削除します。devlog やフィードバックなど、関連データも削除されます。
            この操作は取り消せません。
          </p>
          {deleteError ? (
            <p className="mt-3 text-sm text-red-400" role="alert">
              {deleteError}
            </p>
          ) : null}
          <div className="mt-6 flex flex-wrap justify-end gap-3">
            <button
              type="button"
              disabled={deleting}
              onClick={() => {
                setPendingDelete(null);
                setDeleteError(null);
              }}
              className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-300 transition-colors hover:border-zinc-600 disabled:opacity-50"
            >
              キャンセル
            </button>
            <button
              type="button"
              disabled={deleting}
              onClick={() => void handleConfirmDelete()}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-500 disabled:opacity-50"
            >
              {deleting ? "削除中…" : "削除する"}
            </button>
          </div>
        </V0SimpleModal>
      )}
    </section>
  );
}
