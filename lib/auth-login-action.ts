"use server";

import { redirect } from "next/navigation";
import { getAuthErrorMessage } from "@/lib/auth";
import { resolvePostLoginPath } from "@/lib/login-return-url";
import { createClient } from "@/lib/supabase/server";

export type LoginActionState = {
  error: string | null;
};

export async function loginAction(
  _prevState: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const returnParam = String(formData.get("return") ?? "").trim() || null;

  if (!email || !password) {
    return { error: "メールアドレスとパスワードを入力してください。" };
  }

  const supabase = await createClient();
  if (!supabase) {
    return { error: "Supabaseの環境変数が設定されていません。" };
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: getAuthErrorMessage(error.message) };
  }

  redirect(resolvePostLoginPath(returnParam));
}
