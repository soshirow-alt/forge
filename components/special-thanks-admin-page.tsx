"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  createSpecialThanksEntry,
  updateSpecialThanksEntry,
} from "@/lib/supabase/special-thanks-db";
import {
  SPECIAL_THANKS_DISPLAY_NAME_MAX,
  SPECIAL_THANKS_HANDLE_MAX,
  SPECIAL_THANKS_NOTE_MAX,
  SPECIAL_THANKS_PATH,
  SPECIAL_THANKS_ROLE_LABEL_MAX,
  formatSpecialThanksHandleDisplay,
  type SpecialThanksEntry,
} from "@/lib/special-thanks";

type Draft = {
  displayName: string;
  handle: string;
  roleLabel: string;
  url: string;
  note: string;
  sortOrder: string;
  isPublished: boolean;
};

function emptyDraft(): Draft {
  return {
    displayName: "",
    handle: "",
    roleLabel: "",
    url: "",
    note: "",
    sortOrder: "0",
    isPublished: false,
  };
}

function entryToDraft(entry: SpecialThanksEntry): Draft {
  return {
    displayName: entry.displayName,
    handle: entry.handle ?? "",
    roleLabel: entry.roleLabel ?? "",
    url: entry.url ?? "",
    note: entry.note ?? "",
    sortOrder: String(entry.sortOrder),
    isPublished: entry.isPublished,
  };
}

function draftToInput(draft: Draft) {
  const sortParsed = Number.parseInt(draft.sortOrder, 10);
  return {
    displayName: draft.displayName,
    handle: draft.handle,
    roleLabel: draft.roleLabel,
    url: draft.url,
    note: draft.note,
    sortOrder: Number.isFinite(sortParsed) ? sortParsed : 0,
    isPublished: draft.isPublished,
  };
}

function errorMessage(error: unknown): string {
  if (error instanceof Error) {
    if (error.message === "display_name_required") {
      return "表示名は必須です。";
    }
    if (error.message === "url_must_be_http_or_https") {
      return "URL は http/https のみです。";
    }
    if (error.message === "special_thanks_table_missing") {
      return "Special Thanks テーブルが未適用です（Staging migration 待ち）。";
    }
    return error.message;
  }
  return "保存に失敗しました。";
}

