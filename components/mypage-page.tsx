"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import { useAuth } from "@/components/auth-provider";
import { CreatorLink } from "@/components/creator-link";
import { ForgeHeader } from "@/components/forge-header";
import { GameThumbnail } from "@/components/game-thumbnail";
import { PlayTypeLabel } from "@/components/play-type-label";
import { useGames } from "@/components/games-provider";
import { LOGIN_PATH } from "@/hooks/use-require-auth";
import type { Game } from "@/lib/mock-games";
import { displayGameStatus } from "@/lib/user-labels";

function MyPageGameRow({ game }: { game: Game }) {
  return (
    <Link
      href={`/games/${game.id}`}
      className="group flex gap-4 rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 transition-colors hover:border-zinc-700 hover:bg-zinc-900"
    >
      <div className="w-36 shrink-0 overflow-hidden rounded-lg">
        <GameThumbnail
          thumbnailUrl={game.thumbnailUrl}
          status={game.status}
          projectId={game.id}
          title={game.title}
          genre={game.genre}
          phase={game.phase}
          showStatus={false}
          aspectClassName="aspect-video"
        />
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-center">
        <h3 className="truncate font-semibold text-zinc-100 transition-colors group-hover:text-orange-400">
          {game.title}
        </h3>
        <p className="mt-1 text-sm text-zinc-500">{game.genre}</p>
        <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
          <CreatorLink name={game.creator} />
          <PlayTypeLabel playUrl={game.playUrl} />
        </div>
      </div>
      <span
        aria-hidden="true"
        className="hidden shrink-0 self-center text-zinc-600 transition-colors group-hover:text-orange-400 sm:inline"
      >
        →
      </span>
    </Link>
  );
}

