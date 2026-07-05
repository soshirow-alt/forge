"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { getAuthErrorMessage } from "@/lib/auth";
import { getOAuthRedirectUrl } from "@/lib/auth-redirect";
import { fetchOwnXProfile } from "@/lib/supabase/user-x-profiles-db";
import { getOptionalSupabaseClient } from "@/lib/supabase/client";
import { formatXHandleLabel, hasLinkedXIdentity } from "@/lib/x-auth";
import type { Provider } from "@supabase/supabase-js";

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
  if (reason === "already_linked") {
    return {
      tone: "error" as const,
      text: "このXアカウントは別のForgeアカウントに連携済みです。",
    };
  }

  if (reason === "sync_failed") {
    return {
      tone: "error" as const,
      text: "X連携情報の保存に失敗しました。時間をおいて再度お試しください。",
    };
  }

  return null;
}

export function XAccountLinkSection() {
  const searchParams = useSearchParams();
  const { user, hydrated } = useAuth();
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

      setAuthLinked(authUser.user ? hasLinkedXIdentity(authUser.user) : false);
      setLinkedHandle(storedProfile?.x_username ?? null);
      setProfileLoaded(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [hydrated, user, supabase, searchParams]);

  async function handleLinkX() {
    if (!supabase) {
      return;
    }

    setLinking(true);
    setActionMessage(null);

    try {
      const linkIdentity = (
        supabase.auth as {
          linkIdentity?: (params: {
            provider: Provider;
            options?: { redirectTo?: string };
          }) => Promise<{ data: { url?: string | null }; error: { message?: string } | null }>;
        }
      ).linkIdentity;

      if (!linkIdentity) {
        throw new Error("Identity linking is not available in this client version.");
      }

      const { data, error } = await linkIdentity({
        provider: "x",
        options: {
          redirectTo: getOAuthRedirectUrl("/settings?x=linked"),
        },
      });

      if (error) {
        throw error;
      }

      if (data.url) {
        window.location.assign(data.url);
        return;
      }
    } catch (caught) {
      const authError = caught as { message?: string; code?: string };
      setActionMessage({
        tone: "error",
        text: getAuthErrorMessage(
          authError.message ?? "X連携の開始に失敗しました。",
          authError.code,
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

  return (
    <section className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-5 sm:p-6">
      <h2 className="text-base font-semibold text-white">Xアカウント連携</h2>
      <p className="mt-1 text-sm text-zinc-500">
        Xでログインした情報（@handle・表示名・アイコン）をForge上で表示できます。OAuth
        token は保存しません。
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
            <button
              type="button"
              disabled={linking || !supabase}
              onClick={() => void handleLinkX()}
              className="shrink-0 rounded-lg border border-zinc-700 px-3 py-1.5 text-xs text-zinc-200 transition-colors hover:border-zinc-600 hover:bg-zinc-900 disabled:opacity-50"
            >
              {linking ? "移動中…" : "Xで連携"}
            </button>
          ) : (
            <span className="shrink-0 text-xs text-zinc-600">連携済み</span>
          )}
        </li>
      </ul>

      <p className="mt-4 text-xs leading-relaxed text-zinc-600">
        別のForgeアカウントに同じXアカウントが既に連携されている場合は、新たに連携できません。
        X連携は設定画面からのみ追加できます（ログイン画面の「Xでログイン」とは別導線です）。
      </p>
    </section>
  );
}
