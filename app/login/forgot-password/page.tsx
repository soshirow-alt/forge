import { Suspense } from "react";
import { ForgotPasswordPage } from "@/components/forgot-password-page";
import { hasSupabaseEnv } from "@/lib/supabase/env";

export default function ForgotPasswordRoute() {
  return (
    <Suspense>
      <ForgotPasswordPage supabaseConfigured={hasSupabaseEnv()} />
    </Suspense>
  );
}