function MyPageSection({
  id,
  title,
  description,
  games,
  emptyMessage,
  accentClassName,
}: {
  id: string;
  title: string;
  description: string;
  games: Game[];
  emptyMessage: string;
  accentClassName: string;
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <div className={`border-l-2 pl-4 ${accentClassName}`}>
        <h2 className="text-xl font-semibold tracking-tight text-zinc-100">
          {title}
        </h2>
        <p className="mt-1 text-sm text-zinc-500">{description}</p>
      </div>

      {games.length === 0 ? (
        <div className="mt-5 rounded-xl border border-dashed border-zinc-800 bg-zinc-900/40 px-5 py-10 text-center">
          <p className="text-sm text-zinc-500">{emptyMessage}</p>
        </div>
      ) : (
        <ul className="mt-5 space-y-3">
          {games.map((game) => (
            <li key={game.id}>
              <MyPageGameRow game={game} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function OwnedProjectRow({ game }: { game: Game }) {
  const created = game.createdAt ?? game.lastUpdated;

  return (
    <article className="flex flex-col gap-4 rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <Link
          href={`/games/${game.id}`}
          className="font-semibold text-zinc-100 transition-colors hover:text-orange-400"
        >
          {game.title}
        </Link>
        <p className="mt-1 text-sm text-zinc-500">
          {displayGameStatus(game.status)}
          {created
            ? ` · ${new Date(created).toLocaleDateString("ja-JP")}`
            : ""}
        </p>
      </div>
      <div className="flex shrink-0 flex-wrap gap-2">
        <Link
          href={`/games/${game.id}`}
          className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-200 transition-colors hover:border-orange-500/50 hover:text-orange-400"
        >
          詳細を見る
        </Link>
        <Link
          href={`/projects/${game.id}/edit`}
          className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-400 transition-colors hover:border-zinc-600 hover:text-zinc-200"
        >
          編集
        </Link>
      </div>
    </article>
  );
}

export function MyPagePage() {
  const router = useRouter();
  const { user, hydrated } = useAuth();
  const {
    dataReady,
    getSupportedGames,
    getWatchedGames,
    getBookmarkedGames,
    getOwnedProjects,
  } = useGames();

  const supportedGames = getSupportedGames();
  const watchedGames = getWatchedGames();
  const bookmarkedGames = getBookmarkedGames();
  const ownedGames = useMemo(
    () =>
      getOwnedProjects(user?.id).sort(
        (a, b) =>
          new Date(b.createdAt ?? b.lastUpdated).getTime() -
          new Date(a.createdAt ?? a.lastUpdated).getTime(),
      ),
    [getOwnedProjects, user?.id],
  );

  useEffect(() => {
    if (hydrated && !user) {
      router.replace(LOGIN_PATH);
    }
  }, [hydrated, user, router]);

  if (!hydrated || !dataReady) {
    return (
      <div className="min-h-full bg-zinc-950 text-zinc-100">
        <ForgeHeader />
        <main className="mx-auto max-w-3xl px-6 py-12">
          <p className="text-zinc-500">読み込み中...</p>
        </main>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const hasAnyActivity =
    supportedGames.length > 0 ||
    watchedGames.length > 0 ||
    bookmarkedGames.length > 0 ||
    ownedGames.length > 0;

  return (
    <div className="min-h-full bg-zinc-950 text-zinc-100">
      <ForgeHeader />

      <main className="mx-auto max-w-3xl px-6 py-12">
        <Link
          href="/"
          className="text-sm text-zinc-500 transition-colors hover:text-orange-400"
        >
          ← 作品一覧に戻る
        </Link>

        <header className="mt-8">
          <h1 className="text-3xl font-bold tracking-tight">マイページ</h1>
          <p className="mt-3 text-zinc-400 leading-relaxed">
            あなたとゲームの関係をまとめたページです。応援・更新の追跡・あとで見るは、それぞれ別の意味で保存されています。
          </p>
        </header>

        {!hasAnyActivity ? (
          <div className="mt-12 rounded-xl border border-zinc-800 bg-zinc-900/80 px-6 py-16 text-center">
            <p className="text-zinc-400">
              まだ関わっている作品がありません。
            </p>
            <Link
              href="/"
              className="mt-6 inline-block rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 px-6 py-3 text-sm font-semibold text-zinc-950 transition-opacity hover:opacity-90"
            >
              作品を探す
            </Link>
          </div>
        ) : (
          <nav
            aria-label="マイページ内セクション"
            className="mt-8 flex flex-wrap gap-2 text-xs"
          >
            {supportedGames.length > 0 && (
              <a
                href="#supported"
                className="rounded-full border border-zinc-800 px-3 py-1 text-zinc-400 transition-colors hover:border-orange-500/40 hover:text-orange-400"
              >
                応援中 ({supportedGames.length})
              </a>
            )}
            {watchedGames.length > 0 && (
              <a
                href="#watching"
                className="rounded-full border border-zinc-800 px-3 py-1 text-zinc-400 transition-colors hover:border-amber-500/40 hover:text-amber-400"
              >
                更新を追う ({watchedGames.length})
              </a>
            )}
            {bookmarkedGames.length > 0 && (
              <a
                href="#bookmarks"
                className="rounded-full border border-zinc-800 px-3 py-1 text-zinc-400 transition-colors hover:border-zinc-600 hover:text-zinc-300"
              >
                あとで見る ({bookmarkedGames.length})
              </a>
            )}
            {ownedGames.length > 0 && (
              <a
                href="#owned"
                className="rounded-full border border-zinc-800 px-3 py-1 text-zinc-400 transition-colors hover:border-zinc-600 hover:text-zinc-300"
              >
                投稿した作品 ({ownedGames.length})
              </a>
            )}
          </nav>
        )}

        <div className="mt-12 space-y-14">
          <MyPageSection
            id="supported"
            title="応援中のゲーム"
            description="気に入った作品への、あなたの応援です。"
            games={supportedGames}
            emptyMessage="応援した作品はまだありません。詳細ページから「応援する」を押すと、ここに表示されます。"
            accentClassName="border-orange-500"
          />

          <MyPageSection
            id="watching"
            title="更新を追っているゲーム"
            description="開発ログが投稿されると、通知一覧でお知らせします。"
            games={watchedGames}
            emptyMessage="追跡中の作品はまだありません。気になる作品の「更新を追う」を押すと、ここに表示されます。"
            accentClassName="border-amber-500"
          />

          <MyPageSection
            id="bookmarks"
            title="あとで見る"
            description="後からプレイしたい作品のブックマークです。"
            games={bookmarkedGames}
            emptyMessage="保存した作品はまだありません。詳細ページから「あとで見る」を押すと、ここに表示されます。"
            accentClassName="border-zinc-500"
          />

          <section id="owned" className="scroll-mt-24">
            <div className="border-l-2 border-zinc-600 pl-4">
              <h2 className="text-xl font-semibold tracking-tight text-zinc-100">
                自分が投稿した作品
              </h2>
              <p className="mt-1 text-sm text-zinc-500">
                あなたが Forge に投稿した作品です。編集・削除はダッシュボードでも行えます。
              </p>
            </div>

            {ownedGames.length === 0 ? (
              <div className="mt-5 rounded-xl border border-dashed border-zinc-800 bg-zinc-900/40 px-5 py-10 text-center">
                <p className="text-sm text-zinc-500">
                  投稿した作品はまだありません。
                </p>
                <Link
                  href="/submit"
                  className="mt-4 inline-block text-sm font-medium text-orange-400 transition-colors hover:text-orange-300"
                >
                  作品を投稿する →
                </Link>
              </div>
            ) : (
              <>
                <ul className="mt-5 space-y-3">
                  {ownedGames.map((game) => (
                    <li key={game.id}>
                      <OwnedProjectRow game={game} />
                    </li>
                  ))}
                </ul>
                <p className="mt-4 text-center text-xs text-zinc-600">
                  <Link
                    href="/my-projects"
                    className="transition-colors hover:text-zinc-400"
                  >
                    応援数・テスター管理はダッシュボード →
                  </Link>
                </p>
              </>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
