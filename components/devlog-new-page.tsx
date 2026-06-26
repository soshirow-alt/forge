"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { notFound } from "next/navigation";
import { useState, type FormEvent } from "react";
import { DevlogConfirmationRequestPanel } from "@/components/devlog-confirmation-request-panel";
import { StudioShell } from "@/components/studio-shell";
import { useGames } from "@/components/games-provider";
import {
  EMPTY_CONFIRMATION_REQUEST_DRAFT,
  type ConfirmationRequestDraft,
} from "@/lib/confirmation-request-draft";
import { projectStudioPath } from "@/lib/project-nurture-links";
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
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const [confirmationDraft, setConfirmationDraft] =
    useState<ConfirmationRequestDraft>(EMPTY_CONFIRMATION_REQUEST_DRAFT);

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
        setError("新しいプレイ可能verのバージョン名を入力してください。");
        setSubmitting(false);
        return;
      }
      if (trimmed === currentVersion) {
        setError("現在のプレイ可能verと同じバージョン名は使えません。");
        setSubmitting(false);
        return;
      }
      publishPlayableVersion = trimmed;
    }

    try {
      await addDevlog(projectId, title, content, { publishPlayableVersion });
      router.push(projectStudioPath(projectId));
    } catch {
      setError(
        "開発ログの投稿に失敗しました。Supabase の設定と migration 004 を確認してください。",
      );
    } finally {
      setSubmitting(false);
    }
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

        <h1 className="mt-8 text-3xl font-bold tracking-tight">開発ログを書く</h1>
        <p className="mt-2 text-zinc-500">{game.title}</p>
        <p className="mt-1 text-sm text-zinc-600">
          プレイヤーに、今回の改善や変更点を伝えます。
        </p>

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
              今回の更新タイトル
            </label>
            <input
              id="title"
              type="text"
              required
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className={inputClassName}
              placeholder="例: チュートリアルを追加、バグを修正"
            />
            <p className="mt-2 text-xs text-zinc-600">
              プレイヤーに伝える、今回の変更の見出しです（ゲームタイトルやバージョン名ではありません）。
            </p>
          </div>

          <div>
            <label
              htmlFor="content"
              className="text-sm font-medium text-zinc-400"
            >
              今回の更新内容
            </label>
            <textarea
              id="content"
              required
              rows={8}
              value={content}
              onChange={(event) => setContent(event.target.value)}
              className={`${inputClassName} resize-y`}
              placeholder="何を直したか、何が変わったか、プレイヤーに試してほしい点を書いてください"
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
                  今回の更新を新しいプレイ可能verとして公開する
                </span>
                <span className="mt-1 block text-xs text-zinc-600">
                  チェックすると、プレイヤーは新しいver向けに回答を送れるようになります。
                </span>
              </span>
            </label>

            {publishNewVersion && (
              <div className="pl-7">
                <label
                  htmlFor="newVersion"
                  className="text-xs font-medium text-zinc-500"
                >
                  プレイ可能verのバージョン名
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
                  現在のプレイ可能ver: {currentVersion}
                </p>
              </div>
            )}
          </div>

          <DevlogConfirmationRequestPanel
            open={confirmationOpen}
            onOpenChange={setConfirmationOpen}
            draft={confirmationDraft}
            onDraftChange={setConfirmationDraft}
          />

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 px-8 py-4 text-lg font-semibold text-zinc-950 transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {submitting ? "投稿中..." : "投稿する"}
          </button>
        </form>
      </main>
    </StudioShell>
  );
}
