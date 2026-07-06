"use client";

import { useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { getAuthErrorMessage } from "@/lib/auth";
import { isXAuthEnabled } from "@/lib/x-auth";
import type { Provider } from "@supabase/supabase-js";

export function XOAuthLoginSection({
  nextPath,
  disabled = false,
  mode = "login",
}: {
  nextPath?: string | null;
  disabled?: boolean;
  mode?: "login" | "register";
}) {
  const { signInWithOAuth } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const label = mode === "register" ? "続ける" : "ログイン";

  if (!isXAuthEnabled()) {
    return null;
  }

  async function handleXAuth() {
    setLoading(true);
    setError(null);

    try {
      await signInWithOAuth("x" as Provider, nextPath ?? null);
    } catch (caught) {
      const authError = caught as { message?: string; code?: string };
      setError(
        getAuthErrorMessage(
          authError.message ?? "Xログインに失敗しました。",
          authError.code,
          "x_login",
        ),
      );
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        disabled={disabled || loading}
        onClick={() => void handleXAuth()}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900/60 px-6 py-3.5 text-base font-semibold text-zinc-100 transition-colors hover:border-zinc-600 hover:bg-zinc-900 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span aria-hidden="true">𝕏</span>
        {loading ? "Xへ移動中…" : `Xで${label}`}
      </button>
      {error ? (
        <p className="rounded-xl border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-300">
          {error}
        </p>
      ) : null}
    </div>
  );
}
