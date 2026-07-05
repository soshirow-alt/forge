"use server";

import { revalidatePath } from "next/cache";
import { getAuthErrorMessage } from "@/lib/auth";
import { clearGuestSubmitterCookie } from "@/lib/guest-feedback/submitter-cookie";
import { resolvePostLoginPath } from "@/lib/login-return-url";
import { createClient } from "@/lib/supabase/server";

export type LoginActionState = {
  error: string | null;
  /** Set after successful sign-in; client navigates (useActionState + redirect() is unreliable). */
  redirectTo?: string | null;
};

export async function loginAction(
  _prevState: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const returnParam = String(formData.get("return") ?? "").trim() || null;

  if (!email || !password) {
    return { error: "メールアドレスとパスワードを入力してください。", redirectTo: null };
  }

  const supabase = await createClient();
  if (!supabase) {
    return { error: "Supabaseの環境変数が設定されていません。", redirectTo: null };
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: getAuthErrorMessage(error.message), redirectTo: null };
  }

  await clearGuestSubmitterCookie();

  const redirectTo = resolvePostLoginPath(returnParam);
  revalidatePath("/", "layout");
  return { error: null, redirectTo };
}
