"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { notFound } from "next/navigation";
import { useState, type FormEvent } from "react";
import { ForgeHeader } from "@/components/forge-header";
import { useGames } from "@/components/games-provider";

const inputClassName =
  "mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-zinc-100 placeholder:text-zinc-600 focus:border-orange-500/50 focus:outline-none focus:ring-1 focus:ring-orange-500/50";

export function DevlogNewPage({ projectId }: { projectId: string }) {
  const router = useRouter();
  const { getGameById, addDevlog } = useGames();
  const game = getGameById(projectId);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  if (!game) {
    notFound();
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    addDevlog(projectId, title, content);
    router.push(`/games/${projectId}`);
  }

  return (
    <div className="min-h-full bg-zinc-950 text-zinc-100">
      <ForgeHeader />

      <main className="mx-auto max-w-2xl px-6 py-12">
        <Link
          href={`/games/${projectId}`}
          className="text-sm text-zinc-500 transition-colors hover:text-orange-400"
        >
          ← 作品詳細に戻る
        </Link>

        <h1 className="mt-8 text-3xl font-bold tracking-tight">開発日誌を投稿</h1>
        <p className="mt-2 text-zinc-500">{game.title}</p>

        <form
          onSubmit={handleSubmit}
          className="mt-8 space-y-6 rounded-xl border border-zinc-800 bg-zinc-900/80 p-8"
        >
          <div>
            <label htmlFor="title" className="text-sm font-medium text-zinc-400">
              タイトル
            </label>
            <input
              id="title"
              type="text"
              required
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className={inputClassName}
              placeholder="更新のタイトル"
            />
          </div>

          <div>
            <label
              htmlFor="content"
              className="text-sm font-medium text-zinc-400"
            >
              内容
            </label>
            <textarea
              id="content"
              required
              rows={8}
              value={content}
              onChange={(event) => setContent(event.target.value)}
              className={`${inputClassName} resize-y`}
              placeholder="開発の進捗や変更点を書いてください"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 px-8 py-4 text-lg font-semibold text-zinc-950 transition-opacity hover:opacity-90"
          >
            投稿する
          </button>
        </form>
      </main>
    </div>
  );
}