export function SpecialThanksAdminPage({
  initialEntries,
  userId,
}: {
  initialEntries: SpecialThanksEntry[];
  userId: string;
}) {
  const [entries, setEntries] = useState(initialEntries);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft());
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sorted = useMemo(
    () =>
      [...entries].sort((a, b) => {
        if (a.sortOrder !== b.sortOrder) {
          return a.sortOrder - b.sortOrder;
        }
        return a.createdAt.localeCompare(b.createdAt);
      }),
    [entries],
  );

  function startCreate() {
    setEditingId(null);
    setDraft(emptyDraft());
    setMessage(null);
    setError(null);
  }

  function startEdit(entry: SpecialThanksEntry) {
    setEditingId(entry.id);
    setDraft(entryToDraft(entry));
    setMessage(null);
    setError(null);
  }

  async function save() {
    setBusy(true);
    setMessage(null);
    setError(null);
    try {
      const supabase = createClient();
      const input = draftToInput(draft);
      if (editingId) {
        const updated = await updateSpecialThanksEntry(
          supabase,
          userId,
          editingId,
          input,
        );
        setEntries((prev) =>
          prev.map((item) => (item.id === updated.id ? updated : item)),
        );
        setMessage("更新しました。");
      } else {
        const created = await createSpecialThanksEntry(supabase, userId, input);
        setEntries((prev) => [...prev, created]);
        setEditingId(created.id);
        setDraft(entryToDraft(created));
        setMessage("追加しました。");
      }
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function setPublished(entry: SpecialThanksEntry, isPublished: boolean) {
    setBusy(true);
    setMessage(null);
    setError(null);
    try {
      const supabase = createClient();
      const updated = await updateSpecialThanksEntry(supabase, userId, entry.id, {
        displayName: entry.displayName,
        handle: entry.handle,
        roleLabel: entry.roleLabel,
        url: entry.url,
        note: entry.note,
        sortOrder: entry.sortOrder,
        isPublished,
      });
      setEntries((prev) =>
        prev.map((item) => (item.id === updated.id ? updated : item)),
      );
      if (editingId === entry.id) {
        setDraft(entryToDraft(updated));
      }
      setMessage(isPublished ? "公開しました。" : "非公開にしました。");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-full bg-zinc-950 text-zinc-100">
      <header className="border-b border-zinc-800/80 px-6 py-4 lg:px-10">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-zinc-500">Admin</p>
            <h1 className="text-lg font-bold text-white">Special Thanks</h1>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <Link
              href={SPECIAL_THANKS_PATH}
              className="text-zinc-500 transition-colors hover:text-zinc-300"
            >
              公開ページ
            </Link>
            <Link
              href="/home"
              className="text-zinc-500 transition-colors hover:text-zinc-300"
            >
              ホーム
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-4xl gap-8 px-6 py-8 lg:grid-cols-[1fr_1.1fr] lg:px-10">
        <section>
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-medium text-zinc-300">一覧</h2>
            <button
              type="button"
              onClick={startCreate}
              className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs text-zinc-300 transition-colors hover:border-zinc-500 hover:text-white"
            >
              新規追加
            </button>
          </div>
          <ul className="mt-4 divide-y divide-zinc-800/80 rounded-xl border border-zinc-800">
            {sorted.length === 0 ? (
              <li className="px-4 py-6 text-sm text-zinc-500">まだありません。</li>
            ) : (
              sorted.map((entry) => {
                const handleDisplay = formatSpecialThanksHandleDisplay(entry.handle);
                return (
                  <li
                    key={entry.id}
                    className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <button
                      type="button"
                      onClick={() => startEdit(entry)}
                      className="min-w-0 text-left"
                    >
                      <p className="truncate text-sm font-medium text-zinc-100">
                        {entry.displayName}
                        {handleDisplay ? (
                          <span className="ml-2 font-normal text-zinc-500">
                            {handleDisplay}
                          </span>
                        ) : null}
                      </p>
                      <p className="mt-0.5 text-xs text-zinc-500">
                        order {entry.sortOrder} ·{" "}
                        {entry.isPublished ? "公開中" : "下書き"}
                      </p>
                    </button>
                    <div className="flex shrink-0 gap-2">
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => startEdit(entry)}
                        className="rounded-md border border-zinc-700 px-2.5 py-1 text-xs text-zinc-300 hover:border-zinc-500 disabled:opacity-50"
                      >
                        編集
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() =>
                          void setPublished(entry, !entry.isPublished)
                        }
                        className="rounded-md border border-zinc-700 px-2.5 py-1 text-xs text-zinc-300 hover:border-zinc-500 disabled:opacity-50"
                      >
                        {entry.isPublished ? "非公開" : "公開"}
                      </button>
                    </div>
                  </li>
                );
              })
            )}
          </ul>
          <p className="mt-3 text-xs text-zinc-600">
            物理削除はありません。不要な行は非公開にしてください。
          </p>
        </section>

        <section className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
          <h2 className="text-sm font-medium text-zinc-300">
            {editingId ? "編集" : "新規追加"}
          </h2>
          <form
            className="mt-4 space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              void save();
            }}
          >
            <label className="block space-y-1.5">
              <span className="text-xs text-zinc-500">表示名（必須）</span>
              <input
                required
                maxLength={SPECIAL_THANKS_DISPLAY_NAME_MAX}
                value={draft.displayName}
                onChange={(event) =>
                  setDraft((prev) => ({
                    ...prev,
                    displayName: event.target.value,
                  }))
                }
                className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-500"
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs text-zinc-500">X ハンドル（任意）</span>
              <input
                maxLength={SPECIAL_THANKS_HANDLE_MAX}
                placeholder="username"
                value={draft.handle}
                onChange={(event) =>
                  setDraft((prev) => ({ ...prev, handle: event.target.value }))
                }
                className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-500"
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs text-zinc-500">役割ラベル（任意）</span>
              <input
                maxLength={SPECIAL_THANKS_ROLE_LABEL_MAX}
                value={draft.roleLabel}
                onChange={(event) =>
                  setDraft((prev) => ({
                    ...prev,
                    roleLabel: event.target.value,
                  }))
                }
                className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-500"
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs text-zinc-500">URL（http/https のみ）</span>
              <input
                type="url"
                value={draft.url}
                onChange={(event) =>
                  setDraft((prev) => ({ ...prev, url: event.target.value }))
                }
                className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-500"
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs text-zinc-500">メモ（任意）</span>
              <textarea
                maxLength={SPECIAL_THANKS_NOTE_MAX}
                rows={3}
                value={draft.note}
                onChange={(event) =>
                  setDraft((prev) => ({ ...prev, note: event.target.value }))
                }
                className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-500"
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs text-zinc-500">並び順（小さいほど上）</span>
              <input
                type="number"
                value={draft.sortOrder}
                onChange={(event) =>
                  setDraft((prev) => ({
                    ...prev,
                    sortOrder: event.target.value,
                  }))
                }
                className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-500"
              />
            </label>
            <label className="flex items-center gap-2 text-sm text-zinc-300">
              <input
                type="checkbox"
                checked={draft.isPublished}
                onChange={(event) =>
                  setDraft((prev) => ({
                    ...prev,
                    isPublished: event.target.checked,
                  }))
                }
                className="size-4 rounded border-zinc-600 bg-zinc-900"
              />
              公開する
            </label>

            {error ? <p className="text-sm text-red-400">{error}</p> : null}
            {message ? <p className="text-sm text-emerald-400">{message}</p> : null}

            <button
              type="submit"
              disabled={busy}
              className="rounded-lg bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-950 transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {busy ? "保存中…" : "保存"}
            </button>
          </form>
        </section>
      </main>
    </div>
  );
}
