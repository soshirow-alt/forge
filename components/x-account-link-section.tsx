"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { getAuthErrorMessage } from "@/lib/auth";
import {
  isXAccountAlreadyLinkedReason,
  X_ACCOUNT_ALREADY_LINKED_USER_MESSAGE,
} from "@/lib/oauth-callback-errors";
import { reconcileOwnXProfileFromAuth } from "@/lib/sync-user-x-profile";
import { fetchOwnXProfile } from "@/lib/supabase/user-x-profiles-db";
import { getOptionalSupabaseClient } from "@/lib/supabase/client";
import { formatXHandleLabel, hasLinkedXIdentity, isXAuthEnabled } from "@/lib/x-auth";
import type { Provider } from "@supabase/supabase-js";
import {
  PLAYER_SETTINGS_PATH,
  type SettingsSurfacePath,
} from "@/lib/settings-surface";

function readXLinkStatusMessage(searchParams: URLSearchParams) {
  const xParam = searchParams.get("x");
  if (xParam === "linked") {
    return {
      tone: "success" as const,
      text: "Xアカウントを連携しました。",
    };
  }

  if (xParam !== "error") {
    return null;
  }

  const reason = searchParams.get("reason");
  const errorCode = searchParams.get("error_code");

  if (isXAccountAlreadyLinkedReason(reason) || isXAccountAlreadyLinkedReason(errorCode)) {
    return {
      tone: "error" as const,
      text: X_ACCOUNT_ALREADY_LINKED_USER_MESSAGE,
    };
  }

  if (reason === "sync_failed" || reason === "upsert_failed" || reason === "sync_failed_unknown") {
    return {
      tone: "error" as const,
      text: "X連携情報の保存に失敗しました。時間をおいて再度お試しください。",
    };
  }

  if (
    reason === "callback_failed" ||
    reason === "exchange_failed" ||
    reason === "missing_code" ||
    reason === "missing_oauth_flow_cookie" ||
    reason === "oauth_provider_error" ||
    reason === "missing_session" ||
    reason === "missing_user" ||
    reason === "missing_x_identity" ||
    reason === "missing_x_user_id" ||
    reason === "missing_x_username" ||
    reason === "anonymous_not_allowed"
  ) {
    return {
      tone: "error" as const,
      text: "X連携の完了処理に失敗しました。もう一度お試しください。",
    };
  }

  if (reason || errorCode) {
    return {
      tone: "error" as const,
      text: "X連携の完了処理に失敗しました。もう一度お試しください。",
    };
  }

  return null;
}

export function XAccountLinkSection({
  settingsPath = PLAYER_SETTINGS_PATH,
}: {
  settingsPath?: SettingsSurfacePath;
}) {
  const searchParams = useSearchParams();
  const { user, hydrated, linkOAuthIdentity } = useAuth();
  const supabase = getOptionalSupabaseClient();
  const statusMessage = useMemo(
    () => readXLinkStatusMessage(searchParams),
    [searchParams],
  );
  const [linkedHandle, setLinkedHandle] = useState<string | null>(null);
  const [authLinked, setAuthLinked] = useState(false);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [linking, setLinking] = useState(false);
  const [actionMessage, setActionMessage] = useState<{
    tone: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    if (!hydrated || !user || !supabase) {
      return;
    }

    let cancelled = false;

    void (async () => {
      const [{ data: authUser }, storedProfile] = await Promise.all([
        supabase.auth.getUser(),
        fetchOwnXProfile(supabase),
      ]);

      if (cancelled) {
        return;
      }

      const hasAuthX = authUser.user ? hasLinkedXIdentity(authUser.user) : false;
      let profile = storedProfile;

      if (hasAuthX && !profile) {
        const syncResult = await reconcileOwnXProfileFromAuth(supabase);
        if (!cancelled && syncResult.ok && syncResult.synced) {
          profile = await fetchOwnXProfile(supabase);
        }
      }

      if (cancelled) {
        return;
      }

      setAuthLinked(hasAuthX);
      setLinkedHandle(profile?.x_username ?? null);
      setProfileLoaded(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [hydrated, user, supabase, searchParams]);

  async function handleLinkX() {
    setLinking(true);
    setActionMessage(null);

    try {
      await linkOAuthIdentity("x" as Provider, settingsPath);
    } catch (caught) {
      const authError = caught as { message?: string; code?: string };
      setActionMessage({
        tone: "error",
        text: getAuthErrorMessage(
          authError.message ?? "X連携の開始に失敗しました。",
          authError.code,
          "x_link",
        ),
      });
      setLinking(false);
    }
  }

  if (!hydrated || !user) {
    return null;
  }

  const handleLabel = formatXHandleLabel(linkedHandle);
  const isLinked = Boolean(handleLabel) || authLinked;
  const message = actionMessage ?? statusMessage;
  const loading = Boolean(supabase) && !profileLoaded;
  const xAuthEnabled = isXAuthEnabled();

  if (!xAuthEnabled && !isLinked && !message) {
    return null;
  }

  return (
    <section className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-5 sm:p-6">
      <h2 className="text-base font-semibold text-white">Xアカウント連携</h2>
      <p className="mt-1 text-sm text-zinc-500">
        Forge上のプロフィールにXの@handleを表示できます。連携と公開表示は別々に設定できます。
      </p>

      {message ? (
        <p
          className={`mt-4 rounded-xl border px-4 py-3 text-sm ${
            message.tone === "success"
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
              : "border-red-900/50 bg-red-950/30 text-red-300"
          }`}
        >
          {message.text}
        </p>
      ) : null}

      <ul className="mt-5 divide-y divide-zinc-800/80">
        <li className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0">
          <div className="min-w-0">
            <p className="text-sm font-medium text-zinc-200">連携状態</p>
            {loading ? (
              <p className="mt-0.5 text-xs text-zinc-500">確認中…</p>
            ) : isLinked && handleLabel ? (
              <p className="mt-0.5 truncate text-xs text-sky-200/90">{handleLabel}</p>
            ) : isLinked ? (
              <p className="mt-0.5 text-xs text-sky-200/90">X連携済み</p>
            ) : (
              <p className="mt-0.5 text-xs text-zinc-500">未連携</p>
            )}
          </div>
          {!isLinked ? (
            xAuthEnabled ? (
            <button
              type="button"
              disabled={linking}
              onClick={() => void handleLinkX()}
              className="shrink-0 rounded-lg border border-zinc-700 px-3 py-1.5 text-xs text-zinc-200 transition-colors hover:border-zinc-600 hover:bg-zinc-900 disabled:opacity-50"
            >
              {linking ? "移動中…" : "Xで連携"}
            </button>
            ) : null
          ) : (
            <span className="shrink-0 text-xs text-zinc-600">連携済み</span>
          )}
        </li>
      </ul>
    </section>
  );
}
