"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { StudioShell } from "@/components/studio-shell";
import { StudioPreviewSampleBanner } from "@/components/studio-preview-sample-banner";
import {
  addStudioDevlogExtra,
  buildStudioDevlogEntry,
} from "@/lib/studio-devlog-draft-v0-store";
import { getStudioProjectDetail } from "@/lib/studio-project-detail-v0-mock-data";

const inputClassName =
  "mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-zinc-100 placeholder:text-zinc-600 focus:border-violet-500/50 focus:outline-none focus:ring-1 focus:ring-violet-500/50";

export function StudioDevlogNewPage({ projectId }: { projectId: string }) {
  const router = useRouter();
  const project = getStudioProjectDetail(projectId);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [publishNewVersion, setPublishNewVersion] = useState(false);
  const [newVersion, setNewVersion] = useState("");
  const [developerWorry, setDeveloperWorry] = useState("");
  const [wantedVoices, setWantedVoices] = useState("");
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  if (!project) {
    return (
      <StudioShell activeNav="mypage">
        <p className="text-zinc-500">プロジェクトが見つかりません</p>
      </StudioShell>
    );
  }

  const currentVersion = project.version ?? "v0.3.1";

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (publishNewVersion && !newVersion.trim()) {
      setSaveMessage("新しい ver のバージョン名を入力してください。");
      return;
    }

    const entry = buildStudioDevlogEntry({
      title,
      content,
      publishNewVersion,
      newVersion: newVersion.trim() || undefined,
      developerWorry,
      wantedVoices: wantedVoices
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean),
    });
    addStudioDevlogExtra(projectId, entry);
    router.push(`/studio/projects/${projectId}?tab=devlog`);
  }

  return (
    <StudioShell activeNav="mypage">
      <main className="mx-auto max-w-2xl">
        <Link
          href={`/studio/projects/${projectId}?tab=devlog`}
          className="text-sm text-zinc-500 transition-colors hover:text-violet-400"
        >
          ← 開発ログに戻る
        </Link>

        <div className="mt-4">
          <StudioPreviewSampleBanner compact />
        </div>

        <h1 className="mt-6 text-3xl font-bold tracking-tight text-white">
          開発ログを書く
        </h1>
        <p className="mt-2 text-zinc-500">{project.title}</p>
        <p className="mt-1 text-sm text-zinc-600">
          プレイヤーに、今回の改善や変更点を伝えます（preview mock — 端末内に保存）。
        </p>

        {saveMessage && (
          <p className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
            {saveMessage}
          </p>
        )}

        <form
          onSubmit={handleSubmit}
          className="mt-8 space-y-6 rounded-xl border border-zinc-800 bg-zinc-900/80 p-8"
        >
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
              placeholder="例: チュートリアルを短縮、序盤イベントを調整"
            />
          </div>

          <div>
            <label htmlFor="content" className="text-sm font-medium text-zinc-400">
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
                className="mt-0.5 h-4 w-4 shrink-0 rounded border-zinc-600 bg-zinc-900 text-violet-500 focus:ring-violet-500/50"
              />
              <span>
                <span className="block text-sm font-medium text-zinc-300">
                  今回の更新を新しい ver として公開する
                </span>
                <span className="mt-1 block text-xs text-zinc-600">
                  チェックすると ver の更新として記録されます（preview mock）。
                </span>
              </span>
            </label>

            {publishNewVersion && (
              <div className="pl-7">
                <label
                  htmlFor="newVersion"
                  className="text-xs font-medium text-zinc-500"
                >
                  バージョン名
                </label>
                <input
                  id="newVersion"
                  type="text"
                  required={publishNewVersion}
                  value={newVersion}
                  onChange={(event) => setNewVersion(event.target.value)}
                  className={inputClassName}
                  placeholder="例: 0.4.1"
                />
                <p className="mt-1.5 text-xs text-zinc-600">
                  現在の ver: {currentVersion}
                </p>
              </div>
            )}
          </div>

          <section className="space-y-4 rounded-lg border border-violet-500/20 bg-violet-500/5 p-4">
            <div>
              <h2 className="text-sm font-semibold text-violet-100">
                この ver でプレイヤーに聞きたいこと
              </h2>
              <p className="mt-1 text-xs leading-relaxed text-zinc-500">
                質問は作品全体ではなく、今回の ver ごとに設定します。プレイヤーが FB
                するときのガイドになります。
              </p>
            </div>

            <div>
              <label
                htmlFor="developerWorry"
                className="text-sm font-medium text-zinc-400"
              >
                開発者が聞きたいこと
              </label>
              <textarea
                id="developerWorry"
                rows={3}
                value={developerWorry}
                onChange={(event) => setDeveloperWorry(event.target.value)}
                className={`${inputClassName} resize-y`}
                placeholder="例: チュートリアルは長すぎませんか？序盤のテンポはどう感じましたか？"
              />
            </div>

            <div>
              <label htmlFor="wantedVoices" className="text-sm font-medium text-zinc-400">
                回答してほしい項目
              </label>
              <textarea
                id="wantedVoices"
                rows={5}
                value={wantedVoices}
                onChange={(event) => setWantedVoices(event.target.value)}
                className={`${inputClassName} resize-y`}
                placeholder={"1行に1項目\n例: チュートリアルの長さは適切でしたか？\n例: 最初のランタン取得まで迷いませんでしたか？"}
              />
            </div>
          </section>

          <button
            type="submit"
            className="w-full rounded-lg bg-violet-600 px-8 py-4 text-lg font-semibold text-white transition-colors hover:bg-violet-500"
          >
            投稿する
          </button>
        </form>
      </main>
    </StudioShell>
  );
}
