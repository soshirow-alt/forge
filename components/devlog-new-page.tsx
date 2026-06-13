"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { notFound } from "next/navigation";
import { useState, type FormEvent } from "react";
import { ForgeHeader } from "@/components/forge-header";
import { useGames } from "@/components/games-provider";
import {
  normalizePlayableVersionInput,
  resolvePlayableVersion,
} from "@/lib/playable-version";

const inputClassName =
  "mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-zinc-100 placeholder:text-zinc-600 focus:border-orange-500/50 focus:outline-none focus:ring-1 focus:ring-orange-500/50";

export function DevlogNewPage({ projectId }: { projectId: string }) {
  const router = useRouter();
  const { getGameById, addDevlog } = useGames();
  const game = getGameById(projectId);
  const currentVersion = resolvePlayableVersion(game?.playableVersion);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [publishNewVersion, setPublishNewVersion] = useState(false);
  const [newVersion, setNewVersion] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!game) {
    notFound();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    let publishPlayableVersion: string | undefined;

    if (publishNewVersion) {
      const trimmed = normalizePlayableVersionInput(newVersion);
      if (!trimmed) {
        setError("新しいプレイ可能版のバージョン名を入力してください。");
        setSubmitting(false);
        return;
      }
      if (trimmed === currentVersion) {
        setError("現在のプレイ可能版と同じバージョン名は使えません。");
        setSubmitting(false);
        return;
      }
      publishPlayableVersion = trimmed;
    }

    try {
      await addDevlog(projectId, title, content, { publishPlayableVersion });
      router.push(`/games/${projectId}`);
    } catch {
      setError(
        "開発ログの投稿に失敗しました。Supabase の設定と migration 004 を確認してください。",
      );
    } finally {
      setSubmitting(false);
    }
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
          {error && (
            <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error}
            </p>
          )}

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

          <div className="space-y-3 rounded-lg border border-zinc-800 bg-zinc-950/50 p-4">
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={publishNewVersion}
                onChange={(event) => setPublishNewVersion(event.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 rounded border-zinc-600 bg-zinc-900 text-orange-500 focus:ring-orange-500/50"
              />
              <span>
                <span className="block text-sm font-medium text-zinc-300">
                  今回の更新を新しいプレイ可能版として公開する
                </span>
                <span className="mt-1 block text-xs text-zinc-600">
                  チェックすると、プレイヤーは新しい版向けにフィードバックを送れるようになります。
                </span>
              </span>
            </label>

            {publishNewVersion && (
              <div className="pl-7">
                <label
                  htmlFor="newVersion"
                  className="text-xs font-medium text-zinc-500"
                >
                  プレイ可能版のバージョン名
                </label>
                <input
                  id="newVersion"
                  type="text"
                  required={publishNewVersion}
                  value={newVersion}
                  onChange={(event) => setNewVersion(event.target.value)}
                  className={inputClassName}
                  placeholder="例: 0.2"
                />
                <p className="mt-1.5 text-xs text-zinc-600">
                  現在のプレイ可能版: {currentVersion}
                </p>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 px-8 py-4 text-lg font-semibold text-zinc-950 transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {submitting ? "投稿中..." : "投稿する"}
          </button>
        </form>
      </main>
    </div>
  );
}
