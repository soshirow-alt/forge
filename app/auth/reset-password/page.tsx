import { ResetPasswordPage } from "@/components/reset-password-page";
import { hasSupabaseEnv } from "@/lib/supabase/env";

export default function ResetPasswordRoute() {
  return <ResetPasswordPage supabaseConfigured={hasSupabaseEnv()} />;
}
