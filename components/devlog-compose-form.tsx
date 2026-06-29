"use client";

import { useCallback, useState } from "react";
import { DevlogConfirmationRequestPanel } from "@/components/devlog-confirmation-request-panel";
import { VersionPromptEditor } from "@/components/version-prompt-editor";
import { useGames } from "@/components/games-provider";
import { useDevlogComposePrompts } from "@/hooks/use-devlog-compose-prompts";
import {
  EMPTY_CONFIRMATION_REQUEST_DRAFT,
  shouldPersistConfirmationRequest,
  type ConfirmationRequestDraft,
} from "@/lib/confirmation-request-draft";
import { useDevlogTopPriorities } from "@/hooks/use-devlog-top-priorities";
import {
  normalizePlayableVersionInput,
  resolvePlayableVersion,
} from "@/lib/playable-version";

const inputClassName =
  "mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-zinc-100 placeholder:text-zinc-600 focus:border-orange-500/50 focus:outline-none focus:ring-1 focus:ring-orange-500/50";

type DevlogComposeFormProps = {
  projectId: string;
  playableVersion?: string;
  onSaved?: () => void;
  onCancel?: () => void;
};

export function DevlogComposeForm({
  projectId,
  playableVersion,
  onSaved,
  onCancel,
}: DevlogComposeFormProps) {
  const { getGameById, addDevlog, getDeveloperVersionPrompts, saveDeveloperVersionPrompts } =
    useGames();
  const game = getGameById(projectId);
  const currentVersion = resolvePlayableVersion(playableVersion ?? game?.playableVersion);
  const { priorities: topPriorities, loaded: prioritiesLoaded } =
    useDevlogTopPriorities(projectId, currentVersion);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [newVersion, setNewVersion] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const [confirmationDraft, setConfirmationDraft] =
    useState<ConfirmationRequestDraft>(EMPTY_CONFIRMATION_REQUEST_DRAFT);

  const loadPrompts = useCallback(
    (pid: string, versionKey: string) => getDeveloperVersionPrompts(pid, versionKey),
    [getDeveloperVersionPrompts],
  );

  const prompts = useDevlogComposePrompts({
    projectId,
    currentVersionKey: currentVersion,
    loadPrompts,
  });

  if (!game) {
    return <p className="text-sm text-zinc-500">作品が見つかりません。</p>;
  }

  async function handleSaveCurrentVersionPrompts() {
    setSubmitting(true);
    setError(null);

    const promptResult = prompts.resolvePromptsForVersion(currentVersion);
    if (!promptResult.ok) {
      setError(promptResult.message);
      setSubmitting(false);
      return;
    }

    try {
      await saveDeveloperVersionPrompts(
        projectId,
        promptResult.versionKey,
        promptResult.prompts,
      );
      onSaved?.();
    } catch {
      setError("問いの保存に失敗しました。時間をおいて再度お試しください。");
    } finally {
      setSubmitting(false);
    }
  }

  async function handlePublishNewVersion() {
    setSubmitting(true);
    setError(null);

    const trimmedTitle = title.trim();
    const trimmedContent = content.trim();
    const trimmedVersion = normalizePlayableVersionInput(newVersion);

    if (!trimmedVersion) {
      setError("新しいプレイ可能verのバージョン名を入力してください。");
      setSubmitting(false);
      return;
    }
    if (trimmedVersion === currentVersion) {
      setError("現在のプレイ可能verと同じバージョン名は使えません。");
      setSubmitting(false);
      return;
    }
    if (!trimmedTitle) {
      setError("今回の更新タイトルを入力してください。");
      setSubmitting(false);
      return;
    }
    if (!trimmedContent) {
      setError("今回の更新内容を入力してください。");
      setSubmitting(false);
      return;
    }

    const promptResult = prompts.resolvePromptsForVersion(trimmedVersion);
    if (!promptResult.ok) {
      setError(promptResult.message);
      setSubmitting(false);
      return;
    }

    try {
      await addDevlog(projectId, trimmedTitle, trimmedContent, {
        publishPlayableVersion: trimmedVersion,
        confirmationRequest: shouldPersistConfirmationRequest(confirmationDraft)
          ? confirmationDraft
          : undefined,
      });
      await saveDeveloperVersionPrompts(
        projectId,
        promptResult.versionKey,
        promptResult.prompts,
      );
      onSaved?.();
    } catch {
      setError(
        "開発ログの投稿に失敗しました。Supabase の設定と migration 004 を確認してください。",
      );
    } finally {
      setSubmitting(false);
    }
  }

  const newVersionLabel = newVersion.trim()
    ? `v${normalizePlayableVersionInput(newVersion)}`
    : "（新ver名を入力）";

  return (
    <div className="space-y-6">
      {error ? (
        <p
          role="alert"
          className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300"
        >
          {error}
        </p>
      ) : null}

      <p className="text-sm text-zinc-500">
        いまのプレイ可能ver: <span className="text-zinc-300">v{currentVersion}</span>
      </p>

      <div>
        <label htmlFor={`devlog-new-version-${projectId}`} className="text-sm font-medium text-zinc-400">
          新しいプレイ可能verのバージョン名
        </label>
        <input
          id={`devlog-new-version-${projectId}`}
          type="text"
          value={newVersion}
          onChange={(event) => setNewVersion(event.target.value)}
          className={inputClassName}
          placeholder="例: 0.2"
        />
        <p className="mt-2 text-xs text-zinc-600">
          「新verを公開して開発ログを投稿」するときに必要です。問いだけ更新するときは不要です。
        </p>
      </div>

      <div>
        <label htmlFor={`devlog-title-${projectId}`} className="text-sm font-medium text-zinc-400">
          今回の更新タイトル
        </label>
        <input
          id={`devlog-title-${projectId}`}
          type="text"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          className={inputClassName}
          placeholder="例: チュートリアルを追加、バグを修正"
        />
      </div>

      <div>
        <label htmlFor={`devlog-content-${projectId}`} className="text-sm font-medium text-zinc-400">
          今回の更新内容
        </label>
        <textarea
          id={`devlog-content-${projectId}`}
          rows={6}
          value={content}
          onChange={(event) => setContent(event.target.value)}
          className={`${inputClassName} resize-y`}
          placeholder="何を直したか、何が変わったか、プレイヤーに試してほしい点を書いてください"
        />
      </div>

      {!prompts.loading ? (
        <div id="version-prompts" className="scroll-mt-4">
          <VersionPromptEditor
            mode={prompts.promptMode}
            onModeChange={prompts.setPromptMode}
            drafts={prompts.promptDrafts}
            onDraftsChange={prompts.setPromptDrafts}
            versionLabel={`${prompts.currentVersionLabel} → ${newVersionLabel}`}
            showValidation={prompts.showValidation}
            embeddedInModal
          />
          <p className="mt-2 text-xs leading-relaxed text-zinc-600">
            ひとつ前の ver（{prompts.currentVersionLabel}）の問いを初期表示しています。
            問いだけ更新する場合は {prompts.currentVersionLabel} に保存、新ver公開時は{" "}
            {newVersionLabel} 向けに保存されます。
          </p>
        </div>
      ) : null}

      <DevlogConfirmationRequestPanel
        open={confirmationOpen}
        onOpenChange={setConfirmationOpen}
        draft={confirmationDraft}
        onDraftChange={setConfirmationDraft}
        topPriorities={topPriorities}
        prioritiesLoaded={prioritiesLoaded}
      />

      <div className="flex flex-col gap-3 border-t border-zinc-800 pt-4 sm:flex-row sm:flex-wrap">
        <button
          type="button"
          disabled={submitting}
          onClick={() => void handleSaveCurrentVersionPrompts()}
          className="rounded-lg border border-violet-500/40 bg-violet-500/10 px-5 py-3 text-sm font-semibold text-violet-100 transition-colors hover:bg-violet-500/15 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "保存中..." : "いまの ver の問いだけ更新"}
        </button>
        <button
          type="button"
          disabled={submitting}
          onClick={() => void handlePublishNewVersion()}
          className="rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 px-5 py-3 text-sm font-semibold text-zinc-950 transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "投稿中..." : "新verを公開して開発ログを投稿"}
        </button>
        {onCancel ? (
          <button
            type="button"
            disabled={submitting}
            onClick={onCancel}
            className="rounded-lg border border-zinc-700 px-5 py-3 text-sm font-medium text-zinc-300 transition-colors hover:border-zinc-600 hover:text-white disabled:opacity-60"
          >
            キャンセル
          </button>
        ) : null}
      </div>
    </div>
  );
}
