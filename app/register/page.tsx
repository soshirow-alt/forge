import { Suspense } from "react";
import { RegisterPage } from "@/components/register-page";
import { hasSupabaseEnv } from "@/lib/supabase/env";

export default function Register() {
  const supabaseConfigured = hasSupabaseEnv();

  return (
    <Suspense>
      <RegisterPage supabaseConfigured={supabaseConfigured} />
    </Suspense>
  );
}
