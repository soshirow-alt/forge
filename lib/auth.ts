import type { User as SupabaseUser } from "@supabase/supabase-js";

export type User = {
  id: string;
  email: string;
  name: string;
  avatarInitial: string;
};

export function mapSupabaseUser(supabaseUser: SupabaseUser): User {
  const name =
    (supabaseUser.user_metadata?.display_name as string | undefined) ||
    supabaseUser.email?.split("@")[0] ||
    "ユーザー";
  const avatarInitial = name.charAt(0).toUpperCase() || "U";

  return {
    id: supabaseUser.id,
    email: supabaseUser.email ?? "",
    name,
    avatarInitial,
  };
}

export const AUTH_ALREADY_REGISTERED_MESSAGE =
  "このメールアドレスは既に登録されています。";

export function getAuthErrorMessage(message: string, code?: string): string {
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
      return "このログイン方法は現在利用できません。メールアドレスで登録・ログインしてください。";
    case "Email rate limit exceeded":
      return "確認メールの送信回数が上限に達しました。しばらく待ってから再送してください。";
    default:
      if (message.includes("provider is not enabled")) {
        return "このログイン方法は現在利用できません。メールアドレスで登録・ログインしてください。";
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
      return message;
  }
}
