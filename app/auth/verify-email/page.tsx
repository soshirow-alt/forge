import { Suspense } from "react";
import { AuthVerifyEmailPage } from "@/components/auth-verify-email-page";
import { hasSupabaseEnv } from "@/lib/supabase/env";

export default function VerifyEmailPage() {
  const supabaseConfigured = hasSupabaseEnv();

  return (
    <Suspense>
      <AuthVerifyEmailPage supabaseConfigured={supabaseConfigured} />
    </Suspense>
  );
}
