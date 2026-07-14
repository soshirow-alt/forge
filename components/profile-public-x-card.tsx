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
import { normalizePublicXHandle } from "@/lib/public-x-link";
import type { Provider } from "@supabase/supabase-js";

function readXLinkStatusMessage(searchParams: URLSearchParams) {
  const xParam = searchParams.get("x");
  if (xParam === "linked") {
    return {
      tone: "success" as const,
      text: "Xアカウントを連携しました。公開表示は下の設定をONにしてください。",
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

  if (
    reason === "sync_failed" ||
    reason === "upsert_failed" ||
    reason === "sync_failed_unknown" ||
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
    reason === "anonymous_not_allowed" ||
    reason ||
    errorCode
  ) {
    return {
      tone: "error" as const,
      text: "X連携の完了処理に失敗しました。もう一度お試しください。",
    };
  }

  return null;
}

/**
 * Account-common X link + public publish toggle.
 * OAuth / user_x_profiles = linked; developer_profiles.x_account = public.
 */
export function ProfilePublicXCard({
  publicXAccount,
  onPublicPublishChange,
  busy = false,
  oauthReturnPath = "/mypage/profile",
}: {
  publicXAccount: string | null | undefined;
  onPublicPublishChange: (publish: boolean, linkedHandle: string | null) => Promise<void>;
  busy?: boolean;
  oauthReturnPath?: string;
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
  const [toggling, setToggling] = useState(false);
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
      await linkOAuthIdentity("x" as Provider, oauthReturnPath);
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

  async function handlePublishToggle(next: boolean) {
    setToggling(true);
    setActionMessage(null);
    try {
      await onPublicPublishChange(next, linkedHandle);
      setActionMessage({
        tone: "success",
        text: next
          ? "公開プロフィールにXを表示します。"
          : "公開プロフィールからX表示を外しました。",
      });
    } catch {
      setActionMessage({
        tone: "error",
        text: "公開設定の更新に失敗しました。時間をおいて再度お試しください。",
      });
    } finally {
      setToggling(false);
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
  const publicHandle = normalizePublicXHandle(publicXAccount ?? undefined);
  const linkedNormalized = normalizePublicXHandle(linkedHandle ?? undefined);
  const isPublished = Boolean(
    publicHandle && (!linkedNormalized || publicHandle === linkedNormalized),
  );

  if (!xAuthEnabled && !isLinked && !publicHandle && !message) {
    return null;
  }

  return (
    <section className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-5 sm:p-6">
      <h2 className="text-base font-semibold text-white">Xアカウント</h2>
      <p className="mt-1 text-sm text-zinc-500">
        連携はアカウント共通です。公開プロフィールへの表示は別設定です（連携だけでは自動公開しません）。
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
                disabled={linking || busy}
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

        <li className="flex items-center justify-between gap-4 py-4">
          <div className="min-w-0">
            <p className="text-sm font-medium text-zinc-200">公開プロフィールに表示</p>
            <p className="mt-0.5 text-xs text-zinc-500">
              {isPublished && publicHandle
                ? `表示中: @${publicHandle}`
                : "OFFのときは公開面にXを出しません"}
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={isPublished}
            disabled={
              busy ||
              toggling ||
              loading ||
              (!isLinked && !isPublished) ||
              (Boolean(isLinked) && !linkedHandle && !isPublished)
            }
            onClick={() => void handlePublishToggle(!isPublished)}
            className={`relative h-7 w-12 shrink-0 rounded-full transition-colors disabled:opacity-50 ${
              isPublished ? "bg-violet-600" : "bg-zinc-700"
            }`}
          >
            <span
              className={`absolute top-0.5 size-6 rounded-full bg-white transition-transform ${
                isPublished ? "translate-x-5" : "translate-x-0.5"
              }`}
            />
          </button>
        </li>
      </ul>
    </section>
  );
}
