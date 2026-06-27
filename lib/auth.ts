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

export function getAuthErrorMessage(message: string): string {
  switch (message) {
    case "Invalid login credentials":
      return "メールアドレスまたはパスワードが正しくありません。";
    case "User already registered":
      return "このメールアドレスは既に登録されています。";
    case "Password should be at least 6 characters":
      return "パスワードは6文字以上で入力してください。";
    case "Unable to validate email address: invalid format":
      return "メールアドレスの形式が正しくありません。";
    case "Email not confirmed":
      return "メールアドレスの確認が完了していません。登録時の確認メールをご確認ください。";
    case "auth_callback":
      return "メール確認リンクが無効または期限切れです。確認メールを再送するか、ログインをお試しください。";
    case "Provider is not enabled":
      return "このログイン方法は現在利用できません。メールアドレスで登録・ログインしてください。";
    default:
      if (message.includes("provider is not enabled")) {
        return "このログイン方法は現在利用できません。メールアドレスで登録・ログインしてください。";
      }
      return message;
  }
}
