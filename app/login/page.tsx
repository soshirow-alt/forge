import { Suspense } from "react";
import { LoginPage } from "@/components/login-page";
import { hasSupabaseEnv } from "@/lib/supabase/env";

export default function Login() {
  const supabaseConfigured = hasSupabaseEnv();

  return (
    <Suspense>
      <LoginPage supabaseConfigured={supabaseConfigured} />
    </Suspense>
  );
}
