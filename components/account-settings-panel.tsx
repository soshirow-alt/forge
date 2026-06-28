"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  PasswordInput,
  authInputClassName,
  useAuthAutofillUnlock,
} from "@/components/auth-layout";
import { V0SimpleModal } from "@/components/v0-simple-modal";
import { useAuth } from "@/components/auth-provider";
import {
  ACCOUNT_DELETE_CONFIRMATION_PHRASE,
  ACCOUNT_PASSWORD_MIN_LENGTH,
  hasEmailPasswordIdentity,
} from "@/lib/account-settings";
import { changeEmailWithReauth, changePasswordWithReauth } from "@/lib/account-auth";
import { getAuthErrorMessage } from "@/lib/auth";
import { getOptionalSupabaseClient } from "@/lib/supabase/client";

type AccountEdit = "email" | "password" | "delete" | null;

type AccountSettingsSection = "credentials" | "deletion";

export function AccountSettingsPanel({
  section = "credentials",
}: {
  section?: AccountSettingsSection;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, hydrated, logout } = useAuth();
  const supabase = useMemo(() => getOptionalSupabaseClient(), []);
  const autofill = useAuthAutofillUnlock();

  const [canUsePassword, setCanUsePassword] = useState(false);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [accountEdit, setAccountEdit] = useState<AccountEdit>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [emailDraft, setEmailDraft] = useState("");
  const [passwordDraft, setPasswordDraft] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [deletePassword, setDeletePassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(
    null,
  );

  useEffect(() => {
    if (searchParams.get("email") === "confirmed") {
      setMessage({
        tone: "success",
        text: "メールアドレスの変更が完了しました。",
      });
    }
  }, [searchParams]);

  useEffect(() => {
    if (!hydrated || !user || !supabase) {
      return;
    }

    void supabase.auth.getUser().then(({ data }) => {
      setCanUsePassword(hasEmailPasswordIdentity(data.user?.identities));
      setPendingEmail(data.user?.new_email ?? null);
    });
  }, [hydrated, user, supabase]);

  function resetSensitiveFields() {
    setCurrentPassword("");
    setPasswordDraft("");
    setPasswordConfirm("");
    setDeleteConfirmation("");
    setDeletePassword("");
  }

  function closeModal() {
    if (submitting) {
      return;
    }
    setAccountEdit(null);
    resetSensitiveFields();
  }

  function openEdit(edit: Exclude<AccountEdit, null>) {
    setMessage(null);
    resetSensitiveFields();
    if (edit === "email") {
      setEmailDraft(user?.email ?? "");
    }
    setAccountEdit(edit);
  }

  async function handlePasswordChange() {
    if (!user?.email || !supabase) {
      return;
    }

    if (passwordDraft.length < ACCOUNT_PASSWORD_MIN_LENGTH) {
      setMessage({
        tone: "error",
        text: `パスワードは${ACCOUNT_PASSWORD_MIN_LENGTH}文字以上にしてください。`,
      });
      return;
    }

    if (passwordDraft !== passwordConfirm) {
      setMessage({ tone: "error", text: "確認用パスワードが一致しません。" });
      return;
    }

    setSubmitting(true);
    setMessage(null);

    try {
      await changePasswordWithReauth(
        supabase,
        user.email,
        currentPassword,
        passwordDraft,
      );
      await logout();
      window.location.href = "/login?notice=password-changed";
    } catch (caught) {
      const authError = caught as { message?: string; code?: string };
      setMessage({
        tone: "error",
        text: getAuthErrorMessage(authError.message ?? "更新に失敗しました。", authError.code),
      });
      setSubmitting(false);
    }
  }

  async function handleEmailChange() {
    if (!user?.email || !supabase) {
      return;
    }

    setSubmitting(true);
    setMessage(null);

    try {
      await changeEmailWithReauth(supabase, user.email, currentPassword, emailDraft);
      setPendingEmail(emailDraft.trim());
      setAccountEdit(null);
      resetSensitiveFields();
      setMessage({
        tone: "success",
        text: "確認メールを送信しました。新しいメールアドレスのリンクを開いて変更を完了してください。",
      });
    } catch (caught) {
      const authError = caught as { message?: string; code?: string };
      setMessage({
        tone: "error",
        text: getAuthErrorMessage(authError.message ?? "更新に失敗しました。", authError.code),
      });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAccountDelete() {
    setSubmitting(true);
    setMessage(null);

    try {
      const response = await fetch("/api/account/anonymize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          confirmation: deleteConfirmation,
          password: canUsePassword ? deletePassword : undefined,
        }),
      });

      const payload = (await response.json()) as { error?: string; ok?: boolean };

      if (!response.ok) {
        throw new Error(payload.error ?? "退会に失敗しました。");
      }

      await logout();
      router.replace("/?notice=account-deleted");
    } catch (caught) {
      const err = caught as { message?: string };
      setMessage({
        tone: "error",
        text: err.message ?? "退会に失敗しました。",
      });
      setSubmitting(false);
    }
  }

  if (!hydrated) {
    if (section === "deletion") {
      return null;
    }
    return (
      <section className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-5 sm:p-6">
        <p className="text-sm text-zinc-500">読み込み中…</p>
      </section>
    );
  }

  if (!supabase) {
    if (section === "deletion") {
      return null;
    }
    return (
      <section className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-5 sm:p-6">
        <h2 className="text-base font-semibold text-white">アカウント</h2>
        <p className="mt-3 text-sm text-red-300">Supabaseの環境変数が設定されていません。</p>
      </section>
    );
  }

  if (!user) {
    if (section === "deletion") {
      return null;
    }
    return (
      <section className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-5 sm:p-6">
        <h2 className="text-base font-semibold text-white">アカウント</h2>
        <p className="mt-3 text-sm text-zinc-400">
          ログイン情報の変更にはログインが必要です。
        </p>
      </section>
    );
  }

  if (section === "deletion") {
    return (
      <>
        {message && message.tone === "error" ? (
          <p className="rounded-xl border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-300">
            {message.text}
          </p>
        ) : null}

        <section className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-5 sm:p-6">
          <h2 className="text-base font-semibold text-zinc-200">アカウント退会</h2>
          <p className="mt-2 text-sm leading-relaxed text-zinc-500">
            退会するとログインできなくなり、プロフィール名は「退会済みユーザー」に置き換わります。
            作品へのフィードバックなど、コミュニティに残した記録は匿名のまま保持されます。
          </p>
          <button
            type="button"
            onClick={() => openEdit("delete")}
            className="mt-4 text-sm text-red-400 underline-offset-2 transition-colors hover:text-red-300 hover:underline"
          >
            アカウントを退会する
          </button>
        </section>

        {accountEdit === "delete" && (
          <V0SimpleModal title="アカウントを退会" onClose={closeModal}>
            <p className="text-sm leading-relaxed text-zinc-300">
              退会後はログインできません。公開名は「退会済みユーザー」になり、ブックマーク・通知・フォローなど個人向けデータは削除されます。
            </p>
            {canUsePassword ? (
              <>
                <label className="mt-4 block text-xs font-medium text-zinc-500" htmlFor="account-delete-password">
                  現在のパスワード
                </label>
                <PasswordInput
                  id="account-delete-password"
                  name="current-password"
                  value={deletePassword}
                  onChange={setDeletePassword}
                  placeholder="現在のパスワード"
                  autoComplete="current-password"
                />
              </>
            ) : null}
            <label className="mt-4 block text-xs font-medium text-zinc-500" htmlFor="account-delete-confirmation">
              確認のため「{ACCOUNT_DELETE_CONFIRMATION_PHRASE}」と入力
            </label>
            <input
              id="account-delete-confirmation"
              type="text"
              value={deleteConfirmation}
              onChange={(event) => setDeleteConfirmation(event.target.value)}
              className={authInputClassName}
              autoComplete="off"
            />
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                disabled={submitting}
                onClick={() => void handleAccountDelete()}
                className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-50"
              >
                {submitting ? "処理中…" : "退会する"}
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={closeModal}
                className="rounded-xl border border-zinc-700 px-4 py-2.5 text-sm text-zinc-400 hover:border-zinc-600"
              >
                キャンセル
              </button>
            </div>
          </V0SimpleModal>
        )}
      </>
    );
  }

  return (
    <>
      {message && (
        <p
          className={`rounded-xl border px-4 py-3 text-sm ${
            message.tone === "success"
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
              : "border-red-900/50 bg-red-950/30 text-red-300"
          }`}
        >
          {message.text}
        </p>
      )}

      <section className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-5 sm:p-6">
        <h2 className="text-base font-semibold text-white">アカウント</h2>
        <p className="mt-1 text-sm text-zinc-500">ログイン情報の確認と変更</p>

        <ul className="mt-5 divide-y divide-zinc-800/80">
          <li className="flex items-center justify-between gap-4 py-4 first:pt-0">
            <div>
              <p className="text-sm font-medium text-zinc-200">メールアドレス</p>
              <p className="mt-0.5 text-xs text-zinc-500">{user.email}</p>
              {pendingEmail && pendingEmail !== user.email ? (
                <p className="mt-1 text-xs text-amber-300/90">
                  確認待ち: {pendingEmail}
                </p>
              ) : null}
            </div>
            {canUsePassword ? (
              <button
                type="button"
                onClick={() => openEdit("email")}
                className="shrink-0 rounded-lg border border-zinc-700 px-3 py-1.5 text-xs text-zinc-400 transition-colors hover:border-zinc-600 hover:text-zinc-200"
              >
                変更
              </button>
            ) : (
              <span className="text-xs text-zinc-600">外部ログイン</span>
            )}
          </li>

          <li className="flex items-center justify-between gap-4 py-4 last:pb-0">
            <div>
              <p className="text-sm font-medium text-zinc-200">パスワード</p>
              <p className="mt-0.5 text-xs text-zinc-500">
                {canUsePassword
                  ? "変更後は再ログインが必要です"
                  : "Google / Discord / GitHub ログインのアカウントでは変更できません"}
              </p>
            </div>
            {canUsePassword ? (
              <button
                type="button"
                onClick={() => openEdit("password")}
                className="shrink-0 rounded-lg border border-zinc-700 px-3 py-1.5 text-xs text-zinc-400 transition-colors hover:border-zinc-600 hover:text-zinc-200"
              >
                変更
              </button>
            ) : null}
          </li>
        </ul>
      </section>

      {accountEdit === "email" && (
        <V0SimpleModal title="メールアドレスを変更" onClose={closeModal}>
          <p className="text-sm text-zinc-400">
            現在のパスワードで確認後、新しいメールアドレス宛に確認メールを送ります。
          </p>
          <label className="mt-4 block text-xs font-medium text-zinc-500" htmlFor="account-current-password-email">
            現在のパスワード
          </label>
          <PasswordInput
            id="account-current-password-email"
            name="current-password"
            value={currentPassword}
            onChange={setCurrentPassword}
            placeholder="現在のパスワード"
            autoComplete="current-password"
            readOnly={autofill.readOnly}
            onFocus={autofill.onFocus}
          />
          <label className="mt-4 block text-xs font-medium text-zinc-500" htmlFor="account-new-email">
            新しいメールアドレス
          </label>
          <input
            id="account-new-email"
            name="email"
            type="email"
            value={emailDraft}
            onChange={(event) => setEmailDraft(event.target.value)}
            className={authInputClassName}
            autoComplete="email"
          />
          <div className="mt-5 flex gap-2">
            <button
              type="button"
              disabled={submitting}
              onClick={() => void handleEmailChange()}
              className="flex-1 rounded-xl bg-violet-600 py-2.5 text-sm font-semibold text-white hover:bg-violet-500 disabled:opacity-50"
            >
              {submitting ? "送信中…" : "確認メールを送る"}
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={closeModal}
              className="rounded-xl border border-zinc-700 px-4 py-2.5 text-sm text-zinc-400 hover:border-zinc-600"
            >
              キャンセル
            </button>
          </div>
        </V0SimpleModal>
      )}

      {accountEdit === "password" && (
        <V0SimpleModal title="パスワードを変更" onClose={closeModal}>
          <p className="text-sm text-zinc-400">
            変更後は自動的にログアウトし、新しいパスワードで再ログインしてください。
          </p>
          <div className="mt-4 space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-500" htmlFor="account-current-password">
                現在のパスワード
              </label>
              <PasswordInput
                id="account-current-password"
                name="current-password"
                value={currentPassword}
                onChange={setCurrentPassword}
                placeholder="現在のパスワード"
                autoComplete="current-password"
                readOnly={autofill.readOnly}
                onFocus={autofill.onFocus}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-500" htmlFor="account-new-password">
                新しいパスワード
              </label>
              <PasswordInput
                id="account-new-password"
                name="new-password"
                value={passwordDraft}
                onChange={setPasswordDraft}
                placeholder="新しいパスワード"
                autoComplete="new-password"
                minLength={ACCOUNT_PASSWORD_MIN_LENGTH}
              />
            </div>
            <div>
              <label
                className="block text-xs font-medium text-zinc-500"
                htmlFor="account-new-password-confirm"
              >
                新しいパスワード（確認）
              </label>
              <PasswordInput
                id="account-new-password-confirm"
                name="new-password-confirm"
                value={passwordConfirm}
                onChange={setPasswordConfirm}
                placeholder="新しいパスワード（確認）"
                autoComplete="new-password"
                minLength={ACCOUNT_PASSWORD_MIN_LENGTH}
              />
            </div>
          </div>
          <div className="mt-5 flex gap-2">
            <button
              type="button"
              disabled={submitting}
              onClick={() => void handlePasswordChange()}
              className="flex-1 rounded-xl bg-violet-600 py-2.5 text-sm font-semibold text-white hover:bg-violet-500 disabled:opacity-50"
            >
              {submitting ? "更新中…" : "変更して再ログイン"}
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={closeModal}
              className="rounded-xl border border-zinc-700 px-4 py-2.5 text-sm text-zinc-400 hover:border-zinc-600"
            >
              キャンセル
            </button>
          </div>
        </V0SimpleModal>
      )}
    </>
  );
}
