import { LoginPage } from "@/components/login-page";
import { hasSupabaseEnv } from "@/lib/supabase/env";

const AUTH_CALLBACK_ERROR =
  "メール確認リンクが無効または期限切れです。確認メールを再送するか、ログインをお試しください。";

export default async function Login({
  searchParams,
}: {
  searchParams: Promise<{
    return?: string;
    error?: string;
    notice?: string;
  }>;
}) {
  const params = await searchParams;
  const supabaseConfigured = hasSupabaseEnv();
  const returnParam = params.return ?? null;

  const callbackError =
    params.error === "auth_callback" ? AUTH_CALLBACK_ERROR : null;

  return (
    <LoginPage
      supabaseConfigured={supabaseConfigured}
      returnParam={returnParam}
      callbackError={callbackError}
      notice={params.notice ?? null}
    />
  );
}
