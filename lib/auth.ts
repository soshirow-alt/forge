import type { User as SupabaseUser } from "@supabase/supabase-js";

import { isAnonymousSupabaseUser } from "@/lib/guest-auth";

export type User = {
  id: string;
  email: string;
  name: string;
  avatarInitial: string;
  /** Legacy field when a leftover Supabase anonymous session exists (cleared on bootstrap). */
  isAnonymous: boolean;
};

export function mapSupabaseUser(supabaseUser: SupabaseUser): User {
  const isAnonymous = isAnonymousSupabaseUser(supabaseUser);
  const name = isAnonymous
    ? "ゲスト"
    : (supabaseUser.user_metadata?.display_name as string | undefined) ||
      supabaseUser.email?.split("@")[0] ||
      "ユーザー";
  const avatarInitial = name.charAt(0).toUpperCase() || "U";

  return {
    id: supabaseUser.id,
    email: supabaseUser.email ?? "",
    name,
    avatarInitial,
    isAnonymous,
  };
}

export function isRegisteredAppUser(user: User | null | undefined): boolean {
  return Boolean(user && !user.isAnonymous);
}

export const AUTH_ALREADY_REGISTERED_MESSAGE =
  "このメールアドレスは既に登録されています。";

export const X_OAUTH_LOGIN_START_ERROR =
  "Xログインを開始できませんでした。時間をおいてもう一度お試しください。";

export const X_LINK_START_ERROR =
  "X連携を開始できませんでした。時間をおいてもう一度お試しください。";

export type AuthErrorFlow = "default" | "x_login" | "x_link";

function isUnsafeAuthErrorMessage(message: string): boolean {
  const trimmed = message.trim();
  if (!trimmed) {
    return false;
  }

  return (
    trimmed.startsWith("{") ||
    trimmed.startsWith("[") ||
    /Cannot read properties of/i.test(trimmed) ||
    /linkIdentityOAuth/i.test(trimmed) ||
    /Unsupported provider/i.test(trimmed) ||
    /is not valid JSON/i.test(trimmed)
  );
}

function resolveFlowFallback(flow: AuthErrorFlow): string | null {
  if (flow === "x_login") {
    return X_OAUTH_LOGIN_START_ERROR;
  }
  if (flow === "x_link") {
    return X_LINK_START_ERROR;
  }
  return null;
}

export function getAuthErrorMessage(
  message: string,
  code?: string,
  flow: AuthErrorFlow = "default",
): string {
  if (isUnsafeAuthErrorMessage(message)) {
    return resolveFlowFallback(flow) ?? "リクエストを処理できませんでした。時間をおいてもう一度お試しください。";
  }

  if (
    code === "user_already_exists" ||
    code === "email_exists" ||
    code === "user_already_registered"
  ) {
    return AUTH_ALREADY_REGISTERED_MESSAGE;
  }

  switch (message) {
    case "Invalid login credentials":
      return "メールアドレスまたはパスワードが正しくありません。";
    case "User already registered":
      return AUTH_ALREADY_REGISTERED_MESSAGE;
    case "Password should be at least 6 characters":
      return "パスワードは6文字以上で入力してください。";
    case "Password should be at least 8 characters":
      return "パスワードは8文字以上で入力してください。";
    case "Unable to validate email address: invalid format":
      return "メールアドレスの形式が正しくありません。";
    case "Email not confirmed":
      return "メールアドレスの確認が完了していません。登録時の確認メールをご確認ください。";
    case "auth_callback":
      return "メール確認リンクが無効または期限切れです。確認メールを再送するか、ログインをお試しください。";
    case "Provider is not enabled":
    case "Unsupported provider: provider is not enabled":
      return (
        resolveFlowFallback(flow) ??
        "このログイン方法は現在利用できません。メールアドレスで登録・ログインしてください。"
      );
    case "x_account_already_linked":
      return "このXアカウントは別のForgeアカウントに連携済みです。";
    case "Identity linking is not available in this client version.":
      return resolveFlowFallback("x_link") ?? X_LINK_START_ERROR;
    case "x_auth_disabled":
      return resolveFlowFallback(flow) ?? X_OAUTH_LOGIN_START_ERROR;
    case "Email rate limit exceeded":
      return "確認メールの送信回数が上限に達しました。しばらく待ってから再送してください。";
    default:
      if (message.includes("provider is not enabled")) {
        return (
          resolveFlowFallback(flow) ??
          "このログイン方法は現在利用できません。メールアドレスで登録・ログインしてください。"
        );
      }
      if (message.includes("rate limit")) {
        return "確認メールの送信回数が上限に達しました。しばらく待ってから再送してください。";
      }
      if (message.includes("only request this after")) {
        return "確認メールの再送は少し間隔を空けてお試しください。";
      }
      if (
        message.toLowerCase().includes("already registered") ||
        message.toLowerCase().includes("already been registered") ||
        message.toLowerCase().includes("user already exists")
      ) {
        return AUTH_ALREADY_REGISTERED_MESSAGE;
      }
      if (flow !== "default") {
        return resolveFlowFallback(flow) ?? message;
      }
      return message;
  }
}
